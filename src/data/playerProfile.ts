import { G } from "../utils/theme";
import type { ProfileField, StatItem } from "../types";

export const playerProfile = {
  name: "Marcus Silva",
  level: "Intermediate",
  ageGroup: "U-17",
  memberSince: "June 2025",
};

export const playerProfileStats: StatItem[] = [
  { label: "Total Sessions", value: "6", color: G.green },
  { label: "Avg Score", value: "73/100", color: G.blue },
  { label: "Best Score", value: "84/100", color: G.amber },
  { label: "Most Analyzed", value: "Shooting", color: G.purple },
];

export const playerProfileFields: ProfileField[] = [
  { label: "Age Group", value: "Under-17" },
  { label: "Position", value: "Centre Forward" },
  { label: "Dominant Foot", value: "Right" },
  { label: "Training Goal", value: "Improve shooting accuracy" },
  { label: "Training Level", value: "Intermediate" },
  { label: "Club / Academy", value: "FC Academy" },
];

export const privacyConsentItems = [
  "Uploaded videos stay mocked in this MVP prototype.",
  "Delete Uploaded Videos clears local demo data only.",
  "Real AI analysis and cloud storage are not enabled yet.",
];
