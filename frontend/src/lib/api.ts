const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

async function postJSON<TResponse, TPayload>(
  path: string,
  payload: TPayload
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<TResponse>;
}

export function generateReport(payload: GenerateReportPayload) {
  return postJSON("/api/generate-report", payload);
}

export async function generateCheatSheet(payload: GenerateCheatSheetPayload) {
  const response = await fetch(`${API_BASE_URL}/api/generate-cheat-sheet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const status = response.status;

    // Handle rate limiting (429 Too Many Requests)
    if (status === 429) {
      throw new RateLimitError(errorText || "API Limit reached. Please wait 60 seconds before retrying.");
    }

    throw new Error(`Request failed (${status}): ${errorText}`);
  }

  return response.json() as Promise<{
    success: boolean;
    notes: string;
    sources_count: number;
    provider: string;
    topic: string;
  }>;
}

export async function generateNotes() {
  const response = await fetch(`${API_BASE_URL}/api/generate-notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const status = response.status;

    // Handle rate limiting (429 Too Many Requests)
    if (status === 429) {
      throw new RateLimitError(errorText || "API Limit reached. Please wait 60 seconds before retrying.");
    }

    throw new Error(`Request failed (${status}): ${errorText}`);
  }

  return response.json() as Promise<{
    success: boolean;
    notes: string;
    sources_count: number;
    provider: string;
    citations: Array<{
      id: number;
      type: string;
      preview: string;
    }>;
  }>;
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function fetchSources() {
  const response = await fetch(`${API_BASE_URL}/api/sources`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<Source[]>;
}

export function createSource(payload: SourceCreatePayload) {
  return postJSON<Source, SourceCreatePayload>("/api/sources", payload);
}

export async function deleteSource(sourceId: number) {
  const response = await fetch(`${API_BASE_URL}/api/sources/${sourceId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}): ${errorText}`);
  }
}
