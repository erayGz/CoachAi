import { useState, type ComponentType } from "react";
import { DashboardScreen } from "../screens/DashboardScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProcessingScreen } from "../screens/ProcessingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { ShootingGuideScreen } from "../screens/ShootingGuideScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { VideoUploadScreen } from "../screens/VideoUploadScreen";
import { initialScreen, screenRegistry } from "../utils/navigation";
import { createAnalysisSessionId } from "../utils/session";
import { saveAnalysisToHistory } from "../utils/historyStorage";
import { applyAnalysisRewards } from "../utils/gamificationStorage";
import { G } from "../utils/theme";
import type { AnalysisSession, AppScreenProps, Screen, ShootingAnalysisResult, VideoValidationResult } from "../types";

const screenComponents: Record<Screen, ComponentType<AppScreenProps>> = {
  splash: SplashScreen,
  dashboard: DashboardScreen,
  "shooting-guide": ShootingGuideScreen,
  "video-upload": VideoUploadScreen,
  processing: ProcessingScreen,
  results: ResultsScreen,
  history: HistoryScreen,
  profile: ProfileScreen,
};

const showDevScreenSwitcher = import.meta.env.DEV && import.meta.env.VITE_SHOW_SCREEN_SWITCHER === "true";

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [screenKey, setScreenKey] = useState(0);
  const [selectedVideoValidation, setSelectedVideoValidation] = useState<VideoValidationResult | null>(null);
  const [currentAnalysisSession, setCurrentAnalysisSession] = useState<AnalysisSession | null>(null);

  const selectedVideo = selectedVideoValidation?.isValid ? selectedVideoValidation.metadata : null;

  function go(nextScreen: Screen) {
    setScreen(nextScreen);
    setScreenKey((current) => current + 1);
  }

  function handleVideoValidationChange(validation: VideoValidationResult | null) {
    setSelectedVideoValidation(validation);
    setCurrentAnalysisSession(null);
  }

  function clearSelectedVideo() {
    setSelectedVideoValidation(null);
    setCurrentAnalysisSession(null);
  }

  function startAnalysis() {
    if (!selectedVideo) {
      return;
    }

    setCurrentAnalysisSession({
      id: createAnalysisSessionId(),
      selectedVideo,
      status: "processing",
      createdAt: new Date().toISOString(),
      savedToHistory: false,
    });
    go("processing");
  }

  function completeAnalysis(sessionId: string, result: ShootingAnalysisResult) {
    setCurrentAnalysisSession((currentSession) => {
      if (!currentSession || currentSession.id !== sessionId || currentSession.status === "completed") {
        return currentSession;
      }

      const completedSession: AnalysisSession = {
        ...currentSession,
        status: "completed",
        completedAt: result.createdAt ?? new Date().toISOString(),
        historyItemId: result.id ?? currentSession.id,
        savedToHistory: true,
        result,
      };

      saveAnalysisToHistory(completedSession);

      return {
        ...completedSession,
        rewardSummary: applyAnalysisRewards(result),
      };
    });
  }

  const ActiveScreen = screenComponents[screen];
  const screenProps: AppScreenProps = {
    go,
    selectedVideo,
    selectedVideoValidation,
    currentAnalysisSession,
    onVideoValidationChange: handleVideoValidationChange,
    onClearSelectedVideo: clearSelectedVideo,
    onStartAnalysis: startAnalysis,
    onCompleteAnalysis: completeAnalysis,
  };

  return (
    <div className="coachai-app-shell">
      {showDevScreenSwitcher && (
        <div className="coachai-dev-switcher flex flex-wrap gap-1.5 max-w-[420px] justify-center">
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
      )}

      <div key={screenKey} className="coachai-screen-surface overflow-hidden" style={{ background: G.bg }}>
        <ActiveScreen {...screenProps} />
      </div>
    </div>
  );
}
