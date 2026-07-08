from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import TypeVar
from uuid import uuid4

from .models import (
    AnalysisConfidence,
    AnalysisLevel,
    AnalysisMainFocus,
    AnalysisReliability,
    DrillValidityReport,
    DrillValidityStatus,
    PoseAnalysisSummary,
    SampledFrameInfo,
    ShootingAnalysisCategory,
    ShootingAnalysisResponse,
    SubScoreStatus,
    TechnicalBreakdownItem,
    TrainingPlanItem,
    UploadedFileMetadata,
    VideoMetadata,
    VideoQualityReport,
)

T = TypeVar("T")


CATEGORIES: list[ShootingAnalysisCategory] = [
    "Approach & Balance",
    "Plant Foot Position",
    "Body Posture",
    "Contact Mechanics",
    "Follow-through",
    "Accuracy",
]

COLORS_BY_CATEGORY: dict[ShootingAnalysisCategory, str] = {
    "Approach & Balance": "#2EE86B",
    "Plant Foot Position": "#FFB020",
    "Body Posture": "#5DA8FF",
    "Contact Mechanics": "#A78BFA",
    "Follow-through": "#2EE86B",
    "Accuracy": "#34D399",
}

FOCUS_DESCRIPTIONS: dict[ShootingAnalysisCategory, str] = {
    "Approach & Balance": (
        "Your approach steps are not fully controlled yet. Slow the final steps, "
        "stay balanced, and arrive at the ball with your hips set."
    ),
    "Plant Foot Position": (
        "Your support foot is slightly too far from the ball in most shots. Focus "
        "on placing it closer to the ball and keeping your body over the shot."
    ),
    "Body Posture": (
        "Your body shape changes through the strike. Keep your chest over the ball "
        "and avoid leaning back as you make contact."
    ),
    "Contact Mechanics": (
        "Your connection with the ball is inconsistent. Lock your ankle and strike "
        "through the middle of the ball with a cleaner instep contact."
    ),
    "Follow-through": (
        "Your kicking motion stops too early. Drive through the ball and let your "
        "leg finish naturally toward the target."
    ),
    "Accuracy": (
        "Your shot control needs a clearer target. Pick a corner earlier and keep "
        "the strike compact rather than forcing extra power."
    ),
}

FEEDBACK_BY_FOCUS: dict[ShootingAnalysisCategory, str] = {
    "Approach & Balance": (
        "Your shooting rhythm will improve when the approach is more controlled. "
        "Take shorter final steps, keep your head steady, and arrive balanced "
        "before striking the ball."
    ),
    "Plant Foot Position": (
        "Your follow-through is strong and your body balance is improving. The "
        "biggest area to fix is plant foot placement. When your support foot lands "
        "too far from the ball, your shot loses accuracy and control."
    ),
    "Body Posture": (
        "Your contact has promise, but your body posture is pulling the shot off "
        "line. Keep your chest over the ball and avoid leaning back through the strike."
    ),
    "Contact Mechanics": (
        "Your setup is good enough to create power, but the strike is not always "
        "clean. Focus on locking the ankle and connecting with the instep through "
        "the center of the ball."
    ),
    "Follow-through": (
        "You are getting into decent shooting positions, but the kicking motion "
        "stops too early. Complete the follow-through toward the target to improve "
        "power and direction."
    ),
    "Accuracy": (
        "Your technique has useful pieces, but the final shot needs better control. "
        "Choose the target earlier, keep the strike compact, and prioritize "
        "placement before power."
    ),
}

LOW_CONFIDENCE_FEEDBACK = (
    "CoachAI could not reliably detect the player's full body during the shot. "
    "The score is a preview estimate based on video quality and general motion "
    "signals. For better feedback, record from a stable side or 45-degree angle "
    "with the full body visible."
)

MEDIUM_CONFIDENCE_FEEDBACK = (
    "CoachAI detected the player in some frames, but not consistently throughout "
    "the shot. The feedback is approximate. Record with the full body visible for "
    "a more confident technique report."
)

INVALID_DRILL_FEEDBACK = (
    "CoachAI could not verify that this video contains a clear football shooting "
    "action. This result is a limited preview, not a technique score. Upload one "
    "complete shot with the full body, ball, and kicking leg visible."
)

