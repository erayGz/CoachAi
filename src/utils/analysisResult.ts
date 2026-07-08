import type { ShootingAnalysisResult } from "../types";

const likelyShotValues = new Set(["Likely", "1/1"]);
const unclearShotValues = new Set(["Unclear"]);
const unverifiedShotValues = new Set(["Not verified", "0/1"]);

export function getDetectedShotCounts(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  if (typeof result.detectedShots === "string") {
    if (likelyShotValues.has(result.detectedShots)) {
      return { detected: 1, total: 1 };
    }

    if (unclearShotValues.has(result.detectedShots) || unverifiedShotValues.has(result.detectedShots)) {
      return { detected: 0, total: 1 };
    }

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
  return formatShotAction(result);
}

export function formatShotAction(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  if (typeof result.detectedShots === "string") {
    if (result.detectedShots === "1/1") {
      return "Likely";
    }

    if (result.detectedShots === "0/1") {
      return "Not verified";
    }

    return result.detectedShots;
  }

  return result.detectedShots > 0 ? "Likely" : "Not verified";
}

export function detectedAllShots(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  const { detected, total } = getDetectedShotCounts(result);
  return detected === total;
}

export function shotActionLooksLikely(result: Pick<ShootingAnalysisResult, "detectedShots" | "totalShots">) {
  return formatShotAction(result) === "Likely";
}
