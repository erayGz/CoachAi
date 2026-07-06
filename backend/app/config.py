from pathlib import Path


SERVICE_NAME = "coachai-backend"
VERSION = "0.1.0"
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024
READ_CHUNK_SIZE_BYTES = 1024 * 1024
MIN_VIDEO_DURATION_SECONDS = 10
MAX_VIDEO_DURATION_SECONDS = 25
BACKEND_DIR = Path(__file__).resolve().parents[1]
POSE_MODEL_PATH = BACKEND_DIR / "models" / "pose_landmarker_lite.task"
POSE_ANALYSIS_ENABLED = True
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
