from pathlib import Path


SERVICE_NAME = "coachai-backend"
VERSION = "0.2.1"
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024
READ_CHUNK_SIZE_BYTES = 1024 * 1024
MIN_VIDEO_DURATION_SECONDS = 1
MAX_VIDEO_DURATION_SECONDS = 15
BACKEND_DIR = Path(__file__).resolve().parents[1]
POSE_MODEL_PATH = BACKEND_DIR / "models" / "pose_landmarker_lite.task"
BALL_MODEL_PATH = BACKEND_DIR / "models" / "efficientdet_lite0.tflite"
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
