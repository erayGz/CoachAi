from __future__ import annotations

import cv2

from .models import VideoMetadata


MAX_SAMPLED_FRAMES = 10


class InvalidVideoError(Exception):
    """Raised when OpenCV cannot read the uploaded file as a video."""


class VideoMetadataExtractionError(Exception):
    """Raised when metadata extraction fails unexpectedly."""


def extract_video_metadata(video_path: str) -> VideoMetadata:
    capture = cv2.VideoCapture(video_path)

    try:
        if not capture.isOpened():
            raise InvalidVideoError("OpenCV could not open the uploaded video.")

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

        if width <= 0 or height <= 0 or frame_count <= 0:
            raise InvalidVideoError("OpenCV could not read valid video metadata.")

        duration_seconds = frame_count / fps if fps > 0 else 0.0
        sampled_frame_count = _sample_frames(capture, frame_count)

        return VideoMetadata(
            durationSeconds=round(duration_seconds, 2),
            fps=round(fps, 2),
            width=width,
            height=height,
            frameCount=frame_count,
            sampledFrameCount=sampled_frame_count,
        )
    except InvalidVideoError:
        raise
    except Exception as exc:
        raise VideoMetadataExtractionError("Unexpected video metadata extraction error.") from exc
    finally:
        capture.release()


def _sample_frames(capture: cv2.VideoCapture, frame_count: int) -> int:
    sample_count = min(MAX_SAMPLED_FRAMES, frame_count)
    if sample_count <= 0:
        return 0

    if sample_count == 1:
        frame_indexes = [0]
    else:
        frame_indexes = sorted(
            {
                round(index * (frame_count - 1) / (sample_count - 1))
                for index in range(sample_count)
            }
        )

    sampled_frame_count = 0

    for frame_index in frame_indexes:
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        success, _frame = capture.read()
        if success:
            sampled_frame_count += 1

    return sampled_frame_count
