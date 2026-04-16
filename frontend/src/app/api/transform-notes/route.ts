import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.content !== "string" || body.content.trim().length === 0) {
      return NextResponse.json(
        { detail: "Missing or invalid 'content' field" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/transform-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: body.content }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      let data: unknown = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { detail: await response.text() };
      }

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }

      return NextResponse.json(data, { status: 200 });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { detail: `Failed to transform notes. Backend error: ${message}`, error: message },
      { status: 502 }
    );
  }
}
