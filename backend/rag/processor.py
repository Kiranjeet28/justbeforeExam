"""Study material generation: rules + format files + Gemini."""

from __future__ import annotations

import logging
from pathlib import Path

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from rag.config import ModelConfig

logger = logging.getLogger(__name__)

_RAG_DIR = Path(__file__).resolve().parent

# Rough heuristic: ~4 characters per token for Latin text; 1M token ceiling.
_MAX_INPUT_CHARS_FOR_1M_TOKENS = 1_000_000 * 4


def _is_429_or_resource_exhausted(exc: BaseException) -> bool:
    if isinstance(exc, google_exceptions.ResourceExhausted):
        return True
    msg = str(exc).lower()
    return "429" in msg or "resource exhausted" in msg or "resourceexhausted" in msg


@retry(
    stop=stop_after_attempt(6),
    wait=wait_exponential(multiplier=1, min=6, max=90),
    retry=retry_if_exception(_is_429_or_resource_exhausted),
    reraise=True,
)
def _generate_content_with_429_retry(model: genai.GenerativeModel, prompt: str) -> str:
    """Separate function so Tenacity retry works reliably (not on bound methods)."""
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=ModelConfig.TEMPERATURE,
            max_output_tokens=ModelConfig.MAX_OUTPUT_TOKENS,
        ),
    )
    if not response.candidates:
        block = getattr(response, "prompt_feedback", None)
        raise RuntimeError(f"Gemini returned no candidates. Feedback: {block}")
    text = response.text
    if not text:
        raise RuntimeError("Gemini returned empty text.")
    return text


class StudyMaterialEngine:
    """
    Loads local rules/format instructions and generates exam notes via Gemini.
    """

    def __init__(self) -> None:
        api_key = ModelConfig.get_api_key()
        genai.configure(api_key=api_key)
        self._rules_text = (_RAG_DIR / "rules.txt").read_text(encoding="utf-8")
        self._format_text = (_RAG_DIR / "format.txt").read_text(encoding="utf-8")
        self._model = genai.GenerativeModel(
            model_name=ModelConfig.MODEL_NAME,
            system_instruction=self._rules_text,
        )

    def _truncate_if_needed(self, user_content: str) -> str:
        if len(user_content) <= _MAX_INPUT_CHARS_FOR_1M_TOKENS:
            return user_content
        logger.warning(
            "Input length %s chars exceeds ~1M token budget; truncating to %s chars.",
            len(user_content),
            _MAX_INPUT_CHARS_FOR_1M_TOKENS,
        )
        return user_content[:_MAX_INPUT_CHARS_FOR_1M_TOKENS]

    def _build_user_prompt(self, user_content: str) -> str:
        return (
            f"CONTEXT FROM SOURCES: {user_content}\n\n"
            f"REQUIRED FORMAT:\n{self._format_text}\n\n"
            "TASK: Based on the sources and following the formatting rules, create exam notes."
        )

    def generate_exam_notes(self, user_content: str) -> str:
        """
        Generate markdown exam notes from raw source text (or concatenated links)
        using rules.txt as system instruction and format.txt in the user prompt.
        """
        content = self._truncate_if_needed(user_content.strip())
        if not content:
            raise ValueError("user_content is empty after trimming.")
        prompt = self._build_user_prompt(content)
        try:
            return _generate_content_with_429_retry(self._model, prompt)
        except google_exceptions.ResourceExhausted as e:
            logger.error("Gemini rate limit persisted after retries: %s", e)
            raise
        except Exception as e:
            if _is_429_or_resource_exhausted(e):
                logger.error("Gemini 429 / exhausted after retries: %s", e)
            raise
