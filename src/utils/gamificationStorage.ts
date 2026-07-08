import {
  badges,
  calculateAnalysisXp,
  calculatePlayerLevel,
  getBadgeById,
  getBadgeIdsForAnalysis,
  getDateKey,
  getLevelProgress,
  getWeekAnchorDate,
  isSameDay,
} from "./gamification";
import type { AnalysisRewardSummary, Badge, BadgeId, GamificationState, ShootingAnalysisResult } from "../types";

export const GAMIFICATION_STORAGE_KEY = "coachai.gamification";

const defaultGamificationState: GamificationState = {
  totalXp: 0,
  analysesCompleted: 0,
  currentLevel: 1,
  currentStreak: 0,
  lastAnalysisDate: null,
  unlockedBadges: [],
  dailyQuestCompletedDate: null,
  weeklyQuestProgress: 0,
  weeklyQuestAnchorDate: null,
  rewardedAnalysisIds: [],
  analysisDates: [],
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function getGamificationState(): GamificationState {
  if (!canUseLocalStorage()) {
    return defaultGamificationState;
  }

  try {
    const rawState = window.localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!rawState) {
      return defaultGamificationState;
    }

    return normalizeGamificationState(JSON.parse(rawState));
  } catch {
    return defaultGamificationState;
  }
}

export function saveGamificationState(state: GamificationState) {
  const normalizedState = normalizeGamificationState(state);

  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(normalizedState));
    } catch {
      // Storage can fail in private browsing or quota-limited environments.
    }
  }

  return normalizedState;
}

export function clearGamificationState() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
}

export function applyAnalysisRewards(result: ShootingAnalysisResult): AnalysisRewardSummary {
  const currentState = getGamificationState();
  const analysisId = getAnalysisRewardId(result);
  const levelProgressBefore = getLevelProgress(currentState.totalXp);

  if (currentState.rewardedAnalysisIds.includes(analysisId)) {
    return {
      analysisId,
      xpEarned: 0,
      totalXp: currentState.totalXp,
      previousLevel: currentState.currentLevel,
      currentLevel: currentState.currentLevel,
      levelProgress: levelProgressBefore,
      newlyUnlockedBadges: [],
      dailyQuestCompleted: isSameDay(currentState.dailyQuestCompletedDate ?? "", new Date()),
      weeklyQuestProgress: getCurrentWeeklyProgress(currentState),
      alreadyRewarded: true,
    };
  }

  const completedAt = result.createdAt ?? new Date().toISOString();
  const completedDate = new Date(completedAt);
  const completedDateKey = getDateKey(completedDate);
  const currentWeekAnchor = getWeekAnchorDate(completedDate);
  const isCurrentStoredWeek = currentState.weeklyQuestAnchorDate === currentWeekAnchor;
  const previousWeeklyProgress = isCurrentStoredWeek ? currentState.weeklyQuestProgress : 0;
  const totalXp = currentState.totalXp + calculateAnalysisXp(result);
  const analysesCompleted = currentState.analysesCompleted + 1;
  const currentLevel = calculatePlayerLevel(totalXp);
  const analysisDates = addUnique(currentState.analysisDates, completedDateKey);
  const unlockedBadgeIds = new Set<BadgeId>(currentState.unlockedBadges);
  const newlyUnlockedBadges: Badge[] = [];

  getEarnedBadgeIds(result, analysesCompleted, analysisDates).forEach((badgeId) => {
    if (!unlockedBadgeIds.has(badgeId)) {
      unlockedBadgeIds.add(badgeId);
      const badge = getBadgeById(badgeId);
      if (badge) {
        newlyUnlockedBadges.push(badge);
      }
    }
  });

  const nextState: GamificationState = {
    totalXp,
    analysesCompleted,
    currentLevel,
    currentStreak: getNextStreak(currentState, completedDate),
    lastAnalysisDate: completedAt,
    unlockedBadges: Array.from(unlockedBadgeIds),
    dailyQuestCompletedDate: completedDateKey,
    weeklyQuestProgress: Math.min(3, previousWeeklyProgress + 1),
    weeklyQuestAnchorDate: currentWeekAnchor,
    rewardedAnalysisIds: addUnique(currentState.rewardedAnalysisIds, analysisId),
    analysisDates,
  };

  saveGamificationState(nextState);

  return {
    analysisId,
    xpEarned: calculateAnalysisXp(result),
    totalXp,
    previousLevel: currentState.currentLevel,
    currentLevel,
    levelProgress: getLevelProgress(totalXp),
    newlyUnlockedBadges,
    dailyQuestCompleted: true,
    weeklyQuestProgress: nextState.weeklyQuestProgress,
    alreadyRewarded: false,
  };
}

