import {
  applySkillRewardsToState,
  createDefaultSkillTreeState,
  getRecommendedFocusSkill,
  getSkillDefinition,
  normalizeSkillNode,
  SHOOTING_SKILLS,
} from "./skillTree";
import type { ShootingAnalysisResult, SkillId, SkillNode, SkillTreeRewardResult, SkillTreeState } from "../types";

export const SKILL_TREE_STORAGE_KEY = "coachai.skillTree";

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function getSkillTreeState(): SkillTreeState {
  if (!canUseLocalStorage()) {
    return createDefaultSkillTreeState();
  }

  try {
    const rawState = window.localStorage.getItem(SKILL_TREE_STORAGE_KEY);
    if (!rawState) {
      return createDefaultSkillTreeState();
    }

    return normalizeSkillTreeState(JSON.parse(rawState));
  } catch {
    return createDefaultSkillTreeState();
  }
}

export function saveSkillTreeState(state: SkillTreeState) {
  const normalizedState = normalizeSkillTreeState(state);

  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(SKILL_TREE_STORAGE_KEY, JSON.stringify(normalizedState));
    } catch {
      // Storage can fail in private browsing or quota-limited environments.
    }
  }

  return normalizedState;
}

export function clearSkillTreeState() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(SKILL_TREE_STORAGE_KEY);
}

export function applyAnalysisSkillRewards(result: ShootingAnalysisResult): SkillTreeRewardResult {
  const currentState = getSkillTreeState();
  const analysisId = getAnalysisSkillRewardId(result);

  if (currentState.rewardedSkillAnalysisIds.includes(analysisId)) {
    const recommendedFocusSkillId = getRecommendedFocusSkill(currentState, result);

    return {
      analysisId,
      rewards: [],
      skillTreeState: {
        ...currentState,
        recommendedFocusSkillId,
      },
      recommendedFocusSkillId,
      alreadyRewarded: true,
    };
  }

  const { state, rewards, recommendedFocusSkillId } = applySkillRewardsToState(currentState, result);
  const nextState = saveSkillTreeState({
    ...state,
    rewardedSkillAnalysisIds: addUnique(currentState.rewardedSkillAnalysisIds, analysisId),
  });

  return {
    analysisId,
    rewards,
    skillTreeState: nextState,
    recommendedFocusSkillId,
    alreadyRewarded: false,
  };
}

function normalizeSkillTreeState(value: unknown): SkillTreeState {
  const defaultState = createDefaultSkillTreeState();

  if (!value || typeof value !== "object") {
    return defaultState;
  }

  const state = value as Record<string, unknown>;
  const savedSkills = Array.isArray(state.skills) ? state.skills : [];
  const savedSkillMap = new Map<string, SkillNode>();

  savedSkills.forEach((skill) => {
    if (!skill || typeof skill !== "object") {
      return;
    }

    const maybeSkill = skill as Record<string, unknown>;
    if (typeof maybeSkill.id === "string") {
      savedSkillMap.set(maybeSkill.id, normalizeSavedSkill(maybeSkill));
    }
  });

  const skills = defaultState.skills.map((defaultSkill) => savedSkillMap.get(defaultSkill.id) ?? defaultSkill);
  const recommendedFocusSkillId = normalizeSkillId(state.recommendedFocusSkillId) ?? defaultState.recommendedFocusSkillId;

  return {
    skills,
    lastUpdatedAt: normalizeNullableString(state.lastUpdatedAt),
    recommendedFocusSkillId,
    rewardedSkillAnalysisIds: normalizeStringArray(state.rewardedSkillAnalysisIds),
  };
}

function normalizeSavedSkill(value: Record<string, unknown>): SkillNode {
  const skillId = normalizeSkillId(value.id) ?? "plant-foot-position";
  const definition = getSkillDefinition(skillId);
  const xp = normalizeNumber(value.xp);

  return normalizeSkillNode({
    id: skillId,
    name: definition.name,
    description: definition.description,
    xp,
    level: 1,
    progressPercent: 0,
    status: "locked",
  });
}

function normalizeSkillId(value: unknown): SkillId | null {
  if (typeof value !== "string") {
    return null;
  }

  return SHOOTING_SKILLS.some((skill) => skill.id === value) ? (value as SkillId) : null;
}

function getAnalysisSkillRewardId(result: ShootingAnalysisResult) {
  return result.id ?? `${result.createdAt ?? "analysis"}-${result.overallScore}-${result.mainFocus}`;
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function normalizeNullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function addUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}
