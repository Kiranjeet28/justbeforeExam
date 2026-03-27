from urllib.parse import parse_qs, urlparse


def extract_youtube_video_id(url: str) -> str | None:
    try:
        parsed = urlparse(url.strip())
        host = parsed.netloc.lower().replace("www.", "")

        if host in {"youtube.com", "m.youtube.com"}:
            query_video_id = parse_qs(parsed.query).get("v", [None])[0]
            if query_video_id:
                return query_video_id

            if parsed.path.startswith("/shorts/"):
                return parsed.path.split("/shorts/")[1].split("/")[0] or None

            if parsed.path.startswith("/embed/"):
                return parsed.path.split("/embed/")[1].split("/")[0] or None

        if host == "youtu.be":
            path_parts = [part for part in parsed.path.split("/") if part]
            if path_parts:
                return path_parts[0]

    except Exception:
        return None

    return None


def is_youtube_url(url: str) -> bool:
    return extract_youtube_video_id(url) is not None
