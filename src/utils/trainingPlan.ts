import { createDefaultSkillTreeState, getSkillDefinition, getSkillNodeById } from "./skillTree";
import type {
  GamificationState,
  ShootingAnalysisResult,
  SkillId,
  SkillTreeState,
  WeeklyTrainingPlan,
  WeeklyTrainingTask,
  WeeklyTrainingTaskCategory,
} from "../types";

type TrainingStep = {
  title: string;
  description: string;
};

export function generateWeeklyTrainingPlan(
  skillTreeState: SkillTreeState,
  gamificationState: GamificationState,
  latestResult?: ShootingAnalysisResult | null,
): WeeklyTrainingPlan {
  const weekStartDate = getWeekStartDate(new Date());
  const focusSkillId = getFocusSkillId(skillTreeState, latestResult);
  const focusSkill = getSkillDefinition(focusSkillId);
  const now = new Date().toISOString();

  return {
    id: `weekly-${weekStartDate}-${focusSkillId}`,
    weekStartDate,
    focusSkillId,
    focusSkillName: focusSkill.name,
    focusReason: getFocusReason(focusSkillId, skillTreeState, gamificationState, latestResult),
    tasks: createTasksForFocus(focusSkillId, weekStartDate),
    createdAt: now,
    updatedAt: now,
  };
}

