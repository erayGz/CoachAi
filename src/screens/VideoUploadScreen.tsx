import { useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { AlertTriangle, Camera, Check, RefreshCw, Trash2, Upload } from "lucide-react";
import { FieldGrid, Header } from "../components";
import { formatVideoDuration, formatVideoSize, validateShootingVideo } from "../utils/video";
import { G } from "../utils/theme";
import type { AppScreenProps } from "../types";

const checklist = [
  "Full body visible throughout",
  "Ball and goal in frame",
  "Stationary ball before each shot",
  "Fixed camera, side or 45° angle",
  "5 shots performed",
];

export function VideoUploadScreen({
  go,
  selectedVideoValidation,
  onVideoValidationChange,
  onClearSelectedVideo,
  onStartAnalysis,
}: AppScreenProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isReadingVideo, setIsReadingVideo] = useState(false);

  const metadata = selectedVideoValidation?.metadata ?? null;
  const isValidVideo = selectedVideoValidation?.isValid ?? false;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsReadingVideo(true);
    const result = await validateShootingVideo(file);
    onVideoValidationChange(result);
    setIsReadingVideo(false);
  }

  function openGalleryPicker() {
    galleryInputRef.current?.click();
  }

  function openCameraPicker() {
    cameraInputRef.current?.click();
  }

  function changeVideo(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    openGalleryPicker();
  }

  function removeVideo(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClearSelectedVideo();
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Upload Video" sub="Shooting drill - 5 shots" onBack={() => go("shooting-guide")} />
      <div className="coachai-scroll-content flex-1 overflow-y-auto px-5 space-y-4" style={{ scrollbarWidth: "none" }}>
        <input ref={galleryInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileChange} />

        <div
          onClick={openGalleryPicker}
          className="relative rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.98]"
          style={{
            height: 188,
            background: isValidVideo ? `${G.green}08` : G.card,
            border: `2px dashed ${isValidVideo ? G.green : selectedVideoValidation?.message ? `${G.red}55` : G.border}`,
            borderRadius: 20,
          }}
        >
          <FieldGrid opacity={isValidVideo ? 0.06 : 0.03} />
          <div className="relative text-center flex flex-col items-center gap-2">
            {isReadingVideo ? (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: G.card2 }}>
                  <Upload size={24} color={G.green} />
                </div>
                <p className="text-[13px] font-bold" style={{ color: G.green }}>Reading video...</p>
                <p className="text-[11px]" style={{ color: G.muted }}>Checking duration and file metadata</p>
              </>
            ) : metadata ? (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: G.greenDim }}>
                  {isValidVideo ? (
                    <Check size={26} color={G.green} strokeWidth={2.5} />
                  ) : (
                    <AlertTriangle size={24} color={G.red} />
                  )}
                </div>
                <p className="text-[13px] font-bold" style={{ color: isValidVideo ? G.green : G.red }}>
                  {isValidVideo ? "Video ready" : "Video selected"}
                </p>
                <p className="text-[11px] max-w-[270px] truncate" title={metadata.fileName} style={{ color: G.whiteDim }}>
                  {metadata.fileName}
                </p>
                <p className="text-[11px]" style={{ color: G.muted }}>
                  {formatVideoDuration(metadata.durationSeconds)}&nbsp;&nbsp;·&nbsp;&nbsp;{formatVideoSize(metadata.fileSizeMb)}
                </p>
                <p className="text-[10px] font-bold tracking-wide uppercase" style={{ color: isValidVideo ? G.green : G.red }}>
                  {isValidVideo ? "Validation: Ready for analysis" : "Validation: Needs attention"}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={changeVideo}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1"
                    style={{ background: G.card2, color: G.whiteDim, border: `1px solid ${G.border}` }}
                  >
                    <RefreshCw size={10} />
                    Change
                  </button>
                  <button
                    onClick={removeVideo}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1"
                    style={{ background: `${G.red}10`, color: G.red, border: `1px solid ${G.red}28` }}
                  >
                    <Trash2 size={10} />
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: G.card2 }}>
                  <Upload size={24} color={G.muted} />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: G.white }}>Tap to select video</p>
                <p className="text-[11px]" style={{ color: G.muted }}>Video files only · 10-25 seconds</p>
                <p className="text-[10px] max-w-[240px] leading-relaxed" style={{ color: G.muted }}>
                  Choose a short shooting clip to unlock the mocked analysis flow.
                </p>
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
              onClick={label === "Camera" ? openCameraPicker : openGalleryPicker}
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
                  background: isValidVideo ? G.greenDim : G.card2,
                  border: `1.5px solid ${isValidVideo ? G.green : G.border}`,
                }}
              >
                {isValidVideo && <Check size={8} color={G.green} strokeWidth={3} />}
              </div>
              <span className="text-[12px]" style={{ color: isValidVideo ? "#C4F5D4" : G.muted, fontFamily: "'DM Sans', sans-serif" }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {selectedVideoValidation?.message && <UploadError title="Upload issue" detail={selectedVideoValidation.message} />}

        <button
          disabled={!isValidVideo}
          onClick={onStartAnalysis}
          className="w-full py-[17px] rounded-2xl font-black text-[16px] tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: isValidVideo ? "linear-gradient(90deg, #2EE86B 0%, #1DC959 100%)" : G.card2,
            color: isValidVideo ? G.bg : G.muted,
            fontFamily: "'Barlow Condensed', sans-serif",
            boxShadow: isValidVideo ? `0 6px 28px ${G.green}40` : "none",
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
