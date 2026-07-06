from __future__ import annotations

import cv2

from .models import PoseAnalysisSummary, PoseFrameSummary, SampledFrameInfo


class PoseAnalysisError(Exception):
    """Raised when optional pose analysis cannot be completed."""


def analyze_pose_from_video(
    video_path: str,
    sampled_frames: list[SampledFrameInfo],
) -> PoseAnalysisSummary:
    if not sampled_frames:
        return _build_pose_summary([])

    try:
        import mediapipe as mp
    except ImportError as exc:
        raise PoseAnalysisError("MediaPipe is not installed.") from exc

    pose_solution = getattr(getattr(mp, "solutions", None), "pose", None)
    if pose_solution is None:
        raise PoseAnalysisError("MediaPipe pose solution is not available.")

    capture = cv2.VideoCapture(video_path)

    try:
        if not capture.isOpened():
            raise PoseAnalysisError("OpenCV could not open the uploaded video for pose analysis.")

        pose_frame_summaries: list[PoseFrameSummary] = []

        with pose_solution.Pose(
            static_image_mode=True,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
        ) as pose:
            for sampled_frame in sampled_frames:
                capture.set(cv2.CAP_PROP_POS_FRAMES, sampled_frame.frameIndex)
                success, frame = capture.read()

                if not success:
                    pose_frame_summaries.append(_empty_pose_frame(sampled_frame))
                    continue

                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = pose.process(rgb_frame)
                landmarks = result.pose_landmarks.landmark if result.pose_landmarks else []

                if not landmarks:
                    pose_frame_summaries.append(_empty_pose_frame(sampled_frame))
                    continue

                visibility_values = [float(landmark.visibility) for landmark in landmarks]
                visibility_average = sum(visibility_values) / len(visibility_values)

                pose_frame_summaries.append(
                    PoseFrameSummary(
                        frameIndex=sampled_frame.frameIndex,
                        timestampSeconds=sampled_frame.timestampSeconds,
                        poseDetected=True,
                        landmarkCount=len(landmarks),
                        visibilityAverage=round(visibility_average, 3),
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
