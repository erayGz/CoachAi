import { useEffect, useState } from "react";
import { AlertTriangle, Check, Upload } from "lucide-react";
import { FieldGrid, GlowOrb } from "../components";
import { G } from "../utils/theme";
import type { AppScreenProps } from "../types";

const processingSteps = [
  "Detecting body movement",
  "Checking plant foot position",
  "Analyzing follow-through",
  "Measuring shot accuracy",
  "Generating AI coach feedback",
];

const ANALYSIS_DURATION_MS = 2400;
const RESULT_DELAY_MS = 300;

export function ProcessingScreen({ go, selectedVideo, currentAnalysisSession, onCompleteAnalysis }: AppScreenProps) {
  const [progress, setProgress] = useState(0);
  const step = Math.min(Math.floor((progress / 100) * processingSteps.length), processingSteps.length - 1);
  const canProcess = Boolean(selectedVideo && currentAnalysisSession?.status === "processing");

  useEffect(() => {
    if (!currentAnalysisSession || !canProcess) {
      return;
    }

    const startedAt = Date.now();
    let resultTimer: number | undefined;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, (elapsed / ANALYSIS_DURATION_MS) * 100);

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(timer);
        resultTimer = window.setTimeout(() => {
          onCompleteAnalysis(currentAnalysisSession.id);
          go("results");
        }, RESULT_DELAY_MS);
      }
    }, 50);

    return () => {
      window.clearInterval(timer);
      if (resultTimer) {
        window.clearTimeout(resultTimer);
      }
    };
  }, [canProcess, currentAnalysisSession, go, onCompleteAnalysis]);

  if (!selectedVideo || !currentAnalysisSession) {
    return (
      <ProcessingGate
        title="No video selected"
        detail="Upload a valid 10-25 second shooting video before running analysis."
        buttonLabel="Go to Upload"
        onAction={() => go("video-upload")}
      />
    );
  }

  if (currentAnalysisSession.status === "completed") {
    return (
      <ProcessingGate
        title="Analysis already completed"
        detail="This shooting analysis has finished and is ready to review."
        buttonLabel="View Results"
        onAction={() => go("results")}
      />
    );
  }

  return (
    <div
      className="coachai-scroll-content relative flex flex-col items-center justify-center h-full px-6 gap-7 overflow-y-auto"
      style={{ background: `linear-gradient(165deg, #0B1430 0%, ${G.bg} 60%)`, scrollbarWidth: "none" }}
    >
      <FieldGrid opacity={0.04} />
      <GlowOrb top="0" right="0" size={280} opacity={0.09} />

      <div className="relative flex items-center justify-center">
        <div className="absolute w-36 h-36 rounded-full animate-ping opacity-[0.07]" style={{ background: G.green }} />
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center relative"
          style={{
            background: G.card,
            border: `1.5px solid ${G.greenBorder}`,
            boxShadow: `0 0 40px ${G.green}25`,
          }}
        >
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={{ animation: "spin 4s linear infinite" }}>
            <circle cx="25" cy="25" r="22" stroke={G.green} strokeWidth="1.5" opacity="0.25" />
            <circle cx="25" cy="25" r="22" stroke={G.green} strokeWidth="1.5" strokeDasharray="28 110" strokeLinecap="round" />
          </svg>
          <div className="absolute text-[13px] font-black" style={{ color: G.green, fontFamily: "'Barlow Condensed', sans-serif" }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: G.green }}>AI Analysis Running</p>
        <h2 className="text-[28px] font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
          Processing Video
        </h2>
        <p className="text-[11px] mt-1" style={{ color: G.muted }}>Usually 2-3 seconds</p>
      </div>

      <div className="w-full rounded-2xl p-5 space-y-3" style={{ background: G.card, border: `1px solid ${G.border}` }}>
        {processingSteps.map((item, index) => {
          const done = progress >= 100 || index < step;
          const active = index === step;
          return (
            <div key={item} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done ? G.greenDim : active ? `${G.green}08` : G.card2,
                  border: `1.5px solid ${done ? G.green : active ? `${G.green}50` : G.border}`,
                }}
              >
                {done ? <Check size={9} color={G.green} strokeWidth={3} /> : active ? <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: G.green }} /> : null}
              </div>
              <span
                className="text-[12px] font-medium transition-colors"
                style={{
                  color: done ? "#C0F0D0" : active ? G.white : G.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>

      <div className="w-full">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: G.card2 }}>
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #1DC959 0%, ${G.green} 100%)`,
              boxShadow: `0 0 10px ${G.green}70`,
            }}
          />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProcessingGate({
  title,
  detail,
  buttonLabel,
  onAction,
}: {
  title: string;
  detail: string;
  buttonLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className="coachai-scroll-content relative flex flex-col items-center justify-center h-full px-6 gap-5 text-center overflow-y-auto"
      style={{ background: `linear-gradient(165deg, #0B1430 0%, ${G.bg} 60%)`, scrollbarWidth: "none" }}
    >
      <FieldGrid opacity={0.04} />
      <GlowOrb top="0" right="0" size={240} opacity={0.08} />
      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: G.card, border: `1px solid ${G.border}` }}>
        <AlertTriangle size={24} color={G.amber} />
      </div>
      <div className="relative">
        <h2 className="text-[24px] font-black uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}>
          {title}
        </h2>
        <p className="text-[12px] mt-2 leading-relaxed" style={{ color: G.muted }}>{detail}</p>
      </div>
      <button
        onClick={onAction}
        className="relative px-5 py-3 rounded-2xl text-[13px] font-black tracking-wide uppercase flex items-center gap-2 transition-all active:scale-[0.97]"
        style={{ background: "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)", color: G.bg, fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        <Upload size={14} />
        {buttonLabel}
      </button>
    </div>
  );
}
