import { formatShotAction } from "./analysisResult";
import type { Badge, BadgeId, LevelProgress, ShootingAnalysisResult } from "../types";

export const badges: Badge[] = [
  {
    id: "first-shot-analysis",
    name: "First Shot Analysis",
    description: "Completed your first CoachAI shooting analysis.",
  },
  {
    id: "three-analyses-completed",
    name: "Three Analyses Completed",
    description: "Completed three shooting analyses.",
  },
  {
    id: "accuracy-builder",
    name: "Accuracy Builder",
    description: "Worked on shot accuracy as a main focus.",
  },
  {
    id: "follow-through-fixer",
    name: "Follow-through Fixer",
    description: "Worked on completing the kicking motion.",
  },
  {
    id: "clean-video",
    name: "Clean Shooting Clip",
    description: "Uploaded a clear, verified shooting clip with usable analysis confidence.",
  },
  {
    id: "consistent-trainer",
    name: "Consistent Trainer",
    description: "Completed analyses on three different days.",
  },
];

const levelThresholds = [0, 250, 600, 1000, 1500, 2100, 2800];

export function calculateAnalysisXp(result: ShootingAnalysisResult) {
  const drillValidityStatus = result.drillValidityReport?.status ?? "Unclear";

  if (drillValidityStatus === "Invalid") {
    return 10;
  }

  if (drillValidityStatus === "Unclear") {
    let xp = 30;

    if (result.analysisConfidence === "Medium") {
      xp += 10;
    }

    if (result.detectedShots === "Likely") {
      xp += 10;
    }

    return xp;
  }

  let xp = 50;
  if (result.overallScore >= 65) {
    xp += 20;
  }

  if (result.overallScore >= 80) {
    xp += 40;
  }

  xp += 20;

  if (result.analysisConfidence === "High") {
    xp += 20;
  } else if (result.analysisConfidence === "Medium") {
    xp += 10;
  }

  if (formatShotAction(result) === "Likely") {
    xp += 10;
  }

  return xp;
}

export function calculatePlayerLevel(totalXp: number) {
  const safeXp = Math.max(0, totalXp);
  let level = 1;

  while (getLevelThreshold(level + 1) <= safeXp) {
    level += 1;
  }

  return level;
}

export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp);
  const currentLevel = calculatePlayerLevel(safeXp);
  const currentLevelXp = getLevelThreshold(currentLevel);
  const nextLevel = currentLevel + 1;
  const nextLevelXp = getLevelThreshold(nextLevel);
  const levelSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((safeXp - currentLevelXp) / levelSpan) * 100)));

  return {
    currentLevel,
    currentLevelXp,
    nextLevel,
    nextLevelXp,
    progressPercent,
  };
}

export function isSameDay(dateA: Date | string, dateB: Date | string) {
  const first = toDate(dateA);
  const second = toDate(dateB);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function isSameWeek(dateA: Date | string, dateB: Date | string) {
  return getWeekStart(toDate(dateA)).getTime() === getWeekStart(toDate(dateB)).getTime();
}

export function getBadgeById(id: BadgeId) {
  return badges.find((badge) => badge.id === id);
}

export function getDateKey(date: Date | string) {
  const parsedDate = toDate(date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekAnchorDate(date: Date | string) {
  return getDateKey(getWeekStart(toDate(date)));
}

export function getBadgeIdsForAnalysis(result: ShootingAnalysisResult): BadgeId[] {
  const badgeIds: BadgeId[] = [];
  const isValidResult = result.drillValidityReport?.status === "Valid";

  if (isValidResult && result.mainFocus === "Accuracy") {
    badgeIds.push("accuracy-builder");
  }

  if (isValidResult && result.mainFocus === "Follow-through") {
    badgeIds.push("follow-through-fixer");
  }

  if (
    isValidResult &&
    (result.videoQuality === "Good" || result.videoQuality === "Excellent") &&
    result.analysisConfidence !== "Low" &&
    formatShotAction(result) === "Likely"
  ) {
    badgeIds.push("clean-video");
  }

  return badgeIds;
}

function getLevelThreshold(level: number): number {
  if (level <= 1) {
    return 0;
  }

  if (level <= levelThresholds.length) {
    return levelThresholds[level - 1];
  }

  let threshold = levelThresholds[levelThresholds.length - 1];
  for (let nextLevel = levelThresholds.length + 1; nextLevel <= level; nextLevel += 1) {
    threshold += 700 + (nextLevel - levelThresholds.length) * 100;
  }

  return threshold;
}

function toDate(date: Date | string) {
  return date instanceof Date ? date : new Date(date);
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  return weekStart;
}
