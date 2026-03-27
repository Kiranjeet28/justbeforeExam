const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type GenerateReportPayload = {
  source_ids: string[];
  prompt: string;
};

export type GenerateCheatSheetPayload = {
  topic: string;
  notes: string;
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

export function generateCheatSheet(payload: GenerateCheatSheetPayload) {
  return postJSON("/api/generate-cheat-sheet", payload);
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
