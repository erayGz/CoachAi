from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from statistics import median

import cv2

from .config import MAX_VIDEO_DURATION_SECONDS, MIN_VIDEO_DURATION_SECONDS
from .models import SampledFrameInfo, VideoMetadata, VideoQualityCheck, VideoQualityReport


MAX_SAMPLED_FRAMES = 10


class InvalidVideoError(Exception):
    """Raised when OpenCV cannot read the uploaded file as a video."""


class VideoMetadataExtractionError(Exception):
    """Raised when metadata extraction fails unexpectedly."""


@dataclass(frozen=True)
class VideoTimeline:
    metadata: VideoMetadata
    frame_times: tuple[float, ...]

    def sample_frames(self, max_frames: int = MAX_SAMPLED_FRAMES) -> list[SampledFrameInfo]:
        return [
            SampledFrameInfo(
                frameIndex=index,
                timestampSeconds=round(self.frame_times[index], 2),
                width=self.metadata.width,
                height=self.metadata.height,
            )
            for index in _select_frame_indexes(len(self.frame_times), max_frames)
        ]


def extract_video_timeline(video_path: str) -> VideoTimeline:
    capture = cv2.VideoCapture(video_path)
    try:
        if not capture.isOpened():
            raise InvalidVideoError("OpenCV could not open the uploaded video.")

        nominal_fps = capture.get(cv2.CAP_PROP_FPS)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if width <= 0 or height <= 0:
            raise InvalidVideoError("OpenCV could not read valid video metadata.")

        frame_times, frame_interval = _read_frame_times(capture, nominal_fps)
        duration_seconds = frame_times[-1] + frame_interval
        metadata = VideoMetadata(
            durationSeconds=round(duration_seconds, 9),
            fps=round(len(frame_times) / duration_seconds, 2),
            width=width,
            height=height,
            frameCount=len(frame_times),
            sampledFrameCount=0,
        )
        return VideoTimeline(metadata, frame_times)
    except InvalidVideoError:
        raise
    except Exception as exc:
        raise VideoMetadataExtractionError("Unexpected video metadata extraction error.") from exc
    finally:
        capture.release()


def _read_frame_times(capture: cv2.VideoCapture, nominal_fps: float) -> tuple[tuple[float, ...], float]:
    fallback_interval = 1 / nominal_fps if isfinite(nominal_fps) and nominal_fps > 0 else None
    timestamps = []
    has_clock = True
    while capture.grab():
        time = capture.get(cv2.CAP_PROP_POS_MSEC) / 1000
        has_clock = has_clock and isfinite(time) and (not timestamps or time >= timestamps[-1])
        timestamps.append(time)

        # The advertised frame count can include footage outside the visible cut.
        elapsed = time - timestamps[0] if has_clock else 0.0
        if elapsed == 0 and fallback_interval is not None:
            elapsed = len(timestamps) * fallback_interval
        if elapsed > MAX_VIDEO_DURATION_SECONDS + 1e-9:
            break

    if has_clock and timestamps and timestamps[-1] > timestamps[0]:
        intervals = [end - start for start, end in zip(timestamps, timestamps[1:]) if end > start]
        # The last timestamp is a frame start. Estimate its display interval from nearby frames.
        return tuple(time - timestamps[0] for time in timestamps), median(intervals[-10:])
    if not timestamps or fallback_interval is None:
        raise InvalidVideoError("OpenCV could not read the video frame timing.")
    return tuple(index * fallback_interval for index in range(len(timestamps))), fallback_interval


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


def _select_frame_indexes(frame_count: int, max_frames: int) -> list[int]:
    sample_count = min(max_frames, frame_count)
    if sample_count <= 0:
        return []

    if sample_count == 1:
        return [0]

    return sorted(
        {
            round(index * (frame_count - 1) / (sample_count - 1))
            for index in range(sample_count)
        }
    )


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
        message=f"Duration must be between {MIN_VIDEO_DURATION_SECONDS} and {MAX_VIDEO_DURATION_SECONDS} seconds.",
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