function normalizeGamificationState(value: unknown): GamificationState {
  if (!value || typeof value !== "object") {
    return defaultGamificationState;
  }

  const state = value as Record<string, unknown>;
  const totalXp = normalizeNumber(state.totalXp);
  const currentLevel = calculatePlayerLevel(totalXp);
  const weeklyQuestAnchorDate = normalizeNullableString(state.weeklyQuestAnchorDate);
  const weeklyQuestProgress = weeklyQuestAnchorDate === getWeekAnchorDate(new Date()) ? normalizeNumber(state.weeklyQuestProgress) : 0;

  return {
    totalXp,
    analysesCompleted: normalizeNumber(state.analysesCompleted),
    currentLevel,
    currentStreak: normalizeNumber(state.currentStreak),
    lastAnalysisDate: normalizeNullableString(state.lastAnalysisDate),
    unlockedBadges: normalizeBadgeIds(state.unlockedBadges),
    dailyQuestCompletedDate: normalizeNullableString(state.dailyQuestCompletedDate),
    weeklyQuestProgress: Math.min(3, weeklyQuestProgress),
    weeklyQuestAnchorDate: weeklyQuestAnchorDate === getWeekAnchorDate(new Date()) ? weeklyQuestAnchorDate : getWeekAnchorDate(new Date()),
    rewardedAnalysisIds: normalizeStringArray(state.rewardedAnalysisIds),
    analysisDates: normalizeStringArray(state.analysisDates),
  };
}

function getEarnedBadgeIds(
  result: ShootingAnalysisResult,
  analysesCompleted: number,
  analysisDates: string[],
) {
  const earnedBadgeIds = new Set<BadgeId>(getBadgeIdsForAnalysis(result));

  if (analysesCompleted >= 1) {
    earnedBadgeIds.add("first-shot-analysis");
  }

  if (analysesCompleted >= 3) {
    earnedBadgeIds.add("three-analyses-completed");
  }

  if (analysisDates.length >= 3) {
    earnedBadgeIds.add("consistent-trainer");
  }

  return Array.from(earnedBadgeIds);
}

function getAnalysisRewardId(result: ShootingAnalysisResult) {
  return result.id ?? `${result.createdAt ?? "analysis"}-${result.overallScore}-${result.mainFocus}`;
}

function getNextStreak(state: GamificationState, completedDate: Date) {
  if (!state.lastAnalysisDate) {
    return 1;
  }

  const lastDate = new Date(state.lastAnalysisDate);
  if (isSameDay(lastDate, completedDate)) {
    return Math.max(1, state.currentStreak);
  }

  const yesterday = new Date(completedDate);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(lastDate, yesterday)) {
    return state.currentStreak + 1;
  }

  return 1;
}

function getCurrentWeeklyProgress(state: GamificationState) {
  return state.weeklyQuestAnchorDate === getWeekAnchorDate(new Date()) ? state.weeklyQuestProgress : 0;
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function normalizeNullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeBadgeIds(value: unknown) {
  const knownBadgeIds = new Set(badges.map((badge) => badge.id));
  return normalizeStringArray(value).filter((badgeId): badgeId is BadgeId => knownBadgeIds.has(badgeId as BadgeId));
}

function addUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}
