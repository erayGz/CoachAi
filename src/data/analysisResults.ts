import { G } from "../utils/theme";
import type { SubScore } from "../types";

export const analysisResults = {
  overallScore: 76,
  level: "Intermediate",
  detectedShots: 5,
  videoQuality: "Good",
  warningVideoQuality: "Fair",
  analysisReliability: 82,
  mainFocusThisWeek: "Plant Foot Position",
  mainFocusDescription:
    "Your support foot is slightly too far from the ball in most shots. Focus on placing it closer to the ball and keeping your body over the shot.",
  coachFeedback:
    "Your follow-through is strong and your body balance is improving. The biggest area to fix is plant foot placement. When your support foot lands too far from the ball, your shot loses accuracy and control.",
};

export const technicalBreakdown: SubScore[] = [
  { label: "Approach & Balance", score: 78, color: G.green, delta: "+3", status: "Good" },
  { label: "Plant Foot Position", score: 70, color: G.amber, delta: "+1", status: "Needs Work" },
  { label: "Body Posture", score: 74, color: G.blue, delta: "-", status: "Good" },
  { label: "Contact Mechanics", score: 72, color: G.purple, delta: "+2", status: "Needs Work" },
  { label: "Follow-through", score: 82, color: G.green, delta: "+5", status: "Strong" },
  { label: "Accuracy", score: 80, color: "#34D399", delta: "+4", status: "Strong" },
];
