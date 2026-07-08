import { Activity, Check, Info, Target, Upload, Zap } from "lucide-react";
import { FieldGrid, ScoreRing, SubScoreCard } from "../components";
import { formatShotAction, shotActionLooksLikely } from "../utils/analysisResult";
import { G } from "../utils/theme";
import type {
  AnalysisLevel,
  AnalysisConfidence,
  AnalysisReliability,
  AppScreenProps,
  AnalysisRewardSummary,
  DrillValidityReport,
  DrillValidityStatus,
  PoseAnalysisSummary,
  PoseQuality,
  TrainingDrill,
  VideoMetadata,
  VideoQuality,
  VideoQualityCheckStatus,
  VideoQualityReport,
} from "../types";

export function ResultsScreen({ go, currentAnalysisSession }: AppScreenProps) {
  const result = currentAnalysisSession?.result;

  if (currentAnalysisSession?.status !== "completed" || !result) {
    return <NoResultState go={go} />;
  }

  const shotActionLabel = formatShotAction(result);
  const drillValidityStatus = result.drillValidityReport?.status;
  const isLimitedPreview = drillValidityStatus === "Unclear" || drillValidityStatus === "Invalid";
  const scoreLabel = isLimitedPreview ? "Preview Score" : "Overall Score";

  return (
    <div className="flex flex-col h-full">
      <div className="coachai-results-header px-5 pt-14 pb-2 flex items-center justify-between">
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

      <div className="coachai-scroll-content flex-1 overflow-y-auto px-5 space-y-4" style={{ scrollbarWidth: "none" }}>
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
                {scoreLabel}
              </p>
              <ScoreRing score={result.overallScore} size={130} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <SummaryBadge label="Level" value={result.level} color={getLevelColor(result.level)} />
              <SummaryBadge
                label="Shot Action"
                value={shotActionLabel}
                color={shotActionLooksLikely(result) ? G.green : getShotActionColor(shotActionLabel)}
              />
              <SummaryBadge label="Video Quality" value={result.videoQuality} color={getQualityColor(result.videoQuality)} />
              <SummaryBadge label="Reliability" value={result.analysisReliability} color={getReliabilityColor(result.analysisReliability)} />
            </div>
          </div>
        </div>

        {currentAnalysisSession.rewardSummary && <ProgressEarnedCard rewardSummary={currentAnalysisSession.rewardSummary} />}

        {result.videoMetadata && <VideoInfoCard metadata={result.videoMetadata} />}
        {result.videoQualityReport && <VideoQualityChecksCard report={result.videoQualityReport} analysisConfidence={result.analysisConfidence} />}
        {result.drillValidityReport && <DrillValidityCard report={result.drillValidityReport} />}
        {result.poseAnalysis && <PoseDetectionCard poseAnalysis={result.poseAnalysis} />}

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
                {result.mainFocusDescription ?? "Focus on this area during your next training session."}
              </p>
            </div>
          </div>
        </div>

        {isLimitedPreview && <LimitedPreviewBanner status={drillValidityStatus === "Invalid" ? "Invalid" : "Unclear"} />}

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
              Shot action: {shotActionLabel} - AI-generated feedback
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

function ProgressEarnedCard({ rewardSummary }: { rewardSummary: AnalysisRewardSummary }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.greenBorder}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.green }}>
            Progress Earned
          </p>
          <p className="text-[11px] mt-1" style={{ color: G.whiteDim }}>
            One clear shot is better than rushed uploads.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[24px] font-black leading-none" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
            +{rewardSummary.xpEarned}
          </p>
          <p className="text-[9px] font-bold mt-1" style={{ color: G.muted }}>
            XP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <VideoInfoItem label="Current Level" value={`Level ${rewardSummary.currentLevel}`} />
        <VideoInfoItem label="Weekly Quest" value={`${Math.min(3, rewardSummary.weeklyQuestProgress)}/3`} />
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: G.card2 }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${rewardSummary.levelProgress.progressPercent}%`,
            background: `linear-gradient(90deg, ${G.green} 0%, ${G.blue} 100%)`,
          }}
        />
      </div>
      <p className="text-[9px] mt-1.5" style={{ color: G.muted }}>
        {Math.max(0, rewardSummary.levelProgress.nextLevelXp - rewardSummary.totalXp)} XP to Level {rewardSummary.levelProgress.nextLevel}
      </p>

      {rewardSummary.newlyUnlockedBadges.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${G.greenBorder}` }}>
          <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: G.green }}>
            Badges Unlocked
          </p>
          <div className="space-y-1.5">
            {rewardSummary.newlyUnlockedBadges.map((badge) => (
              <div key={badge.id} className="rounded-xl px-3 py-2" style={{ background: G.greenDim, border: `1px solid ${G.greenBorder}` }}>
                <p className="text-[11px] font-black" style={{ color: G.white }}>
                  {badge.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: G.whiteDim }}>
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LimitedPreviewBanner({ status }: { status: "Unclear" | "Invalid" }) {
  const isInvalid = status === "Invalid";

  return (
    <div
      className="rounded-2xl px-4 py-3.5"
      style={{
        background: `${isInvalid ? G.red : G.amber}10`,
        border: `1px solid ${isInvalid ? `${G.red}28` : `${G.amber}28`}`,
      }}
    >
      <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: isInvalid ? G.red : G.amber }}>
        Limited Preview
      </p>
      <p className="text-[12px] leading-relaxed" style={{ color: G.whiteDim }}>
        Limited preview: shooting action was not confidently verified.
      </p>
    </div>
  );
}

