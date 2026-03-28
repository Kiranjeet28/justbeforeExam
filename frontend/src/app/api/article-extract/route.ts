import { NextResponse } from "next/server";

import { extractArticleFromHtml } from "@/lib/htmlExtract";

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isAllowedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null;
    }
    const h = u.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(h) || h.endsWith(".localhost")) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url =
    typeof body === "object" && body !== null && "url" in body && typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url.trim()
      : "";

  const safe = isAllowedUrl(url);
  if (!safe) {
    return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(safe, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; JustBeforeExam/1.0; +https://github.com) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Page returned ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    if (html.length > 3_000_000) {
      return NextResponse.json({ error: "Page too large" }, { status: 413 });
    }

    const { title, cleanedParagraphs } = extractArticleFromHtml(html);
    return NextResponse.json({ title, cleanedParagraphs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
