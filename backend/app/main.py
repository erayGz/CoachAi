import asyncio
import logging
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
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
from .models import HealthResponse, RootResponse, ShootingAnalysisResponse, UploadedFileMetadata
from .shooting_report import build_shooting_report
from .shot_detection import UnscorableShotError, find_single_contact, measure_shot
from .shot_recovery import recover_shot
from .shot_vision import ShotVisionError, observe_video, summarize_pose
from .video_processing import (
    InvalidVideoError,
    VideoMetadataExtractionError,
    VideoTimeline,
    evaluate_video_quality,
    extract_video_timeline,
)


logger = logging.getLogger(__name__)
analysis_slots = asyncio.Semaphore(2)

app = FastAPI(
    title="CoachAI Backend",
    description="Local football shooting analysis using player pose and ball tracking.",
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
            raise HTTPException(status_code=400, detail="Only video files are supported.")

        temp_video_path, file_size_bytes = await _write_upload_to_temp_file(file)
        if file_size_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded video is empty.")

        uploaded_file = UploadedFileMetadata(
            filename=file.filename or "shooting-video",
            contentType=content_type,
            fileSizeBytes=file_size_bytes,
        )
        async with analysis_slots:
            return await run_in_threadpool(_analyze_video, temp_video_path, uploaded_file)
    finally:
        try:
            await file.close()
        finally:
            if temp_video_path:
                Path(temp_video_path).unlink(missing_ok=True)


def _analyze_video(
    video_path: str, uploaded_file: UploadedFileMetadata, *, timeline: VideoTimeline | None = None
) -> ShootingAnalysisResponse:
    duration_range = f"{MIN_VIDEO_DURATION_SECONDS}–{MAX_VIDEO_DURATION_SECONDS}"
    try:
        if timeline is None:
            timeline = extract_video_timeline(video_path)
        metadata = timeline.metadata
        if metadata.durationSeconds < MIN_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=400,
                detail=f"Video is too short. Please upload a {duration_range} second shooting video.",
            )
        if metadata.durationSeconds > MAX_VIDEO_DURATION_SECONDS:
            raise HTTPException(
                status_code=400,
                detail=f"Video is too long. Please upload a {duration_range} second shooting video.",
            )

        sampled_frames = timeline.sample_frames()
        metadata = metadata.model_copy(update={"sampledFrameCount": len(sampled_frames)})
        quality = evaluate_video_quality(metadata)
        frames = observe_video(video_path, timeline)
        try:
            contact = find_single_contact(frames)
            measurements = measure_shot(frames, contact)
        except UnscorableShotError as original_error:
            if not original_error.recoverable:
                raise
            recovered = recover_shot(video_path, timeline, frames)
            if recovered is None:
                raise
            frames, contact, measurements = recovered
    except InvalidVideoError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file could not be read as a valid video.") from exc
    except VideoMetadataExtractionError as exc:
        logger.exception("Video metadata extraction failed")
        raise HTTPException(status_code=500, detail="Video metadata extraction failed.") from exc
    except ShotVisionError as exc:
        logger.exception("Local shooting analysis failed")
        raise HTTPException(
            status_code=503,
            detail="Shooting analysis is temporarily unavailable. Check the local analysis model setup.",
        ) from exc
    except UnscorableShotError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return build_shooting_report(
        uploaded_file, metadata, quality, sampled_frames, summarize_pose(frames), measurements,
        evidence=contact.evidence,
    )


async def _write_upload_to_temp_file(file: UploadFile) -> tuple[str, int]:
    file_size_bytes = 0
    temp_video_path: str | None = None
    suffix = Path(file.filename or "").suffix or ".video"
    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_video_path = temp_file.name
            while chunk := await file.read(READ_CHUNK_SIZE_BYTES):
                file_size_bytes += len(chunk)
                if file_size_bytes > MAX_VIDEO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video file is too large. Maximum size is 100 MB.",
                    )
                temp_file.write(chunk)
        return temp_video_path, file_size_bytes
    except BaseException:
        if temp_video_path:
            Path(temp_video_path).unlink(missing_ok=True)
        raise
