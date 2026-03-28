/**
 * Shared types previously used with the backend API.
 * Network helpers were removed; the app uses local state and client-side parsing only.
 */

export type GenerateReportPayload = {
  source_ids: string[];
  prompt: string;
};

export type GenerateCheatSheetPayload = {
  source_ids: number[];
  topic?: string;
};

export type SourceType = "video" | "link" | "note";

export type Source = {
  id: number;
  type: SourceType;
  content: string;
  timestamp: string;
  video_id?: string | null;
};

export type SourceCreatePayload = {
  type: SourceType;
  content: string;
};

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function summarizeText(
  text: string,
  maxLength: number = 150,
  minLength: number = 50
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

  try {
    const response = await fetch("/api/v1/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        max_length: maxLength,
        min_length: minLength,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || `Summarization failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.summary;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Summarization took too long. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
