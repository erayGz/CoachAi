from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


AnalysisLevel = Literal["Beginner", "Developing", "Intermediate", "Advanced", "Elite"]
AnalysisReliability = Literal["Medium", "Good", "High"]
VideoQuality = Literal["Fair", "Good", "Excellent"]
SubScoreStatus = Literal["Strong", "Good", "Needs Work"]
ShootingAnalysisCategory = Literal[
    "Approach & Balance",
    "Plant Foot Position",
    "Body Posture",
    "Contact Mechanics",
    "Follow-through",
    "Accuracy",
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
    mainFocus: ShootingAnalysisCategory
    mainFocusDescription: str
    technicalBreakdown: list[TechnicalBreakdownItem]
    aiCoachFeedback: str
    recommendedTraining: list[TrainingPlanItem]
    uploadedFile: UploadedFileMetadata
