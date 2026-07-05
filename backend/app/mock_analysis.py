from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import TypeVar
from uuid import uuid4

from .models import (
    AnalysisLevel,
    AnalysisReliability,
    ShootingAnalysisCategory,
    ShootingAnalysisResponse,
    SubScoreStatus,
    TechnicalBreakdownItem,
    TrainingPlanItem,
    UploadedFileMetadata,
    VideoMetadata,
    VideoQuality,
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


def _generate_detected_shots() -> str:
    detected = _pick_weighted([(5, 82), (4, 18)])
    return f"{detected}/5"


def _generate_video_quality() -> VideoQuality:
    return _pick_weighted(
        [
            ("Good", 58),
            ("Fair", 24),
            ("Excellent", 18),
        ]
    )


def _generate_reliability(detected_shots: str) -> AnalysisReliability:
    if detected_shots == "4/5":
        return _pick_weighted(
            [
                ("Good", 62),
                ("Medium", 38),
            ]
        )

    return _pick_weighted(
        [
            ("Good", 54),
            ("Medium", 24),
            ("High", 22),
        ]
    )


def generate_mock_shooting_analysis(
    uploaded_file: UploadedFileMetadata,
    video_metadata: VideoMetadata,
) -> ShootingAnalysisResponse:
    overall_score = _generate_overall_score()
    technical_breakdown = _generate_sub_scores(overall_score)
    main_focus = _choose_main_focus(technical_breakdown)
    detected_shots = _generate_detected_shots()

    return ShootingAnalysisResponse(
        id=str(uuid4()),
        createdAt=datetime.now(timezone.utc),
        moduleName="Football · Shooting Lab",
        drillName="Shooting Analysis",
        overallScore=overall_score,
        level=_get_level(overall_score),
        detectedShots=detected_shots,
        videoQuality=_generate_video_quality(),
        analysisReliability=_generate_reliability(detected_shots),
        mainFocus=main_focus,
        mainFocusDescription=FOCUS_DESCRIPTIONS[main_focus],
        technicalBreakdown=technical_breakdown,
        aiCoachFeedback=FEEDBACK_BY_FOCUS[main_focus],
        recommendedTraining=TRAINING_BY_FOCUS[main_focus],
        uploadedFile=uploaded_file,
        videoMetadata=video_metadata,
    )
