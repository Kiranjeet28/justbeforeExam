"""
Artifact Transformation Service
Converts generated study notes into specialized formats:
- Cheat Sheet: Bullet points with LaTeX formulas
- Mind Map: JSON hierarchy structure
"""

import json
import logging
from typing import Optional
import requests
from dotenv import load_dotenv
import os
import re

load_dotenv()
logger = logging.getLogger(__name__)


class ArtifactTransformationService:
    """Service for transforming notes into specialized study artifacts"""

    def __init__(self):
        """Initialize with HuggingFace API for Qwen model"""
        self.api_token = os.getenv("HUGGINGFACE_API_TOKEN")
        if not self.api_token:
            logger.warning("HUGGINGFACE_API_TOKEN not set - artifact generation will be limited")

        self.model_id = "Qwen/Qwen2.5-72B-Instruct"
        self.api_url = f"https://api-inference.huggingface.co/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

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

        payload = {
            "model": self.model_id,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": max_tokens,
            "top_p": 0.9,
        }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60,
            )
            response.raise_for_status()

            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                raise RuntimeError(f"Unexpected response format: {result}")

        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 429:
                raise RuntimeError(f"HuggingFace API rate limited (429): {str(e)}") from e
            status_code = e.response.status_code if e.response is not None else "Unknown"
            raise RuntimeError(f"HuggingFace API error ({status_code}): {str(e)}") from e
        except Exception as e:
            logger.error(f"Error calling Qwen model: {str(e)}")
            raise RuntimeError(f"Failed to generate artifact: {str(e)}") from e

    def generate_cheat_sheet(self, note_content: str) -> str:
        """
        Transform notes into a cheat sheet with bullet points and LaTeX formulas.

        Args:
            note_content: Original study notes

        Returns:
            Formatted cheat sheet as markdown
        """
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
            result = self._call_qwen_model(prompt, max_tokens=3000)
            return result
        except Exception as e:
            logger.error(f"Failed to generate cheat sheet: {str(e)}")
            raise

    def generate_mind_map(self, note_content: str) -> dict:
        """
        Transform notes into a hierarchical mind map JSON structure.

        Args:
            note_content: Original study notes

        Returns:
            JSON object with hierarchical structure
        """
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

        try:
            result = self._call_qwen_model(prompt, max_tokens=2500)
            
            # Clean up the response - remove markdown code blocks if present
            result = result.strip()
            if result.startswith("```json"):
                result = result[7:]  # Remove ```json
            elif result.startswith("```"):
                result = result[3:]  # Remove ```
            
            if result.endswith("```"):
                result = result[:-3]  # Remove trailing ```
            
            result = result.strip()
            
            # Try to parse as JSON
            mind_map = json.loads(result)
            
            # Validate structure
            if "root" not in mind_map:
                raise ValueError("Mind map missing 'root' field")
            
            if "children" not in mind_map:
                mind_map["children"] = []
            
            return mind_map

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse mind map JSON: {str(e)}")
            # Return a basic structure if parsing fails
            return {
                "root": "Study Notes",
                "children": [{
                    "branch": "Content",
                    "leafs": [note_content[:100] + "..."]
                }],
                "error": f"JSON parsing failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Failed to generate mind map: {str(e)}")
            raise

    def generate_study_artifacts(self, note_content: str) -> dict:
        """
        Generate both cheat sheet and mind map artifacts from notes.

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
                    "error": str (optional)
                }
            }
        """
        if not note_content or not note_content.strip():
            raise ValueError("Note content cannot be empty")

        result = {
            "success": False,
            "cheat_sheet": None,
            "mind_map": None,
            "metadata": {
                "input_length": len(note_content),
                "cheat_sheet_length": 0,
                "errors": []
            }
        }

        # Generate cheat sheet
        try:
            logger.info("Generating cheat sheet...")
            cheat_sheet = self.generate_cheat_sheet(note_content)
            result["cheat_sheet"] = cheat_sheet
            result["metadata"]["cheat_sheet_length"] = len(cheat_sheet)
            logger.info(f"Cheat sheet generated: {len(cheat_sheet)} characters")
        except Exception as e:
            error_msg = f"Cheat sheet generation failed: {str(e)}"
            logger.error(error_msg)
            result["metadata"]["errors"].append(error_msg)

        # Generate mind map
        try:
            logger.info("Generating mind map...")
            mind_map = self.generate_mind_map(note_content)
            result["mind_map"] = mind_map
            logger.info(f"Mind map generated with root: {mind_map.get('root', 'Unknown')}")
        except Exception as e:
            error_msg = f"Mind map generation failed: {str(e)}"
            logger.error(error_msg)
            result["metadata"]["errors"].append(error_msg)

        # Mark as success if at least one artifact was generated
        result["success"] = result["cheat_sheet"] is not None or result["mind_map"] is not None

        return result
