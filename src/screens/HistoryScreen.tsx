import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BottomNav, StatCard } from "../components";
import { historyFilters, historyItems, historyProgress } from "../data/historyItems";
import { G } from "../utils/theme";
import type { ScreenProps } from "../types";

export function HistoryScreen({ go }: ScreenProps) {
  const [filter, setFilter] = useState(historyFilters[0]);
  const chartData = historyItems.slice().reverse().map((session, index) => ({
    label: `S${index + 1}`,
    score: session.score,
  }));
  const bestScore = Math.max(...historyItems.map((session) => session.score));
  const avgScore = Math.round(historyItems.reduce((total, session) => total + session.score, 0) / historyItems.length);
  const latestScore = historyItems[0].score;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-14 pb-4">
        <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: G.green }}>History Progress</p>
        <h1 className="text-[28px] font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
          History
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Latest" value={latestScore} color={G.green} className="rounded-xl py-3.5 px-1" />
          <StatCard label="Best" value={bestScore} color={G.blue} className="rounded-xl py-3.5 px-1" />
          <StatCard label="Average" value={avgScore} color={G.amber} className="rounded-xl py-3.5 px-1" />
        </div>

        <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>Score Over Time</p>
              <p className="text-[11px] mt-0.5" style={{ color: G.green }}>{historyProgress.scoreDelta}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px]" style={{ color: G.muted }}>Most improved</p>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: G.green }}>{historyProgress.mostImproved}</p>
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
              <YAxis domain={[55, 90]} tick={{ fill: G.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
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

        <div className="space-y-2">
          {historyItems.map(({ score, date, delta, label }, index) => (
            <div
              key={`${label}-${date}`}
              className="flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-all active:scale-[0.98] cursor-pointer"
              style={{ background: G.card, border: `1px solid ${G.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
                <span className="text-[18px]">⚽</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: G.white }}>{label} · Shooting</p>
                <p className="text-[11px] mt-0.5" style={{ color: G.muted }}>{date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[18px] font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
                  {score}<span className="text-[11px] font-normal" style={{ color: G.muted }}>/100</span>
                </div>
                {delta !== null && (
                  <div className="text-[10px] font-bold mt-0.5" style={{ color: delta > 0 ? G.green : G.red }}>
                    {delta > 0 ? `↑ +${delta}` : `↓ ${delta}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="history" onNav={go} />
    </div>
  );
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