function DrillValidityCard({ report }: { report: DrillValidityReport }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
            Drill Validity
          </p>
          <p className="text-[10px] mt-1" style={{ color: G.whiteDim }}>
            Single-shot shooting clip check
          </p>
        </div>
        <div className="flex gap-1.5">
          <QualityPill label="Status" value={report.status} color={getDrillValidityStatusColor(report.status)} />
          <QualityPill label="Confidence" value={report.confidence} color={getConfidenceColor(report.confidence)} />
        </div>
      </div>

      {report.status === "Invalid" && (
        <div className="rounded-xl px-3 py-2 mb-3" style={{ background: `${G.red}10`, border: `1px solid ${G.red}24` }}>
          <p className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: G.red }}>
            Check Recording
          </p>
          <p className="text-[11px] leading-snug" style={{ color: G.whiteDim }}>
            Upload a clear single-shot football video for a more useful report.
          </p>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="rounded-xl px-3 py-2 mb-3" style={{ background: `${G.amber}12`, border: `1px solid ${G.amber}28` }}>
          <p className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: G.amber }}>
            Warnings
          </p>
          <div className="space-y-1">
            {report.warnings.map((warning) => (
              <p key={warning} className="text-[11px] leading-snug" style={{ color: G.whiteDim }}>
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {report.checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2.5">
            <span
              className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: getCheckStatusColor(check.status), boxShadow: `0 0 10px ${getCheckStatusColor(check.status)}55` }}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: G.white }}>
                {check.label}
              </p>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: G.whiteDim }}>
                {check.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoInfoCard({ metadata }: { metadata: VideoMetadata }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: G.muted }}>
        Video Info
      </p>
      <div className="grid grid-cols-2 gap-2">
        <VideoInfoItem label="Duration" value={`${metadata.durationSeconds.toFixed(1)} sec`} />
        <VideoInfoItem label="Resolution" value={`${metadata.width}x${metadata.height}`} />
        <VideoInfoItem label="FPS" value={metadata.fps.toFixed(1)} />
        <VideoInfoItem label="Sampled Frames" value={String(metadata.sampledFrameCount)} />
      </div>
    </div>
  );
}

