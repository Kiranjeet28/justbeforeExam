"""Multi-model configuration: Groq primary, Gemini fallback."""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


class ModelConfig:
    """Multi-model configuration with Groq as primary and Gemini 3 Flash as fallback."""

    # Primary Model: Groq (Llama 3.3 70B)
    PRIMARY_MODEL = "llama-3.3-70b-versatile"
    MAX_TOKENS_GROQ = 4096
    TEMPERATURE_GROQ = 0.7

    # Fallback Model: Google Gemini
    FALLBACK_MODEL = "gemini-2.5-flash"
    MAX_TOKENS_GEMINI = 4096
    TEMPERATURE_GEMINI = 0.7

    @staticmethod
    def get_groq_api_key() -> str:
        key = (os.getenv("GROQ_API_KEY") or "").strip()
        if not key:
            raise ValueError("GROQ_API_KEY is not set. Add it to your .env file.")
        return key

    @staticmethod
    def get_gemini_api_key() -> str:
        key = (os.getenv("GEMINI_API_KEY") or "").strip()
        if not key:
            raise ValueError("GEMINI_API_KEY is not set. Add it to your .env file.")
        return key

    @staticmethod
    def get_api_key() -> str:
        """Legacy method for backward compatibility."""
        return ModelConfig.get_gemini_api_key()

    # Legacy properties for backward compatibility
    MODEL_NAME = PRIMARY_MODEL
    MAX_OUTPUT_TOKENS = MAX_TOKENS_GEMINI