UNCLEAR_DRILL_FEEDBACK = (
    "CoachAI found some useful movement cues, but the shooting action was not "
    "clear enough for confident technical feedback. This score is a limited "
    "preview. For a better report, record one complete shot from a stable side "
    "or 45-degree angle."
)

TRAINING_BY_FOCUS: dict[ShootingAnalysisCategory, list[TrainingPlanItem]] = {
    "Approach & Balance": [
        TrainingPlanItem(name="Controlled approach drill", reps="4 x 6 shots", focus="Approach"),
        TrainingPlanItem(name="Two-step finishing", reps="3 x 8 shots", focus="Balance"),
        TrainingPlanItem(name="Tempo run-up practice", reps="5 sets", focus="Rhythm"),
        TrainingPlanItem(name="Balance hold shooting", reps="3 x 6 shots", focus="Stability"),
        TrainingPlanItem(name="Slow-to-fast approach reps", reps="4 x 5 shots", focus="Timing"),
        TrainingPlanItem(name="One-step strike control", reps="3 x 8 shots", focus="Control"),
        TrainingPlanItem(name="Approach reset challenge", reps="5 rounds", focus="Consistency"),
    ],
    "Plant Foot Position": [
        TrainingPlanItem(name="Plant foot placement drill", reps="4 x 8 shots", focus="Position"),
        TrainingPlanItem(name="Marker beside ball drill", reps="3 x 10 shots", focus="Distance"),
        TrainingPlanItem(name="Low driven shot practice", reps="5 sets", focus="Control"),
        TrainingPlanItem(name="Support foot freeze drill", reps="3 x 6 shots", focus="Balance"),
        TrainingPlanItem(name="Plant-and-pause finishing", reps="4 x 6 shots", focus="Stability"),
        TrainingPlanItem(name="Target-side support reps", reps="3 x 8 shots", focus="Alignment"),
        TrainingPlanItem(name="Placement pressure set", reps="5 rounds", focus="Consistency"),
    ],
    "Body Posture": [
        TrainingPlanItem(name="Chest-over-ball drill", reps="4 x 8 shots", focus="Posture"),
        TrainingPlanItem(name="Forward lean finishing", reps="3 x 10 shots", focus="Shape"),
        TrainingPlanItem(name="Balance line shooting", reps="5 sets", focus="Control"),
        TrainingPlanItem(name="Core-stable strike drill", reps="3 x 6 shots", focus="Balance"),
        TrainingPlanItem(name="No-lean-back reps", reps="4 x 6 shots", focus="Body shape"),
        TrainingPlanItem(name="Head-still finishing", reps="3 x 8 shots", focus="Stability"),
        TrainingPlanItem(name="Posture reset challenge", reps="5 rounds", focus="Consistency"),
    ],
    "Contact Mechanics": [
        TrainingPlanItem(name="Instep contact drill", reps="3 x 10 shots", focus="Contact"),
        TrainingPlanItem(name="Locked ankle finishing", reps="4 x 8 shots", focus="Clean strike"),
        TrainingPlanItem(name="Low driven shot practice", reps="5 sets", focus="Connection"),
        TrainingPlanItem(name="One-touch contact reps", reps="3 x 6 shots", focus="Timing"),
        TrainingPlanItem(name="Middle-ball strike drill", reps="4 x 8 shots", focus="Contact point"),
        TrainingPlanItem(name="Clean connection ladder", reps="3 x 10 shots", focus="Technique"),
        TrainingPlanItem(name="Contact consistency set", reps="5 rounds", focus="Repeatability"),
    ],
    "Follow-through": [
        TrainingPlanItem(name="Follow-through gate drill", reps="4 x 8 shots", focus="Finish"),
        TrainingPlanItem(name="Target-line strike drill", reps="3 x 10 shots", focus="Direction"),
        TrainingPlanItem(name="Power through ball practice", reps="5 sets", focus="Motion"),
        TrainingPlanItem(name="Hold the finish drill", reps="3 x 6 shots", focus="Control"),
        TrainingPlanItem(name="Strike-and-land reps", reps="4 x 6 shots", focus="Balance"),
        TrainingPlanItem(name="Follow-through target challenge", reps="3 x 8 shots", focus="Accuracy"),
        TrainingPlanItem(name="Finish consistency set", reps="5 rounds", focus="Repeatability"),
    ],
    "Accuracy": [
        TrainingPlanItem(name="Corner target finishing", reps="4 x 8 shots", focus="Accuracy"),
        TrainingPlanItem(name="Low driven shot practice", reps="5 sets", focus="Placement"),
        TrainingPlanItem(name="Instep contact drill", reps="3 x 10 shots", focus="Control"),
        TrainingPlanItem(name="Weak foot finishing", reps="3 x 6 shots", focus="Balance"),
        TrainingPlanItem(name="Two-corner target game", reps="4 x 6 shots", focus="Decision"),
        TrainingPlanItem(name="Placement before power drill", reps="3 x 8 shots", focus="Control"),
        TrainingPlanItem(name="Accuracy pressure set", reps="5 rounds", focus="Consistency"),
    ],
}

