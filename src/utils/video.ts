import type { SelectedVideoMetadata, VideoValidationResult } from "../types";

export const MIN_SHOOTING_VIDEO_SECONDS = 3;
export const MAX_SHOOTING_VIDEO_SECONDS = 15;

const shortVideoMessage = "Video is too short. Please upload a 3–15 second shooting video.";
const longVideoMessage = "Video is too long. Please upload a 3–15 second shooting video.";
const videoExtensionPattern = /\.(avi|m4v|mkv|mov|mp4|webm)$/i;

export function isVideoFile(file: File) {
  return file.type.startsWith("video/") || (!file.type && videoExtensionPattern.test(file.name));
}

export function formatVideoSize(fileSizeMb: number) {
  return `${fileSizeMb.toFixed(1)} MB`;
}

export function formatVideoDuration(durationSeconds: number) {
  return `${Math.round(durationSeconds)} sec`;
}

export function createVideoMetadata(file: File, durationSeconds: number): SelectedVideoMetadata {
  return {
    fileName: file.name,
    fileSizeMb: file.size / (1024 * 1024),
    durationSeconds,
    file,
  };
}

export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    function cleanup() {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    }

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();

      if (Number.isFinite(duration) && duration > 0) {
        resolve(duration);
        return;
      }

      reject(new Error("Video duration is unavailable."));
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Video metadata could not be read."));
    };
    video.src = objectUrl;
  });
}

export async function validateShootingVideo(file: File): Promise<VideoValidationResult> {
  if (!isVideoFile(file)) {
    return {
      isValid: false,
      metadata: null,
      error: "not-video",
      message: "Selected file is not a video. Please upload a video file.",
    };
  }

  try {
    const durationSeconds = await readVideoDuration(file);
    const metadata = createVideoMetadata(file, durationSeconds);

    if (durationSeconds < MIN_SHOOTING_VIDEO_SECONDS) {
      return {
        isValid: false,
        metadata,
        error: "too-short",
        message: shortVideoMessage,
      };
    }

    if (durationSeconds > MAX_SHOOTING_VIDEO_SECONDS) {
      return {
        isValid: false,
        metadata,
        error: "too-long",
        message: longVideoMessage,
      };
    }

    return {
      isValid: true,
      metadata,
      error: null,
      message: null,
    };
  } catch {
    return {
      isValid: false,
      metadata: null,
      error: "duration-unavailable",
      message: "Could not read video duration. Please choose a different video file.",
    };
  }
}
