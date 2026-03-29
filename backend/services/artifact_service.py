"""
Artifact Transformation Service
Converts generated study notes into specialized formats:
- Cheat Sheet: Bullet points with LaTeX formulas
- Mind Map: JSON hierarchy structure

Includes fallback to Mathstral model for complex formula extraction.
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
        Dictionary of headers for HuggingFace API requests
    """
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
    api_url: str = "https://api-inference.huggingface.co/v1/chat/completions",
) -> str:
    """
    Generic helper function to call any HuggingFace model via Inference API.
    
    Args:
        model_id: Model identifier (e.g., "Qwen/Qwen2.5-72B-Instruct")
        prompt: The prompt to send to the model
        api_token: HuggingFace API token
        max_tokens: Maximum tokens in response
        temperature: Sampling temperature (0.0-1.0)
        api_url: HuggingFace API endpoint
        
    Returns:
        Generated text from the model
        
    Raises:
        ValueError: If API token is missing
        RuntimeError: If API call fails
    """
    if not api_token:
        raise ValueError("HUGGINGFACE_API_TOKEN is not set")

    headers = get_huggingface_headers(api_token)
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
    }

    try:
        response = requests.post(
            api_url,
            headers=headers,
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
        logger.error(f"Error calling HuggingFace model: {str(e)}")
        raise RuntimeError(f"Failed to call model: {str(e)}") from e


class ArtifactTransformationService:
    """Service for transforming notes into specialized study artifacts"""

    def __init__(self):
        """Initialize with HuggingFace API for Qwen model and Mathstral fallback"""
        self.api_token: Optional[str] = os.getenv("HUGGINGFACE_API_TOKEN")
        if not self.api_token:
            logger.warning("HUGGINGFACE_API_TOKEN not set - artifact generation will be limited")

        # Primary model for general artifact generation
        self.primary_model_id = "Qwen/Qwen2.5-72B-Instruct"
        # Fallback model for complex formula extraction
        self.fallback_model_id = "mistralai/Mathstral-7B-v0.1"
        self.api_url = f"https://api-inference.huggingface.co/v1/chat/completions"

    def _is_formula_too_complex(self, note_content: str) -> bool:
        """
        Detect if formula extraction might be too complex for primary model.
        
        Args:
            note_content: The note content to analyze
            
        Returns:
            True if content appears to have complex formulas
        """
        # Indicators of complex formulas
        complex_patterns = [
            r'\\\[.*?\\\]',  # Display math with \[ \]
            r'\$\$.*?\$\$',  # Block math with $$ $$
            r'\\begin\{equation\}',  # LaTeX equation environment
            r'\\begin\{align\}',  # LaTeX align environment
            r'\\int',  # Integrals
            r'\\sum',  # Summations
            r'\\frac\{',  # Fractions
            r'\\sqrt\{',  # Roots
            r'\\matrix',  # Matrices
            r'\\begin\{array\}',  # Array structures
        ]
        
        for pattern in complex_patterns:
            if re.search(pattern, note_content):
                logger.info(f"Detected complex formula pattern: {pattern}")
                return True
        
        # Check for high density of mathematical symbols
        math_symbols = len(re.findall(r'[\^\√∫∑∏∞∂∇±≠≤≥≈~∈∉⊂⊃∩∪]', note_content))
        if math_symbols > 10:
            logger.info(f"High density of math symbols detected: {math_symbols}")
            return True
        
        return False

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
            temperature=0.5,  # Lower temperature for more consistent formula output
        )

    def generate_cheat_sheet(self, note_content: str) -> str:
        """
        Transform notes into a cheat sheet with bullet points and LaTeX formulas.
        Uses Mathstral fallback if formula extraction is detected as complex.

        Args:
            note_content: Original study notes

        Returns:
            Formatted cheat sheet as markdown
        """
        # Check if we should use fallback for complex formulas
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
                result = self._call_mathstral_fallback(prompt, max_tokens=3000)
            else:
                result = self._call_qwen_model(prompt, max_tokens=3000)
            return result
        except Exception as e:
            logger.error(f"Failed to generate cheat sheet (primary model): {str(e)}")
            # If primary fails and we haven't tried fallback yet, try fallback
            if not use_fallback:
                try:
                    logger.info("Primary model failed, attempting Mathstral fallback")
                    result = self._call_mathstral_fallback(prompt, max_tokens=3000)
                    return result
                except Exception as fallback_error:
                    logger.error(f"Fallback model also failed: {str(fallback_error)}")
                    raise RuntimeError(f"Both primary and fallback models failed: {str(e)}") from e
            raise

    def generate_mind_map(self, note_content: str) -> dict:
        """
        Transform notes into a hierarchical mind map JSON structure.
        Uses Mathstral fallback if formula extraction is detected as complex.

        Args:
            note_content: Original study notes

        Returns:
            JSON object with hierarchical structure
        """
        # Check if we should use fallback for complex formulas
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

        try:
            if use_fallback:
                logger.info("Using Mathstral fallback for complex formula extraction in mind map")
                result = self._call_mathstral_fallback(prompt, max_tokens=2500)
            else:
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
            # If parsing failed and we haven't tried fallback yet, try fallback
            if not use_fallback:
                try:
                    logger.info("JSON parsing failed, attempting Mathstral fallback")
                    result = self._call_mathstral_fallback(prompt, max_tokens=2500)
                    result = result.strip()
                    if result.startswith("```"):
                        result = result[result.find('\n')+1:result.rfind('```')]
                    mind_map = json.loads(result)
                    
                    if "root" not in mind_map:
                        mind_map["root"] = "Study Notes"
                    if "children" not in mind_map:
                        mind_map["children"] = []
                    
                    return mind_map
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed to parse: {str(fallback_error)}")
            
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
                    "model_used": {
                        "cheat_sheet": "Qwen" or "Mathstral",
                        "mind_map": "Qwen" or "Mathstral"
                    },
                    "errors": []
                }
            }
        """
        if not note_content or not note_content.strip():
            raise ValueError("Note content cannot be empty")

        # Determine if complex formulas are present
        has_complex_formulas = self._is_formula_too_complex(note_content)

        result = {
            "success": False,
            "cheat_sheet": None,
            "mind_map": None,
            "metadata": {
                "input_length": len(note_content),
                "cheat_sheet_length": 0,
                "has_complex_formulas": has_complex_formulas,
                "model_used": {
                    "cheat_sheet": None,
                    "mind_map": None,
                },
                "errors": []
            }
        }

        # Generate cheat sheet
        try:
            logger.info("Generating cheat sheet...")
            cheat_sheet = self.generate_cheat_sheet(note_content)
            result["cheat_sheet"] = cheat_sheet
            result["metadata"]["cheat_sheet_length"] = len(cheat_sheet)
            
            # Determine which model was used
            if has_complex_formulas:
                result["metadata"]["model_used"]["cheat_sheet"] = "Mathstral"
            else:
                result["metadata"]["model_used"]["cheat_sheet"] = "Qwen"
            
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
            
            # Determine which model was used
            if has_complex_formulas:
                result["metadata"]["model_used"]["mind_map"] = "Mathstral"
            else:
                result["metadata"]["model_used"]["mind_map"] = "Qwen"
            
            logger.info(f"Mind map generated with root: {mind_map.get('root', 'Unknown')}")
        except Exception as e:
            error_msg = f"Mind map generation failed: {str(e)}"
            logger.error(error_msg)
            result["metadata"]["errors"].append(error_msg)

        # Mark as success if at least one artifact was generated
        result["success"] = result["cheat_sheet"] is not None or result["mind_map"] is not None

        return result
