from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS, MAX_VIDEO_SIZE_BYTES, READ_CHUNK_SIZE_BYTES, SERVICE_NAME, VERSION
from .mock_analysis import generate_mock_shooting_analysis
from .models import HealthResponse, RootResponse, ShootingAnalysisResponse, UploadedFileMetadata
from .video_processing import InvalidVideoError, VideoMetadataExtractionError, extract_video_metadata


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

        uploaded_file = UploadedFileMetadata(
            filename=file.filename or "shooting-video",
            contentType=content_type,
            fileSizeBytes=file_size_bytes,
        )

        return generate_mock_shooting_analysis(uploaded_file, video_metadata)
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
