import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Upload } from "lucide-react";
import { BottomNav, StatCard } from "../components";
import { clearGamificationState } from "../utils/gamificationStorage";
import { clearAnalysisHistory, formatHistoryDateTime, getAnalysisHistory } from "../utils/historyStorage";
import { filterHistoryItems, getHistorySummary, historyFilters, type HistoryFilter } from "../utils/historyStats";
import { clearSkillTreeState } from "../utils/skillTreeStorage";
import { G } from "../utils/theme";
import type { AnalysisHistoryItem, ScreenProps } from "../types";

export function HistoryScreen({ go }: ScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>("All");
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>(() => getAnalysisHistory());
  const hasSavedHistory = historyItems.length > 0;
  const filteredItems = filterHistoryItems(historyItems, filter);
  const hasFilteredHistory = filteredItems.length > 0;
  const summary = getHistorySummary(filteredItems);

  const chartData = filteredItems.slice().reverse().map((item, index) => ({
    label: `A${index + 1}`,
    score: item.overallScore,
  }));
  const latestFocus = filteredItems[0]?.mainFocus ?? "Plant Foot Position";
  const scoreDelta = getOverallScoreDelta(filteredItems);

  function handleClearHistory() {
    clearAnalysisHistory();
    clearGamificationState();
    clearSkillTreeState();
    setHistoryItems([]);
  }

  return (
    <div className="coachai-has-bottom-nav flex flex-col h-full">
      <div className="coachai-history-header px-5 pt-14 pb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: G.green }}>History Progress</p>
          <h1 className="text-[28px] font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
            History
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>
            Saved on this device.
          </p>
        </div>
      </div>

      <div className="coachai-scroll-content flex-1 overflow-y-auto px-5 space-y-4" style={{ scrollbarWidth: "none" }}>
        {hasSavedHistory ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Latest Score"
                value={summary.latestScore ?? "--"}
                color={G.green}
                className="rounded-xl py-3.5 px-1"
              />
              <StatCard
                label="Best Score"
                value={summary.bestScore ?? "--"}
                color={G.blue}
                className="rounded-xl py-3.5 px-1"
              />
              <StatCard
                label="Average Score"
                value={summary.averageScore ?? "--"}
                color={G.amber}
                className="rounded-xl py-3.5 px-1"
              />
              <StatCard label="Total Analyses" value={summary.totalAnalyses} color={G.purple} className="rounded-xl py-3.5 px-1" />
            </div>

            <div className="flex gap-2">
              {historyFilters.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all"
                  style={{
                    background: filter === item ? G.greenDim : G.card,
                    color: filter === item ? G.green : G.muted,
                    border: `1px solid ${filter === item ? G.greenBorder : G.border}`,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            {hasFilteredHistory ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ProgressInsightCard label="Most Improved" value="Follow-through +12" color={G.green} />
                  <ProgressInsightCard label="Needs Work" value={latestFocus} color={G.amber} />
                </div>

                <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>Score Over Time</p>
                      <p className="text-[11px] mt-0.5" style={{ color: G.green }}>{scoreDelta}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: G.muted }}>Needs work</p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: G.amber }}>{latestFocus}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={G.green} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={G.green} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fill: G.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[30, 95]} tick={{ fill: G.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={G.green}
                        strokeWidth={2.5}
                        fill="url(#sg)"
                        dot={{ fill: G.green, strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: G.green, stroke: G.bg, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {filteredItems.map((item, index) => {
                    const delta = getSessionDelta(filteredItems, index);
                    return <HistoryResultCard key={item.id} item={item} delta={delta} />;
                  })}
                </div>
              </>
            ) : (
              <EmptyFilteredHistoryState />
            )}
          </>
        ) : (
          <EmptyHistoryState go={go} />
        )}
        <DevClearHistoryAction hasHistory={hasSavedHistory} onClear={handleClearHistory} />
      </div>
      <BottomNav active="history" onNav={go} />
    </div>
  );
}

function EmptyHistoryState({ go }: ScreenProps) {
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
        <Upload size={20} color={G.green} />
      </div>
      <p className="text-[13px] font-semibold mt-4 leading-relaxed" style={{ color: G.whiteDim }}>
        No analyses yet. Upload your first shooting video to start tracking your progress.
      </p>
      <button
        onClick={() => go("shooting-guide")}
        className="mt-4 px-4 py-2.5 rounded-xl text-[12px] font-black tracking-wide uppercase transition-all active:scale-[0.97]"
        style={{
          background: "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)",
          color: G.bg,
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        Start First Analysis
      </button>
    </div>
  );
}

function EmptyFilteredHistoryState() {
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <p className="text-[13px] font-semibold leading-relaxed" style={{ color: G.whiteDim }}>
        No analyses found for this period.
      </p>
    </div>
  );
}

function DevClearHistoryAction({ hasHistory, onClear }: { hasHistory: boolean; onClear: () => void }) {
  return (
    <div className="flex justify-center pt-1">
      <button
        onClick={onClear}
        disabled={!hasHistory}
        className="px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wide uppercase transition-all"
        style={{
          background: "transparent",
          color: hasHistory ? `${G.red}AA` : `${G.muted}80`,
          border: `1px solid ${hasHistory ? `${G.red}22` : `${G.border}`}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Dev: Clear Local History
      </button>
    </div>
  );
}

function HistoryResultCard({ item, delta }: { item: AnalysisHistoryItem; delta: number | null }) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-all active:scale-[0.98] cursor-pointer" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
        <span className="text-[18px]">⚽</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: G.white }}>
          {item.drillName}
        </p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: G.muted }}>
          {formatHistoryDateTime(item.createdAt)} - {item.level} - {item.videoQuality} quality - {item.analysisReliability} reliability
        </p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: G.muted }}>
          Focus: {item.mainFocus}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[18px] font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
          {item.overallScore}<span className="text-[11px] font-normal" style={{ color: G.muted }}>/100</span>
        </div>
        {delta !== null && (
          <div className="text-[10px] font-bold mt-0.5" style={{ color: delta > 0 ? G.green : delta < 0 ? G.red : G.muted }}>
            {delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : "0"}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressInsightCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
        {label}
      </p>
      <p className="text-[13px] font-bold mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function getSessionDelta(items: AnalysisHistoryItem[], index: number) {
  const previous = items[index + 1];
  if (!previous) {
    return null;
  }

  return items[index].overallScore - previous.overallScore;
}

function getOverallScoreDelta(items: AnalysisHistoryItem[]) {
  if (items.length < 2) {
    return "First saved analysis";
  }

  const newestScore = items[0].overallScore;
  const oldestScore = items[items.length - 1].overallScore;
  const delta = newestScore - oldestScore;
  const prefix = delta > 0 ? "+" : "";

  return `${prefix}${delta} pts across ${items.length} analyses`;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
        <p className="text-[14px] font-black" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {payload[0].value}/100
        </p>
      </div>
    );
  }

  return null;
}
