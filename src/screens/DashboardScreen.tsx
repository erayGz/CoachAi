import { Check, ChevronRight, Lock, Target } from "lucide-react";
import { useState } from "react";
import { BottomNav, FieldGrid, GlowOrb, StatCard } from "../components";
import { activeModuleLabel } from "../data/appMeta";
import { getLevelProgress, isSameDay } from "../utils/gamification";
import { getGamificationState } from "../utils/gamificationStorage";
import { formatHistoryDateTime, getAnalysisHistory } from "../utils/historyStorage";
import { getSkillNodeById, getTechnicalSkillNodes } from "../utils/skillTree";
import { getSkillTreeState } from "../utils/skillTreeStorage";
import { markTrainingTaskDone, refreshWeeklyTrainingPlanIfNeeded } from "../utils/trainingPlanStorage";
import { G } from "../utils/theme";
import type { AnalysisHistoryItem, ScreenProps, SkillNode, StatItem, WeeklyTrainingPlan, WeeklyTrainingTask } from "../types";

export function DashboardScreen({ go }: ScreenProps) {
  const historyItems = getAnalysisHistory();
  const recentSessions = historyItems.slice(0, 3);
  const statsRow = getDashboardStats(historyItems);
  const gamificationState = getGamificationState();
  const levelProgress = getLevelProgress(gamificationState.totalXp);
  const dailyQuestCompleted = gamificationState.dailyQuestCompletedDate
    ? isSameDay(gamificationState.dailyQuestCompletedDate, new Date())
    : false;
  const skillTreeState = getSkillTreeState();
  const technicalSkills = getTechnicalSkillNodes(skillTreeState);
  const focusSkill = getSkillNodeById(skillTreeState, skillTreeState.recommendedFocusSkillId);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyTrainingPlan>(() => (
    refreshWeeklyTrainingPlanIfNeeded(skillTreeState, gamificationState)
  ));

  function handleMarkTaskDone(taskId: string) {
    setWeeklyPlan(markTrainingTaskDone(taskId));
  }

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

          <PlayerProgressCard
            totalXp={gamificationState.totalXp}
            currentStreak={gamificationState.currentStreak}
            levelProgress={levelProgress}
            dailyQuestCompleted={dailyQuestCompleted}
            weeklyQuestProgress={gamificationState.weeklyQuestProgress}
          />

          <ShootingSkillTreeCard skills={technicalSkills} focusSkill={focusSkill} />
          <WeeklyCoachPlanCard plan={weeklyPlan} onMarkTaskDone={handleMarkTaskDone} />

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
                  <RecentSessionCard
                    key={item.id}
                    item={item}
                    delta={getSessionDelta(historyItems, index)}
                    onOpen={() => go("history")}
                  />
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

function ShootingSkillTreeCard({
  skills,
  focusSkill,
}: {
  skills: SkillNode[];
  focusSkill: SkillNode | null;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
            Shooting Skill Tree
          </p>
          <p className="text-[11px] mt-1" style={{ color: G.whiteDim }}>
            Current Focus: {focusSkill?.name ?? "Plant Foot Position"}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2 text-right" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: G.muted }}>
            Path
          </p>
          <p className="text-[11px] font-black mt-1" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
            Shooting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {skills.map((skill) => <SkillTreeRow key={skill.id} skill={skill} />)}
      </div>

      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: G.muted }}>
        Focus on quality, not endless repetitions.
      </p>
    </div>
  );
}

function SkillTreeRow({ skill }: { skill: SkillNode }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold truncate" style={{ color: G.white }}>
          {skill.name}
        </p>
        <p className="text-[10px] font-black flex-shrink-0" style={{ color: G.green, fontFamily: "'JetBrains Mono', monospace" }}>
          L{skill.level}
        </p>
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
    </div>
  );
}

