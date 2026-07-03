import type { Screen } from "../types";

export const initialScreen: Screen = "splash";

export const screenRegistry: { id: Screen; label: string }[] = [
  { id: "splash", label: "Splash" },
  { id: "dashboard", label: "Home" },
  { id: "shooting-guide", label: "Guide" },
  { id: "video-upload", label: "Upload" },
  { id: "processing", label: "Processing" },
  { id: "results", label: "Results" },
  { id: "history", label: "History" },
  { id: "profile", label: "Profile" },
];

const shootingLabFlow: Screen[] = [
  "shooting-guide",
  "video-upload",
  "processing",
  "results",
];

export function isShootingLabScreen(screen: Screen) {
  return shootingLabFlow.includes(screen);
}
