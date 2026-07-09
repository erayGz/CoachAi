import type {
  AnalysisConfidence,
  AnalysisMainFocus,
  LevelProgress,
  ShootingAnalysisResult,
  SkillId,
  SkillNode,
  SkillRewardSummary,
  SkillStatus,
  SkillTreeState,
} from "../types";

type SkillDefinition = Pick<SkillNode, "id" | "name" | "description"> & {
  type: "technical" | "clarity";
};

type TrainingStep = {
  title: string;
  description: string;
};

export const SHOOTING_SKILLS: SkillDefinition[] = [
  {
    id: "approach-balance",
    name: "Approach & Balance",
    description: "Controlled run-up, stable rhythm, and balance before contact.",
    type: "technical",
  },
  {
    id: "plant-foot-position",
    name: "Plant Foot Position",
    description: "Support foot distance, direction, and stability next to the ball.",
    type: "technical",
  },
  {
    id: "body-posture",
    name: "Body Posture",
    description: "Body shape over the ball and balance through the strike.",
    type: "technical",
  },
  {
    id: "contact-mechanics",
    name: "Contact Mechanics",
    description: "Clean connection, foot surface, and strike timing.",
    type: "technical",
  },
  {
    id: "follow-through",
    name: "Follow-through",
    description: "Finishing the kicking motion with control and direction.",
    type: "technical",
  },
  {
    id: "accuracy",
    name: "Accuracy",
    description: "Shot control, target selection, and repeatable placement.",
    type: "technical",
  },
  {
    id: "recording-clarity",
    name: "Recording Clarity",
    description: "Clear framing with the player, ball, and kicking leg visible.",
    type: "clarity",
  },
  {
    id: "shot-action-clarity",
    name: "Shot Action Clarity",
    description: "A complete single-shot action CoachAI can verify.",
    type: "clarity",
  },
];

const technicalSkillIds: SkillId[] = SHOOTING_SKILLS.filter((skill) => skill.type === "technical").map((skill) => skill.id);
const skillLevelThresholds = [0, 80, 200, 380, 620];

export function createDefaultSkillTreeState(): SkillTreeState {
  return {
    skills: SHOOTING_SKILLS.map((skill) => createSkillNode(skill, 0)),
    lastUpdatedAt: null,
    recommendedFocusSkillId: "plant-foot-position",
    rewardedSkillAnalysisIds: [],
  };
}

export function calculateSkillLevel(skillXp: number) {
  const safeXp = Math.max(0, skillXp);
  let level = 1;

  while (getSkillLevelThreshold(level + 1) <= safeXp) {
    level += 1;
  }

  return level;
}

export function getSkillProgress(skillXp: number): LevelProgress {
  const safeXp = Math.max(0, skillXp);
  const currentLevel = calculateSkillLevel(safeXp);
  const currentLevelXp = getSkillLevelThreshold(currentLevel);
  const nextLevel = currentLevel + 1;
  const nextLevelXp = getSkillLevelThreshold(nextLevel);
  const levelSpan = Math.max(1, nextLevelXp - currentLevelXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((safeXp - currentLevelXp) / levelSpan) * 100)));

  return {
    currentLevel,
    currentLevelXp,
    nextLevel,
    nextLevelXp,
    progressPercent,
  };
}

export function calculateSkillRewards(result: ShootingAnalysisResult): SkillRewardSummary[] {
  return buildSkillXpAwards(result).map(({ skillId, xpEarned }) => {
    const skill = getSkillDefinition(skillId);
    const newLevel = calculateSkillLevel(xpEarned);

    return {
      skillId,
      skillName: skill.name,
      xpEarned,
      previousLevel: 1,
      newLevel,
      leveledUp: newLevel > 1,
    };
  });
}

