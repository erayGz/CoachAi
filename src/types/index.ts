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
