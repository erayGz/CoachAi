from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .config import (
    ALLOWED_ORIGINS,
    MAX_VIDEO_DURATION_SECONDS,
    MAX_VIDEO_SIZE_BYTES,
    MIN_VIDEO_DURATION_SECONDS,
    READ_CHUNK_SIZE_BYTES,
    SERVICE_NAME,
    VERSION,
)
from .mock_analysis import generate_mock_shooting_analysis
from .models import (
    AnalysisReliability,
    HealthResponse,
    PoseAnalysisSummary,
    RootResponse,
    SampledFrameInfo,
    ShootingAnalysisResponse,
    UploadedFileMetadata,
    VideoMetadata,
    VideoQualityReport,
)
from .pose_analysis import PoseAnalysisError, analyze_pose_from_video
from .video_processing import (
    InvalidVideoError,
    VideoMetadataExtractionError,
    evaluate_video_quality,
    extract_video_metadata,
    extract_sample_frames,
)


app = FastAPI(
    title="CoachAI Backend",
    description="Mock backend API for the CoachAI Football · Shooting Lab MVP.",
    version=VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=RootResponse)
async def root() -> RootResponse:
    return RootResponse(
        service=SERVICE_NAME,
        message="CoachAI backend is running",
        docs="/docs",
    )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service=SERVICE_NAME, version=VERSION)


@app.post("/analyze/shooting", response_model=ShootingAnalysisResponse)
async def analyze_shooting(file: UploadFile = File(...)) -> ShootingAnalysisResponse:
    temp_video_path: str | None = None

    try:
        content_type = file.content_type or ""

        if not content_type.startswith("video/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only video files are supported.",
            )

        temp_video_path, file_size_bytes = await _write_upload_to_temp_file(file)

        if file_size_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded video is empty.",
            )

        try:
            video_metadata = extract_video_metadata(temp_video_path)
            sampled_frames = extract_sample_frames(temp_video_path)
        except InvalidVideoError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file could not be read as a valid video.",
            )
        except VideoMetadataExtractionError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Video metadata extraction failed.",
            )

        video_metadata = _with_sampled_frame_count(video_metadata, len(sampled_frames))

        if video_metadata.durationSeconds < MIN_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video is too short. Please upload a 10–25 second shooting drill video.",
            )

        if video_metadata.durationSeconds > MAX_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video is too long. Please upload a 10–25 second shooting drill video.",
            )

        video_quality_report = evaluate_video_quality(video_metadata)
        pose_analysis, pose_warning = _analyze_pose_safely(temp_video_path, sampled_frames)
        video_quality_report = _with_pose_analysis_adjustments(
            video_quality_report,
            pose_analysis,
            pose_warning,
        )

        uploaded_file = UploadedFileMetadata(
            filename=file.filename or "shooting-video",
            contentType=content_type,
            fileSizeBytes=file_size_bytes,
        )

        return generate_mock_shooting_analysis(
            uploaded_file,
            video_metadata,
            video_quality_report,
            sampled_frames,
            pose_analysis,
        )
    finally:
        await file.close()
        if temp_video_path:
            Path(temp_video_path).unlink(missing_ok=True)


async def _write_upload_to_temp_file(file: UploadFile) -> tuple[str, int]:
    file_size_bytes = 0
    temp_video_path: str | None = None

    try:
        with NamedTemporaryFile(delete=False, suffix=_get_temp_suffix(file.filename)) as temp_file:
            temp_video_path = temp_file.name

            while True:
                chunk = await file.read(READ_CHUNK_SIZE_BYTES)
                if not chunk:
                    break

                file_size_bytes += len(chunk)

                if file_size_bytes > MAX_VIDEO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video file is too large. Maximum size is 100 MB.",
                    )

                temp_file.write(chunk)

        return temp_video_path, file_size_bytes
    except Exception:
        if temp_video_path:
            Path(temp_video_path).unlink(missing_ok=True)
        raise


def _get_temp_suffix(filename: str | None) -> str:
    suffix = Path(filename or "").suffix
    return suffix if suffix else ".video"


def _with_sampled_frame_count(metadata: VideoMetadata, sampled_frame_count: int) -> VideoMetadata:
    return VideoMetadata(
        durationSeconds=metadata.durationSeconds,
        fps=metadata.fps,
        width=metadata.width,
        height=metadata.height,
        frameCount=metadata.frameCount,
        sampledFrameCount=sampled_frame_count,
    )


def _analyze_pose_safely(
    video_path: str,
    sampled_frames: list[SampledFrameInfo],
) -> tuple[PoseAnalysisSummary | None, str | None]:
    try:
        return analyze_pose_from_video(video_path, sampled_frames), None
    except PoseAnalysisError:
        return None, "Pose analysis could not be completed."


def _with_pose_analysis_adjustments(
    report: VideoQualityReport,
    pose_analysis: PoseAnalysisSummary | None,
    pose_warning: str | None,
) -> VideoQualityReport:
    warnings = list(report.warnings)
    reliability = report.reliability

    if pose_warning:
        _append_warning(warnings, pose_warning)
        reliability = _cap_high_reliability(reliability)
    elif pose_analysis is not None and pose_analysis.poseQuality == "Poor":
        _append_warning(warnings, "Player pose was not reliably detected in sampled frames.")
        reliability = _cap_high_reliability(reliability)
    elif pose_analysis is not None and pose_analysis.poseQuality == "Partial":
        _append_warning(warnings, "Player pose was only detected in some sampled frames.")
        reliability = _cap_high_reliability(reliability)

    return VideoQualityReport(
        quality=report.quality,
        reliability=reliability,
        warnings=warnings,
        checks=report.checks,
    )


def _append_warning(warnings: list[str], warning: str) -> None:
    if warning not in warnings:
        warnings.append(warning)


def _cap_high_reliability(reliability: AnalysisReliability) -> AnalysisReliability:
    return "Good" if reliability == "High" else reliability
