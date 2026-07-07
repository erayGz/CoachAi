from __future__ import annotations

from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODEL_DIR / "pose_landmarker_lite.task"


def main() -> int:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if MODEL_PATH.exists():
        print("Pose Landmarker model is already set up.")
        print(f"Path: {MODEL_PATH}")
        print(f"File size: {_format_file_size(MODEL_PATH.stat().st_size)}")
        return 0

    print("Pose Landmarker model is not installed locally.")
    print(f"Expected path: {MODEL_PATH}")
    print("")
    print("Manual setup:")
    print("1. Download the MediaPipe Pose Landmarker Lite .task model from the official MediaPipe model source.")
    print("2. Rename it to: pose_landmarker_lite.task")
    print(f"3. Place it at: {MODEL_PATH}")
    print("")
    print("No automatic download was attempted because this project does not store a verified official model URL.")
    print("The backend will still run without the model and will return poseAnalysis: null with a warning.")
    return 0


def _format_file_size(file_size_bytes: int) -> str:
    file_size_mb = file_size_bytes / (1024 * 1024)
    return f"{file_size_mb:.2f} MB ({file_size_bytes} bytes)"


if __name__ == "__main__":
    raise SystemExit(main())
