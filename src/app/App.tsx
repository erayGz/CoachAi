import { useState, type ComponentType } from "react";
import { DashboardScreen } from "../screens/DashboardScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProcessingScreen } from "../screens/ProcessingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { ShootingGuideScreen } from "../screens/ShootingGuideScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { VideoUploadScreen } from "../screens/VideoUploadScreen";
import { activeModuleLabel, appMeta } from "../data/appMeta";
import { initialScreen, screenRegistry } from "../utils/navigation";
import { G } from "../utils/theme";
import type { Screen, ScreenProps } from "../types";

const screenComponents: Record<Screen, ComponentType<ScreenProps>> = {
  splash: SplashScreen,
  dashboard: DashboardScreen,
  "shooting-guide": ShootingGuideScreen,
  "video-upload": VideoUploadScreen,
  processing: ProcessingScreen,
  results: ResultsScreen,
  history: HistoryScreen,
  profile: ProfileScreen,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [screenKey, setScreenKey] = useState(0);

  function go(nextScreen: Screen) {
    setScreen(nextScreen);
    setScreenKey((current) => current + 1);
  }

  const ActiveScreen = screenComponents[screen];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start gap-5 pt-6 pb-8 px-4" style={{ background: "#030509" }}>
      <div className="flex flex-wrap gap-1.5 max-w-[420px] justify-center">
        {screenRegistry.map(({ id, label }, index) => (
          <button
            key={id}
            onClick={() => go(id)}
            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all"
            style={{
              background: screen === id ? G.greenDim : "#0C1126",
              color: screen === id ? G.green : G.muted,
              border: `1px solid ${screen === id ? G.greenBorder : "rgba(255,255,255,0.05)"}`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {String(index + 1).padStart(2, "0")} {label}
          </button>
        ))}
      </div>

      <div
        className="relative flex-shrink-0"
        style={{
          width: 390,
          height: 790,
          borderRadius: 50,
          background: G.card,
          boxShadow: [
            "0 0 0 10px #0C1126",
            "0 0 0 11px rgba(46,232,107,0.06)",
            "0 48px 96px rgba(0,0,0,0.85)",
            "inset 0 0 0 1px rgba(255,255,255,0.04)",
          ].join(", "),
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-28 h-8 rounded-b-[24px]" style={{ background: "#0C1126" }} />

        <div className="absolute top-2 left-8 right-8 z-50 flex items-center justify-between px-1" style={{ height: 20 }}>
          <span className="text-[10px] font-bold" style={{ color: G.whiteDim, fontFamily: "'DM Sans', sans-serif" }}>
            9:41
          </span>
          <div className="flex items-center gap-1.5 opacity-70">
            <div className="flex items-end gap-0.5 h-3">
              {[3, 5, 7, 9].map((height, index) => (
                <div key={`${height}-${index}`} className="w-1 rounded-sm" style={{ height, background: G.white }} />
              ))}
            </div>
            <svg width="14" height="10" viewBox="0 0 14 10">
              <rect x="1" y="3" width="10" height="7" rx="1.5" fill="none" stroke={G.white} strokeWidth="1.2" />
              <rect x="2" y="4" width="7" height="5" rx="0.8" fill={G.white} />
              <rect x="11.5" y="4.5" width="1.5" height="3" rx="0.5" fill={G.white} />
            </svg>
          </div>
        </div>

        <div key={screenKey} className="absolute inset-0 overflow-hidden" style={{ borderRadius: 50, background: G.bg }}>
          <ActiveScreen go={go} />
        </div>

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full z-50" style={{ background: "rgba(255,255,255,0.2)" }} />
      </div>

      <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "#1A2340", fontFamily: "'JetBrains Mono', monospace" }}>
        {appMeta.brand} · {activeModuleLabel} · MVP Frontend
      </p>
    </div>
  );
}