export function getWeekStartDate(date: Date | string) {
  const parsedDate = date instanceof Date ? new Date(date) : new Date(date);
  parsedDate.setHours(0, 0, 0, 0);
  const day = parsedDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  parsedDate.setDate(parsedDate.getDate() + mondayOffset);

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

export function getDefaultPlan(): WeeklyTrainingPlan {
  const defaultSkillTreeState = createDefaultSkillTreeState();
  const defaultGamificationState = {
    totalXp: 0,
    analysesCompleted: 0,
    currentLevel: 1,
    currentStreak: 0,
    lastAnalysisDate: null,
    unlockedBadges: [],
    dailyQuestCompletedDate: null,
    weeklyQuestProgress: 0,
    weeklyQuestAnchorDate: null,
    rewardedAnalysisIds: [],
    analysisDates: [],
  } satisfies GamificationState;

  return generateWeeklyTrainingPlan(
    {
      ...defaultSkillTreeState,
      recommendedFocusSkillId: "recording-clarity",
    },
    defaultGamificationState,
  );
}

export function getNextTrainingStepFromFocus(focusSkillId: SkillId, latestResult?: ShootingAnalysisResult | null): TrainingStep {
  if (latestResult?.drillValidityReport?.status === "Invalid") {
    return {
      title: "Record one complete football shooting action only",
      description: "Avoid random clips, celebrations, or non-shooting videos before uploading.",
    };
  }

  return createTasksForFocus(focusSkillId, getWeekStartDate(new Date()))[0];
}

function getFocusSkillId(skillTreeState: SkillTreeState, latestResult?: ShootingAnalysisResult | null): SkillId {
  if (!latestResult) {
    return skillTreeState.recommendedFocusSkillId ?? getWeakestTechnicalSkillId(skillTreeState);
  }

  const validity = latestResult.drillValidityReport?.status ?? "Unclear";

  if (validity === "Invalid") {
    return "shot-action-clarity";
  }

  if (validity === "Unclear") {
    return "recording-clarity";
  }

  return skillTreeState.recommendedFocusSkillId ?? getWeakestTechnicalSkillId(skillTreeState);
}

function getWeakestTechnicalSkillId(skillTreeState: SkillTreeState): SkillId {
  const technicalSkills = skillTreeState.skills
    .filter((skill) => !["recording-clarity", "shot-action-clarity"].includes(skill.id))
    .slice()
    .sort((first, second) => first.level - second.level || first.xp - second.xp);

  return technicalSkills[0]?.id ?? "accuracy";
}

function getFocusReason(
  focusSkillId: SkillId,
  skillTreeState: SkillTreeState,
  gamificationState: GamificationState,
  latestResult?: ShootingAnalysisResult | null,
) {
  if (focusSkillId === "recording-clarity") {
    return "CoachAI needs a clearer clip before giving confident technique feedback.";
  }

  if (focusSkillId === "shot-action-clarity") {
    return "CoachAI could not verify a complete football shooting action.";
  }

  const focusSkill = getSkillNodeById(skillTreeState, focusSkillId);
  if (latestResult?.mainFocus === focusSkill?.name) {
    return `Your latest report highlighted ${focusSkill.name} as the main focus.`;
  }

  if (gamificationState.currentStreak > 0) {
    return `Keep this week's training focused on ${focusSkill?.name ?? "one shooting skill"} while your rhythm is active.`;
  }

  return `This is the recommended technical focus for your next clear shooting analysis.`;
}

function createTasksForFocus(focusSkillId: SkillId, weekStartDate: string): WeeklyTrainingTask[] {
  if (focusSkillId === "recording-clarity") {
    return createTasks(weekStartDate, focusSkillId, [
      ["Record one clear single-shot video from a stable side or 45-degree angle.", "One clear shot is better than rushed uploads.", "recording"],
      ["Keep full body, ball, and kicking leg visible.", "Check the frame before the shot starts.", "recording"],
      ["Upload one improved shooting clip this week.", "Use the result to guide your next focus.", "analysis"],
      ["Rest or light practice day.", "Rest days count too.", "recovery"],
    ]);
  }

  if (focusSkillId === "shot-action-clarity") {
    return createTasks(weekStartDate, focusSkillId, [
      ["Record one complete football shooting action only.", "Approach, strike, and follow-through should all be visible.", "recording"],
      ["Avoid random clips, celebrations, or non-shooting videos.", "Keep the upload focused on one football action.", "recording"],
      ["Upload one valid single-shot attempt.", "Focus on quality, not endless repetitions.", "analysis"],
      ["Review the shooting guide before recording.", "Use the guide as a quick checklist.", "technical"],
    ]);
  }

  switch (focusSkillId) {
    case "approach-balance":
      return createTasks(weekStartDate, focusSkillId, [
        ["Practice slow approach steps before the strike.", "Build rhythm before adding power.", "technical"],
        ["Keep hips stable and body balanced.", "Control your final stride into contact.", "technical"],
        ["Upload one side-angle clip.", "Use a clear angle to check balance.", "analysis"],
        ["Rest days count too.", "Take one rest or light recovery day.", "recovery"],
      ]);
    case "plant-foot-position":
      return createTasks(weekStartDate, focusSkillId, [
        ["Place your support foot closer to the ball.", "Aim the plant foot toward the target.", "technical"],
        ["Take 5 controlled shots at low power.", "Focus on body position over the ball.", "technical"],
        ["Upload one clear side-angle analysis.", "Compare your support foot position.", "analysis"],
        ["Rest or light mobility day.", "Fresh legs help technique stick.", "recovery"],
      ]);
    case "body-posture":
      return createTasks(weekStartDate, focusSkillId, [
        ["Keep your chest over the ball through contact.", "Avoid leaning back before the strike.", "technical"],
        ["Take 5 controlled shots with balanced posture.", "Pause between attempts so each shot has intent.", "technical"],
        ["Record one clean side or diagonal clip.", "Make sure the full body is visible.", "recording"],
        ["Review your weakest technical category.", "Use the next report to guide practice.", "analysis"],
      ]);
    case "contact-mechanics":
      return createTasks(weekStartDate, focusSkillId, [
        ["Focus on clean instep contact.", "Strike through the middle of the ball.", "technical"],
        ["Take 5 controlled shots focused on connection.", "Do not chase power yet.", "technical"],
        ["Upload one clear analysis.", "Check whether contact quality improves.", "analysis"],
        ["Take one rest/light recovery day.", "Rest days count too.", "recovery"],
      ]);
    case "follow-through":
      return createTasks(weekStartDate, focusSkillId, [
        ["Perform 5 slow controlled shots focusing on finishing the kicking-leg motion.", "Let the leg finish naturally after contact.", "technical"],
        ["Record one clean side-angle shot.", "Full body and kicking leg should stay visible.", "recording"],
        ["Upload one analysis and compare your focus skill.", "Look for smoother follow-through.", "analysis"],
        ["Take one rest/light recovery day.", "Rest days count too.", "recovery"],
      ]);
    case "accuracy":
    default:
      return createTasks(weekStartDate, focusSkillId, [
        ["Pick one target corner before striking.", "Choose placement before your approach.", "technical"],
        ["Take 5 controlled shots focused on placement, not power.", "Focus on quality, not endless repetitions.", "technical"],
        ["Upload one clear analysis.", "Use the result to compare shot control.", "analysis"],
        ["Review your weakest technical category.", "Keep the next session focused.", "analysis"],
      ]);
  }
}

function createTasks(
  weekStartDate: string,
  focusSkillId: SkillId,
  tasks: Array<[string, string, WeeklyTrainingTaskCategory]>,
): WeeklyTrainingTask[] {
  return tasks.map(([title, description, category], index) => ({
    id: `${weekStartDate}-${focusSkillId}-${index + 1}`,
    title,
    description,
    category,
    status: "todo",
  }));
}
