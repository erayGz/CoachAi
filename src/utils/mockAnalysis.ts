import { G } from "./theme";
import type {
  AnalysisLevel,
  AnalysisMainFocus,
  AnalysisReliability,
  DrillValidityReport,
  ShootingAnalysisCategory,
  ShootingAnalysisResult,
  SubScore,
  TrainingDrill,
  VideoQuality,
} from "../types";

const categories: ShootingAnalysisCategory[] = [
  "Approach & Balance",
  "Plant Foot Position",
  "Body Posture",
  "Contact Mechanics",
  "Follow-through",
  "Accuracy",
];

const colorsByCategory: Record<ShootingAnalysisCategory, string> = {
  "Approach & Balance": G.green,
  "Plant Foot Position": G.amber,
  "Body Posture": G.blue,
  "Contact Mechanics": G.purple,
  "Follow-through": G.green,
  Accuracy: "#34D399",
};

const focusDescriptions: Record<ShootingAnalysisCategory, string> = {
  "Approach & Balance":
    "Your approach steps are not fully controlled yet. Slow the final steps, stay balanced, and arrive at the ball with your hips set.",
  "Plant Foot Position":
    "Your support foot is slightly too far from the ball in most shots. Focus on placing it closer to the ball and keeping your body over the shot.",
  "Body Posture":
    "Your body shape changes through the strike. Keep your chest over the ball and avoid leaning back as you make contact.",
  "Contact Mechanics":
    "Your connection with the ball is inconsistent. Lock your ankle and strike through the middle of the ball with a cleaner instep contact.",
  "Follow-through":
    "Your kicking motion stops too early. Drive through the ball and let your leg finish naturally toward the target.",
  Accuracy:
    "Your shot control needs a clearer target. Pick a corner earlier and keep the strike compact rather than forcing extra power.",
};

const feedbackByFocus: Record<ShootingAnalysisCategory, string> = {
  "Approach & Balance":
    "Your shooting rhythm will improve when the approach is more controlled. Take shorter final steps, keep your head steady, and arrive balanced before striking the ball.",
  "Plant Foot Position":
    "Your follow-through is strong and your body balance is improving. The biggest area to fix is plant foot placement. When your support foot lands too far from the ball, your shot loses accuracy and control.",
  "Body Posture":
    "Your contact has promise, but your body posture is pulling the shot off line. Keep your chest over the ball and avoid leaning back through the strike.",
  "Contact Mechanics":
    "Your setup is good enough to create power, but the strike is not always clean. Focus on locking the ankle and connecting with the instep through the center of the ball.",
  "Follow-through":
    "You are getting into decent shooting positions, but the kicking motion stops too early. Complete the follow-through toward the target to improve power and direction.",
  Accuracy:
    "Your technique has useful pieces, but the final shot needs better control. Choose the target earlier, keep the strike compact, and prioritize placement before power.",
};

const trainingByFocus: Record<ShootingAnalysisCategory, TrainingDrill[]> = {
  "Approach & Balance": [
    { name: "Controlled approach drill", reps: "4 x 6 shots", focus: "Approach" },
    { name: "Two-step finishing", reps: "3 x 8 shots", focus: "Balance" },
    { name: "Tempo run-up practice", reps: "5 sets", focus: "Rhythm" },
    { name: "Balance hold shooting", reps: "3 x 6 shots", focus: "Stability" },
  ],
  "Plant Foot Position": [
    { name: "Plant foot placement drill", reps: "4 x 8 shots", focus: "Position" },
    { name: "Marker beside ball drill", reps: "3 x 10 shots", focus: "Distance" },
    { name: "Low driven shot practice", reps: "5 sets", focus: "Control" },
    { name: "Support foot freeze drill", reps: "3 x 6 shots", focus: "Balance" },
  ],
  "Body Posture": [
    { name: "Chest-over-ball drill", reps: "4 x 8 shots", focus: "Posture" },
    { name: "Forward lean finishing", reps: "3 x 10 shots", focus: "Shape" },
    { name: "Balance line shooting", reps: "5 sets", focus: "Control" },
    { name: "Core-stable strike drill", reps: "3 x 6 shots", focus: "Balance" },
  ],
  "Contact Mechanics": [
    { name: "Instep contact drill", reps: "3 x 10 shots", focus: "Contact" },
    { name: "Locked ankle finishing", reps: "4 x 8 shots", focus: "Clean strike" },
    { name: "Low driven shot practice", reps: "5 sets", focus: "Connection" },
    { name: "One-touch contact reps", reps: "3 x 6 shots", focus: "Timing" },
  ],
  "Follow-through": [
    { name: "Follow-through gate drill", reps: "4 x 8 shots", focus: "Finish" },
    { name: "Target-line strike drill", reps: "3 x 10 shots", focus: "Direction" },
    { name: "Power through ball practice", reps: "5 sets", focus: "Motion" },
    { name: "Hold the finish drill", reps: "3 x 6 shots", focus: "Control" },
  ],
  Accuracy: [
    { name: "Corner target finishing", reps: "4 x 8 shots", focus: "Accuracy" },
    { name: "Low driven shot practice", reps: "5 sets", focus: "Placement" },
    { name: "Instep contact drill", reps: "3 x 10 shots", focus: "Control" },
    { name: "Weak foot finishing", reps: "3 x 6 shots", focus: "Balance" },
  ],
};

