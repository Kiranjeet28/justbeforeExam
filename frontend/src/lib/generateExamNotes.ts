const API_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "")
    : "http://localhost:8000";

export type GenerateExamNotesResult = {
  markdown: string;
  model: string;
  engine_used: string;
};

type BackendResponse = {
  markdown?: string;
  engine?: string;
  status?: string;
  model?: string;
  engine_used?: string;
  error?: string;
};

export type RateLimitError = {
  isRateLimited: true;
  retry_after: number;
  retry_at: string;
  message: string;
  error: string;
};

export class RateLimitedException extends Error {
  constructor(
    public retry_after: number,
    public retry_at: string,
    public message: string
  ) {
    super(`Rate limited. Retry after ${retry_after}s`);
    this.name = "RateLimitedException";
  }
}

export async function generateExamNotes(content: string): Promise<GenerateExamNotesResult> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  const data = (await res.json().catch(() => ({}))) as BackendResponse & {
    detail?: unknown;
    retry_after?: number;
    retry_at?: string;
  };

  // Handle rate limit (429) responses
  if (res.status === 429) {
    const detailObj = typeof data.detail === "object" ? (data.detail as any) : null;
    const retryAfter = detailObj?.retry_after || data.retry_after || 60;
    const retryAt = detailObj?.retry_at || data.retry_at || new Date(Date.now() + retryAfter * 1000).toISOString();
    const message = detailObj?.message || data.detail || "Rate limited. Please try again later.";

    throw new RateLimitedException(retryAfter, retryAt, message as string);
  }

  if (!res.ok) {
    const detail = data.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d?.msg ?? "").filter(Boolean).join("; ") ||
          `Request failed (${res.status})`
          : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!data.markdown) {
    throw new Error("No markdown in response");
  }
  return {
    markdown: data.markdown,
    model: data.model ?? data.engine ?? "unknown",
    engine_used: data.engine_used ?? data.engine ?? "unknown",
  };
}
