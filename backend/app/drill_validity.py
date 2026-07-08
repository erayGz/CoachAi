from __future__ import annotations

from .config import MAX_VIDEO_DURATION_SECONDS, MIN_VIDEO_DURATION_SECONDS
from .models import (
    DrillValidityCheck,
    DrillValidityConfidence,
    DrillValidityReport,
    DrillValidityStatus,
    PoseAnalysisSummary,
    VideoMetadata,
    VideoQualityReport,
)


def evaluate_shooting_drill_validity(
    video_metadata: VideoMetadata,
    video_quality_report: VideoQualityReport,
    pose_analysis: PoseAnalysisSummary | None,
) -> DrillValidityReport:
    checks = [
        _evaluate_duration(video_metadata),
        _evaluate_pose_presence(pose_analysis),
        _evaluate_full_body_proxy(pose_analysis),
        _evaluate_motion_proxy(video_metadata, pose_analysis),
        _evaluate_video_quality(video_quality_report),
    ]

    status = _get_report_status(checks)
    warnings = [check.message for check in checks if check.status in {"warning", "fail"}]

    return DrillValidityReport(
        status=status,
        confidence=_get_report_confidence(status, checks),
        warnings=warnings,
        checks=checks,
    )


def _evaluate_duration(metadata: VideoMetadata) -> DrillValidityCheck:
    if MIN_VIDEO_DURATION_SECONDS <= metadata.durationSeconds <= MAX_VIDEO_DURATION_SECONDS:
        return DrillValidityCheck(
            label="Duration",
            status="pass",
            message="Video length matches the single-shot drill window.",
        )

    return DrillValidityCheck(
        label="Duration",
        status="fail",
        message=f"Video must be {MIN_VIDEO_DURATION_SECONDS}-{MAX_VIDEO_DURATION_SECONDS} seconds.",
    )


def _evaluate_pose_presence(pose_analysis: PoseAnalysisSummary | None) -> DrillValidityCheck:
    if pose_analysis is None:
        return DrillValidityCheck(
            label="Pose presence",
            status="fail",
            message="Player pose could not be checked.",
        )

    if pose_analysis.poseDetectionRate >= 0.6:
        return DrillValidityCheck(
            label="Pose presence",
            status="pass",
            message="Player body was detected in enough frames.",
        )

    if pose_analysis.poseDetectionRate >= 0.3:
        return DrillValidityCheck(
            label="Pose presence",
            status="warning",
            message="Player body was detected only part of the time.",
        )

    return DrillValidityCheck(
        label="Pose presence",
        status="fail",
        message="Player body was not detected reliably.",
    )


def _evaluate_full_body_proxy(pose_analysis: PoseAnalysisSummary | None) -> DrillValidityCheck:
    if pose_analysis is None or pose_analysis.averageVisibility is None:
        return DrillValidityCheck(
            label="Full-body visibility",
            status="warning",
            message="Full-body visibility could not be estimated.",
        )

    if pose_analysis.averageVisibility >= 0.65:
        return DrillValidityCheck(
            label="Full-body visibility",
            status="pass",
            message="Pose visibility looks strong enough for a preview report.",
        )

    if pose_analysis.averageVisibility >= 0.45:
        return DrillValidityCheck(
            label="Full-body visibility",
            status="warning",
            message="Some body landmarks were only partially visible.",
        )

    return DrillValidityCheck(
        label="Full-body visibility",
        status="fail",
        message="Full-body visibility was too limited for confident feedback.",
    )


def _evaluate_motion_proxy(
    metadata: VideoMetadata,
    pose_analysis: PoseAnalysisSummary | None,
) -> DrillValidityCheck:
    if pose_analysis is None:
        return DrillValidityCheck(
            label="Action cues",
            status="warning",
            message="Shooting action cues could not be estimated without pose data.",
        )

    in_duration_window = MIN_VIDEO_DURATION_SECONDS <= metadata.durationSeconds <= MAX_VIDEO_DURATION_SECONDS

    if pose_analysis.framesWithPose >= 4 and in_duration_window:
        return DrillValidityCheck(
            label="Action cues",
            status="pass",
            message="Movement cues are usable, but ball contact is not verified yet.",
        )

    if pose_analysis.framesWithPose >= 2 and in_duration_window:
        return DrillValidityCheck(
            label="Action cues",
            status="warning",
            message="Some movement cues were found, but the shot action is not clear.",
        )

    return DrillValidityCheck(
        label="Action cues",
        status="fail",
        message="Not enough movement cues were found for a single-shot drill.",
    )


def _evaluate_video_quality(report: VideoQualityReport) -> DrillValidityCheck:
    if any(check.status == "fail" for check in report.checks):
        return DrillValidityCheck(
            label="Video quality",
            status="fail",
            message="Video quality checks include a blocking issue.",
        )

    if report.quality == "Fair" or report.reliability == "Medium" or len(report.warnings) >= 3:
        return DrillValidityCheck(
            label="Video quality",
            status="warning",
            message="Video quality may limit drill verification.",
        )

    return DrillValidityCheck(
        label="Video quality",
        status="pass",
        message="Video quality is usable for drill verification.",
    )


def _get_report_status(checks: list[DrillValidityCheck]) -> DrillValidityStatus:
    fail_count = sum(1 for check in checks if check.status == "fail")
    warning_count = sum(1 for check in checks if check.status == "warning")

    if fail_count >= 2 or _has_failed_check(checks, "Duration") or _has_failed_check(checks, "Video quality"):
        return "Invalid"

    if fail_count == 1 or warning_count > 0:
        return "Unclear"

    return "Valid"


def _get_report_confidence(
    status: DrillValidityStatus,
    checks: list[DrillValidityCheck],
) -> DrillValidityConfidence:
    if status == "Invalid":
        return "Low"
    if status == "Unclear":
        return "Medium"
    if any(check.status == "warning" for check in checks):
        return "Medium"
    return "High"


def _has_failed_check(checks: list[DrillValidityCheck], label: str) -> bool:
    return any(check.label == label and check.status == "fail" for check in checks)
