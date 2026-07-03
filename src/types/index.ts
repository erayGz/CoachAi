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
};

export type TrainingDrill = {
  name: string;
  reps: string;
  focus: string;
};

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
  level: string;
  detectedShots: number;
  videoQuality: string;
  analysisReliability: number;
  mainFocus: string;
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
  onCompleteAnalysis: (sessionId: string) => void;
};