LIMITED_PREVIEW_TRAINING: list[TrainingPlanItem] = [
    TrainingPlanItem(name="Record one complete shot", reps="1 clear 3-15 sec clip", focus="Clarity"),
    TrainingPlanItem(name="Set a stable side angle", reps="Side or 45-degree view", focus="Camera"),
    TrainingPlanItem(name="Keep ball and kicking leg visible", reps="Before and through contact", focus="Visibility"),
    TrainingPlanItem(name="Review framing before upload", reps="Full body in frame", focus="Setup"),
]


def _random_int(min_value: int, max_value: int) -> int:
    return random.randint(min_value, max_value)


def _clamp(value: int, min_value: int, max_value: int) -> int:
    return min(max_value, max(min_value, value))


def _pick_weighted(items: list[tuple[T, int]]) -> T:
    total_weight = sum(weight for _, weight in items)
    ticket = random.uniform(0, total_weight)

    for value, weight in items:
        ticket -= weight
        if ticket <= 0:
            return value

    return items[-1][0]


def _generate_overall_score() -> int:
    min_score, max_score = _pick_weighted(
        [
            ((38, 64), 30),
            ((65, 82), 62),
            ((83, 94), 8),
        ]
    )
    return _random_int(min_score, max_score)


def _get_level(score: int) -> AnalysisLevel:
    if score <= 39:
        return "Beginner"
    if score <= 64:
        return "Developing"
    if score <= 82:
        return "Intermediate"
    if score <= 89:
        return "Advanced"
    return "Elite"


def _get_status(score: int) -> SubScoreStatus:
    if score >= 82:
        return "Strong"
    if score >= 68:
        return "Good"
    return "Needs Work"


def _generate_sub_scores(overall_score: int) -> list[TechnicalBreakdownItem]:
    sub_scores: list[TechnicalBreakdownItem] = []

    for category in CATEGORIES:
        score = _clamp(overall_score + _random_int(-12, 12), 25, 95)
        delta_value = score - overall_score

        sub_scores.append(
            TechnicalBreakdownItem(
                label=category,
                score=score,
                color=COLORS_BY_CATEGORY[category],
                delta=f"+{delta_value}" if delta_value >= 0 else str(delta_value),
                status=_get_status(score),
            )
        )

    return sub_scores


def _choose_main_focus(sub_scores: list[TechnicalBreakdownItem]) -> ShootingAnalysisCategory:
    return min(sub_scores, key=lambda item: item.score).label


def _get_main_focus(
    sub_scores: list[TechnicalBreakdownItem],
    drill_validity_report: DrillValidityReport | None,
) -> AnalysisMainFocus:
    status = _get_drill_status(drill_validity_report)
    if status == "Invalid":
        return "Shot Action Clarity"
    if status == "Unclear":
        return "Recording Clarity"
    return _choose_main_focus(sub_scores)


def _get_main_focus_description(main_focus: AnalysisMainFocus) -> str:
    if main_focus == "Shot Action Clarity":
        return "CoachAI could not verify a clear single-shot football action in this video."
    if main_focus == "Recording Clarity":
        return (
            "The shooting action was not clear enough for a confident technique "
            "report. Record with full body, ball, and kicking leg visible."
        )
    return FOCUS_DESCRIPTIONS[main_focus]


def _get_drill_status(drill_validity_report: DrillValidityReport | None) -> DrillValidityStatus:
    return drill_validity_report.status if drill_validity_report is not None else "Unclear"


def _get_score_cap(drill_validity_report: DrillValidityReport | None) -> int:
    status = _get_drill_status(drill_validity_report)
    if status == "Invalid":
        return 55
    if status == "Unclear":
        return 69
    return 94


