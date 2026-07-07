from __future__ import annotations

import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODEL_DIR / "pose_landmarker_lite.task"


def main() -> int:
    if not MODEL_PATH.exists():
        print("Pose Landmarker model missing.")
        print(f"Expected path: {MODEL_PATH}")
        print("Pose analysis will gracefully return poseAnalysis: null until the model is added.")
        return 1

    file_size_bytes = MODEL_PATH.stat().st_size
    print("Pose Landmarker model found.")
    print(f"Path: {MODEL_PATH}")
    print(f"File size: {_format_file_size(file_size_bytes)}")
    print("Pose analysis should be enabled when the backend runs.")
    return 0


def _format_file_size(file_size_bytes: int) -> str:
    file_size_mb = file_size_bytes / (1024 * 1024)
    return f"{file_size_mb:.2f} MB ({file_size_bytes} bytes)"


if __name__ == "__main__":
    raise SystemExit(main())