export function getRecommendedFocusSkill(skillTreeState: SkillTreeState, latestResult?: ShootingAnalysisResult | null): SkillId {
  const validity = latestResult?.drillValidityReport?.status ?? "Unclear";

  if (validity === "Invalid") {
    return "shot-action-clarity";
  }

  if (validity === "Unclear") {
    return "recording-clarity";
  }

  const latestFocusSkillId = latestResult ? getSkillIdForFocus(latestResult.mainFocus) : null;
  if (latestFocusSkillId && isTechnicalSkill(latestFocusSkillId)) {
    return latestFocusSkillId;
  }

  return getWeakestTechnicalSkill(skillTreeState)?.id ?? "plant-foot-position";
}

export function applySkillRewardsToState(state: SkillTreeState, result: ShootingAnalysisResult): {
  state: SkillTreeState;
  rewards: SkillRewardSummary[];
  recommendedFocusSkillId: SkillId;
} {
  const awards = buildSkillXpAwards(result);
  const rewardMap = new Map(awards.map((award) => [award.skillId, award.xpEarned]));
  const rewards: SkillRewardSummary[] = [];

  const updatedSkills = state.skills.map((skill) => {
    const xpEarned = rewardMap.get(skill.id) ?? 0;
    if (xpEarned <= 0) {
      return normalizeSkillNode(skill);
    }

    const previousLevel = calculateSkillLevel(skill.xp);
    const nextXp = skill.xp + xpEarned;
    const newLevel = calculateSkillLevel(nextXp);
    const updatedSkill = createSkillNode(getSkillDefinition(skill.id), nextXp);

    rewards.push({
      skillId: skill.id,
      skillName: skill.name,
      xpEarned,
      previousLevel,
      newLevel,
      leveledUp: newLevel > previousLevel,
    });

    return updatedSkill;
  });

  const nextStateBase: SkillTreeState = {
    ...state,
    skills: updatedSkills,
    lastUpdatedAt: result.createdAt ?? new Date().toISOString(),
    recommendedFocusSkillId: state.recommendedFocusSkillId,
  };
  const recommendedFocusSkillId = getRecommendedFocusSkill(nextStateBase, result);

  return {
    state: {
      ...nextStateBase,
      recommendedFocusSkillId,
    },
    rewards,
    recommendedFocusSkillId,
  };
}

export function normalizeSkillNode(skill: SkillNode): SkillNode {
  const definition = getSkillDefinition(skill.id);
  return createSkillNode(definition, skill.xp);
}

export function getTechnicalSkillNodes(state: SkillTreeState) {
  return state.skills.filter((skill) => isTechnicalSkill(skill.id));
}

export function getSkillNodeById(state: SkillTreeState, skillId: SkillId | null | undefined) {
  return skillId ? state.skills.find((skill) => skill.id === skillId) ?? null : null;
}

export function getSkillDefinition(skillId: SkillId) {
  return SHOOTING_SKILLS.find((skill) => skill.id === skillId) ?? SHOOTING_SKILLS[0];
}

export function getNextTrainingStep(result?: ShootingAnalysisResult | null, skillTreeState?: SkillTreeState | null): TrainingStep {
  const validity = result?.drillValidityReport?.status ?? "Unclear";

  if (validity === "Invalid") {
    return {
      title: "Record one complete shooting clip",
      description: "Keep the player, ball, and kicking leg visible. One clear shot is better than rushed uploads.",
    };
  }

  if (validity === "Unclear") {
    return {
      title: "Improve recording clarity",
      description: "Use a stable side or 45-degree camera angle so CoachAI can verify the full shooting action.",
    };
  }

  const focusSkillId = result ? getSkillIdForFocus(result.mainFocus) : skillTreeState?.recommendedFocusSkillId ?? null;
  const focusSkill = focusSkillId ? getSkillDefinition(focusSkillId) : getSkillDefinition("plant-foot-position");

  return {
    title: `Work on ${focusSkill.name}`,
    description: getTrainingStepDescription(focusSkill.id),
  };
}

export function getSkillIdForFocus(focus: AnalysisMainFocus): SkillId | null {
  return SHOOTING_SKILLS.find((skill) => skill.name === focus)?.id ?? null;
}

