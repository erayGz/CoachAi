from __future__ import annotations

import hashlib
from pathlib import Path
from shutil import copyfileobj
from tempfile import NamedTemporaryFile
from urllib.request import urlopen


MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_BASE = "https://storage.googleapis.com/mediapipe-models"
MODELS = {
    "pose_landmarker_lite.task": (
        f"{MODEL_BASE}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        "59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a",
    ),
    "efficientdet_lite0.tflite": (
        f"{MODEL_BASE}/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite",
        "40338edf5ec70d43e318b0a716a84d4564cd1802759a7a07170c7e43796dbf58",
    ),
}


def file_digest(path: Path) -> str:
    with path.open("rb") as body:
        return hashlib.file_digest(body, "sha256").hexdigest()


def install_model(path: Path, url: str, checksum: str) -> None:
    if path.is_file():
        if file_digest(path) != checksum:
            raise ValueError(f"{path.name} has an unexpected checksum. Move it aside before reinstalling.")
        return

    temporary_path = None
    try:
        with urlopen(url, timeout=30) as response:
            with NamedTemporaryFile(dir=path.parent, suffix=".part", delete=False) as output:
                temporary_path = Path(output.name)
                copyfileobj(response, output)
        if file_digest(temporary_path) != checksum:
            raise ValueError(f"Downloaded {path.name} has an unexpected checksum.")
        temporary_path.replace(path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def main() -> int:
    try:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        for name, (url, checksum) in MODELS.items():
            install_model(MODEL_DIR / name, url, checksum)
            print(f"Verified {name}")
    except (OSError, ValueError) as exc:
        print(f"Model setup failed. {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
