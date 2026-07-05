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
    throw new Error("Please make sure the backend is running and try again.");
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(detail ?? "Please make sure the backend is running and try again.");
  }

  try {
    return (await response.json()) as AnalysisResult;
  } catch {
    throw new Error("Analysis request returned an invalid response.");
  }
}

async function readErrorDetail(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return typeof body.detail === "string" ? body.detail : null;
  } catch {
    return null;
  }
}
