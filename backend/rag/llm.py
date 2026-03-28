"""Smart LLM Switcher: Groq with Gemini Fallback for Rate Limits & Length Issues."""

import os
from typing import Optional

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()


class SmartLLMSwitcher:
    """Manages Groq -> Gemini fallback logic with rate limit and length handling."""

    def __init__(self):
        """Initialize both LLM models."""
        self.groq_model = self._init_groq()
        self.gemini_model = self._init_gemini()
        self.last_error = None
        self.switch_reason = None

    def _init_groq(self) -> ChatGroq:
        """Initialize Groq LLM."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in environment")

        return ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=4096,
            api_key=api_key,
            streaming=False,
        )

    def _init_gemini(self) -> ChatGoogleGenerativeAI:
        """Initialize Google Gemini LLM."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")

        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0.7,
            max_output_tokens=4096,
            api_key=api_key,
        )

    def get_completion(
        self, prompt: str, use_groq_first: bool = True, retry_with_continuation: bool = True
    ) -> dict:
        """
        Get completion with intelligent fallback logic.

        Args:
            prompt: The prompt to send to LLM
            use_groq_first: Try Groq first before Gemini
            retry_with_continuation: If Groq fails due to 'length', send partial result to Gemini

        Returns:
            {
                "content": completion text,
                "model": "groq" or "gemini",
                "status": "success" or "fallback",
                "reason": fallback reason if applicable,
                "partial_content": partial Groq output if length limited
            }
        """
        self.last_error = None
        self.switch_reason = None
        partial_content = None

        # Try Groq first
        if use_groq_first:
            result = self._try_groq(prompt)
            if result["status"] == "success":
                return result

            if result["error_code"] == "rate_limit":
                self.switch_reason = "Groq rate limit (429) - Switching to Gemini"
                partial_content = result.get("partial_content")
            elif result["error_code"] == "length":
                self.switch_reason = "Groq output length exceeded - Switching to Gemini for continuation"
                partial_content = result.get("partial_content")
            else:
                self.switch_reason = f"Groq error: {result.get('error_message')}"

        # Fallback to Gemini
        if partial_content and retry_with_continuation:
            continuation_prompt = (
                f"Continue this text exactly where it stopped. "
                f"Do not repeat what came before:\n\n{partial_content}"
            )
            result = self._try_gemini(continuation_prompt)
            if result["status"] == "success":
                return {
                    "content": partial_content + "\n\n[Continued by Gemini]\n\n" + result["content"],
                    "model": "gemini-with-groq-continuation",
                    "status": "fallback",
                    "reason": self.switch_reason,
                }
        else:
            result = self._try_gemini(prompt)
            if result["status"] == "success":
                return {
                    "content": result["content"],
                    "model": "gemini",
                    "status": "fallback",
                    "reason": self.switch_reason,
                }

        # Both failed
        return {
            "content": None,
            "model": None,
            "status": "error",
            "reason": result.get("error_message", "Both Groq and Gemini failed"),
            "partial_content": partial_content,
        }

    def _try_groq(self, prompt: str) -> dict:
        """
        Try to get completion from Groq.

        Returns:
            {
                "status": "success" or "error",
                "content": completion text or None,
                "error_code": "rate_limit", "length", "other", or None,
                "error_message": error details,
                "partial_content": output before truncation if available
            }
        """
        try:
            response = self.groq_model.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)

            # Check if response was truncated
            if hasattr(response, "response_metadata"):
                metadata = response.response_metadata
                finish_reason = metadata.get("finish_reason", "")

                if finish_reason == "length":
                    return {
                        "status": "error",
                        "content": None,
                        "error_code": "length",
                        "error_message": "Output length exceeded",
                        "partial_content": content,
                    }

            return {
                "status": "success",
                "content": content,
                "error_code": None,
                "error_message": None,
                "partial_content": None,
            }

        except Exception as e:
            error_str = str(e).lower()

            # Detect rate limit error
            if "429" in error_str or "rate limit" in error_str:
                return {
                    "status": "error",
                    "content": None,
                    "error_code": "rate_limit",
                    "error_message": "Rate limit exceeded (429)",
                    "partial_content": None,
                }

            # Generic error
            return {
                "status": "error",
                "content": None,
                "error_code": "other",
                "error_message": str(e),
                "partial_content": None,
            }

    def _try_gemini(self, prompt: str) -> dict:
        """
        Try to get completion from Gemini.

        Returns:
            {
                "status": "success" or "error",
                "content": completion text or None,
                "error_message": error details
            }
        """
        try:
            response = self.gemini_model.invoke(prompt)
            content = response.content if hasattr(response, "content") else str(response)

            return {
                "status": "success",
                "content": content,
                "error_message": None,
            }

        except Exception as e:
            return {
                "status": "error",
                "content": None,
                "error_message": str(e),
            }


# Global instance
_switcher = None


def get_switcher() -> SmartLLMSwitcher:
    """Get or create the global switcher instance."""
    global _switcher
    if _switcher is None:
        _switcher = SmartLLMSwitcher()
    return _switcher


def get_completion(prompt: str) -> dict:
    """Convenience function to get completion using the global switcher."""
    switcher = get_switcher()
    return switcher.get_completion(prompt)