function WeeklyCoachPlanCard({
  plan,
  onMarkTaskDone,
}: {
  plan: WeeklyTrainingPlan;
  onMarkTaskDone: (taskId: string) => void;
}) {
  const completedTasks = plan.tasks.filter((task) => task.status === "done").length;

  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
            This Week's Coach Plan
          </p>
          <p className="text-[13px] font-black mt-1" style={{ color: G.white, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {plan.focusSkillName}
          </p>
          <p className="text-[10px] mt-1 leading-relaxed" style={{ color: G.whiteDim }}>
            {plan.focusReason}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2 text-right flex-shrink-0" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: G.muted }}>
            Tasks
          </p>
          <p className="text-[15px] font-black mt-1" style={{ color: G.green, fontFamily: "'JetBrains Mono', monospace" }}>
            {completedTasks}/{plan.tasks.length}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {plan.tasks.map((task) => (
          <WeeklyPlanTaskRow key={task.id} task={task} onMarkDone={onMarkTaskDone} />
        ))}
      </div>

      <p className="text-[10px] mt-3 leading-relaxed" style={{ color: G.muted }}>
        Rest days count too.
      </p>
    </div>
  );
}

function WeeklyPlanTaskRow({
  task,
  onMarkDone,
}: {
  task: WeeklyTrainingTask;
  onMarkDone: (taskId: string) => void;
}) {
  const isDone = task.status === "done";

  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: G.card2, border: `1px solid ${isDone ? G.greenBorder : G.border}` }}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onMarkDone(task.id)}
          disabled={isDone}
          aria-label={isDone ? `${task.title} completed` : `Mark ${task.title} done`}
          className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black transition-all active:scale-[0.95]"
          style={{
            background: isDone ? G.green : G.greenDim,
            color: isDone ? G.bg : G.green,
            border: `1px solid ${G.greenBorder}`,
          }}
        >
          {isDone ? <Check size={11} strokeWidth={3} /> : null}
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-bold leading-snug" style={{ color: isDone ? G.green : G.white }}>
            {task.title}
          </p>
          <p className="text-[10px] mt-1 leading-snug" style={{ color: G.muted }}>
            {task.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlayerProgressCard({
  totalXp,
  currentStreak,
  levelProgress,
  dailyQuestCompleted,
  weeklyQuestProgress,
}: {
  totalXp: number;
  currentStreak: number;
  levelProgress: ReturnType<typeof getLevelProgress>;
  dailyQuestCompleted: boolean;
  weeklyQuestProgress: number;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
            Player Progress
          </p>
          <p className="text-[11px] mt-1" style={{ color: G.whiteDim }}>
            Focus on quality, not endless repetitions.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[24px] font-black leading-none" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
            L{levelProgress.currentLevel}
          </p>
          <p className="text-[9px] font-bold mt-1" style={{ color: G.muted }}>
            {totalXp} XP
          </p>
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: G.card2 }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${levelProgress.progressPercent}%`,
            background: `linear-gradient(90deg, ${G.green} 0%, ${G.blue} 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px]" style={{ color: G.muted }}>
        <span>Level {levelProgress.currentLevel}</span>
        <span>{Math.max(0, levelProgress.nextLevelXp - totalXp)} XP to Level {levelProgress.nextLevel}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <QuestMiniCard label="Current Streak" value={`${currentStreak} day${currentStreak === 1 ? "" : "s"}`} />
        <QuestMiniCard label="Daily Quest" value={dailyQuestCompleted ? "Completed today" : "Complete 1 single-shot analysis"} />
        <QuestMiniCard label="Weekly Quest" value={`${Math.min(3, weeklyQuestProgress)}/3 analyses this week`} />
        <QuestMiniCard label="Training Note" value="Rest days count too." />
      </div>
    </div>
  );
}

function QuestMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: G.muted }}>
        {label}
      </p>
      <p className="text-[11px] font-semibold mt-1 leading-snug" style={{ color: G.whiteDim }}>
        {value}
      </p>
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

function RecentSessionCard({
  item,
  delta,
  onOpen,
}: {
  item: AnalysisHistoryItem;
  delta: number | null;
  onOpen: () => void;
}) {
  const formattedDate = formatHistoryDateTime(item.createdAt);

  return (
    <button
      type="button"
      aria-label={`Open history for ${item.drillName} from ${formattedDate}`}
      onClick={onOpen}
      className="coachai-dashboard-recent-card w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
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
          {item.drillName} - {formattedDate}
        </div>
      </div>
      <ChevronRight size={14} color={G.muted} />
    </button>
  );
}

function getSessionDelta(items: AnalysisHistoryItem[], index: number) {
  const previous = items[index + 1];
  if (!previous) {
    return null;
  }

  return items[index].overallScore - previous.overallScore;
}
