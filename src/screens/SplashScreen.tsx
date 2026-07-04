import { FieldGrid, GlowOrb } from "../components";
import { activeModuleLabel, appMeta } from "../data/appMeta";
import { G } from "../utils/theme";
import type { ScreenProps } from "../types";

export function SplashScreen({ go }: ScreenProps) {
  return (
    <div
      className="relative flex flex-col h-full overflow-y-auto"
      style={{ background: `linear-gradient(165deg, #0B1430 0%, ${G.bg} 55%)`, scrollbarWidth: "none" }}
    >
      <FieldGrid opacity={0.05} />
      <GlowOrb top="0" right="0" size={300} opacity={0.12} />

      <div className="coachai-splash-hero relative flex-1 flex flex-col items-center justify-center px-7 gap-7">
        <div
          className="relative w-20 h-20 rounded-[22px] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #162040 0%, #0C1126 100%)",
            border: `1.5px solid ${G.greenBorder}`,
            boxShadow: `0 0 40px ${G.green}18, 0 8px 32px rgba(0,0,0,0.5)`,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="20" stroke={G.green} strokeWidth="1.5" />
            <circle cx="22" cy="22" r="20" fill={G.greenDim} />
            <polygon points="22,12 27,16.5 25.2,23 18.8,23 17,16.5" fill={G.green} opacity="0.95" />
            <line x1="22" y1="2" x2="22" y2="12" stroke={G.green} strokeWidth="1.3" />
            <line x1="22" y1="32" x2="22" y2="42" stroke={G.green} strokeWidth="1.3" />
            <line x1="17" y1="16.5" x2="7" y2="12" stroke={G.green} strokeWidth="1.3" />
            <line x1="27" y1="16.5" x2="37" y2="12" stroke={G.green} strokeWidth="1.3" />
            <line x1="18.8" y1="23" x2="10" y2="34" stroke={G.green} strokeWidth="1.3" />
            <line x1="25.2" y1="23" x2="34" y2="34" stroke={G.green} strokeWidth="1.3" />
          </svg>
        </div>

        <div className="text-center">
          <h1
            className="text-[46px] font-black tracking-[0.06em] uppercase leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
          >
            {appMeta.brand}
          </h1>
          <div
            className="text-[22px] font-semibold tracking-[0.18em] uppercase -mt-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.green }}
          >
            {appMeta.sport}
          </div>
          <p className="text-sm tracking-[0.12em] mt-4" style={{ color: G.muted, fontFamily: "'DM Sans', sans-serif" }}>
            Analyze your shot. Train smarter.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {["AI Technique Feedback", "Progress Tracking", "Drill Recommendations"].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide"
              style={{ background: G.card2, color: G.whiteDim, border: `1px solid ${G.border}` }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="coachai-splash-actions relative px-6 pb-12 space-y-3">
        <button
          onClick={() => go("dashboard")}
          className="w-full py-[17px] rounded-2xl font-black text-[16px] tracking-[0.12em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)",
            color: G.bg,
            fontFamily: "'Barlow Condensed', sans-serif",
            boxShadow: `0 6px 32px ${G.green}40`,
          }}
        >
          Get Started
        </button>
        <button
          onClick={() => go("history")}
          className="w-full py-[17px] rounded-2xl font-bold text-[16px] tracking-[0.12em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: "transparent",
            color: G.whiteDim,
            fontFamily: "'Barlow Condensed', sans-serif",
            border: `1.5px solid ${G.border}`,
          }}
        >
          View History
        </button>
        <p className="text-center text-[10px] pt-1" style={{ color: G.muted }}>
          {activeModuleLabel} · {appMeta.version}
        </p>
      </div>
    </div>
  );
}
