import { Check, ChevronRight, Database, Settings, Shield, Star, Trash2, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { BottomNav, FieldGrid, GlowOrb, StatCard } from "../components";
import { activeModuleLabel, appMeta } from "../data/appMeta";
import { playerProfile, playerProfileFields, privacyConsentItems } from "../data/playerProfile";
import { badges, getLevelProgress } from "../utils/gamification";
import { getGamificationState } from "../utils/gamificationStorage";
import { getAnalysisHistory } from "../utils/historyStorage";
import { getHistorySummary } from "../utils/historyStats";
import { getSkillTreeState } from "../utils/skillTreeStorage";
import { G } from "../utils/theme";
import type { ScreenProps, SkillNode } from "../types";

const profileActionFeedback = "Coming soon in a future version.";

export function ProfileScreen({ go }: ScreenProps) {
  const profileStats = getProfileStats();
  const gamificationState = getGamificationState();
  const levelProgress = getLevelProgress(gamificationState.totalXp);
  const unlockedBadges = badges.filter((badge) => gamificationState.unlockedBadges.includes(badge.id));
  const skillTreeState = getSkillTreeState();
  const [actionFeedback, setActionFeedback] = useState("");

  function showActionFeedback() {
    setActionFeedback(profileActionFeedback);
  }

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
            <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${G.border}` }}>
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
                  Progression
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: G.whiteDim }}>
                  Rest days count too.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-black leading-none" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  L{levelProgress.currentLevel}
                </p>
                <p className="text-[9px] font-bold mt-1" style={{ color: G.muted }}>
                  {gamificationState.totalXp} XP
                </p>
              </div>
            </div>
            <div className="px-4 py-3.5 space-y-3">
              <div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: G.card2 }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${levelProgress.progressPercent}%`,
                      background: `linear-gradient(90deg, ${G.green} 0%, ${G.blue} 100%)`,
                    }}
                  />
                </div>
                <p className="text-[9px] mt-1.5" style={{ color: G.muted }}>
                  {Math.max(0, levelProgress.nextLevelXp - gamificationState.totalXp)} XP to Level {levelProgress.nextLevel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <ProgressStat label="Current Streak" value={`${gamificationState.currentStreak} day${gamificationState.currentStreak === 1 ? "" : "s"}`} />
                <ProgressStat label="Analyses" value={String(gamificationState.analysesCompleted)} />
              </div>

              <div>
                <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: G.muted }}>
                  Badges
                </p>
                {unlockedBadges.length > 0 ? (
                  <div className="space-y-1.5">
                    {unlockedBadges.map((badge) => (
                      <div key={badge.id} className="rounded-xl px-3 py-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
                        <p className="text-[11px] font-black" style={{ color: G.white }}>
                          {badge.name}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>
                          {badge.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed" style={{ color: G.muted }}>
                    Complete your first shooting analysis to unlock badges.
                  </p>
                )}
              </div>
            </div>
          </div>

          <SkillDevelopmentSection skills={skillTreeState.skills} />

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
            {actionFeedback && (
              <div
                role="status"
                className="rounded-xl px-4 py-3 text-[12px] font-semibold"
                style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}`, color: G.green }}
              >
                {actionFeedback}
              </div>
            )}
            <ProfileActionButton
              title="Delete Uploaded Videos"
              detail="Manage uploaded training videos"
              icon={Trash2}
              tone="danger"
              onClick={showActionFeedback}
            />
            <ProfileActionButton
              title="Settings"
              detail="Notifications, privacy, account"
              icon={Settings}
              onClick={showActionFeedback}
            />
            <ProfileActionButton
              title="Data Settings"
              detail="Review storage and data preferences"
              icon={Database}
              onClick={showActionFeedback}
            />
            <ProfileActionButton
              title="Parent / Guardian Consent"
              detail="Manage youth player permissions"
              icon={UserRoundCheck}
              onClick={showActionFeedback}
            />
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

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: G.muted }}>
        {label}
      </p>
      <p className="text-[13px] font-black mt-1" style={{ color: G.white, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </p>
    </div>
  );
}

function SkillDevelopmentSection({ skills }: { skills: SkillNode[] }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${G.border}` }}>
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
          Skill Development
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: G.whiteDim }}>
          Shooting path progress by skill.
        </p>
      </div>
      <div className="px-4 py-3.5 space-y-2.5">
        {skills.map((skill) => <ProfileSkillRow key={skill.id} skill={skill} />)}
      </div>
    </div>
  );
}

function ProfileSkillRow({ skill }: { skill: SkillNode }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold truncate" style={{ color: G.white }}>
            {skill.name}
          </p>
          <p className="text-[9px] mt-0.5 capitalize" style={{ color: getSkillStatusColor(skill.status) }}>
            {skill.status}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[14px] font-black leading-none" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
            L{skill.level}
          </p>
          <p className="text-[9px] mt-1" style={{ color: G.muted }}>
            {skill.xp} XP
          </p>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: `${G.bg}AA` }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${skill.progressPercent}%`,
            background: `linear-gradient(90deg, ${G.green} 0%, ${G.blue} 100%)`,
          }}
        />
      </div>
      <p className="text-[9px] text-right mt-1" style={{ color: G.muted }}>
        {skill.progressPercent}% to next level
      </p>
    </div>
  );
}

function ProfileActionButton({
  title,
  detail,
  icon: Icon,
  tone = "default",
  onClick,
}: {
  title: string;
  detail: string;
  icon: typeof Settings;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  const isDanger = tone === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
      style={{
        background: isDanger ? `${G.red}0E` : G.card,
        border: `1px solid ${isDanger ? `${G.red}22` : G.border}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isDanger ? `${G.red}18` : G.card2 }}
      >
        <Icon size={15} color={isDanger ? G.red : G.muted} />
      </div>
      <div className="text-left flex-1">
        <p className="text-[13px] font-bold" style={{ color: isDanger ? G.red : G.white }}>{title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: isDanger ? `${G.red}88` : G.muted }}>{detail}</p>
      </div>
      <ChevronRight size={14} color={isDanger ? `${G.red}AA` : G.muted} />
    </button>
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

function getSkillStatusColor(status: SkillNode["status"]) {
  if (status === "strong") return G.blue;
  if (status === "developing") return G.green;
  if (status === "active") return G.amber;
  return G.muted;
}
