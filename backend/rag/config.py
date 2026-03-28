"""Gemini model and environment configuration for RAG."""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


class ModelConfig:
    """Defaults for Gemini 2.5 Flash (free tier friendly)."""

    MODEL_NAME = "gemini-2.5-flash"
    TEMPERATURE = 0.7
    MAX_OUTPUT_TOKENS = 2048

    @staticmethod
    def get_api_key() -> str:
        key = (os.getenv("GEMINI_API_KEY") or "").strip()
        if not key:
            raise ValueError("GEMINI_API_KEY is not set. Add it to your .env file.")
        return key
