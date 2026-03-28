/**
 * Direct Content link parsing. YouTube transcripts use the FastAPI backend.
 * Articles: browser fetch when CORS allows, otherwise Next.js `/api/article-extract` (server-side fetch).
 */

import { extractArticleFromHtml } from "@/lib/htmlExtract";

export type ParsedSourceType = "video" | "article";

export type TranscriptSegment = {
  text: string;
  start: number;
  duration: number;
};

export type ParsedLink = {
  id: string;
  url: string;
  sourceType: ParsedSourceType;
  /** Article */
  title?: string;
  cleanedParagraphs?: string[];
  /** Video (YouTube) */
  videoTitle?: string;
  channelName?: string;
  /** Full caption text when backend succeeds */
  transcript?: string;
  transcriptLanguage?: string;
  transcriptIsGenerated?: boolean;
  transcriptSegments?: TranscriptSegment[];
  /** Single-line message when transcript API fails (shown in red in the UI). */
  transcriptError?: string;
};

const YOUTUBE_HOST = /(?:youtube\.com|youtu\.be)/i;

function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

const API_BASE = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000" : "";

/** Public oEmbed — works from the browser when captions API fails. */
async function fetchYouTubeOEmbedMetadata(videoUrl: string): Promise<{
  videoTitle: string;
  channelName: string;
} | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string };
    return {
      videoTitle: (data.title ?? "").trim() || "YouTube video",
      channelName: (data.author_name ?? "").trim() || "—",
    };
  } catch {
    return null;
  }
}

async function fetchYouTubeTranscriptFromApi(url: string): Promise<{
  video_title: string;
  channel_name: string;
  transcript: string;
  language_code: string;
  is_generated: boolean;
  segments: TranscriptSegment[];
}> {
  const base = API_BASE.replace(/\/$/, "");
  const response = await fetch(`${base}/api/youtube/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    detail?: unknown;
    video_title?: string;
    channel_name?: string;
    transcript?: string;
    language_code?: string;
    is_generated?: boolean;
    segments?: TranscriptSegment[];
  };
  if (!response.ok) {
    const detail = data.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d?.msg ?? "").filter(Boolean).join("; ") ||
            `Transcript request failed (${response.status})`
          : `Transcript request failed (${response.status})`;
    throw new Error(msg);
  }
  return data as {
    video_title: string;
    channel_name: string;
    transcript: string;
    language_code: string;
    is_generated: boolean;
    segments: TranscriptSegment[];
  };
}

/** One short line for the UI; red is reserved for this in the video preview. */
function normalizeTranscriptError(raw: string, isNetwork: boolean): string {
  if (isNetwork) {
    return "Cannot reach the transcript API. Start the backend or set NEXT_PUBLIC_API_BASE_URL.";
  }
  const t = raw.trim();
  if (
    /no captions on youtube|subtitles are off|not provided|no caption track matched|subtitles are disabled/i.test(
      t
    )
  ) {
    return "No captions on YouTube for this video—use one with CC/subtitles enabled.";
  }
  if (t.length <= 140) {
    return t;
  }
  return `${t.slice(0, 137)}…`;
}

async function extractArticleFromUrlPage(url: string): Promise<{ title: string; cleanedParagraphs: string[] }> {
  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    });
    if (response.ok) {
      const html = await response.text();
      const out = extractArticleFromHtml(html);
      if (out.cleanedParagraphs.length > 0) {
        return out;
      }
    }
  } catch {
    /* CORS or blocked — try server route */
  }

  const res = await fetch("/api/article-extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload = (await res.json()) as {
    title?: string;
    cleanedParagraphs?: string[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : `Article extract failed (${res.status})`
    );
  }
  const paragraphs = payload.cleanedParagraphs ?? [];
  if (paragraphs.length === 0) {
    throw new Error("No readable paragraphs found in the page HTML");
  }
  return {
    title: payload.title?.trim() || "Article",
    cleanedParagraphs: paragraphs,
  };
}

export async function parseLinkContent(url: string): Promise<ParsedLink> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const normalized = url.trim();

  if (YOUTUBE_HOST.test(normalized)) {
    try {
      const data = await fetchYouTubeTranscriptFromApi(normalized);
      const result: ParsedLink = {
        id,
        url: normalized,
        sourceType: "video",
        videoTitle: data.video_title,
        channelName: data.channel_name,
        transcript: data.transcript,
        transcriptLanguage: data.language_code,
        transcriptIsGenerated: data.is_generated,
        transcriptSegments: data.segments,
      };
      console.log("[parseLinkContent] YouTube (transcript from API):", {
        ...result,
        transcript: result.transcript?.slice(0, 200) + (result.transcript && result.transcript.length > 200 ? "…" : ""),
        transcriptSegments: `[${result.transcriptSegments?.length ?? 0} segments]`,
      });
      return result;
    } catch (err) {
      const videoId = extractYouTubeVideoId(normalized);
      const message = err instanceof Error ? err.message : "Unknown error";
      const isNetwork =
        err instanceof TypeError ||
        (err instanceof Error &&
          /fetch|network|Failed to fetch|Load failed|ECONNREFUSED/i.test(message));
      const oembed = await fetchYouTubeOEmbedMetadata(normalized);
      const fallbackTitle = videoId
        ? `YouTube video (${videoId.slice(0, 8)}…)`
        : "YouTube video";
      const result: ParsedLink = {
        id,
        url: normalized,
        sourceType: "video",
        videoTitle: oembed?.videoTitle ?? fallbackTitle,
        channelName: oembed?.channelName ?? "—",
        transcriptError: normalizeTranscriptError(message, isNetwork),
      };
      console.warn("[parseLinkContent] YouTube transcript API failed:", err);
      return result;
    }
  }

  let title = "Article";
  let cleanedParagraphs: string[] = [];

  try {
    const extracted = await extractArticleFromUrlPage(normalized);
    title = extracted.title;
    cleanedParagraphs = extracted.cleanedParagraphs;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    try {
      title = new URL(normalized).hostname.replace(/^www\./, "");
    } catch {
      title = "Website";
    }
    cleanedParagraphs = [
      `Could not extract readable text from this page (${msg}). Some sites block automated fetching or need JavaScript to render content.`,
    ];
  }

  const result: ParsedLink = {
    id,
    url: normalized,
    sourceType: "article",
    title,
    cleanedParagraphs,
  };
  console.log("[parseLinkContent] Website:", result);
  return result;
}

export function sortParsedLinksByType(links: ParsedLink[]): ParsedLink[] {
  return [...links].sort((a, b) => {
    if (a.sourceType === b.sourceType) return 0;
    if (a.sourceType === "video") return -1;
    return 1;
  });
}
