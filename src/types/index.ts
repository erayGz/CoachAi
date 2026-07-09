export type Screen =
  | "splash"
  | "dashboard"
  | "shooting-guide"
  | "video-upload"
  | "processing"
  | "results"
  | "history"
  | "profile";

export type Navigate = (screen: Screen) => void;

export type ScreenProps = {
  go: Navigate;
};

export type StatItem = {
  label: string;
  value: string;
  sub?: string;
  color: string;
};

export type SubScore = {
  label: string;
  score: number;
  color: string;
  delta: string;
  status: "Strong" | "Good" | "Needs Work";
};

export type TrainingDrill = {
  name: string;
  reps: string;
  focus: string;
};

export type AnalysisLevel =
  | "Beginner"
  | "Developing"
  | "Intermediate"
  | "Advanced"
  | "Elite";

export type VideoQuality = "Fair" | "Good" | "Excellent";

export type AnalysisReliability = "Medium" | "Good" | "High";

export type AnalysisConfidence = "Low" | "Medium" | "High";

export type VideoQualityCheckStatus = "pass" | "warning" | "fail";

export type VideoQualityCheck = {
  label: string;
  status: VideoQualityCheckStatus;
  message: string;
};

export type VideoQualityReport = {
  quality: VideoQuality;
  reliability: AnalysisReliability;
  warnings: string[];
  checks: VideoQualityCheck[];
};

export type DrillValidityStatus = "Valid" | "Unclear" | "Invalid";

export type DrillValidityConfidence = "High" | "Medium" | "Low";

export type DrillValidityCheckStatus = "pass" | "warning" | "fail";

export type DrillValidityCheck = {
  label: string;
  status: DrillValidityCheckStatus;
  message: string;
};

export type DrillValidityReport = {
  status: DrillValidityStatus;
  confidence: DrillValidityConfidence;
  warnings: string[];
  checks: DrillValidityCheck[];
};

export type PoseQuality = "Good" | "Partial" | "Poor";

export type PoseFrameSummary = {
  frameIndex: number;
  timestampSeconds: number;
  poseDetected: boolean;
  landmarkCount: number;
  visibilityAverage: number | null;
};

export type PoseAnalysisSummary = {
  framesAnalyzed: number;
  framesWithPose: number;
  poseDetectionRate: number;
  averageVisibility: number | null;
  poseQuality: PoseQuality;
  frameSummaries: PoseFrameSummary[];
};

export type ShootingAnalysisCategory =
  | "Approach & Balance"
  | "Plant Foot Position"
  | "Body Posture"
  | "Contact Mechanics"
  | "Follow-through"
  | "Accuracy";

export type AnalysisMainFocus =
  | ShootingAnalysisCategory
  | "Recording Clarity"
  | "Shot Action Clarity";

export type ShootingAnalysisResult = {
  id?: string;
  createdAt?: string;
  moduleName?: string;
  drillName?: string;
  overallScore: number;
  level: AnalysisLevel;
  detectedShots: number | string;
  totalShots?: number;
  videoQuality: VideoQuality;
  analysisReliability: AnalysisReliability;
  analysisConfidence?: AnalysisConfidence;
  mainFocus: AnalysisMainFocus;
  mainFocusDescription: string;
  technicalBreakdown: SubScore[];
  aiCoachFeedback: string;
  recommendedTraining: TrainingDrill[];
  uploadedFile?: UploadedFileMetadata;
  videoMetadata?: VideoMetadata;
  videoQualityReport?: VideoQualityReport;
  drillValidityReport?: DrillValidityReport | null;
  sampledFrames?: SampledFrameInfo[];
  poseAnalysis?: PoseAnalysisSummary | null;
};

export type AnalysisResult = ShootingAnalysisResult;

export type HistoryItem = {
  score: number;
  date: string;
  delta: number | null;
  label: string;
};

export type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
  moduleName: string;
  drillName: string;
  overallScore: number;
  level: AnalysisLevel;
  detectedShots: number | string;
  totalShots?: number;
  videoQuality: VideoQuality;
  analysisReliability: AnalysisReliability;
  analysisConfidence?: AnalysisConfidence;
  mainFocus: string;
  videoMetadata?: VideoMetadata;
  videoQualityReport?: VideoQualityReport;
  drillValidityReport?: DrillValidityReport | null;
  sampledFrames?: SampledFrameInfo[];
  poseAnalysis?: PoseAnalysisSummary | null;
};

