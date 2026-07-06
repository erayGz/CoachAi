from __future__ import annotations

import cv2

from .config import MAX_VIDEO_DURATION_SECONDS, MIN_VIDEO_DURATION_SECONDS
from .models import VideoMetadata, VideoQualityCheck, VideoQualityReport


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


def evaluate_video_quality(metadata: VideoMetadata) -> VideoQualityReport:
    checks = [
        _evaluate_resolution(metadata),
        _evaluate_fps(metadata),
        _evaluate_duration(metadata),
        _evaluate_frame_count(metadata),
        _evaluate_frame_sampling(metadata),
    ]

    warnings = [check.message for check in checks if check.status in {"warning", "fail"}]
    warning_count = sum(1 for check in checks if check.status == "warning")
    has_failures = any(check.status == "fail" for check in checks)

    if has_failures:
        quality = "Fair"
        reliability = "Medium"
    elif warning_count == 0:
        quality = "Excellent"
        reliability = "High"
    elif warning_count <= 2:
        quality = "Good"
        reliability = "Good"
    else:
        quality = "Fair"
        reliability = "Medium"

    return VideoQualityReport(
        quality=quality,
        reliability=reliability,
        warnings=warnings,
        checks=checks,
    )


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


def _evaluate_resolution(metadata: VideoMetadata) -> VideoQualityCheck:
    if metadata.width >= 1280 and metadata.height >= 720:
        return VideoQualityCheck(
            label="Resolution",
            status="pass",
            message="HD resolution or better.",
        )

    if metadata.width >= 854 and metadata.height >= 480:
        return VideoQualityCheck(
            label="Resolution",
            status="warning",
            message="Resolution is usable, but HD recording is recommended.",
        )

    return VideoQualityCheck(
        label="Resolution",
        status="warning",
        message="Low resolution may reduce analysis quality.",
    )


def _evaluate_fps(metadata: VideoMetadata) -> VideoQualityCheck:
    if metadata.fps >= 30:
        return VideoQualityCheck(
            label="FPS",
            status="pass",
            message="Frame rate is strong for movement analysis.",
        )

    if metadata.fps >= 24:
        return VideoQualityCheck(
            label="FPS",
            status="warning",
            message="Frame rate is usable, but 30 FPS is recommended.",
        )

    return VideoQualityCheck(
        label="FPS",
        status="warning",
        message="Low frame rate may reduce analysis reliability.",
    )


def _evaluate_duration(metadata: VideoMetadata) -> VideoQualityCheck:
    if MIN_VIDEO_DURATION_SECONDS <= metadata.durationSeconds <= MAX_VIDEO_DURATION_SECONDS:
        return VideoQualityCheck(
            label="Duration",
            status="pass",
            message="Duration is within the shooting drill range.",
        )

    return VideoQualityCheck(
        label="Duration",
        status="fail",
        message="Duration must be between 10 and 25 seconds.",
    )


def _evaluate_frame_count(metadata: VideoMetadata) -> VideoQualityCheck:
    if metadata.frameCount > 0:
        return VideoQualityCheck(
            label="Frame count",
            status="pass",
            message="Video frames were detected.",
        )

    return VideoQualityCheck(
        label="Frame count",
        status="fail",
        message="No readable video frames were detected.",
    )


def _evaluate_frame_sampling(metadata: VideoMetadata) -> VideoQualityCheck:
    if metadata.sampledFrameCount >= 8:
        return VideoQualityCheck(
            label="Frame sampling",
            status="pass",
            message="Enough frames were sampled for the preview analysis.",
        )

    if metadata.sampledFrameCount >= 4:
        return VideoQualityCheck(
            label="Frame sampling",
            status="warning",
            message="Limited frames were sampled from the uploaded video.",
        )

    return VideoQualityCheck(
        label="Frame sampling",
        status="fail",
        message="Too few frames were sampled from the uploaded video.",
    )
