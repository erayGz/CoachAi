import { useState, type ReactNode } from "react";
import { Activity, AlertTriangle, Check, Info, Target, Upload, Zap } from "lucide-react";
import { Chip, FieldGrid, ScoreRing, SubScoreCard, TrainingDrillCard } from "../components";
import { analysisResults, technicalBreakdown } from "../data/analysisResults";
import { trainingDrills } from "../data/trainingDrills";
import { G } from "../utils/theme";
import type { AppScreenProps } from "../types";

export function ResultsScreen({ go, currentAnalysisSession }: AppScreenProps) {
  const [warning, setWarning] = useState(false);
  const videoQuality = warning ? analysisResults.warningVideoQuality : analysisResults.videoQuality;

  if (currentAnalysisSession?.status !== "completed") {
    return <NoResultState go={go} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: G.green }}>Session Complete</p>
          <h1 className="text-[22px] font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
            Analysis Results
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Check size={11} color={G.green} strokeWidth={3} />
            <span className="text-[10px] font-bold tracking-wide uppercase" style={{ color: G.green }}>
              Saved to History
            </span>
          </div>
        </div>
        <button
          onClick={() => setWarning((current) => !current)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: G.card2, border: `1px solid ${G.border}` }}
          title="Toggle quality warning"
        >
          <AlertTriangle size={15} color={warning ? G.amber : G.muted} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4" style={{ scrollbarWidth: "none" }}>
        {warning && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: `${G.amber}0E`, border: `1px solid ${G.amber}30` }}>
            <AlertTriangle size={15} color={G.amber} className="flex-shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed" style={{ color: `${G.amber}DD` }}>
              Some scores may be less reliable because the ball was not clearly visible in every frame.
            </p>
          </div>
        )}

        <div
          className="relative rounded-2xl overflow-hidden p-5"
          style={{
            background: "linear-gradient(135deg, #0C1E40 0%, #091628 100%)",
            border: `1.5px solid ${G.greenBorder}`,
          }}
        >
          <FieldGrid opacity={0.06} />
          <div className="relative flex items-center gap-5">
            <div className="text-center">
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: G.muted }}>Overall Score</p>
              <ScoreRing score={analysisResults.overallScore} size={130} />
            </div>
            <div className="flex-1 space-y-3">
              <ResultMetric label="Level">
                <Chip label={analysisResults.level} color={G.amber} />
              </ResultMetric>
              <ResultMetric label="Detected Shots">
                <Chip label={`${analysisResults.detectedShots} shots`} color={G.green} />
              </ResultMetric>
              <ResultMetric label="Video Quality">
                <Chip label={videoQuality} color={warning ? G.amber : G.green} />
              </ResultMetric>
              <ResultMetric label="Analysis Reliability">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: G.card3 }}>
                    <div className="h-full rounded-full" style={{ width: `${analysisResults.analysisReliability}%`, background: G.blue }} />
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: G.blue, fontFamily: "'JetBrains Mono', monospace" }}>
                    {analysisResults.analysisReliability}%
                  </span>
                </div>
              </ResultMetric>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${G.border}` }}>
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
              Technical Breakdown
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: G.border }}>
            {technicalBreakdown.map((score) => <SubScoreCard key={score.label} {...score} />)}
          </div>
        </div>

        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
            <Target size={16} color={G.green} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
              Main Focus This Week
            </p>
            <p className="text-[14px] font-black mt-1" style={{ color: G.white, fontFamily: "'Barlow Condensed', sans-serif" }}>
              {analysisResults.mainFocusThisWeek}
            </p>
            <p className="text-[11px] mt-1 leading-relaxed" style={{ color: G.muted }}>
              Keep your support foot closer to the ball and repeat the recommended drills before the next upload.
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${G.green}25` }}>
              <Zap size={14} color={G.green} />
            </div>
            <span
              className="text-[11px] font-black tracking-widest uppercase"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.green }}
            >
              AI Coach Feedback
            </span>
          </div>
          <p className="text-[13px] leading-[1.65]" style={{ color: "#D4F5DC", fontFamily: "'DM Sans', sans-serif" }}>
            {analysisResults.coachFeedback}
          </p>
          <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${G.greenBorder}` }}>
            <Info size={12} color={G.green} opacity={0.6} />
            <p className="text-[10px]" style={{ color: `${G.green}88` }}>
              Based on {analysisResults.detectedShots} shots detected · AI-generated feedback
            </p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${G.border}` }}>
            <Activity size={14} color={G.blue} />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
              Recommended Training
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: G.border }}>
            {trainingDrills.map((drill, index) => <TrainingDrillCard key={drill.name} drill={drill} index={index} />)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => go("history")}
            className="py-[15px] rounded-2xl font-black text-[15px] tracking-[0.08em] uppercase transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)",
              color: G.bg,
              fontFamily: "'Barlow Condensed', sans-serif",
              boxShadow: `0 4px 20px ${G.green}35`,
            }}
          >
            View History
          </button>
          <button
            onClick={() => go("shooting-guide")}
            className="py-[15px] rounded-2xl font-black text-[15px] tracking-[0.08em] uppercase transition-all active:scale-[0.97]"
            style={{
              background: G.card,
              color: G.whiteDim,
              fontFamily: "'Barlow Condensed', sans-serif",
              border: `1px solid ${G.border}`,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

function NoResultState({ go }: { go: (screen: "video-upload") => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="rounded-2xl p-5 text-center" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
            <Upload size={20} color={G.green} />
          </div>
          <h1 className="text-[22px] font-black uppercase mt-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
            No Result Yet
          </h1>
          <p className="text-[13px] font-semibold mt-2 leading-relaxed" style={{ color: G.whiteDim }}>
            No analysis result yet. Upload a shooting video to get started.
          </p>
          <button
            onClick={() => go("video-upload")}
            className="mt-4 px-4 py-2.5 rounded-xl text-[12px] font-black tracking-wide uppercase transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)",
              color: G.bg,
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultMetric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: G.muted }}>
        {label}
      </p>
      {children}
    </div>
  );
}
