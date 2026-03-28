import type { ParsedLink } from "@/lib/parseLinkContent";

/** Flatten session sources into one string for POST /api/v1/generate */
export function buildRagContextFromLinks(links: ParsedLink[]): string {
  return links
    .map((link, i) => {
      const n = i + 1;
      if (link.sourceType === "video") {
        const parts = [
          `### Source ${n} [Video]`,
          `URL: ${link.url}`,
          `Title: ${link.videoTitle ?? ""}`,
          link.channelName && link.channelName !== "—" ? `Channel: ${link.channelName}` : "",
          link.transcript?.trim() ? `Transcript:\n${link.transcript.trim()}` : "",
          link.transcriptError ? `Caption note: ${link.transcriptError}` : "",
        ].filter(Boolean);
        return parts.join("\n\n");
      }
      const body = (link.cleanedParagraphs ?? []).filter(Boolean).join("\n\n");
      return [
        `### Source ${n} [Article]`,
        `URL: ${link.url}`,
        `Title: ${link.title ?? ""}`,
        body.trim() ? body : "(No extracted body text.)",
      ].join("\n\n");
    })
    .join("\n\n---\n\n");
}
