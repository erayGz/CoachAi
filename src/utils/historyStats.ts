import type { AnalysisHistoryItem } from "../types";

export const historyFilters = ["All", "This Week", "This Month"] as const;

export type HistoryFilter = (typeof historyFilters)[number];

export type HistorySummary = {
  totalAnalyses: number;
  latestScore: number | null;
  bestScore: number | null;
  averageScore: number | null;
};

export function getHistorySummary(items: AnalysisHistoryItem[]): HistorySummary {
  const scores = items.map((item) => item.overallScore);

  if (scores.length === 0) {
    return {
      totalAnalyses: 0,
      latestScore: null,
      bestScore: null,
      averageScore: null,
    };
  }

  return {
    totalAnalyses: items.length,
    latestScore: items[0]?.overallScore ?? null,
    bestScore: Math.max(...scores),
    averageScore: Math.round(scores.reduce((total, score) => total + score, 0) / scores.length),
  };
}

export function filterHistoryItems(
  items: AnalysisHistoryItem[],
  filter: HistoryFilter,
  now = new Date(),
) {
  if (filter === "All") {
    return items;
  }

  if (filter === "This Week") {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    return items.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return createdAt >= sevenDaysAgo && createdAt <= now;
    });
  }

  return items.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
  });
}
