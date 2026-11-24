from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


AnalysisLevel = Literal["Beginner", "Developing", "Intermediate", "Advanced", "Elite"]
AnalysisReliability = Literal["Medium", "Good", "High"]
AnalysisConfidence = Literal["Low", "Medium", "High"]
VideoQuality = Literal["Fair", "Good", "Excellent"]
VideoQualityCheckStatus = Literal["pass", "warning", "fail"]
DrillValidityStatus = Literal["Valid", "Unclear", "Invalid"]
DrillValidityConfidence = Literal["High", "Medium", "Low"]
DrillValidityCheckStatus = Literal["pass", "warning", "fail"]
PoseQuality = Literal["Good", "Partial", "Poor"]
SubScoreStatus = Literal["Strong", "Good", "Needs Work"]
ShootingAnalysisCategory = Literal[
    "Approach & Balance",
    "Plant Foot Position",
    "Body Posture",
    "Contact Mechanics",
    "Follow-through",
    "Accuracy",
]
AnalysisMainFocus = Literal[
    "Approach & Balance",
    "Plant Foot Position",
    "Body Posture",
    "Contact Mechanics",
    "Follow-through",
    "Accuracy",
    "Recording Clarity",
    "Shot Action Clarity",
    "No clear weakness",
]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["coachai-backend"]
    version: str


class RootResponse(BaseModel):
    service: Literal["coachai-backend"]
    message: Literal["CoachAI backend is running"]
    docs: Literal["/docs"]


class UploadedFileMetadata(BaseModel):
    filename: str
    contentType: str
    fileSizeBytes: int = Field(ge=0)


class VideoMetadata(BaseModel):
    durationSeconds: float = Field(ge=0)
    fps: float = Field(ge=0)
    width: int = Field(ge=0)
    height: int = Field(ge=0)
    frameCount: int = Field(ge=0)
    sampledFrameCount: int = Field(ge=0)


class SampledFrameInfo(BaseModel):
    frameIndex: int = Field(ge=0)
    timestampSeconds: float = Field(ge=0)
    width: int = Field(ge=0)
    height: int = Field(ge=0)


class PoseFrameSummary(BaseModel):
    frameIndex: int = Field(ge=0)
    timestampSeconds: float = Field(ge=0)
    poseDetected: bool
    landmarkCount: int = Field(ge=0)
    visibilityAverage: float | None = Field(default=None, ge=0, le=1)


class PoseAnalysisSummary(BaseModel):
    framesAnalyzed: int = Field(ge=0)
    framesWithPose: int = Field(ge=0)
    poseDetectionRate: float = Field(ge=0, le=1)
    averageVisibility: float | None = Field(default=None, ge=0, le=1)
    poseQuality: PoseQuality
    frameSummaries: list[PoseFrameSummary]


class VideoQualityCheck(BaseModel):
    label: str
    status: VideoQualityCheckStatus
    message: str


class VideoQualityReport(BaseModel):
    quality: VideoQuality
    reliability: AnalysisReliability
    warnings: list[str]
    checks: list[VideoQualityCheck]


class DrillValidityCheck(BaseModel):
    label: str
    status: DrillValidityCheckStatus
    message: str


class DrillValidityReport(BaseModel):
    status: DrillValidityStatus
    confidence: DrillValidityConfidence
    warnings: list[str]
    checks: list[DrillValidityCheck]


class TechnicalBreakdownItem(BaseModel):
    label: ShootingAnalysisCategory
    score: int = Field(ge=0, le=100)
    color: str
    delta: str
    status: SubScoreStatus


class TrainingPlanItem(BaseModel):
    name: str
    reps: str
    focus: str


class ShotMeasurements(BaseModel):
    contactTimeSeconds: float = Field(ge=0)
    kickingFoot: Literal["left", "right"]
    plantFootDistanceTorsoLengths: float | None = Field(default=None, ge=0)
    torsoTiltDegrees: float | None = Field(default=None, ge=0, le=180)
    followThroughTorsoLengths: float | None = None


class ShootingAnalysisResponse(BaseModel):
    id: str
    createdAt: datetime
    moduleName: Literal["Football · Shooting Lab"]
    drillName: Literal["Shooting Analysis"]
    overallScore: int = Field(ge=0, le=100)
    level: AnalysisLevel
    detectedShots: str
    videoQuality: VideoQuality
    analysisReliability: AnalysisReliability
    analysisConfidence: AnalysisConfidence
    mainFocus: AnalysisMainFocus
    mainFocusDescription: str
    technicalBreakdown: list[TechnicalBreakdownItem]
    techniqueMetricsTotal: int | None = Field(default=None, ge=1)
    aiCoachFeedback: str
    recommendedTraining: list[TrainingPlanItem]
    uploadedFile: UploadedFileMetadata
    videoMetadata: VideoMetadata
    videoQualityReport: VideoQualityReport
    drillValidityReport: DrillValidityReport | None = None
    sampledFrames: list[SampledFrameInfo]
    poseAnalysis: PoseAnalysisSummary | None = None
    shotMeasurements: ShotMeasurements | None = None
    scoringVersion: str | None = None
