import { useState } from "react";
import { AlertTriangle, Camera, Check, Upload } from "lucide-react";
import { FieldGrid, Header } from "../components";
import { G } from "../utils/theme";
import type { ScreenProps } from "../types";

const checklist = [
  "Full body visible throughout",
  "Ball and goal in frame",
  "Stationary ball before each shot",
  "Fixed camera, side or 45° angle",
  "5 shots performed",
];

export function VideoUploadScreen({ go }: ScreenProps) {
  const [uploaded, setUploaded] = useState(false);
  const [errorType, setErrorType] = useState<null | "long" | "short">(null);

  return (
    <div className="flex flex-col h-full">
      <Header title="Upload Video" sub="Shooting drill - 5 shots" onBack={() => go("shooting-guide")} />
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4" style={{ scrollbarWidth: "none" }}>
        <div
          onClick={() => {
            setUploaded(!uploaded);
            setErrorType(null);
          }}
          className="relative rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.98]"
          style={{
            height: 188,
            background: uploaded ? `${G.green}08` : G.card,
            border: `2px dashed ${uploaded ? G.green : G.border}`,
            borderRadius: 20,
          }}
        >
          <FieldGrid opacity={uploaded ? 0.06 : 0.03} />
          <div className="relative text-center flex flex-col items-center gap-2">
            {uploaded ? (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: G.greenDim }}>
                  <Check size={26} color={G.green} strokeWidth={2.5} />
                </div>
                <p className="text-[13px] font-bold" style={{ color: G.green }}>Video ready</p>
                <p className="text-[11px]" style={{ color: G.muted }}>shooting_drill.mp4&nbsp;&nbsp;·&nbsp;&nbsp;18 sec&nbsp;&nbsp;·&nbsp;&nbsp;94 MB</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: G.card2 }}>
                  <Upload size={24} color={G.muted} />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: G.white }}>Tap to select video</p>
                <p className="text-[11px]" style={{ color: G.muted }}>MP4 or MOV · 10-25 seconds</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Upload, label: "Gallery" },
            { icon: Camera, label: "Camera" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setUploaded(true)}
              className="py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{ background: G.card, border: `1px solid ${G.border}` }}
            >
              <Icon size={17} color={G.green} />
              <span className="text-[13px] font-bold" style={{ color: G.white, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl p-4 space-y-2.5" style={{ background: G.card, border: `1px solid ${G.border}` }}>
          <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: G.muted }}>
            Pre-upload Checklist
          </p>
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: uploaded ? G.greenDim : G.card2,
                  border: `1.5px solid ${uploaded ? G.green : G.border}`,
                }}
              >
                {uploaded && <Check size={8} color={G.green} strokeWidth={3} />}
              </div>
              <span className="text-[12px]" style={{ color: uploaded ? "#C4F5D4" : G.muted, fontFamily: "'DM Sans', sans-serif" }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {errorType === "long" && (
            <UploadError title="Video too long" detail="Please upload a video between 10 and 25 seconds. Your video is 38 seconds." />
          )}
          {errorType === "short" && (
            <UploadError title="Video too short" detail="Your video is only 6 seconds. We need at least 10 seconds to detect 5 shots." />
          )}
          <div className="flex gap-2">
            <button onClick={() => setErrorType("long")} className="flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all" style={{ background: G.card2, color: G.muted, border: `1px solid ${G.border}` }}>
              Preview: Too Long
            </button>
            <button onClick={() => setErrorType("short")} className="flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all" style={{ background: G.card2, color: G.muted, border: `1px solid ${G.border}` }}>
              Preview: Too Short
            </button>
          </div>
        </div>

        <button
          onClick={() => go("processing")}
          className="w-full py-[17px] rounded-2xl font-black text-[16px] tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: uploaded ? "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)" : G.card2,
            color: uploaded ? G.bg : G.muted,
            fontFamily: "'Barlow Condensed', sans-serif",
            boxShadow: uploaded ? `0 6px 28px ${G.green}40` : "none",
          }}
        >
          Analyze Video
        </button>
      </div>
    </div>
  );
}

function UploadError({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: `${G.red}0F`, border: `1px solid ${G.red}28` }}>
      <AlertTriangle size={15} color={G.red} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] font-bold" style={{ color: G.red }}>{title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: `${G.red}AA` }}>{detail}</p>
      </div>
    </div>
  );
}
