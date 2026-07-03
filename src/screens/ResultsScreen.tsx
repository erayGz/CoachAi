import { Activity, Check, Info, Target, Upload, Zap } from "lucide-react";
import { FieldGrid, ScoreRing, SubScoreCard } from "../components";
import { G } from "../utils/theme";
import type { AnalysisLevel, AnalysisReliability, AppScreenProps, TrainingDrill, VideoQuality } from "../types";

export function ResultsScreen({ go, currentAnalysisSession }: AppScreenProps) {
  const result = currentAnalysisSession?.result;

  if (currentAnalysisSession?.status !== "completed" || !result) {
    return <NoResultState go={go} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase" style={{ color: G.green }}>
            Session Complete
          </p>
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
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4" style={{ scrollbarWidth: "none" }}>
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
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: G.muted }}>
                Overall Score
              </p>
              <ScoreRing score={result.overallScore} size={130} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <SummaryBadge label="Level" value={result.level} color={getLevelColor(result.level)} />
              <SummaryBadge
                label="Detected Shots"
                value={`${result.detectedShots}/${result.totalShots}`}
                color={result.detectedShots === result.totalShots ? G.green : G.amber}
              />
              <SummaryBadge label="Video Quality" value={result.videoQuality} color={getQualityColor(result.videoQuality)} />
              <SummaryBadge label="Reliability" value={result.analysisReliability} color={getReliabilityColor(result.analysisReliability)} />
            </div>
          </div>
        </div>

        <div
          className="relative rounded-2xl p-5 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${G.greenDim} 0%, ${G.card} 95%)`, border: `1.5px solid ${G.greenBorder}` }}
        >
          <FieldGrid opacity={0.045} />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${G.green}20`, border: `1px solid ${G.greenBorder}` }}>
              <Target size={17} color={G.green} />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.green }}>
                Main Focus This Week
              </p>
              <p className="text-[22px] font-black uppercase mt-1 leading-none" style={{ color: G.white, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {result.mainFocus}
              </p>
              <p className="text-[12px] mt-2 leading-relaxed" style={{ color: G.whiteDim }}>
                {result.mainFocusDescription}
              </p>
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
            {result.technicalBreakdown.map((score) => (
              <SubScoreCard key={score.label} {...score} />
            ))}
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
            {result.aiCoachFeedback}
          </p>
          <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${G.greenBorder}` }}>
            <Info size={12} color={G.green} opacity={0.6} />
            <p className="text-[10px]" style={{ color: `${G.green}88` }}>
              Based on {result.detectedShots}/{result.totalShots} shots detected - AI-generated feedback
            </p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${G.border}` }}>
            <Activity size={14} color={G.blue} />
            <div>
              <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
                Recommended Training
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: G.green }}>
                7-day mini plan preview
              </p>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: G.border }}>
            {result.recommendedTraining.map((drill, index) => (
              <PlanDay key={`${drill.name}-${index}`} drill={drill} day={index + 1} />
            ))}
          </div>
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${G.border}` }}>
            <button
              className="w-full py-3 rounded-xl text-[13px] font-black tracking-wide uppercase transition-all active:scale-[0.98]"
              style={{ background: G.card2, color: G.green, border: `1px solid ${G.greenBorder}`, fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Start 7-Day Plan
            </button>
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

function NoResultState({ go }: { go: AppScreenProps["go"] }) {
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

function SummaryBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: `${color}10`, border: `1px solid ${color}26` }}>
      <p className="text-[8px] tracking-widest uppercase mb-1" style={{ color: G.muted }}>
        {label}
      </p>
      <p className="text-[13px] font-black leading-none" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </p>
    </div>
  );
}

function PlanDay({ drill, day }: { drill: TrainingDrill; day: number }) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3.5" style={{ borderColor: G.border }}>
      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
        <span className="text-[8px] font-bold uppercase leading-none" style={{ color: G.muted }}>
          Day
        </span>
        <span className="text-[16px] font-black leading-none" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {day}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: G.white }}>
          {drill.name}
        </p>
        <p className="text-[10px] font-bold mt-0.5" style={{ color: G.green, fontFamily: "'JetBrains Mono', monospace" }}>
          {drill.reps}
        </p>
      </div>
    </div>
  );
}

function getLevelColor(level: AnalysisLevel) {
  if (level === "Advanced" || level === "Elite") return G.blue;
  if (level === "Intermediate") return G.green;
  return G.amber;
}

function getQualityColor(quality: VideoQuality) {
  if (quality === "Excellent") return G.blue;
  if (quality === "Good") return G.green;
  return G.amber;
}

function getReliabilityColor(reliability: AnalysisReliability) {
  if (reliability === "High") return G.blue;
  if (reliability === "Good") return G.green;
  return G.amber;
}
