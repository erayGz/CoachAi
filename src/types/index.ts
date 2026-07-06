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
  mainFocus: ShootingAnalysisCategory;
  mainFocusDescription: string;
  technicalBreakdown: SubScore[];
  aiCoachFeedback: string;
  recommendedTraining: TrainingDrill[];
  uploadedFile?: UploadedFileMetadata;
  videoMetadata?: VideoMetadata;
  videoQualityReport?: VideoQualityReport;
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
  detectedShots: number;
  totalShots: number;
  videoQuality: VideoQuality;
  analysisReliability: AnalysisReliability;
  mainFocus: string;
  videoMetadata?: VideoMetadata;
  videoQualityReport?: VideoQualityReport;
  sampledFrames?: SampledFrameInfo[];
  poseAnalysis?: PoseAnalysisSummary | null;
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
