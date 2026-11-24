from .models import PoseAnalysisSummary, PoseFrameSummary, PoseQuality


def build_pose_summary(frame_summaries: list[PoseFrameSummary]) -> PoseAnalysisSummary:
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


def _get_pose_quality(frames_analyzed: int, pose_detection_rate: float) -> PoseQuality:
    if frames_analyzed == 0:
        return "Poor"
    if pose_detection_rate >= 0.8:
        return "Good"
    if pose_detection_rate >= 0.5:
        return "Partial"
    return "Poor"