function buildSkillXpAwards(result: ShootingAnalysisResult) {
  const awards = new Map<SkillId, number>();
  const validity = result.drillValidityReport?.status ?? "Unclear";

  if (validity === "Invalid") {
    addXp(awards, "shot-action-clarity", 18);
    return mapAwards(awards);
  }

  if (validity === "Unclear") {
    addXp(awards, "recording-clarity", 18);
    result.technicalBreakdown.forEach((score) => {
      const skillId = getSkillIdForFocus(score.label as AnalysisMainFocus);
      if (skillId && isTechnicalSkill(skillId)) {
        addXp(awards, skillId, 1);
      }
    });
    return mapAwards(awards);
  }

  technicalSkillIds.forEach((skillId) => {
    const skill = getSkillDefinition(skillId);
    const score = result.technicalBreakdown.find((item) => item.label === skill.name);
    let xp = 4;

    if (score?.score !== undefined && score.score >= 65) {
      xp += 3;
    }

    if (score?.score !== undefined && score.score >= 80) {
      xp += 6;
    }

    xp += getConfidenceBonus(result.analysisConfidence);
    addXp(awards, skillId, xp);
  });

  const mainFocusSkillId = getSkillIdForFocus(result.mainFocus);
  if (mainFocusSkillId && isTechnicalSkill(mainFocusSkillId)) {
    addXp(awards, mainFocusSkillId, 12);
  }

  return mapAwards(awards);
}

function createSkillNode(skill: SkillDefinition, xp: number): SkillNode {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = calculateSkillLevel(safeXp);
  const progress = getSkillProgress(safeXp);

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    xp: safeXp,
    level,
    progressPercent: progress.progressPercent,
    status: getSkillStatus(safeXp, level),
  };
}

function getSkillLevelThreshold(level: number): number {
  if (level <= 1) {
    return 0;
  }

  if (level <= skillLevelThresholds.length) {
    return skillLevelThresholds[level - 1];
  }

  let threshold = skillLevelThresholds[skillLevelThresholds.length - 1];
  for (let nextLevel = skillLevelThresholds.length + 1; nextLevel <= level; nextLevel += 1) {
    threshold += 300 + (nextLevel - skillLevelThresholds.length - 1) * 80;
  }

  return threshold;
}

function getSkillStatus(xp: number, level: number): SkillStatus {
  if (xp <= 0) {
    return "locked";
  }

  if (level >= 4) {
    return "strong";
  }

  if (level >= 2) {
    return "developing";
  }

  return "active";
}

function getConfidenceBonus(confidence?: AnalysisConfidence) {
  if (confidence === "High") {
    return 3;
  }

  if (confidence === "Medium") {
    return 1;
  }

  return 0;
}

function getWeakestTechnicalSkill(state: SkillTreeState) {
  return getTechnicalSkillNodes(state).slice().sort((first, second) => first.level - second.level || first.xp - second.xp)[0] ?? null;
}

function isTechnicalSkill(skillId: SkillId) {
  return technicalSkillIds.includes(skillId);
}

function addXp(awards: Map<SkillId, number>, skillId: SkillId, xp: number) {
  awards.set(skillId, (awards.get(skillId) ?? 0) + xp);
}

function mapAwards(awards: Map<SkillId, number>) {
  return Array.from(awards.entries()).map(([skillId, xpEarned]) => ({ skillId, xpEarned }));
}

function getTrainingStepDescription(skillId: SkillId) {
  switch (skillId) {
    case "approach-balance":
      return "Try 5 controlled shots with slow approach steps and a stable final stride. Focus on quality, not endless repetitions.";
    case "plant-foot-position":
      return "Try 5 controlled shots placing your support foot close to the ball and pointing toward the target.";
    case "body-posture":
      return "Try 5 controlled shots keeping your chest over the ball and your balance steady through contact.";
    case "contact-mechanics":
      return "Try 5 controlled shots focusing on clean instep contact and a smooth connection through the ball.";
    case "follow-through":
      return "Try 5 controlled shots focusing on finishing your kicking-leg motion naturally.";
    case "accuracy":
      return "Try 5 controlled shots toward one clear target, resting between attempts so each shot has intent.";
    default:
      return "Focus on one clear shot at a time. Rest days count too.";
  }
}
