import type { AnalysisResult } from "../types";

const env = import.meta.env as Record<string, string | undefined>;

export const API_BASE_URL = (env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export async function analyzeShootingVideo(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/analyze/shooting`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Analysis request failed. Please make sure the CoachAI backend is running.");
  }

  if (!response.ok) {
    throw new Error(`Analysis request failed with status ${response.status}.`);
  }

  try {
    return (await response.json()) as AnalysisResult;
  } catch {
    throw new Error("Analysis request returned an invalid response.");
  }
}
