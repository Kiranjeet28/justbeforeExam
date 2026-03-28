const API_BASE =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "")
    : "http://localhost:8000";

export type GenerateExamNotesResult = {
  markdown: string;
  model: string;
};

export async function generateExamNotes(content: string): Promise<GenerateExamNotesResult> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
    markdown?: string;
    model?: string;
  };
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
  return { markdown: data.markdown, model: data.model ?? "unknown" };
}