const limitedPreviewTraining: TrainingDrill[] = [
  { name: "Record one complete shot", reps: "1 clear 3-15 sec clip", focus: "Clarity" },
  { name: "Set a stable side angle", reps: "Side or 45-degree view", focus: "Camera" },
  { name: "Keep ball and kicking leg visible", reps: "Before and through contact", focus: "Visibility" },
  { name: "Review framing before upload", reps: "Full body in frame", focus: "Setup" },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickWeighted<T>(items: { value: T; weight: number }[]) {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  let ticket = Math.random() * totalWeight;

  for (const item of items) {
    ticket -= item.weight;
    if (ticket <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}

function generateOverallScore() {
  const scoreBand = pickWeighted([
    { value: { min: 38, max: 64 }, weight: 30 },
    { value: { min: 65, max: 82 }, weight: 62 },
    { value: { min: 83, max: 94 }, weight: 8 },
  ]);

  return randomInt(scoreBand.min, scoreBand.max);
}

function getLevel(score: number): AnalysisLevel {
  if (score <= 39) return "Beginner";
  if (score <= 64) return "Developing";
  if (score <= 82) return "Intermediate";
  if (score <= 89) return "Advanced";
  return "Elite";
}

function getStatus(score: number): SubScore["status"] {
  if (score >= 82) return "Strong";
  if (score >= 68) return "Good";
  return "Needs Work";
}

function generateSubScores(overallScore: number): SubScore[] {
  return categories.map((category) => {
    const score = clamp(overallScore + randomInt(-12, 12), 25, 95);

    return {
      label: category,
      score,
      color: colorsByCategory[category],
      delta: score >= overallScore ? `+${score - overallScore}` : `${score - overallScore}`,
      status: getStatus(score),
    };
  });
}

function chooseMainFocus(subScores: SubScore[]) {
  return subScores.reduce((lowest, current) => (current.score < lowest.score ? current : lowest)).label as ShootingAnalysisCategory;
}

function generateShotAction() {
  return pickWeighted([
    { value: "Likely", weight: 72 },
    { value: "Unclear", weight: 22 },
    { value: "Not verified", weight: 6 },
  ]);
}

function generateVideoQuality(): VideoQuality {
  return pickWeighted([
    { value: "Good", weight: 58 },
    { value: "Fair", weight: 24 },
    { value: "Excellent", weight: 18 },
  ]);
}

function generateReliability(shotAction: string): AnalysisReliability {
  const options: { value: AnalysisReliability; weight: number }[] =
    shotAction !== "Likely"
      ? [
          { value: "Good", weight: 62 },
          { value: "Medium", weight: 38 },
        ]
      : [
          { value: "Good", weight: 54 },
          { value: "Medium", weight: 24 },
          { value: "High", weight: 22 },
        ];

  return pickWeighted(options);
}

function createFallbackDrillValidityReport(shotAction: string): DrillValidityReport {
  const status = shotAction === "Likely" ? "Valid" : shotAction === "Unclear" ? "Unclear" : "Invalid";

  return {
    status,
    confidence: status === "Valid" ? "High" : status === "Unclear" ? "Medium" : "Low",
    warnings: status === "Valid" ? [] : ["Shooting action could not be confidently verified."],
    checks: [
      {
        label: "Drill format",
        status: status === "Valid" ? "pass" : status === "Unclear" ? "warning" : "fail",
        message: "Preview check for a single-shot shooting clip.",
      },
    ],
  };
}

export function generateMockShootingAnalysisResult(): ShootingAnalysisResult {
  const shotAction = generateShotAction();
  const scoreCap = shotAction === "Not verified" ? 55 : shotAction === "Unclear" ? 69 : 94;
  const overallScore = Math.min(generateOverallScore(), scoreCap);
  const technicalBreakdown = generateSubScores(overallScore);
  const drillValidityReport = createFallbackDrillValidityReport(shotAction);
  const technicalMainFocus = chooseMainFocus(technicalBreakdown);
  const mainFocus: AnalysisMainFocus =
    drillValidityReport.status === "Invalid"
      ? "Shot Action Clarity"
      : drillValidityReport.status === "Unclear"
        ? "Recording Clarity"
        : technicalMainFocus;

  return {
    overallScore,
    level: getLevel(overallScore),
    detectedShots: shotAction,
    videoQuality: generateVideoQuality(),
    analysisReliability: generateReliability(shotAction),
    analysisConfidence: drillValidityReport.confidence,
    mainFocus,
    mainFocusDescription:
      mainFocus === "Shot Action Clarity"
        ? "CoachAI could not verify a clear single-shot football action in this video."
        : mainFocus === "Recording Clarity"
          ? "The shooting action was not clear enough for a confident technique report. Record with full body, ball, and kicking leg visible."
          : focusDescriptions[mainFocus],
    technicalBreakdown,
    aiCoachFeedback:
      shotAction === "Not verified"
        ? "CoachAI could not verify that this video contains a clear football shooting action. This result is a limited preview, not a technique score. Upload one complete shot with the full body, ball, and kicking leg visible."
        : shotAction === "Unclear"
          ? "CoachAI found some useful movement cues, but the shooting action was not clear enough for confident technical feedback. This score is a limited preview. For a better report, record one complete shot from a stable side or 45-degree angle."
          : feedbackByFocus[technicalMainFocus],
    recommendedTraining: mainFocus === "Shot Action Clarity" || mainFocus === "Recording Clarity"
      ? limitedPreviewTraining
      : trainingByFocus[mainFocus],
    drillValidityReport,
  };
}
