"""Multi-model study material generation: Groq primary, Gemini fallback."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
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
            temperature=ModelConfig.TEMPERATURE_GEMINI,
            max_output_tokens=ModelConfig.MAX_TOKENS_GEMINI,
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
            model_name=ModelConfig.FALLBACK_MODEL,
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


class MultiModelNotesGenerator:
    """
    Advanced notes generator with Groq as primary and Gemini as fallback.
    Handles rate limits (429) and length truncation with continuation.
    """

    def __init__(self) -> None:
        """Initialize both Groq and Gemini models."""
        self._rules_text = (_RAG_DIR / "rules.txt").read_text(encoding="utf-8")
        self._format_text = (_RAG_DIR / "format.txt").read_text(encoding="utf-8")

        # Initialize Groq
        groq_api_key = ModelConfig.get_groq_api_key()
        self._groq_model = ChatGroq(
            model=ModelConfig.PRIMARY_MODEL,
            temperature=ModelConfig.TEMPERATURE_GROQ,
            max_tokens=ModelConfig.MAX_TOKENS_GROQ,
            api_key=groq_api_key,
            streaming=False,
        )

        # Initialize Gemini
        gemini_api_key = ModelConfig.get_gemini_api_key()
        genai.configure(api_key=gemini_api_key)
        self._gemini_model = genai.GenerativeModel(
            model_name=ModelConfig.FALLBACK_MODEL,
            system_instruction=self._rules_text,
        )

    def _truncate_if_needed(self, user_content: str) -> str:
        """Truncate content if it exceeds token budget."""
        if len(user_content) <= _MAX_INPUT_CHARS_FOR_1M_TOKENS:
            return user_content
        logger.warning(
            "Input length %s chars exceeds ~1M token budget; truncating to %s chars.",
            len(user_content),
            _MAX_INPUT_CHARS_FOR_1M_TOKENS,
        )
        return user_content[:_MAX_INPUT_CHARS_FOR_1M_TOKENS]

    def _build_system_prompt(self) -> str:
        """Combine rules and format as system prompt."""
        return f"{self._rules_text}\n\nFORMAT REQUIREMENTS:\n{self._format_text}"

    def _build_user_prompt(self, user_content: str) -> str:
        """Build user prompt with context."""
        return (
            f"CONTEXT FROM SOURCES:\n{user_content}\n\n"
            "TASK: Based on the context above, create comprehensive exam notes "
            "following the required format and rules."
        )

    def _call_groq(self, prompt: str) -> tuple[str, Optional[str]]:
        """
        Call Groq model.
        
        Returns:
            (content, finish_reason)
        """
        try:
            response = self._groq_model.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)

            # Check finish reason for truncation
            finish_reason = None
            if hasattr(response, "response_metadata"):
                metadata = response.response_metadata
                finish_reason = metadata.get("finish_reason")

            return content, finish_reason
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str:
                raise RateLimitError(f"Groq rate limit (429): {str(e)}") from e
            raise

    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini model for fallback or continuation."""
        try:
            response = self._gemini_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=ModelConfig.TEMPERATURE_GEMINI,
                    max_output_tokens=ModelConfig.MAX_TOKENS_GEMINI,
                ),
            )
            if not response.candidates:
                raise RuntimeError("Gemini returned no candidates")
            return response.text
        except Exception as e:
            logger.error(f"Gemini failed: {str(e)}")
            raise

    def _get_last_10_words(self, text: str) -> str:
        """Extract last 10 words from text."""
        words = text.strip().split()
        return " ".join(words[-10:]) if words else ""

    def generate_full_notes(self, user_input: str) -> dict[str, str]:
        """
        Generate complete exam notes with multi-model fallback.

        STEP 1: Call Groq with combined system prompt
        STEP 2: Handle Groq response:
            - If 429 (rate limit): Switch to Gemini
            - If finish_reason='length' (truncated): Send partial + input to Gemini with continuation
            - Else: Return Groq output
        STEP 3: Merge results and return with engine_used metadata

        Args:
            user_input: Raw text content from sources

        Returns:
            {
                "notes": generated notes,
                "engine_used": "Groq" | "Groq + Gemini",
                "status": "success",
            }
        """
        content = self._truncate_if_needed(user_input.strip())
        if not content:
            raise ValueError("user_input is empty after trimming.")

        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(content)
        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        engine_used = "Groq"

        # STEP 1 & 2: Try Groq
        try:
            groq_output, finish_reason = self._call_groq(full_prompt)

            # Check if output was truncated
            if finish_reason == "length":
                logger.warning("Groq output truncated (finish_reason='length'). Continuing with Gemini.")
                engine_used = "Groq + Gemini"

                # Build continuation prompt
                last_words = self._get_last_10_words(groq_output)
                continuation_prompt = (
                    f"The notes below were cut off. Using the provided links/context, "
                    f"CONTINUE the notes from the exact point where they stopped. "
                    f"Do not repeat the Title or Overview. "
                    f"START WITH: {last_words}\n\n"
                    f"Partial notes that need continuation:\n{groq_output}\n\n"
                    f"Original context:\n{content}"
                )

                # Call Gemini for continuation
                gemini_output = self._call_gemini(continuation_prompt)
                final_notes = groq_output + "\n\n" + gemini_output

            else:
                final_notes = groq_output

            return {
                "notes": final_notes,
                "engine_used": engine_used,
                "status": "success",
            }

        except RateLimitError as e:
            logger.warning(f"Groq rate limited (429). Switching to Gemini: {str(e)}")
            engine_used = "Gemini"

            # STEP 2b: Groq rate limited, use Gemini with full input
            gemini_output = self._call_gemini(full_prompt)

            return {
                "notes": gemini_output,
                "engine_used": engine_used,
                "status": "success",
            }


class RateLimitError(Exception):
    """Custom exception for rate limit errors."""
    pass
