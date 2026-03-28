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
