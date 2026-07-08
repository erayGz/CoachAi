from __future__ import annotations

import cv2

from .config import MAX_VIDEO_DURATION_SECONDS, MIN_VIDEO_DURATION_SECONDS
from .models import SampledFrameInfo, VideoMetadata, VideoQualityCheck, VideoQualityReport


MAX_SAMPLED_FRAMES = 10
MAX_POSE_ANALYSIS_FRAMES = 20


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


def extract_sample_frames(video_path: str, max_frames: int = MAX_SAMPLED_FRAMES) -> list[SampledFrameInfo]:
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

        return _sample_frame_infos(capture, frame_count, fps, width, height, max_frames)
    except InvalidVideoError:
        raise
    except Exception as exc:
        raise VideoMetadataExtractionError("Unexpected sample frame extraction error.") from exc
    finally:
        capture.release()


def extract_pose_candidate_frames(video_path: str, max_frames: int = MAX_POSE_ANALYSIS_FRAMES) -> list[SampledFrameInfo]:
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

        even_count = min(max_frames // 2, frame_count)
        even_indexes = _select_frame_indexes(frame_count, even_count)
        motion_indexes = _select_high_motion_frame_indexes(
            capture=capture,
            frame_count=frame_count,
            max_motion_frames=max_frames - len(even_indexes),
            probe_count=min(frame_count, max(max_frames * 3, 12)),
        )
        frame_indexes = sorted(set(even_indexes + motion_indexes))[:max_frames]

        return _sample_frame_infos_for_indexes(capture, frame_indexes, fps, width, height)
    except InvalidVideoError:
        raise
    except Exception as exc:
        raise VideoMetadataExtractionError("Unexpected pose candidate frame extraction error.") from exc
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
    return len(_sample_frame_infos(capture, frame_count, 0, 0, 0, MAX_SAMPLED_FRAMES))


def _sample_frame_infos(
    capture: cv2.VideoCapture,
    frame_count: int,
    fps: float,
    fallback_width: int,
    fallback_height: int,
    max_frames: int,
) -> list[SampledFrameInfo]:
    frame_indexes = _select_frame_indexes(frame_count, max_frames)

    return _sample_frame_infos_for_indexes(
        capture=capture,
        frame_indexes=frame_indexes,
        fps=fps,
        fallback_width=fallback_width,
        fallback_height=fallback_height,
    )


def _sample_frame_infos_for_indexes(
    capture: cv2.VideoCapture,
    frame_indexes: list[int],
    fps: float,
    fallback_width: int,
    fallback_height: int,
) -> list[SampledFrameInfo]:
    sampled_frames: list[SampledFrameInfo] = []

    for frame_index in frame_indexes:
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        success, frame = capture.read()
        if not success:
            continue

        frame_height, frame_width = frame.shape[:2]
        sampled_frames.append(
            SampledFrameInfo(
                frameIndex=frame_index,
                timestampSeconds=round(frame_index / fps, 2) if fps > 0 else 0,
                width=int(frame_width or fallback_width),
                height=int(frame_height or fallback_height),
            )
        )

    return sampled_frames


def _select_high_motion_frame_indexes(
    capture: cv2.VideoCapture,
    frame_count: int,
    max_motion_frames: int,
    probe_count: int,
) -> list[int]:
    if max_motion_frames <= 0 or probe_count <= 1:
        return []

    probe_indexes = _select_frame_indexes(frame_count, probe_count)
    previous_gray = None
    scored_indexes: list[tuple[float, int]] = []

    for frame_index in probe_indexes:
        capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        success, frame = capture.read()
        if not success:
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if previous_gray is not None:
            diff = cv2.absdiff(gray, previous_gray)
            scored_indexes.append((float(diff.mean()), frame_index))

        previous_gray = gray

    scored_indexes.sort(key=lambda item: item[0], reverse=True)
    return sorted({frame_index for _, frame_index in scored_indexes[:max_motion_frames]})


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