export type BadgeId =
  | "first-shot-analysis"
  | "three-analyses-completed"
  | "accuracy-builder"
  | "follow-through-fixer"
  | "clean-video"
  | "consistent-trainer";

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
};

export type LevelProgress = {
  currentLevel: number;
  currentLevelXp: number;
  nextLevel: number;
  nextLevelXp: number;
  progressPercent: number;
};

export type GamificationState = {
  totalXp: number;
  analysesCompleted: number;
  currentLevel: number;
  currentStreak: number;
  lastAnalysisDate: string | null;
  unlockedBadges: BadgeId[];
  dailyQuestCompletedDate: string | null;
  weeklyQuestProgress: number;
  weeklyQuestAnchorDate: string | null;
  rewardedAnalysisIds: string[];
  analysisDates: string[];
};

export type AnalysisRewardSummary = {
  analysisId: string;
  xpEarned: number;
  totalXp: number;
  previousLevel: number;
  currentLevel: number;
  levelProgress: LevelProgress;
  newlyUnlockedBadges: Badge[];
  dailyQuestCompleted: boolean;
  weeklyQuestProgress: number;
  alreadyRewarded: boolean;
};

export type SkillId =
  | "approach-balance"
  | "plant-foot-position"
  | "body-posture"
  | "contact-mechanics"
  | "follow-through"
  | "accuracy"
  | "recording-clarity"
  | "shot-action-clarity";

export type SkillStatus = "locked" | "active" | "developing" | "strong";

export type SkillNode = {
  id: SkillId;
  name: AnalysisMainFocus;
  description: string;
  xp: number;
  level: number;
  progressPercent: number;
  status: SkillStatus;
};

export type SkillTreeState = {
  skills: SkillNode[];
  lastUpdatedAt: string | null;
  recommendedFocusSkillId: SkillId | null;
  rewardedSkillAnalysisIds: string[];
};

export type SkillRewardSummary = {
  skillId: SkillId;
  skillName: string;
  xpEarned: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
};

export type SkillTreeRewardResult = {
  analysisId: string;
  rewards: SkillRewardSummary[];
  skillTreeState: SkillTreeState;
  recommendedFocusSkillId: SkillId | null;
  alreadyRewarded: boolean;
};

export type ProfileField = {
  label: string;
  value: string;
};

export type VideoRule = {
  icon: string;
  title: string;
  detail: string;
};

export type SelectedVideoMetadata = {
  fileName: string;
  fileSizeMb: number;
  durationSeconds: number;
  file: File;
};

export type UploadedFileMetadata = {
  filename: string;
  contentType: string;
  fileSizeBytes: number;
};

export type VideoMetadata = {
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  frameCount: number;
  sampledFrameCount: number;
};

export type SampledFrameInfo = {
  frameIndex: number;
  timestampSeconds: number;
  width: number;
  height: number;
};

export type AnalysisSessionStatus = "processing" | "completed";

export type AnalysisSession = {
  id: string;
  selectedVideo: SelectedVideoMetadata;
  status: AnalysisSessionStatus;
  createdAt: string;
  completedAt?: string;
  historyItemId?: string;
  savedToHistory: boolean;
  result?: ShootingAnalysisResult;
  rewardSummary?: AnalysisRewardSummary;
  skillRewardSummary?: SkillTreeRewardResult;
};

export type VideoValidationError =
  | "not-video"
  | "duration-unavailable"
  | "too-short"
  | "too-long";

export type VideoValidationResult =
  | {
      isValid: true;
      metadata: SelectedVideoMetadata;
      error: null;
      message: null;
    }
  | {
      isValid: false;
      metadata: SelectedVideoMetadata | null;
      error: VideoValidationError;
      message: string;
    };

export type AppScreenProps = ScreenProps & {
  selectedVideo: SelectedVideoMetadata | null;
  selectedVideoValidation: VideoValidationResult | null;
  currentAnalysisSession: AnalysisSession | null;
  onVideoValidationChange: (validation: VideoValidationResult | null) => void;
  onClearSelectedVideo: () => void;
  onStartAnalysis: () => void;
  onCompleteAnalysis: (sessionId: string, result: ShootingAnalysisResult) => void;
};
