"""Multi-model study material generation: Groq primary, HuggingFace fallback, then Gemini."""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

from google import genai
from langchain_groq import ChatGroq
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from rag.config import ModelConfig
from services.ai_service import HuggingFaceRAG

logger = logging.getLogger(__name__)

_RAG_DIR = Path(__file__).resolve().parent

# Rough heuristic: ~4 characters per token for Latin text; 1M token ceiling.
_MAX_INPUT_CHARS_FOR_1M_TOKENS = 1_000_000 * 4


def _is_429_or_rate_limit(exc: BaseException) -> bool:
    """Check if exception is a rate limit error."""
    msg = str(exc).lower()
    return "429" in msg or "rate limit" in msg or "resource exhausted" in msg


def _extract_retry_after(error_msg: str) -> Optional[int]:
    """
    Extract retry-after seconds from error message.
    Looks for patterns like "Please retry in 47.14324496s" or "X seconds"
    """
    # Try to find "Please retry in XXs" pattern
    match = re.search(r'retry in (\d+(?:\.\d+)?)\s*s', error_msg, re.IGNORECASE)
    if match:
        return int(float(match.group(1)))
    
    # Try to find just number followed by 's'
    match = re.search(r'(\d+(?:\.\d+)?)\s*s(?:ec)?', error_msg)
    if match:
        return int(float(match.group(1)))
    
    # Default to 60 seconds if can't parse
    return 60


class RateLimitError(Exception):
    """Custom exception for rate limit errors."""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after or _extract_retry_after(message)


class StudyMaterialEngine:
    """
    Loads local rules/format instructions and generates exam notes via Gemini.
    """

    def __init__(self) -> None:
        api_key = ModelConfig.get_gemini_api_key()
        self._client = genai.Client(api_key=api_key)
        self._rules_text = (_RAG_DIR / "rules.txt").read_text(encoding="utf-8")
        self._format_text = (_RAG_DIR / "format.txt").read_text(encoding="utf-8")

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
            response = self._client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            
            if not response.candidates or not response.candidates[0].content.parts:
                raise RuntimeError("Gemini returned no candidates or empty parts")
            
            text = response.candidates[0].content.parts[0].text
            if not text:
                raise RuntimeError("Gemini returned empty text.")
            return text
        except Exception as e:
            if _is_429_or_rate_limit(e):
                logger.error("Gemini rate limit (429): %s", e)
            logger.error("Gemini error: %s", e)
            raise


