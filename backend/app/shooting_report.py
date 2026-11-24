from datetime import datetime, timezone
from uuid import uuid4

from .shot_detection import Evidence

from .models import (
    AnalysisLevel,
    AnalysisMainFocus,
    DrillValidityCheck,
    DrillValidityReport,
    PoseAnalysisSummary,
    SampledFrameInfo,
    ShootingAnalysisCategory,
    ShootingAnalysisResponse,
    ShotMeasurements,
    TechnicalBreakdownItem,
    TrainingPlanItem,
    UploadedFileMetadata,
    VideoMetadata,
    VideoQualityReport,
)


ADVICE: dict[ShootingAnalysisCategory, tuple[str, TrainingPlanItem]] = {
    "Plant Foot Position": (
        "Use a marker next to the ball to practice a consistent support-foot position.",
        TrainingPlanItem(name="Marker beside ball drill", reps="3 x 10 shots", focus="Distance"),
    ),
    "Body Posture": (
        "Rehearse slow strikes and review your torso position at the moment of contact.",
        TrainingPlanItem(name="Balance line shooting", reps="5 sets", focus="Posture"),
    ),
    "Follow-through": (
        "Practice letting your kicking leg continue naturally along the shot direction.",
        TrainingPlanItem(name="Follow-through gate drill", reps="4 x 8 shots", focus="Finish"),
    ),
}


def build_shooting_report(
    uploaded_file: UploadedFileMetadata,
    metadata: VideoMetadata,
    quality: VideoQualityReport,
    sampled_frames: list[SampledFrameInfo],
    pose: PoseAnalysisSummary,
    measurements: ShotMeasurements,
    *,
    evidence: Evidence = "tracked",
) -> ShootingAnalysisResponse:
    breakdown, findings = _score_measurements(measurements)
    weakest = min(breakdown, key=lambda item: item.score)
    focus: AnalysisMainFocus = "No clear weakness"
    guidance = "No clear weakness was found in the measured areas."
    description = guidance
    training = []
    if weakest.status != "Strong":
        focus = weakest.label
        guidance, drill = ADVICE[weakest.label]
        description = f"{findings[weakest.label]} {guidance}"
        training = [drill]
    overall_score = round(sum(item.score for item in breakdown) / len(breakdown))
    partial = len(breakdown) < len(ADVICE)

    warnings = list(quality.warnings)
    if partial:
        warnings.append(f"Partial assessment. The score is based on {len(breakdown)} of {len(ADVICE)} technique metrics.")
    limited_ball_track = evidence != "tracked"
    ball_explanation = {
        "tracked": "The visible ball moved away immediately afterwards.",
        "short-flight": "The ball likely left the frame shortly after contact.",
        "occluded": "Contact was estimated from the ball's path before and after it briefly disappeared.",
        "edge-disappearance": "Contact was estimated from the foot movement as the ball disappeared at the frame edge.",
    }[evidence]
    if limited_ball_track:
        warnings.append(f"{ball_explanation} The follow-through was left out of the score.")
    elif partial:
        warnings.append("One technique metric was obscured and has been omitted from the score.")
    if pose.poseQuality != "Good":
        warnings.append("Pose visibility varied across the clip. Scoring uses the visible joints around contact.")
    limited = limited_ball_track or partial or pose.poseQuality != "Good" or quality.reliability == "Medium"
    reliability = "Medium" if limited else "Good"
    quality = quality.model_copy(update={"reliability": reliability, "warnings": warnings})

    contact_summary = f"Estimated {measurements.kickingFoot}-foot contact at {measurements.contactTimeSeconds:.2f}s."
    scope = f"The score covers {len(breakdown)} of {len(ADVICE)} technique metrics. " if partial else ""
    validity = DrillValidityReport(
        status="Valid",
        confidence="Medium",
        warnings=[],
        checks=[DrillValidityCheck(
            label="Shot action",
            status="pass",
            message=f"{contact_summary} {ball_explanation}",
        )],
    )

    return ShootingAnalysisResponse(
        id=str(uuid4()),
        createdAt=datetime.now(timezone.utc),
        moduleName="Football · Shooting Lab",
        drillName="Shooting Analysis",
        overallScore=overall_score,
        level=_level(overall_score),
        detectedShots="Likely",
        videoQuality=quality.quality,
        analysisReliability=reliability,
        analysisConfidence="Low" if pose.poseQuality == "Poor" else "Medium",
        mainFocus=focus,
        mainFocusDescription=description,
        technicalBreakdown=breakdown,
        techniqueMetricsTotal=len(ADVICE),
        aiCoachFeedback=f"{contact_summary} {scope}{' '.join(findings.values())} {guidance}",
        recommendedTraining=training,
        uploadedFile=uploaded_file,
        videoMetadata=metadata,
        videoQualityReport=quality,
        drillValidityReport=validity,
        sampledFrames=sampled_frames,
        poseAnalysis=pose,
        shotMeasurements=measurements,
        scoringVersion="shooting-2d-v1",
    )


def _score_measurements(
    measurements: ShotMeasurements,
) -> tuple[list[TechnicalBreakdownItem], dict[ShootingAnalysisCategory, str]]:
    breakdown: list[TechnicalBreakdownItem] = []
    findings: dict[ShootingAnalysisCategory, str] = {}

    def add(label: ShootingAnalysisCategory, value: float, description: str) -> None:
        score = round(max(0, min(100, value)))
        if score >= 82:
            item = TechnicalBreakdownItem(label=label, score=score, color="#2EE86B", delta="", status="Strong")
        elif score >= 68:
            item = TechnicalBreakdownItem(label=label, score=score, color="#5DA8FF", delta="", status="Good")
        else:
            item = TechnicalBreakdownItem(label=label, score=score, color="#FFB020", delta="", status="Needs Work")
        breakdown.append(item)
        findings[label] = description

    distance = measurements.plantFootDistanceTorsoLengths
    if distance is not None:
        outside_band = max(0.25 - distance, distance - 0.60, 0)
        add("Plant Foot Position", 100 - 120 * outside_band,
            f"The support foot was {distance:.2f} torso lengths from the ball in this view.")

    tilt = measurements.torsoTiltDegrees
    if tilt is not None:
        add("Body Posture", 100 - 2 * max(tilt - 20, 0),
            f"The torso was tilted {tilt:.0f}° from vertical at contact in this view.")

    finish = measurements.followThroughTorsoLengths
    if finish is not None:
        add("Follow-through", 100 * finish / 0.45,
            f"The kicking ankle moved {finish:+.2f} torso lengths along the ball's projected direction after contact.")

    return breakdown, findings


def _level(score: int) -> AnalysisLevel:
    if score <= 39:
        return "Beginner"
    if score <= 64:
        return "Developing"
    if score <= 82:
        return "Intermediate"
    if score <= 89:
        return "Advanced"
    return "Elite"