def _get_shot_action(drill_validity_report: DrillValidityReport | None) -> str:
    status = _get_drill_status(drill_validity_report)
    if status == "Valid":
        return "Likely"
    if status == "Unclear":
        return "Unclear"
    return "Not verified"


def _adjust_report_for_shot_action(
    quality_report: VideoQualityReport,
    shot_action: str,
) -> VideoQualityReport:
    if shot_action == "Likely":
        return quality_report

    return VideoQualityReport(
        quality=quality_report.quality,
        reliability="Medium",
        warnings=quality_report.warnings,
        checks=quality_report.checks,
    )


def _get_analysis_confidence(
    pose_analysis: PoseAnalysisSummary | None,
    reliability: AnalysisReliability,
    drill_validity_report: DrillValidityReport | None,
) -> AnalysisConfidence:
    status = _get_drill_status(drill_validity_report)
    if status == "Invalid":
        return "Low"
    if status == "Unclear":
        return "Medium"
    if pose_analysis is None:
        return "Low"
    if pose_analysis.poseQuality == "Poor":
        return "Low"
    if pose_analysis.poseQuality == "Partial":
        return "Medium"
    if reliability in {"High", "Good"}:
        return "High"
    return "Medium"


def _get_coach_feedback(
    main_focus: AnalysisMainFocus,
    pose_analysis: PoseAnalysisSummary | None,
    drill_validity_report: DrillValidityReport | None,
) -> str:
    status = _get_drill_status(drill_validity_report)
    if status == "Invalid":
        return INVALID_DRILL_FEEDBACK
    if status == "Unclear":
        return UNCLEAR_DRILL_FEEDBACK
    if pose_analysis is None or pose_analysis.poseQuality == "Poor":
        return LOW_CONFIDENCE_FEEDBACK
    if pose_analysis.poseQuality == "Partial":
        return MEDIUM_CONFIDENCE_FEEDBACK
    return FEEDBACK_BY_FOCUS[main_focus]


def _get_recommended_training(main_focus: AnalysisMainFocus) -> list[TrainingPlanItem]:
    if main_focus in {"Shot Action Clarity", "Recording Clarity"}:
        return LIMITED_PREVIEW_TRAINING

    return TRAINING_BY_FOCUS[main_focus]


def generate_mock_shooting_analysis(
    uploaded_file: UploadedFileMetadata,
    video_metadata: VideoMetadata,
    video_quality_report: VideoQualityReport,
    sampled_frames: list[SampledFrameInfo],
    pose_analysis: PoseAnalysisSummary | None,
    drill_validity_report: DrillValidityReport | None,
) -> ShootingAnalysisResponse:
    overall_score = min(_generate_overall_score(), _get_score_cap(drill_validity_report))
    technical_breakdown = _generate_sub_scores(overall_score)
    main_focus = _get_main_focus(technical_breakdown, drill_validity_report)
    shot_action = _get_shot_action(drill_validity_report)
    adjusted_quality_report = _adjust_report_for_shot_action(video_quality_report, shot_action)
    analysis_confidence = _get_analysis_confidence(
        pose_analysis,
        adjusted_quality_report.reliability,
        drill_validity_report,
    )

    return ShootingAnalysisResponse(
        id=str(uuid4()),
        createdAt=datetime.now(timezone.utc),
        moduleName="Football · Shooting Lab",
        drillName="Shooting Analysis",
        overallScore=overall_score,
        level=_get_level(overall_score),
        detectedShots=shot_action,
        videoQuality=adjusted_quality_report.quality,
        analysisReliability=adjusted_quality_report.reliability,
        analysisConfidence=analysis_confidence,
        mainFocus=main_focus,
        mainFocusDescription=_get_main_focus_description(main_focus),
        technicalBreakdown=technical_breakdown,
        aiCoachFeedback=_get_coach_feedback(main_focus, pose_analysis, drill_validity_report),
        recommendedTraining=_get_recommended_training(main_focus),
        uploadedFile=uploaded_file,
        videoMetadata=video_metadata,
        videoQualityReport=adjusted_quality_report,
        drillValidityReport=drill_validity_report,
        sampledFrames=sampled_frames,
        poseAnalysis=pose_analysis,
    )
