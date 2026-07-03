import { ChevronRight, Lock, Target } from "lucide-react";
import { BottomNav, FieldGrid, GlowOrb, StatCard } from "../components";
import { activeModuleLabel } from "../data/appMeta";
import { historyItems } from "../data/historyItems";
import { G } from "../utils/theme";
import type { ScreenProps, StatItem } from "../types";

const statsRow: StatItem[] = [
  { label: "Latest", value: "76", sub: "/100", color: G.green },
  { label: "Best", value: "84", sub: "/100", color: G.blue },
  { label: "Sessions", value: "6", sub: "total", color: G.amber },
];

export function DashboardScreen({ go }: ScreenProps) {
  const recentSessions = historyItems.slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div
          className="relative overflow-hidden px-5 pt-14 pb-7"
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

        <div className="px-5 space-y-4 pb-6 mt-4">
          <div className="grid grid-cols-3 gap-2.5">
            {statsRow.map((stat) => <StatCard key={stat.label} {...stat} />)}
          </div>

          <button
            onClick={() => go("shooting-guide")}
            className="w-full rounded-2xl overflow-hidden relative transition-all active:scale-[0.98]"
            style={{ boxShadow: `0 8px 40px ${G.green}18` }}
          >
            <div
              className="relative p-5"
              style={{
                background: "linear-gradient(135deg, #0C1E40 0%, #091628 100%)",
                border: `1.5px solid ${G.greenBorder}`,
                borderRadius: 16,
              }}
            >
              <FieldGrid opacity={0.07} />
              <div className="relative flex items-center justify-between gap-3">
                <div className="text-left">
                  <div className="text-[10px] tracking-[0.2em] uppercase font-bold mb-1.5" style={{ color: G.green }}>
                    New Session
                  </div>
                  <div
                    className="text-[26px] font-black uppercase leading-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
                  >
                    Analyze<br />Shooting
                  </div>
                  <div className="text-[11px] mt-1.5" style={{ color: G.muted }}>
                    Upload a video · Get AI technique feedback
                  </div>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
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
              {recentSessions.map(({ score, date, delta }, index) => (
                <div
                  key={`${date}-${index}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
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
                        {score}<span className="text-xs font-normal" style={{ color: G.muted }}>/100</span>
                      </span>
                      {delta !== null && (
                        <span className="text-[10px] font-bold" style={{ color: delta > 0 ? G.green : G.red }}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: G.muted }}>Shooting · {date.split(",")[0]}</div>
                  </div>
                  <ChevronRight size={14} color={G.muted} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: G.card, border: `1px solid ${G.border}` }}>
            <Lock size={16} color={G.muted} className="flex-shrink-0" />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: G.whiteDim }}>
                Dribbling, Passing & First Touch modules coming soon
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>
                Focus on Football · Shooting Lab while we build the rest
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="dashboard" onNav={go} />
    </div>
  );
}
