"""Prepare the holdout videos locally from the public Women Players source clips."""

import argparse
from pathlib import Path
import shutil
import sys

import cv2

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.video_processing import extract_video_timeline


def render(source: Path, target: Path, *, frames: int | None = None, mirror: bool = False) -> None:
    timeline = extract_video_timeline(str(source))
    # Container FPS can describe a different edit from the pictures actually played.
    fps = timeline.metadata.fps
    frame_count = frames if frames is not None else timeline.metadata.frameCount
    reader = cv2.VideoCapture(str(source))
    ok, first = reader.read()
    if not ok or fps <= 0:
        reader.release()
        raise ValueError(f"Cannot decode {source}")
    height, width = first.shape[:2]
    size = (width // 2 * 2, height // 2 * 2)
    writer = cv2.VideoWriter(str(target), cv2.VideoWriter_fourcc(*"mp4v"), fps, size)
    count = 0
    try:
        if not writer.isOpened():
            raise ValueError(f"Cannot create {target}")
        frame = first
        while ok:
            if mirror:
                frame = cv2.flip(frame, 1)
            writer.write(frame[:size[1], :size[0]])
            count += 1
            if count == frame_count:
                break
            ok, frame = reader.read()
        if count != frame_count:
            raise ValueError(f"Could not decode {frame_count} frames in {source}")
    finally:
        writer.release()
        reader.release()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video_root", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    if args.video_root.resolve() == args.destination.resolve():
        parser.error("Use a separate output directory for the holdout.")
    args.destination.mkdir(parents=True, exist_ok=True)
    for name in ("08-02.mov", "15-01.mov", "17-03.mov", "18-07.mov"):
        shutil.copyfile(args.video_root / name, args.destination / name)
    render(args.video_root / "08-02.mov", args.destination / "08-02-approach.mp4", frames=54)
    render(args.video_root / "17-03.mov", args.destination / "17-03-approach.mp4", frames=51)
    render(args.video_root / "18-07.mov", args.destination / "18-07-mirrored.mp4", mirror=True)


if __name__ == "__main__":
    main()
