import { generateWeeklyTrainingPlan, getDefaultPlan, getWeekStartDate } from "./trainingPlan";
import type { GamificationState, ShootingAnalysisResult, SkillTreeState, WeeklyTrainingPlan } from "../types";

export const WEEKLY_TRAINING_PLAN_STORAGE_KEY = "coachai.weeklyTrainingPlan";

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function getWeeklyTrainingPlan(): WeeklyTrainingPlan {
  if (!canUseLocalStorage()) {
    return getDefaultPlan();
  }

  try {
    const rawPlan = window.localStorage.getItem(WEEKLY_TRAINING_PLAN_STORAGE_KEY);
    if (!rawPlan) {
      return saveWeeklyTrainingPlan(getDefaultPlan());
    }

    return normalizeWeeklyTrainingPlan(JSON.parse(rawPlan));
  } catch {
    return saveWeeklyTrainingPlan(getDefaultPlan());
  }
}

export function saveWeeklyTrainingPlan(plan: WeeklyTrainingPlan) {
  const normalizedPlan = normalizeWeeklyTrainingPlan(plan);

  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(WEEKLY_TRAINING_PLAN_STORAGE_KEY, JSON.stringify(normalizedPlan));
    } catch {
      // Storage can fail in private browsing or quota-limited environments.
    }
  }

  return normalizedPlan;
}

export function refreshWeeklyTrainingPlanIfNeeded(
  skillTreeState: SkillTreeState,
  gamificationState: GamificationState,
  latestResult?: ShootingAnalysisResult | null,
) {
  const hasStoredPlan = hasStoredWeeklyTrainingPlan();
  const currentPlan = hasStoredPlan ? getWeeklyTrainingPlan() : getDefaultPlan();
  const currentWeekStartDate = getWeekStartDate(new Date());
  const nextPlan = generateWeeklyTrainingPlan(skillTreeState, gamificationState, latestResult);
  const needsInitialPlan = !hasStoredPlan;
  const isNewWeek = currentPlan.weekStartDate !== currentWeekStartDate;
  const focusChangedAfterAnalysis = Boolean(latestResult) && currentPlan.focusSkillId !== nextPlan.focusSkillId;

  if (needsInitialPlan || isNewWeek || focusChangedAfterAnalysis) {
    return saveWeeklyTrainingPlan(nextPlan);
  }

  return currentPlan;
}

function hasStoredWeeklyTrainingPlan() {
  return canUseLocalStorage() && window.localStorage.getItem(WEEKLY_TRAINING_PLAN_STORAGE_KEY) !== null;
}

export function markTrainingTaskDone(taskId: string) {
  const currentPlan = getWeeklyTrainingPlan();
  const nextPlan: WeeklyTrainingPlan = {
    ...currentPlan,
    updatedAt: new Date().toISOString(),
    tasks: currentPlan.tasks.map((task) => (
      task.id === taskId
        ? { ...task, status: "done" }
        : task
    )),
  };

  return saveWeeklyTrainingPlan(nextPlan);
}

export function resetWeeklyTrainingPlan() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(WEEKLY_TRAINING_PLAN_STORAGE_KEY);
}

function normalizeWeeklyTrainingPlan(value: unknown): WeeklyTrainingPlan {
  const defaultPlan = getDefaultPlan();

  if (!value || typeof value !== "object") {
    return defaultPlan;
  }

  const plan = value as Record<string, unknown>;
  const tasks = Array.isArray(plan.tasks)
    ? plan.tasks.map((task, index) => normalizeTask(task, index, defaultPlan)).filter(Boolean)
    : defaultPlan.tasks;

  return {
    id: normalizeString(plan.id) || defaultPlan.id,
    weekStartDate: normalizeString(plan.weekStartDate) || defaultPlan.weekStartDate,
    focusSkillId: normalizeString(plan.focusSkillId) as WeeklyTrainingPlan["focusSkillId"] || defaultPlan.focusSkillId,
    focusSkillName: normalizeString(plan.focusSkillName) || defaultPlan.focusSkillName,
    focusReason: normalizeString(plan.focusReason) || defaultPlan.focusReason,
    tasks: tasks.length > 0 ? tasks : defaultPlan.tasks,
    createdAt: normalizeString(plan.createdAt) || defaultPlan.createdAt,
    updatedAt: normalizeString(plan.updatedAt) || defaultPlan.updatedAt,
  };
}

function normalizeTask(task: unknown, index: number, defaultPlan: WeeklyTrainingPlan) {
  if (!task || typeof task !== "object") {
    return defaultPlan.tasks[index] ?? null;
  }

  const value = task as Record<string, unknown>;
  const fallbackTask = defaultPlan.tasks[index] ?? defaultPlan.tasks[0];
  if (!fallbackTask) {
    return null;
  }

  const status = value.status === "done" ? "done" : "todo";
  const category = ["recording", "technical", "analysis", "recovery"].includes(String(value.category))
    ? String(value.category) as WeeklyTrainingPlan["tasks"][number]["category"]
    : fallbackTask.category;

  return {
    id: normalizeString(value.id) || fallbackTask.id,
    title: normalizeString(value.title) || fallbackTask.title,
    description: normalizeString(value.description) || fallbackTask.description,
    status,
    category,
    xpReward: typeof value.xpReward === "number" && Number.isFinite(value.xpReward) ? value.xpReward : undefined,
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}
