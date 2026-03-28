/**
 * Shared HTML → title + paragraph extraction (client or server).
 */

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function stripHtml(html: string): string {
  return decodeBasicEntities(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function titleFromHtml(html: string): string | null {
  const og =
    html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i);
  if (og?.[1]) return decodeBasicEntities(og[1].trim());
  const tw =
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']twitter:title["'][^>]*>/i);
  if (tw?.[1]) return decodeBasicEntities(tw[1].trim());
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeBasicEntities(m[1].trim()) : null;
}

function paragraphChunksFromPlain(stripped: string): string[] {
  const chunks = stripped
    .split(/\n{2,}|\.\s+(?=[A-Z])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40);
  return chunks.slice(0, 24);
}

/**
 * Prefer <article>/<main>, then <p> tags; fallback to full-body strip.
 */
export function extractArticleFromHtml(html: string): { title: string; cleanedParagraphs: string[] } {
  let title = titleFromHtml(html) ?? "";

  const articleMatch =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const scope = articleMatch ? articleMatch[1] : html;

  const pTexts: string[] = [];
  for (const m of scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = stripHtml(m[1] ?? "").trim();
    if (t.length > 35 && !/^cookie|subscribe|newsletter|sign up/i.test(t)) {
      pTexts.push(t);
    }
  }

  let cleanedParagraphs =
    pTexts.length >= 2 ? pTexts.slice(0, 40) : paragraphChunksFromPlain(stripHtml(scope));

  if (cleanedParagraphs.length === 0) {
    const fallback = stripHtml(scope);
    cleanedParagraphs =
      fallback.length > 80 ? [fallback.slice(0, 4000) + (fallback.length > 4000 ? "…" : "")] : [];
  }

  if (!title) {
    title = "Article";
  }

  return { title, cleanedParagraphs };
}
