"""
Artifact Transformation Service
Converts generated study notes into specialized formats.
Delegates to model_dispatch.py for model routing.
"""

import json
import logging
from typing import Optional, Dict, Any
import requests
from dotenv import load_dotenv
import os
import re

load_dotenv()
logger = logging.getLogger(__name__)


def get_huggingface_headers(api_token: str) -> Dict[str, str]:
    """
    Helper function to format HuggingFace API headers with authorization.

    Args:
        api_token: HuggingFace API token

    Returns:
        Dictionary of headers
    """
    if not api_token:
        raise ValueError("HuggingFace API token is required")
    return {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }


def call_huggingface_model(
    model_id: str,
    prompt: str,
    api_token: str,
    max_tokens: int = 2000,
    temperature: float = 0.7,
) -> str:
    """
    Generic HuggingFace Inference API caller.

    Args:
        model_id: HuggingFace model identifier
        prompt: The prompt to send to the model
        api_token: HuggingFace API token
        max_tokens: Maximum tokens in response
        temperature: Sampling temperature

    Returns:
        Generated text from the model
    """
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    headers = get_huggingface_headers(api_token)
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_tokens,
            "temperature": temperature,
            "return_full_text": False,
        },
    }
    response = requests.post(url, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    result = response.json()
    if isinstance(result, list) and result:
        return result[0].get("generated_text", "")
    raise ValueError(f"Unexpected response format: {result}")


class ArtifactTransformationService:
    """Service for transforming notes into Mind Map JSON and Cheat Sheet Markdown."""

    def __init__(self):
        self.api_token = os.getenv("HUGGINGFACE_API_TOKEN", "")
        self.primary_model_id = "Qwen/Qwen2.5-72B-Instruct"
        self.fallback_model_id = "mistralai/Mathstral-7B-v0.1"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _is_formula_too_complex(self, note_content: str) -> bool:
        """
        Heuristic: decide whether to route to the Mathstral fallback model
        based on the density of mathematical content in the notes.

        Args:
            note_content: The original study notes

        Returns:
            True if complex formula handling is recommended
        """
        formula_indicators = [r"\$\$", r"\\frac", r"\\int", r"\\sum", r"\\prod", r"\\lim"]
        count = sum(len(re.findall(p, note_content)) for p in formula_indicators)
        return count >= 3

    def _generate_mock_mind_map(self, note_content: str) -> dict:
        """
        Generate a fallback mind map structure when all API calls are unavailable.
        Creates a simple hierarchy based on note structure.

        Args:
            note_content: The original study notes

        Returns:
            Dictionary representing a mind map structure
        """
        lines = note_content.split("\n")
        topics = [line.strip() for line in lines if line.strip()][:5]

        children = []
        for topic in topics[1:]:  # Skip first line (usually title)
            children.append({
                "branch": topic[:50],
                "leafs": ["Key concept", "Supporting detail", "Example"],
            })

        return {
            "root": topics[0] if topics else "Study Notes",
            "children": children if children else [
                {"branch": "Main Topic", "leafs": ["Concept 1", "Concept 2", "Concept 3"]}
            ],
        }

    def _generate_mock_cheat_sheet(self, note_content: str) -> str:
        """
        Generate a basic cheat sheet when all API calls fail.

        Args:
            note_content: The original study notes

        Returns:
            Simple markdown cheat sheet
        """
        lines = [l.strip() for l in note_content.split("\n") if l.strip()]
        bullets = "\n".join(f"- {line}" for line in lines[:20])
        return f"# Cheat Sheet\n\n{bullets}"

    def _call_qwen_model(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Call Qwen2.5-72B-Instruct model via HuggingFace API.

        Args:
            prompt: The prompt to send to the model
            max_tokens: Maximum tokens in response

        Returns:
            Generated text from the model
        """
        if not self.api_token:
            raise ValueError("HUGGINGFACE_API_TOKEN is not set")
        return call_huggingface_model(
            model_id=self.primary_model_id,
            prompt=prompt,
            api_token=self.api_token,
            max_tokens=max_tokens,
            temperature=0.7,
        )

    def _call_mathstral_fallback(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Call Mathstral-7B-v0.1 model as fallback for complex formula extraction.

        Args:
            prompt: The prompt to send to the model
            max_tokens: Maximum tokens in response

        Returns:
            Generated text from the fallback model
        """
        if not self.api_token:
            raise ValueError("HUGGINGFACE_API_TOKEN is not set")
        logger.info("Using Mathstral fallback model for formula extraction")
        return call_huggingface_model(
            model_id=self.fallback_model_id,
            prompt=prompt,
            api_token=self.api_token,
            max_tokens=max_tokens,
            temperature=0.5,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_cheat_sheet(self, note_content: str) -> str:
        """
        Transform notes into a cheat sheet with bullet points and LaTeX formulas.
        Uses Mathstral fallback if formula extraction is detected as complex.

        Args:
            note_content: Original study notes

        Returns:
            Formatted cheat sheet as markdown
        """
        use_fallback = self._is_formula_too_complex(note_content)

        prompt = f"""Convert the following study notes into a concise cheat sheet format.

Requirements:
1. Extract key points as bullet points (use -, *, or •)
2. Organize into logical sections with headers
3. Keep each bullet point brief and memorable
4. For any mathematical formulas or equations, wrap them in LaTeX delimiters: $formula$
5. For more complex math, use block LaTeX: $$formula$$
6. Include examples where helpful
7. Use abbreviations and shortcuts to save space
8. Highlight important terms in bold **term**

Study Notes:
{note_content}

Generate the cheat sheet now:"""

        try:
            if use_fallback:
                logger.info("Using Mathstral fallback for complex formula extraction in cheat sheet")
                return self._call_mathstral_fallback(prompt, max_tokens=3000)
            return self._call_qwen_model(prompt, max_tokens=3000)
        except Exception as e:
            logger.error(f"Primary model failed for cheat sheet: {e}")
            if not use_fallback:
                try:
                    logger.info("Attempting Mathstral fallback after primary failure")
                    return self._call_mathstral_fallback(prompt, max_tokens=3000)
                except Exception as fallback_error:
                    logger.error(f"Fallback model also failed: {fallback_error}")
            logger.warning("All API calls failed, using mock cheat sheet")
            return self._generate_mock_cheat_sheet(note_content)

    def generate_mind_map(self, note_content: str) -> dict:
        """
        Transform notes into a hierarchical mind map JSON structure.
        Uses Mathstral fallback if formula extraction is detected as complex.

        Args:
            note_content: Original study notes

        Returns:
            JSON object with hierarchical structure
        """
        use_fallback = self._is_formula_too_complex(note_content)

        prompt = f"""Convert the following study notes into a hierarchical mind map JSON structure.

Requirements:
1. Create a root node representing the main topic
2. Branch out into major sections/concepts
3. Further subdivide into details and examples
4. Return ONLY valid JSON (no markdown, no extra text)

JSON Structure (follow exactly):
{{
    "root": "Main Topic Name",
    "children": [
        {{
            "branch": "Major Concept 1",
            "leafs": ["detail 1", "detail 2", "example"]
        }},
        {{
            "branch": "Major Concept 2",
            "leafs": ["detail 1", "detail 2", "detail 3"]
        }}
    ]
}}

Your JSON must be valid and parseable. No markdown code blocks.

Study Notes:
{note_content}

Generate the mind map JSON now:"""

        def _parse_mind_map_result(raw: str) -> dict:
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            elif raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
            data = json.loads(raw)
            data.setdefault("root", "Study Notes")
            data.setdefault("children", [])
            return data

        try:
            if use_fallback:
                logger.info("Using Mathstral fallback for mind map generation")
                result = self._call_mathstral_fallback(prompt, max_tokens=2500)
            else:
                result = self._call_qwen_model(prompt, max_tokens=2500)
            return _parse_mind_map_result(result)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse mind map JSON: {e}")
            if not use_fallback:
                try:
                    logger.info("JSON parsing failed, attempting Mathstral fallback")
                    result = self._call_mathstral_fallback(prompt, max_tokens=2500)
                    return _parse_mind_map_result(result)
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed to parse: {fallback_error}")
            return {
                "root": "Study Notes",
                "children": [{"branch": "Content", "leafs": [note_content[:100] + "..."]}],
                "error": f"JSON parsing failed: {e}",
            }
        except Exception as e:
            logger.error(f"Failed to generate mind map: {e}")
            logger.warning("All API calls failed for mind map, using mock response")
            return self._generate_mock_mind_map(note_content)

    def generate_study_artifacts(self, note_content: str) -> dict:
        """
        Generate both cheat sheet and mind map artifacts from notes.
        Automatically routes to Mathstral fallback for complex formula extraction.

        Args:
            note_content: Original study notes

        Returns:
            {
                "success": bool,
                "cheat_sheet": str (markdown),
                "mind_map": dict (JSON),
                "metadata": {
                    "input_length": int,
                    "cheat_sheet_length": int,
                    "has_complex_formulas": bool,
                    "model_used": {"cheat_sheet": str, "mind_map": str},
                    "errors": []
                }
            }
        """
        if not note_content or not note_content.strip():
            raise ValueError("Note content cannot be empty")

        has_complex_formulas = self._is_formula_too_complex(note_content)
        model_label = "Mathstral" if has_complex_formulas else "Qwen"

        result = {
            "success": False,
            "cheat_sheet": None,
            "mind_map": None,
            "metadata": {
                "input_length": len(note_content),
                "cheat_sheet_length": 0,
                "has_complex_formulas": has_complex_formulas,
                "model_used": {"cheat_sheet": None, "mind_map": None},
                "errors": [],
            },
        }

        # Generate cheat sheet
        try:
            logger.info("Generating cheat sheet...")
            cheat_sheet = self.generate_cheat_sheet(note_content)
            result["cheat_sheet"] = cheat_sheet
            result["metadata"]["cheat_sheet_length"] = len(cheat_sheet)
            result["metadata"]["model_used"]["cheat_sheet"] = model_label
            logger.info(f"Cheat sheet generated: {len(cheat_sheet)} characters")
        except Exception as e:
            error_msg = f"Cheat sheet generation failed: {e}"
            logger.error(error_msg)
            result["metadata"]["errors"].append(error_msg)

        # Generate mind map
        try:
            logger.info("Generating mind map...")
            mind_map = self.generate_mind_map(note_content)
            result["mind_map"] = mind_map
            result["metadata"]["model_used"]["mind_map"] = model_label
            logger.info(f"Mind map generated with root: {mind_map.get('root', 'Unknown')}")
        except Exception as e:
            error_msg = f"Mind map generation failed: {e}"
            logger.error(error_msg)
            result["metadata"]["errors"].append(error_msg)

        result["success"] = result["cheat_sheet"] is not None or result["mind_map"] is not None
        return result