import { activeModuleLabel } from "../data/appMeta";
import { analysisResults } from "../data/analysisResults";
import type { AnalysisHistoryItem } from "../types";

export const ANALYSIS_HISTORY_STORAGE_KEY = "coachai.analysisHistory";

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isAnalysisHistoryItem(value: unknown): value is AnalysisHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.moduleName === "string" &&
    typeof item.drillName === "string" &&
    typeof item.overallScore === "number" &&
    typeof item.level === "string" &&
    typeof item.detectedShots === "number" &&
    typeof item.videoQuality === "string" &&
    typeof item.analysisReliability === "number" &&
    typeof item.mainFocus === "string"
  );
}

function sortNewestFirst(items: AnalysisHistoryItem[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAnalysisHistory(): AnalysisHistoryItem[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawHistory = window.localStorage.getItem(ANALYSIS_HISTORY_STORAGE_KEY);
    if (!rawHistory) {
      return [];
    }

    const parsedHistory: unknown = JSON.parse(rawHistory);
    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return sortNewestFirst(parsedHistory.filter(isAnalysisHistoryItem));
  } catch {
    return [];
  }
}

export function saveAnalysisHistoryItem(item: AnalysisHistoryItem) {
  const nextHistory = sortNewestFirst([item, ...getAnalysisHistory()]);

  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(ANALYSIS_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    } catch {
      // Storage can fail in private browsing or quota-limited environments.
    }
  }

  return item;
}

export function clearAnalysisHistory() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(ANALYSIS_HISTORY_STORAGE_KEY);
}

export function createMockAnalysisHistoryItem(date = new Date()): AnalysisHistoryItem {
  return {
    id: createHistoryId(),
    createdAt: date.toISOString(),
    moduleName: activeModuleLabel,
    drillName: "Shooting Analysis",
    overallScore: analysisResults.overallScore,
    level: analysisResults.level,
    detectedShots: analysisResults.detectedShots,
    videoQuality: analysisResults.videoQuality,
    analysisReliability: analysisResults.analysisReliability,
    mainFocus: analysisResults.mainFocusThisWeek,
  };
}

export function saveMockAnalysisToHistory() {
  return saveAnalysisHistoryItem(createMockAnalysisHistoryItem());
}

export function formatHistoryDateTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}
