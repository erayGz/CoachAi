import { G } from "../utils/theme";
import type { SubScore } from "../types";

export const analysisResults = {
  overallScore: 76,
  level: "Intermediate",
  detectedShots: 5,
  videoQuality: "Good",
  warningVideoQuality: "Fair",
  analysisReliability: 82,
  mainFocusThisWeek: "Plant foot placement",
  coachFeedback:
    "Your follow-through is strong, but your plant foot is slightly too far from the ball. Keep your support foot closer and keep your body over the ball to improve accuracy and add more power to driven shots.",
};

export const technicalBreakdown: SubScore[] = [
  { label: "Approach & Balance", score: 78, color: G.green, delta: "+3" },
  { label: "Plant Foot Position", score: 70, color: G.amber, delta: "+1" },
  { label: "Body Posture", score: 74, color: G.blue, delta: "-" },
  { label: "Contact Mechanics", score: 72, color: G.purple, delta: "+2" },
  { label: "Follow-Through", score: 82, color: G.green, delta: "+5" },
  { label: "Accuracy", score: 80, color: "#34D399", delta: "+4" },
];
