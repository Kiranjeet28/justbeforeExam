"""
Modular AI Service with Provider Pattern
Supports Gemini (default) and OpenAI-compatible providers (e.g., Groq)
"""

import os
from abc import ABC, abstractmethod
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


class AIProvider(ABC):
    """Base class for AI providers"""

    @abstractmethod
    def generate_study_report(self, sources_text: str) -> str:
        """
        Generate a study report from concatenated source content.
        Must return clean Markdown with:
        - 'Just Before Exam' summary
        - 'Key Terms' list
        - '3-5 Potential Exam Questions'
        """
        pass


class GeminiProvider(AIProvider):
    """Google Gemini API provider (Free Tier)"""

    def __init__(self):
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError(
                "google-generativeai is not installed. "
                "Install it with: pip install google-generativeai"
            )

        self.genai = genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        self.genai.configure(api_key=api_key)
        self.model = self.genai.GenerativeModel("gemini-pro")

    def generate_study_report(self, sources_text: str) -> str:
        """Generate study report using Gemini API"""
        master_prompt = self._get_master_prompt(sources_text)

        try:
            response = self.model.generate_content(master_prompt)
            return response.text
        except Exception as e:
            raise RuntimeError(f"Error generating report with Gemini: {str(e)}")

    @staticmethod
    def _get_master_prompt(sources_text: str) -> str:
        """Master prompt template for study report generation"""
        return f"""You are an expert exam preparation tutor. Analyze the following study materials and generate a comprehensive study report in Markdown format.

STUDY MATERIALS:
---
{sources_text}
---

Generate a detailed study report with the following structure:

## 📚 Just Before Exam Summary
Provide a concise, high-impact summary (150-250 words) of the most critical concepts. Focus on what a student should know right before taking an exam. Make it actionable and memorable.

## 🔑 Key Terms
Create a bulleted list of 10-15 essential terms or concepts with brief 1-sentence explanations. Format: **Term**: explanation.

## ❓ Potential Exam Questions
Generate 4-5 likely exam questions based on the study materials. Include a mix of:
- Multiple choice (with 4 options)
- Short answer questions
- Essay/discussion questions

Format each question clearly with the question type indicated.

---

IMPORTANT:
- Return ONLY valid Markdown
- Use clear headers and formatting
- Be specific and draw from the provided materials
- Make content educational and exam-focused
- Avoid markdown code blocks unless showing examples
"""


class OpenAIProvider(AIProvider):
    """OpenAI-compatible API provider (supports OpenAI, Groq, etc.)"""

    def __init__(self):
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "openai is not installed. Install it with: pip install openai"
            )

        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

        # Optional: Support custom API base (e.g., for Groq)
        if base_url := os.getenv("OPENAI_BASE_URL"):
            self.client.base_url = base_url

    def generate_study_report(self, sources_text: str) -> str:
        """Generate study report using OpenAI-compatible API"""
        master_prompt = self._get_master_prompt(sources_text)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": master_prompt}],
                temperature=0.7,
                max_tokens=2000,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(
                f"Error generating report with OpenAI-compatible API: {str(e)}"
            )

    @staticmethod
    def _get_master_prompt(sources_text: str) -> str:
        """Master prompt template for study report generation"""
        return f"""You are an expert exam preparation tutor. Analyze the following study materials and generate a comprehensive study report in Markdown format.

STUDY MATERIALS:
---
{sources_text}
---

Generate a detailed study report with the following structure:

## 📚 Just Before Exam Summary
Provide a concise, high-impact summary (150-250 words) of the most critical concepts. Focus on what a student should know right before taking an exam. Make it actionable and memorable.

## 🔑 Key Terms
Create a bulleted list of 10-15 essential terms or concepts with brief 1-sentence explanations. Format: **Term**: explanation.

## ❓ Potential Exam Questions
Generate 4-5 likely exam questions based on the study materials. Include a mix of:
- Multiple choice (with 4 options)
- Short answer questions
- Essay/discussion questions

Format each question clearly with the question type indicated.

---

IMPORTANT:
- Return ONLY valid Markdown
- Use clear headers and formatting
- Be specific and draw from the provided materials
- Make content educational and exam-focused
- Avoid markdown code blocks unless showing examples
"""


class AIService:
    """
    Modular AI Service that routes to configured provider
    Switch providers via AI_PROVIDER environment variable
    """

    def __init__(self):
        provider_name = os.getenv("AI_PROVIDER", "gemini").lower()

        if provider_name == "gemini":
            self.provider = GeminiProvider()
        elif provider_name == "openai":
            self.provider = OpenAIProvider()
        else:
            raise ValueError(
                f"Unknown AI_PROVIDER: {provider_name}. "
                "Supported providers: 'gemini', 'openai'"
            )

        self.provider_name = provider_name

    def generate_study_report(self, sources_text: str) -> str:
        """
        Generate a study report from concatenated source content.

        Args:
            sources_text: Concatenated text from all sources

        Returns:
            Markdown-formatted study report

        Raises:
            RuntimeError: If API call fails
        """
        if not sources_text or not sources_text.strip():
            raise ValueError("sources_text cannot be empty")

        return self.provider.generate_study_report(sources_text)
