import { activeModuleLabel } from "../data/appMeta";
import type { AnalysisHistoryItem, AnalysisLevel, AnalysisReliability, AnalysisSession, VideoQuality } from "../types";

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

function normalizeReliability(value: unknown): AnalysisReliability | null {
  if (value === "Medium" || value === "Good" || value === "High") {
    return value;
  }

  if (typeof value === "number") {
    if (value >= 86) return "High";
    if (value >= 70) return "Good";
    return "Medium";
  }

  return null;
}

function normalizeAnalysisHistoryItem(value: unknown): AnalysisHistoryItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const reliability = normalizeReliability(item.analysisReliability);

  if (
    typeof item.id !== "string" ||
    typeof item.createdAt !== "string" ||
    typeof item.moduleName !== "string" ||
    typeof item.drillName !== "string" ||
    typeof item.overallScore !== "number" ||
    typeof item.level !== "string" ||
    typeof item.detectedShots !== "number" ||
    typeof item.videoQuality !== "string" ||
    typeof item.mainFocus !== "string" ||
    !reliability
  ) {
    return null;
  }

  return {
    id: item.id,
    createdAt: item.createdAt,
    moduleName: item.moduleName,
    drillName: item.drillName,
    overallScore: item.overallScore,
    level: item.level as AnalysisLevel,
    detectedShots: item.detectedShots,
    totalShots: typeof item.totalShots === "number" ? item.totalShots : 5,
    videoQuality: item.videoQuality as VideoQuality,
    analysisReliability: reliability,
    mainFocus: item.mainFocus,
  };
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

    return sortNewestFirst(parsedHistory.map(normalizeAnalysisHistoryItem).filter((item): item is AnalysisHistoryItem => Boolean(item)));
  } catch {
    return [];
  }
}

export function saveAnalysisHistoryItem(item: AnalysisHistoryItem) {
  const currentHistory = getAnalysisHistory();
  if (currentHistory.some((historyItem) => historyItem.id === item.id)) {
    return item;
  }

  const nextHistory = sortNewestFirst([item, ...currentHistory]);

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

export function createMockAnalysisHistoryItem(session: AnalysisSession): AnalysisHistoryItem {
  if (!session.result) {
    throw new Error("Cannot save history without a generated analysis result.");
  }

  const { result } = session;

  return {
    id: session.historyItemId ?? session.id ?? createHistoryId(),
    createdAt: session.completedAt ?? new Date().toISOString(),
    moduleName: activeModuleLabel,
    drillName: "Shooting Analysis",
    overallScore: result.overallScore,
    level: result.level,
    detectedShots: result.detectedShots,
    totalShots: result.totalShots,
    videoQuality: result.videoQuality,
    analysisReliability: result.analysisReliability,
    mainFocus: result.mainFocus,
  };
}

export function saveMockAnalysisToHistory(session: AnalysisSession) {
  return saveAnalysisHistoryItem(createMockAnalysisHistoryItem(session));
}

export function formatHistoryDateTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}
