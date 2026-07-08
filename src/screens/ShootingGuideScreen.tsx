import { AlertTriangle } from "lucide-react";
import { FieldGrid, Header, VideoRuleCard } from "../components";
import { G } from "../utils/theme";
import type { ScreenProps, VideoRule } from "../types";

const videoRules: VideoRule[] = [
  { icon: "1", title: "One complete shot only", detail: "Record one full action from approach through follow-through." },
  { icon: "2", title: "Ball visible at contact", detail: "Keep the ball visible before and during the strike." },
  { icon: "3", title: "Kicking leg visible", detail: "Do not crop out the striking leg or plant foot." },
  { icon: "4", title: "Full body stays in frame", detail: "Avoid standing too close to the camera." },
  { icon: "5", title: "Fixed side angle", detail: "Use a stable side or 45-degree view." },
  { icon: "⏱", title: "Video: 3-15 seconds", detail: "Longer or shorter videos cannot be processed reliably." },
  { icon: "7", title: "One player only", detail: "No other players in the frame during the drill." },
  { icon: "8", title: "Use a shooting clip", detail: "Avoid random football clips, celebrations, or non-shooting videos." },
];

export function ShootingGuideScreen({ go }: ScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Recording Guide" sub="Read carefully before you record" onBack={() => go("dashboard")} />
      <div className="coachai-scroll-content flex-1 overflow-y-auto px-5 space-y-3" style={{ scrollbarWidth: "none" }}>
        <div className="relative rounded-2xl overflow-hidden" style={{ background: G.card, border: `1px solid ${G.border}`, height: 180 }}>
          <FieldGrid opacity={0.07} />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet">
            <rect x="20" y="20" width="320" height="140" fill="none" stroke={G.green} strokeWidth="0.8" opacity="0.2" rx="4" />
            <line x1="180" y1="20" x2="180" y2="160" stroke={G.green} strokeWidth="0.6" strokeDasharray="4 4" opacity="0.2" />
            <rect x="60" y="50" width="48" height="5" rx="2" fill={G.green} opacity="0.7" />
            <rect x="60" y="50" width="4" height="48" rx="2" fill={G.green} opacity="0.5" />
            <rect x="104" y="50" width="4" height="48" rx="2" fill={G.green} opacity="0.5" />
            <circle cx="232" cy="130" r="8" fill={G.white} opacity="0.85" />
            <circle cx="232" cy="130" r="8" fill="none" stroke={G.muted} strokeWidth="0.8" />
            <circle cx="232" cy="130" r="3" fill={G.card} opacity="0.5" />
            <circle cx="250" cy="104" r="6" fill={G.whiteDim} opacity="0.75" />
            <rect x="244" y="111" width="12" height="22" rx="3" fill={G.whiteDim} opacity="0.65" />
            <rect x="244" y="129" width="5" height="18" rx="2.5" fill={G.whiteDim} opacity="0.55" />
            <rect x="250" y="129" width="5" height="18" rx="2.5" fill={G.whiteDim} opacity="0.55" />
            <rect x="237" y="113" width="6" height="16" rx="3" fill={G.whiteDim} opacity="0.45" />
            <rect x="257" y="113" width="6" height="16" rx="3" fill={G.whiteDim} opacity="0.45" />
            <path d="M 232 130 Q 160 80 84 73" stroke={G.green} strokeWidth="1.5" fill="none" strokeDasharray="5 3" opacity="0.55" />
            <polygon points="84,68 78,76 90,76" fill={G.green} opacity="0.55" />
            <rect x="288" y="118" width="40" height="28" rx="5" fill={G.card3} stroke={G.greenBorder} strokeWidth="1" />
            <circle cx="304" cy="132" r="7" fill={G.green} opacity="0.3" />
            <circle cx="304" cy="132" r="4" fill={G.green} opacity="0.6" />
            <rect x="326" y="126" width="4" height="12" rx="2" fill={G.muted} opacity="0.5" />
            <text x="288" y="112" fill={G.green} fontSize="9" opacity="0.7" fontFamily="'DM Sans', sans-serif">45° / Side</text>
            <text x="82" y="44" fill={G.green} fontSize="9" opacity="0.7" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Goal</text>
            <text x="232" y="152" fill={G.whiteDim} fontSize="9" opacity="0.7" textAnchor="middle" fontFamily="'DM Sans', sans-serif">Ball</text>
          </svg>
        </div>

        <div className="space-y-2">
          {videoRules.map((rule) => <VideoRuleCard key={rule.title} {...rule} />)}
        </div>

        <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: `${G.amber}0F`, border: `1px solid ${G.amber}28` }}>
          <AlertTriangle size={15} color={G.amber} className="flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed" style={{ color: `${G.amber}CC` }}>
            Poor video quality, missing body parts, or a moving camera will reduce analysis confidence and may affect scores.
          </p>
        </div>

        <button
          onClick={() => go("video-upload")}
          className="w-full py-[17px] rounded-2xl font-black text-[16px] tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)",
            color: G.bg,
            fontFamily: "'Barlow Condensed', sans-serif",
            boxShadow: `0 6px 28px ${G.green}40`,
          }}
        >
          I'm Ready - Upload Video
        </button>
      </div>
    </div>
  );
}