function PoseDetectionCard({ poseAnalysis }: { poseAnalysis: PoseAnalysisSummary }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
            Pose Detection
          </p>
          <p className="text-[10px] mt-1" style={{ color: G.whiteDim }}>
            Sampled-frame detection quality
          </p>
        </div>
        <div
          className="rounded-lg px-2 py-1"
          style={{
            background: `${getPoseQualityColor(poseAnalysis.poseQuality)}10`,
            border: `1px solid ${getPoseQualityColor(poseAnalysis.poseQuality)}22`,
          }}
        >
          <p className="text-[7px] tracking-widest uppercase" style={{ color: G.muted }}>
            Quality
          </p>
          <p className="text-[10px] font-black leading-none mt-1" style={{ color: getPoseQualityColor(poseAnalysis.poseQuality), fontFamily: "'Barlow Condensed', sans-serif" }}>
            {poseAnalysis.poseQuality}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <VideoInfoItem label="Frames Analyzed" value={String(poseAnalysis.framesAnalyzed)} />
        <VideoInfoItem label="Frames With Pose" value={String(poseAnalysis.framesWithPose)} />
        <VideoInfoItem label="Detection Rate" value={`${Math.round(poseAnalysis.poseDetectionRate * 100)}%`} />
        <VideoInfoItem
          label="Avg Visibility"
          value={poseAnalysis.averageVisibility === null ? "--" : `${Math.round(poseAnalysis.averageVisibility * 100)}%`}
        />
      </div>
    </div>
  );
}

function VideoQualityChecksCard({
  report,
  analysisConfidence,
}: {
  report: VideoQualityReport;
  analysisConfidence?: AnalysisConfidence;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: G.muted }}>
            Video Quality Checks
          </p>
          <p className="text-[10px] mt-1" style={{ color: G.whiteDim }}>
            Metadata-based readiness check
          </p>
        </div>
        <div className="flex gap-1.5">
          <QualityPill label="Quality" value={report.quality} color={getQualityColor(report.quality)} />
          <QualityPill label="Reliability" value={report.reliability} color={getReliabilityColor(report.reliability)} />
          {analysisConfidence && (
            <QualityPill label="Confidence" value={analysisConfidence} color={getConfidenceColor(analysisConfidence)} />
          )}
        </div>
      </div>

      {analysisConfidence === "Low" && (
        <div className="rounded-xl px-3 py-2 mb-3" style={{ background: `${G.red}10`, border: `1px solid ${G.red}24` }}>
          <p className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: G.red }}>
            Limited Analysis
          </p>
          <p className="text-[11px] leading-snug" style={{ color: G.whiteDim }}>
            Limited analysis: full-body pose was not reliably detected.
          </p>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="rounded-xl px-3 py-2 mb-3" style={{ background: `${G.amber}12`, border: `1px solid ${G.amber}28` }}>
          <p className="text-[9px] font-black tracking-widest uppercase mb-1" style={{ color: G.amber }}>
            Warnings
          </p>
          <div className="space-y-1">
            {report.warnings.map((warning) => (
              <p key={warning} className="text-[11px] leading-snug" style={{ color: G.whiteDim }}>
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {report.checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2.5">
            <span
              className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: getCheckStatusColor(check.status), boxShadow: `0 0 10px ${getCheckStatusColor(check.status)}55` }}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: G.white }}>
                {check.label}
              </p>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: G.whiteDim }}>
                {check.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualityPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg px-2 py-1 text-right" style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
      <p className="text-[7px] tracking-widest uppercase" style={{ color: G.muted }}>
        {label}
      </p>
      <p className="text-[10px] font-black leading-none mt-1" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </p>
    </div>
  );
}

function VideoInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: G.card2, border: `1px solid ${G.border}` }}>
      <p className="text-[8px] tracking-widest uppercase" style={{ color: G.muted }}>
        {label}
      </p>
      <p className="text-[13px] font-black mt-1" style={{ color: G.white, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </p>
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

function getConfidenceColor(confidence: AnalysisConfidence) {
  if (confidence === "High") return G.green;
  if (confidence === "Medium") return G.amber;
  return G.red;
}

function getShotActionColor(value: string) {
  if (value === "Likely") return G.green;
  if (value === "Unclear") return G.amber;
  return G.red;
}

function getDrillValidityStatusColor(status: DrillValidityStatus) {
  if (status === "Valid") return G.green;
  if (status === "Unclear") return G.amber;
  return G.red;
}

function getCheckStatusColor(status: VideoQualityCheckStatus) {
  if (status === "pass") return G.green;
  if (status === "warning") return G.amber;
  return G.red;
}

function getPoseQualityColor(quality: PoseQuality) {
  if (quality === "Good") return G.green;
  if (quality === "Partial") return G.amber;
  return G.red;
}
