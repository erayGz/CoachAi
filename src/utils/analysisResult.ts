import type { ShootingAnalysisResult } from "../types";

export function getDetectedShotCounts(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  if (typeof result.detectedShots === "string") {
    const [detected, total] = result.detectedShots.split("/").map((value) => Number.parseInt(value, 10));

    return {
      detected: Number.isFinite(detected) ? detected : 0,
      total: Number.isFinite(total) ? total : result.totalShots ?? 1,
    };
  }

  return {
    detected: result.detectedShots,
    total: result.totalShots ?? 1,
  };
}

export function formatDetectedShots(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  if (typeof result.detectedShots === "string") {
    return result.detectedShots;
  }

  return `${result.detectedShots}/${result.totalShots ?? 1}`;
}

export function detectedAllShots(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  const { detected, total } = getDetectedShotCounts(result);
  return detected === total;
}
