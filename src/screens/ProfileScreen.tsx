import { Check, ChevronRight, Settings, Shield, Star, Trash2 } from "lucide-react";
import { BottomNav, FieldGrid, GlowOrb, StatCard } from "../components";
import { activeModuleLabel, appMeta } from "../data/appMeta";
import { playerProfile, playerProfileFields, privacyConsentItems } from "../data/playerProfile";
import { getAnalysisHistory } from "../utils/historyStorage";
import { getHistorySummary } from "../utils/historyStats";
import { G } from "../utils/theme";
import type { ScreenProps } from "../types";

export function ProfileScreen({ go }: ScreenProps) {
  const profileStats = getProfileStats();

  return (
    <div className="coachai-has-bottom-nav flex flex-col h-full">
      <div className="coachai-scroll-content flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div
          className="coachai-profile-hero relative overflow-hidden px-5 pt-14 pb-7"
          style={{ background: `linear-gradient(165deg, #0B1430 0%, ${G.bg} 100%)` }}
        >
          <FieldGrid opacity={0.04} />
          <GlowOrb top="0" right="0" size={200} opacity={0.09} />
          <div className="relative flex items-center gap-4">
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: `linear-gradient(135deg, #162040, ${G.card})`,
                border: `1.5px solid ${G.greenBorder}`,
              }}
            >
              ⚽
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: G.green }}>
                <Check size={10} color={G.bg} strokeWidth={3} />
              </div>
            </div>
            <div>
              <h2 className="text-[24px] font-black uppercase leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
                {playerProfile.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Star size={10} color={G.amber} fill={G.amber} />
                <span className="text-[11px] font-semibold" style={{ color: G.amber }}>
                  {playerProfile.level} · {playerProfile.ageGroup}
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>Member since {playerProfile.memberSince}</p>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-2.5">
            {profileStats.map((stat) => <StatCard key={stat.label} {...stat} className="text-left" />)}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${G.border}` }}>
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
                Player Profile
              </p>
            </div>
            {playerProfileFields.map(({ label, value }, index) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: index < playerProfileFields.length - 1 ? `1px solid ${G.border}` : "none" }}
              >
                <span className="text-[12px]" style={{ color: G.muted }}>{label}</span>
                <span className="text-[12px] font-semibold" style={{ color: G.white }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}` }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${G.border}` }}>
              <Shield size={14} color={G.green} />
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
                Privacy & Consent
              </p>
            </div>
            <div className="px-4 py-3.5 space-y-2.5">
              {privacyConsentItems.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
                    <Check size={8} color={G.green} strokeWidth={3} />
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: G.muted }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <button className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-all active:scale-[0.98]" style={{ background: `${G.red}0E`, border: `1px solid ${G.red}22` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${G.red}18` }}>
                <Trash2 size={15} color={G.red} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold" style={{ color: G.red }}>Delete Uploaded Videos</p>
                <p className="text-[11px] mt-0.5" style={{ color: `${G.red}88` }}>Remove all stored video data from this device</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-all active:scale-[0.98]" style={{ background: G.card, border: `1px solid ${G.border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: G.card2 }}>
                <Settings size={15} color={G.muted} />
              </div>
              <div className="text-left flex-1">
                <p className="text-[13px] font-bold" style={{ color: G.white }}>Settings</p>
                <p className="text-[11px] mt-0.5" style={{ color: G.muted }}>Notifications, privacy, account</p>
              </div>
              <ChevronRight size={14} color={G.muted} />
            </button>
          </div>

          <p className="text-center text-[10px] pt-1" style={{ color: G.muted }}>
            {appMeta.brand} · {activeModuleLabel}
          </p>
        </div>
      </div>
      <BottomNav active="profile" onNav={go} />
    </div>
  );
}

function getProfileStats() {
  const summary = getHistorySummary(getAnalysisHistory());

  return [
    { label: "Total Analyses", value: summary.totalAnalyses, color: G.green },
    {
      label: "Best Score",
      value: summary.bestScore ?? "--",
      sub: summary.bestScore === null ? undefined : "/100",
      color: G.blue,
    },
    {
      label: "Average Score",
      value: summary.averageScore ?? "--",
      sub: summary.averageScore === null ? undefined : "/100",
      color: G.amber,
    },
    {
      label: "Latest Score",
      value: summary.latestScore ?? "--",
      sub: summary.latestScore === null ? undefined : "/100",
      color: G.purple,
    },
  ];
}
