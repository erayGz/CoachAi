from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .mock_analysis import generate_mock_shooting_analysis
from .models import HealthResponse, ShootingAnalysisResponse, UploadedFileMetadata


app = FastAPI(
    title="CoachAI Backend",
    description="Mock backend API for the CoachAI Football · Shooting Lab MVP.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="coachai-backend")


@app.post("/analyze/shooting", response_model=ShootingAnalysisResponse)
async def analyze_shooting(file: UploadFile = File(...)) -> ShootingAnalysisResponse:
    file_bytes = await file.read()
    uploaded_file = UploadedFileMetadata(
        filename=file.filename or "shooting-video",
        contentType=file.content_type or "application/octet-stream",
        fileSizeBytes=len(file_bytes),
    )

    await file.close()

    return generate_mock_shooting_analysis(uploaded_file)
