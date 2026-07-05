from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS, MAX_VIDEO_SIZE_BYTES, READ_CHUNK_SIZE_BYTES, SERVICE_NAME, VERSION
from .mock_analysis import generate_mock_shooting_analysis
from .models import HealthResponse, RootResponse, ShootingAnalysisResponse, UploadedFileMetadata


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
    try:
        content_type = file.content_type or ""

        if not content_type.startswith("video/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only video files are supported.",
            )

        file_size_bytes = await _read_upload_size(file)

        if file_size_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded video is empty.",
            )

        uploaded_file = UploadedFileMetadata(
            filename=file.filename or "shooting-video",
            contentType=content_type,
            fileSizeBytes=file_size_bytes,
        )

        return generate_mock_shooting_analysis(uploaded_file)
    finally:
        await file.close()


async def _read_upload_size(file: UploadFile) -> int:
    file_size_bytes = 0

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

    return file_size_bytes