class MultiModelNotesGenerator:
    """
    Advanced notes generator with three-tier fallback:
    1. Try Groq (primary)
    2. If rate limited, try HuggingFace
    3. If both fail, return error with countdown timer for rate limits
    """

    def __init__(self) -> None:
        """Initialize Groq, HuggingFace, and Gemini models."""
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

        # Initialize HuggingFace RAG (will raise if token not set)
        self._huggingface_rag: Optional[HuggingFaceRAG] = None
        try:
            self._huggingface_rag = HuggingFaceRAG()
            logger.info("HuggingFace RAG initialized as fallback")
        except ValueError as e:
            logger.warning(f"HuggingFace RAG not available: {e}")

        # Initialize Gemini (google-genai) for info only
        gemini_api_key = ModelConfig.get_gemini_api_key()
        self._gemini_client = genai.Client(api_key=gemini_api_key)

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

    def _call_huggingface(self, prompt: str) -> str:
        """
        Call HuggingFace model via RAG.
        
        Returns:
            Generated content string
        """
        if not self._huggingface_rag:
            raise ValueError("HuggingFace RAG not available - API token not set")
        
        try:
            response = self._huggingface_rag.generate_with_rag(prompt)
            if not response:
                raise RuntimeError("HuggingFace returned empty response")
            return response
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str:
                raise RateLimitError(f"HuggingFace rate limit (429): {str(e)}", retry_after=_extract_retry_after(str(e))) from e
            logger.error(f"HuggingFace failed: {str(e)}")
            raise

    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini model for fallback or continuation."""
        try:
            response = self._gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            
            if not response.candidates or not response.candidates[0].content.parts:
                raise RuntimeError("Gemini returned no candidates or empty parts")
            
            text = response.candidates[0].content.parts[0].text
            if not text:
                raise RuntimeError("Gemini returned empty text.")
            return text
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str:
                raise RateLimitError(f"Gemini rate limit (429): {str(e)}", retry_after=_extract_retry_after(str(e))) from e
            logger.error(f"Gemini failed: {str(e)}")
            raise

    def generate_full_notes(self, user_input: str) -> dict:
        """
        Generate complete exam notes with three-tier fallback:
        
        TIER 1 (Primary): Groq
        TIER 2 (Fallback): HuggingFace (if Groq rate limited)
        TIER 3 (Error): Return error with countdown timer (if both rate limited)

        Args:
            user_input: Raw text content from sources

        Returns:
            {
                "engine": "Groq" | "HuggingFace" | "Error",
                "content": generated notes,
                "status": "completed" | "rate_limited",
                "retry_after": seconds_to_retry (only if rate_limited),
                "retry_at": ISO format datetime (only if rate_limited),
            }
        """
        content = self._truncate_if_needed(user_input.strip())
        if not content:
            raise ValueError("user_input is empty after trimming.")

        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(content)
        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        engine_used = "Groq"

        # TIER 1: Try Groq
        try:
            logger.info("Attempting to generate notes with Groq...")
            groq_output, finish_reason = self._call_groq(full_prompt)

            # Check if output was truncated
            if finish_reason == "length":
                logger.warning("Groq output truncated (finish_reason='length'). Output is complete.")
                # Groq still returned valid output, even if truncated
                final_notes = groq_output
            else:
                final_notes = groq_output

            return {
                "engine": engine_used,
                "content": final_notes,
                "status": "completed",
            }

        except RateLimitError as groq_error:
            logger.warning(f"Groq rate limited (429). Attempting HuggingFace fallback: {str(groq_error)}")
            
            # TIER 2: Try HuggingFace
            try:
                logger.info("Attempting to generate notes with HuggingFace...")
                huggingface_output = self._call_huggingface(full_prompt)
                engine_used = "HuggingFace"
                
                return {
                    "engine": engine_used,
                    "content": huggingface_output,
                    "status": "completed",
                }
            
            except RateLimitError as hf_error:
                logger.error(f"HuggingFace also rate limited (429): {str(hf_error)}")
                
                # TIER 3: Both failed - return error with countdown
                retry_after = hf_error.retry_after or groq_error.retry_after or 60
                retry_at = (datetime.now() + timedelta(seconds=retry_after)).isoformat()
                
                logger.error(f"All AI providers rate limited. Retry after {retry_after} seconds at {retry_at}")
                
                return {
                    "engine": "Error",
                    "content": f"All AI providers are rate limited. Please try again in {retry_after} seconds.",
                    "status": "rate_limited",
                    "retry_after": retry_after,
                    "retry_at": retry_at,
                    "error": f"Rate limit exceeded on all providers. {str(hf_error)}"
                }
            
            except Exception as hf_error:
                logger.error(f"HuggingFace error: {str(hf_error)}")
                
                # If HuggingFace fails for other reason, check if it was rate limited
                if _is_429_or_rate_limit(hf_error):
                    retry_after = groq_error.retry_after or 60
                    retry_at = (datetime.now() + timedelta(seconds=retry_after)).isoformat()
                    return {
                        "engine": "Error",
                        "content": f"All AI providers are rate limited. Please try again in {retry_after} seconds.",
                        "status": "rate_limited",
                        "retry_after": retry_after,
                        "retry_at": retry_at,
                        "error": f"Rate limit exceeded. {str(hf_error)}"
                    }
                else:
                    # HuggingFace failed but not due to rate limit
                    logger.error(f"HuggingFace error (not rate limited): {str(hf_error)}")
                    raise


        except Exception as e:
            # Groq failed for non-rate-limit reason
            logger.error(f"Groq error (not rate limited): {str(e)}")
            raise