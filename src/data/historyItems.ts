import type { HistoryItem } from "../types";

export const historyItems: HistoryItem[] = [
  { score: 76, date: "Today, 14:32", delta: 7, label: "Session 6" },
  { score: 69, date: "Yesterday, 10:15", delta: -3, label: "Session 5" },
  { score: 72, date: "Mon 30 Jun", delta: 4, label: "Session 4" },
  { score: 68, date: "Sat 28 Jun", delta: -2, label: "Session 3" },
  { score: 70, date: "Thu 26 Jun", delta: 8, label: "Session 2" },
  { score: 62, date: "Tue 24 Jun", delta: null, label: "Session 1" },
];

export const historyFilters = ["All", "This Week", "This Month"];

export const historyProgress = {
  scoreDelta: "+14 pts across 6 sessions",
  mostImproved: "Follow-Through",
};
