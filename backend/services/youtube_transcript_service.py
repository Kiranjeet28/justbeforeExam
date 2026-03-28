"""Fetch YouTube captions via youtube-transcript-api and title/channel via oEmbed."""

from __future__ import annotations

import logging
from typing import Any

import requests
from youtube_transcript_api import FetchedTranscript, YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    AgeRestricted,
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApiException,
)

from utils import extract_youtube_video_id

logger = logging.getLogger(__name__)

OEMBED_URL = "https://www.youtube.com/oembed"


def transcript_api_user_message(exc: YouTubeTranscriptApiException) -> str:
    """Short, UI-friendly text (avoid multi-paragraph library messages)."""
    if isinstance(exc, TranscriptsDisabled):
        return (
            "This video has no captions on YouTube (subtitles are off or not provided). "
            "Pick another video with CC/subtitles, or upload one that includes captions."
        )
    if isinstance(exc, NoTranscriptFound):
        return (
            "No caption track matched the languages we tried. "
            "Try a video that lists subtitles in the player menu."
        )
    if isinstance(exc, VideoUnavailable):
        return "That video is unavailable, private, or removed."
    if isinstance(exc, AgeRestricted):
        return "This video is age-restricted; captions cannot be fetched without signing in to YouTube."
    if isinstance(exc, (IpBlocked, RequestBlocked)):
        return "YouTube limited this request. Wait a minute and try again."
    return "Could not load captions. Try a different video or try again later."

# Prefer English, then common Indian languages and other frequent tracks on YouTube.
_CAPTION_LANGUAGE_PRIORITY = (
    "en",
    "en-US",
    "en-GB",
    "en-IN",
    "hi",
    "hi-IN",
    "es",
    "es-419",
    "fr",
    "de",
    "pt",
    "pt-BR",
    "ja",
    "ko",
    "zh",
    "zh-Hans",
    "zh-Hant",
    "it",
    "ru",
    "ar",
    "tr",
    "vi",
    "th",
    "id",
    "ms",
    "ta",
    "te",
    "bn",
    "mr",
    "gu",
    "kn",
    "ml",
    "pa",
    "ur",
)


def _fetch_oembed_metadata(video_id: str) -> dict[str, str]:
    watch_url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        response = requests.get(
            OEMBED_URL,
            params={"url": watch_url, "format": "json"},
            timeout=12,
        )
        response.raise_for_status()
        data = response.json()
        return {
            "title": (data.get("title") or "").strip(),
            "channel_name": (data.get("author_name") or "").strip(),
        }
    except Exception as exc:
        logger.warning("oEmbed failed for %s: %s", video_id, exc)
        return {
            "title": f"YouTube video ({video_id[:8]}…)",
            "channel_name": "Unknown channel",
        }


def _fetch_transcript_with_fallbacks(api: YouTubeTranscriptApi, video_id: str) -> FetchedTranscript:
    """
    Try many language codes, then any available track (with EN translation when possible).
    """
    try:
        return api.fetch(video_id, languages=_CAPTION_LANGUAGE_PRIORITY)
    except NoTranscriptFound:
        logger.info("No match in preferred languages for %s; trying any available track", video_id)

    transcript_list = api.list(video_id)
    last_exc: Exception | None = None

    for transcript in transcript_list:
        try:
            if transcript.language_code.startswith("en"):
                return transcript.fetch()
            if transcript.is_translatable:
                try:
                    return transcript.translate("en").fetch()
                except Exception as trans_exc:
                    logger.debug("Translate to en failed: %s", trans_exc)
                    last_exc = trans_exc
            return transcript.fetch()
        except Exception as exc:
            logger.debug("Transcript fetch failed for one track: %s", exc)
            last_exc = exc
            continue

    if last_exc is not None:
        raise last_exc
    raise NoTranscriptFound(video_id, _CAPTION_LANGUAGE_PRIORITY, transcript_list)


def fetch_youtube_transcript_bundle(video_url: str) -> dict[str, Any]:
    """
    Return transcript text, timed segments, and basic metadata for a YouTube watch URL.
    Raises ValueError if the URL is not YouTube or has no extractable video id.
    Raises YouTubeTranscriptApiException if captions cannot be fetched.
    """
    video_id = extract_youtube_video_id(video_url)
    if not video_id:
        raise ValueError("Invalid or unsupported YouTube URL")

    meta = _fetch_oembed_metadata(video_id)

    api = YouTubeTranscriptApi()
    fetched = _fetch_transcript_with_fallbacks(api, video_id)

    segments: list[dict[str, Any]] = [
        {
            "text": snippet.text,
            "start": snippet.start,
            "duration": snippet.duration,
        }
        for snippet in fetched.snippets
    ]
    full_text = " ".join(s["text"] for s in segments).strip()

    return {
        "video_id": video_id,
        "video_title": meta["title"] or f"Video {video_id}",
        "channel_name": meta["channel_name"] or "Unknown channel",
        "language_code": fetched.language_code,
        "language": fetched.language,
        "is_generated": fetched.is_generated,
        "transcript": full_text,
        "segments": segments,
    }
