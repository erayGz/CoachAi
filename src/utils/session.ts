export function createAnalysisSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `analysis-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
