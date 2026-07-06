from __future__ import annotations

import cv2
from pathlib import Path

from .config import POSE_ANALYSIS_ENABLED, POSE_MODEL_PATH
from .models import PoseAnalysisSummary, PoseFrameSummary, SampledFrameInfo


class PoseAnalysisError(Exception):
    """Raised when optional pose analysis cannot be completed."""


def analyze_pose_from_video(
    video_path: str,
    sampled_frames: list[SampledFrameInfo],
    model_path: Path = POSE_MODEL_PATH,
) -> PoseAnalysisSummary:
    if not sampled_frames:
        return _build_pose_summary([])

    if not POSE_ANALYSIS_ENABLED:
        raise PoseAnalysisError("Pose analysis is disabled.")

    model_path = Path(model_path)
    if not model_path.exists():
        raise PoseAnalysisError("Pose Landmarker model file is missing.")

    try:
        import mediapipe as mp
    except ImportError as exc:
        raise PoseAnalysisError("MediaPipe is not installed.") from exc

    try:
        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        pose_landmarker = mp.tasks.vision.PoseLandmarker
        pose_landmarker_options = mp.tasks.vision.PoseLandmarkerOptions
        running_mode = mp.tasks.vision.RunningMode.VIDEO
        image_format = mp.ImageFormat.SRGB
        image_class = mp.Image
    except AttributeError as exc:
        raise PoseAnalysisError("MediaPipe Tasks Pose Landmarker API is not available.") from exc

    capture = cv2.VideoCapture(video_path)

    try:
        if not capture.isOpened():
            raise PoseAnalysisError("OpenCV could not open the uploaded video for pose analysis.")

        pose_frame_summaries: list[PoseFrameSummary] = []
        previous_timestamp_ms = -1

        options = pose_landmarker_options(
            base_options=base_options,
            running_mode=running_mode,
            num_poses=1,
            output_segmentation_masks=False,
            min_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        with pose_landmarker.create_from_options(options) as landmarker:
            for sampled_frame in sampled_frames:
                capture.set(cv2.CAP_PROP_POS_FRAMES, sampled_frame.frameIndex)
                success, frame = capture.read()

                if not success:
                    pose_frame_summaries.append(_empty_pose_frame(sampled_frame))
                    continue

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = image_class(image_format=image_format, data=rgb_frame)
                timestamp_ms = max(
                    previous_timestamp_ms + 1,
                    int(round(sampled_frame.timestampSeconds * 1000)),
                )
                previous_timestamp_ms = timestamp_ms

                result = landmarker.detect_for_video(image, timestamp_ms)
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
        raise PoseAnalysisError("Unexpected pose analysis error.") from exc
    finally:
        capture.release()


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
