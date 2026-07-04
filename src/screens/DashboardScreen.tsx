import { ChevronRight, Lock, Target } from "lucide-react";
import { BottomNav, FieldGrid, GlowOrb, StatCard } from "../components";
import { activeModuleLabel } from "../data/appMeta";
import { formatHistoryDateTime, getAnalysisHistory } from "../utils/historyStorage";
import { G } from "../utils/theme";
import type { AnalysisHistoryItem, ScreenProps, StatItem } from "../types";

export function DashboardScreen({ go }: ScreenProps) {
  const historyItems = getAnalysisHistory();
  const recentSessions = historyItems.slice(0, 3);
  const statsRow = getDashboardStats(historyItems);

  return (
    <div className="coachai-has-bottom-nav flex flex-col h-full">
      <div className="coachai-scroll-content flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div
          className="coachai-dashboard-hero relative overflow-hidden px-5 pt-14 pb-7"
          style={{ background: `linear-gradient(165deg, #0B1430 0%, ${G.bg} 100%)` }}
        >
          <FieldGrid opacity={0.04} />
          <GlowOrb top="0" right="0" size={200} opacity={0.1} />
          <div className="relative">
            <p
              className="text-[11px] tracking-[0.18em] uppercase font-semibold"
              style={{ color: G.green, fontFamily: "'DM Sans', sans-serif" }}
            >
              {activeModuleLabel}
            </p>
            <h2
              className="text-[30px] font-black uppercase leading-tight mt-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
            >
              Ready to improve<br />your technique?
            </h2>
          </div>
        </div>

        <div className="coachai-dashboard-main px-5 space-y-4 mt-4">
          <div className="coachai-dashboard-stats grid grid-cols-3 gap-2.5">
            {statsRow.map((stat) => <StatCard key={stat.label} {...stat} className="coachai-dashboard-stat" />)}
          </div>

          <button
            onClick={() => go("shooting-guide")}
            className="w-full rounded-2xl overflow-hidden relative transition-all active:scale-[0.98]"
            style={{ boxShadow: `0 8px 40px ${G.green}18` }}
          >
            <div
              className="coachai-dashboard-session-card relative p-5"
              style={{
                background: "linear-gradient(135deg, #0C1E40 0%, #091628 100%)",
                border: `1.5px solid ${G.greenBorder}`,
                borderRadius: 16,
              }}
            >
              <FieldGrid opacity={0.07} />
              <div className="relative flex items-center justify-between gap-3">
                <div className="text-left">
                  <div className="coachai-dashboard-session-label text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5" style={{ color: G.green }}>
                    New Session
                  </div>
                  <div
                    className="coachai-dashboard-session-title text-[26px] font-black uppercase leading-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
                  >
                    Analyze<br />Shooting
                  </div>
                  <div className="coachai-dashboard-session-subtitle text-[11px] mt-1.5" style={{ color: G.muted }}>
                    Upload a video - Get AI technique feedback
                  </div>
                </div>
                <div
                  className="coachai-dashboard-session-icon w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${G.green} 0%, #1DC959 100%)`,
                    boxShadow: `0 4px 20px ${G.green}50`,
                  }}
                >
                  <Target size={26} color={G.bg} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </button>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-[13px] font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
              >
                Recent Sessions
              </h3>
              <button onClick={() => go("history")} className="text-[11px] font-semibold" style={{ color: G.green }}>
                See All
              </button>
            </div>
            <div className="space-y-2">
              {recentSessions.length > 0 ? (
                recentSessions.map((item, index) => (
                  <RecentSessionCard key={item.id} item={item} delta={getSessionDelta(historyItems, index)} />
                ))
              ) : (
                <div
                  className="coachai-dashboard-empty rounded-xl px-4 py-4 text-center"
                  style={{ background: G.card, border: `1px solid ${G.border}` }}
                >
                  <p className="text-[12px] font-semibold leading-relaxed" style={{ color: G.whiteDim }}>
                    No recent analyses yet. Upload your first shooting video to start tracking progress.
                  </p>
                  <button
                    onClick={() => go("shooting-guide")}
                    className="mt-3 px-4 py-2 rounded-xl text-[11px] font-black tracking-wide uppercase transition-all active:scale-[0.97]"
                    style={{
                      background: G.greenDim,
                      color: G.green,
                      border: `1px solid ${G.greenBorder}`,
                      fontFamily: "'Barlow Condensed', sans-serif",
                    }}
                  >
                    Start Analysis
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            className="coachai-dashboard-coming-soon rounded-xl p-4 flex items-center gap-3"
            style={{ background: G.card, border: `1px solid ${G.border}` }}
          >
            <Lock size={16} color={G.muted} className="flex-shrink-0" />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: G.whiteDim }}>
                Dribbling, Passing & First Touch modules coming soon
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>
                Focus on Football - Shooting Lab while we build the rest
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="dashboard" onNav={go} />
    </div>
  );
}

function getDashboardStats(items: AnalysisHistoryItem[]): StatItem[] {
  const scores = items.map((item) => item.overallScore);
  const latestScore = items[0]?.overallScore;
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;

  return [
    { label: "Latest Score", value: latestScore ?? "--", sub: latestScore !== undefined ? "/100" : undefined, color: G.green },
    { label: "Best Score", value: bestScore ?? "--", sub: bestScore !== null ? "/100" : undefined, color: G.blue },
    { label: "Total Analyses", value: String(items.length), color: G.amber },
  ];
}

function RecentSessionCard({ item, delta }: { item: AnalysisHistoryItem; delta: number | null }) {
  return (
    <div
      className="coachai-dashboard-recent-card flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: G.card, border: `1px solid ${G.border}` }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: G.greenDim }}>
        <span className="text-base">⚽</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[15px] font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
          >
            {item.overallScore}<span className="text-xs font-normal" style={{ color: G.muted }}>/100</span>
          </span>
          {delta !== null && (
            <span className="text-[10px] font-bold" style={{ color: delta > 0 ? G.green : delta < 0 ? G.red : G.muted }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
        <div className="text-[11px] truncate" style={{ color: G.muted }}>
          {item.drillName} - {formatHistoryDateTime(item.createdAt)}
        </div>
      </div>
      <ChevronRight size={14} color={G.muted} />
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
