from __future__ import annotations

import cv2
import logging
from pathlib import Path

from .config import POSE_ANALYSIS_ENABLED, POSE_MODEL_PATH
from .models import PoseAnalysisSummary, PoseFrameSummary, SampledFrameInfo


logger = logging.getLogger(__name__)


class PoseAnalysisError(Exception):
    """Raised when optional pose analysis cannot be completed."""


def check_pose_runtime(model_path: Path = POSE_MODEL_PATH) -> None:
    if not POSE_ANALYSIS_ENABLED:
        exc = RuntimeError("Pose analysis is disabled.")
        _log_known_pose_failure(exc)
        raise PoseAnalysisError("Pose analysis is disabled.") from exc

    model_path = Path(model_path)
    if not model_path.exists():
        exc = FileNotFoundError(f"Pose Landmarker model file missing at {model_path}")
        _log_known_pose_failure(exc)
        raise PoseAnalysisError("Pose Landmarker model file is missing.") from exc

    try:
        import mediapipe as mp
    except ImportError as exc:
        _log_known_pose_failure(exc)
        raise PoseAnalysisError("MediaPipe is not installed.") from exc

    try:
        _get_pose_landmarker_api(mp)
    except AttributeError as exc:
        _log_known_pose_failure(exc)
        raise PoseAnalysisError("MediaPipe Tasks Pose Landmarker API is not available.") from exc


def analyze_pose_from_video(
    video_path: str,
    sampled_frames: list[SampledFrameInfo],
    model_path: Path = POSE_MODEL_PATH,
) -> PoseAnalysisSummary:
    if not sampled_frames:
        return _build_pose_summary([])

    model_path = Path(model_path)
    check_pose_runtime(model_path)

    try:
        import mediapipe as mp
        pose_api = _get_pose_landmarker_api(mp)
    except (ImportError, AttributeError) as exc:
        _log_known_pose_failure(exc)
        raise PoseAnalysisError("MediaPipe Pose Landmarker runtime is not available.") from exc

    capture = cv2.VideoCapture(video_path)

    try:
        if not capture.isOpened():
            raise PoseAnalysisError("OpenCV could not open the uploaded video for pose analysis.")

        pose_frame_summaries: list[PoseFrameSummary] = []
        previous_timestamp_ms = -1

        options = pose_api["pose_landmarker_options"](
            base_options=pose_api["base_options"](model_asset_path=str(model_path)),
            running_mode=pose_api["running_mode_video"],
            num_poses=1,
            output_segmentation_masks=False,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        try:
            landmarker_context = pose_api["pose_landmarker"].create_from_options(options)
        except Exception as exc:
            _log_known_pose_failure(exc)
            raise PoseAnalysisError("Pose Landmarker creation failed.") from exc

        with landmarker_context as landmarker:
            for sampled_frame in sampled_frames:
                capture.set(cv2.CAP_PROP_POS_FRAMES, sampled_frame.frameIndex)
                success, frame = capture.read()

                if not success:
                    exc = RuntimeError(f"Could not read sampled frame index {sampled_frame.frameIndex}.")
                    _log_known_pose_failure(exc)
                    pose_frame_summaries.append(_empty_pose_frame(sampled_frame))
                    continue

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = pose_api["image_class"](image_format=pose_api["image_format"], data=rgb_frame)
                timestamp_ms = max(
                    previous_timestamp_ms + 1,
                    int(round(sampled_frame.timestampSeconds * 1000)),
                )
                previous_timestamp_ms = timestamp_ms

                try:
                    result = landmarker.detect_for_video(image, timestamp_ms)
                except Exception as exc:
                    _log_known_pose_failure(exc)
                    raise PoseAnalysisError("Pose detect_for_video failed.") from exc

                landmarks = result.pose_landmarks[0] if result.pose_landmarks else []

                if not landmarks:
                    pose_frame_summaries.append(_empty_pose_frame(sampled_frame))
                    continue

                visibility_values = [
                    float(landmark.visibility)
                    for landmark in landmarks
                    if landmark.visibility is not None
                ]
                visibility_average = (
                    round(sum(visibility_values) / len(visibility_values), 3)
                    if visibility_values
                    else None
                )

                pose_frame_summaries.append(
                    PoseFrameSummary(
                        frameIndex=sampled_frame.frameIndex,
                        timestampSeconds=sampled_frame.timestampSeconds,
                        poseDetected=True,
                        landmarkCount=len(landmarks),
                        visibilityAverage=visibility_average,
                    )
                )

        return _build_pose_summary(pose_frame_summaries)
    except PoseAnalysisError:
        raise
    except Exception as exc:
        logger.exception("Unexpected pose analysis failure: %s: %s", type(exc).__name__, exc)
        raise PoseAnalysisError("Unexpected pose analysis error.") from exc
    finally:
        capture.release()


def _get_pose_landmarker_api(mp):
    return {
        "base_options": mp.tasks.BaseOptions,
        "pose_landmarker": mp.tasks.vision.PoseLandmarker,
        "pose_landmarker_options": mp.tasks.vision.PoseLandmarkerOptions,
        "running_mode_video": mp.tasks.vision.RunningMode.VIDEO,
        "image_format": mp.ImageFormat.SRGB,
        "image_class": mp.Image,
    }


def _log_known_pose_failure(exc: BaseException) -> None:
    logger.warning("Pose analysis failure: %s: %s", type(exc).__name__, exc)


def _empty_pose_frame(sampled_frame: SampledFrameInfo) -> PoseFrameSummary:
    return PoseFrameSummary(
        frameIndex=sampled_frame.frameIndex,
        timestampSeconds=sampled_frame.timestampSeconds,
        poseDetected=False,
        landmarkCount=0,
        visibilityAverage=None,
    )


def _build_pose_summary(frame_summaries: list[PoseFrameSummary]) -> PoseAnalysisSummary:
    frames_analyzed = len(frame_summaries)
    frames_with_pose = sum(1 for frame in frame_summaries if frame.poseDetected)
    pose_detection_rate = frames_with_pose / frames_analyzed if frames_analyzed > 0 else 0

    visibility_values = [
        frame.visibilityAverage
        for frame in frame_summaries
        if frame.visibilityAverage is not None
    ]
    average_visibility = (
        round(sum(visibility_values) / len(visibility_values), 3)
        if visibility_values
        else None
    )

    return PoseAnalysisSummary(
        framesAnalyzed=frames_analyzed,
        framesWithPose=frames_with_pose,
        poseDetectionRate=round(pose_detection_rate, 3),
        averageVisibility=average_visibility,
        poseQuality=_get_pose_quality(frames_analyzed, pose_detection_rate),
        frameSummaries=frame_summaries,
    )


def _get_pose_quality(frames_analyzed: int, pose_detection_rate: float) -> str:
    if frames_analyzed == 0:
        return "Poor"
    if pose_detection_rate >= 0.8:
        return "Good"
    if pose_detection_rate >= 0.5:
        return "Partial"
    return "Poor"
