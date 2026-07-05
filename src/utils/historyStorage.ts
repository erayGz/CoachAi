import { activeModuleLabel } from "../data/appMeta";
import { getDetectedShotCounts } from "./analysisResult";
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
  const detectedShots = normalizeDetectedShots(item.detectedShots);
  const totalShots = normalizeTotalShots(item.detectedShots, item.totalShots);

  if (
    typeof item.id !== "string" ||
    typeof item.createdAt !== "string" ||
    typeof item.moduleName !== "string" ||
    typeof item.drillName !== "string" ||
    typeof item.overallScore !== "number" ||
    typeof item.level !== "string" ||
    typeof item.videoQuality !== "string" ||
    typeof item.mainFocus !== "string" ||
    detectedShots === null ||
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
    detectedShots,
    totalShots,
    videoQuality: item.videoQuality as VideoQuality,
    analysisReliability: reliability,
    mainFocus: item.mainFocus,
    videoMetadata: normalizeVideoMetadata(item.videoMetadata),
  };
}

function normalizeDetectedShots(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const detected = Number.parseInt(value.split("/")[0], 10);
    return Number.isFinite(detected) ? detected : null;
  }

  return null;
}

function normalizeTotalShots(detectedShots: unknown, totalShots: unknown) {
  if (typeof totalShots === "number") {
    return totalShots;
  }

  if (typeof detectedShots === "string") {
    const total = Number.parseInt(detectedShots.split("/")[1], 10);
    return Number.isFinite(total) ? total : 5;
  }

  return 5;
}

function normalizeVideoMetadata(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const metadata = value as Record<string, unknown>;

  if (
    typeof metadata.durationSeconds !== "number" ||
    typeof metadata.fps !== "number" ||
    typeof metadata.width !== "number" ||
    typeof metadata.height !== "number" ||
    typeof metadata.frameCount !== "number" ||
    typeof metadata.sampledFrameCount !== "number"
  ) {
    return undefined;
  }

  return {
    durationSeconds: metadata.durationSeconds,
    fps: metadata.fps,
    width: metadata.width,
    height: metadata.height,
    frameCount: metadata.frameCount,
    sampledFrameCount: metadata.sampledFrameCount,
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

export function createAnalysisHistoryItem(session: AnalysisSession): AnalysisHistoryItem {
  if (!session.result) {
    throw new Error("Cannot save history without a generated analysis result.");
  }

  const { result } = session;
  const { detected, total } = getDetectedShotCounts(result);

  return {
    id: result.id ?? session.historyItemId ?? session.id ?? createHistoryId(),
    createdAt: result.createdAt ?? session.completedAt ?? new Date().toISOString(),
    moduleName: result.moduleName ?? activeModuleLabel,
    drillName: result.drillName ?? "Shooting Analysis",
    overallScore: result.overallScore,
    level: result.level,
    detectedShots: detected,
    totalShots: total,
    videoQuality: result.videoQuality,
    analysisReliability: result.analysisReliability,
    mainFocus: result.mainFocus,
    videoMetadata: result.videoMetadata,
  };
}

export function saveAnalysisToHistory(session: AnalysisSession) {
  return saveAnalysisHistoryItem(createAnalysisHistoryItem(session));
}

export function createMockAnalysisHistoryItem(session: AnalysisSession): AnalysisHistoryItem {
  return createAnalysisHistoryItem(session);
}

export function saveMockAnalysisToHistory(session: AnalysisSession) {
  return saveAnalysisToHistory(session);
}

export function formatHistoryDateTime(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}
