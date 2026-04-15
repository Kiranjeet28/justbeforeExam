"""
Artifact Transformation Service
Converts generated study notes into specialized formats.
Delegates to model_dispatch.py for model routing.
"""

import json
import logging
import os
import re
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv

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
        formula_indicators = [
            r"\$\$",
            r"\\frac",
            r"\\int",
            r"\\sum",
            r"\\prod",
            r"\\lim",
        ]
        count = sum(len(re.findall(p, note_content)) for p in formula_indicators)
        return count >= 3

    def _generate_mock_mind_map(self, note_content: str) -> dict:
        """
        Generate a fallback mind map structure when all API calls are unavailable.
        Creates a simple hierarchy based on note structure with nodes and edges.

        Args:
            note_content: The original study notes

        Returns:
            Dictionary representing a mind map structure with nodes and edges
        """
        lines = note_content.split("\n")
        topics = [line.strip() for line in lines if line.strip()][:5]

        nodes = []
        edges = []
        root_label = topics[0] if topics else "Study Notes"
        nodes.append({"id": "root", "label": root_label, "level": 0})

        for i, topic in enumerate(
            topics[1:], start=1
        ):  # Skip first line (usually title)
            child_id = f"child{i}"
            nodes.append({"id": child_id, "label": topic[:50], "level": 1})
            edges.append({"source": "root", "target": child_id})
            # Add leafs as level 2
            for j, leaf in enumerate(["Key concept", "Supporting detail", "Example"]):
                leaf_id = f"{child_id}_leaf{j}"
                nodes.append({"id": leaf_id, "label": leaf, "level": 2})
                edges.append({"source": child_id, "target": leaf_id})

        if not nodes[1:]:  # If no children
            child_id = "child1"
            nodes.append({"id": child_id, "label": "Main Topic", "level": 1})
            edges.append({"source": "root", "target": child_id})
            for j, leaf in enumerate(["Concept 1", "Concept 2", "Concept 3"]):
                leaf_id = f"{child_id}_leaf{j}"
                nodes.append({"id": leaf_id, "label": leaf, "level": 2})
                edges.append({"source": child_id, "target": leaf_id})

        return {
            "nodes": nodes,
            "edges": edges,
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
        Transform notes into a concise cheat sheet with key concepts in bullet points.

        Args:
            note_content: Original study notes

        Returns:
            Formatted cheat sheet as markdown
        """
        prompt = f"""Convert the following study notes into a concise cheat sheet with key concepts in bullet points.

Requirements:
1. Use bullet points for key concepts only
2. Keep it concise and focused on essentials
3. Use LaTeX for formulas if present: $formula$ or $$formula$$

Study Notes:
{note_content}

Generate the cheat sheet now:"""

        try:
            return self._call_qwen_model(prompt, max_tokens=3000)
        except Exception as e:
            logger.error(f"Model failed for cheat sheet: {e}")
            logger.warning("API call failed, using mock cheat sheet")
            return self._generate_mock_cheat_sheet(note_content)

    def _validate_mind_map(self, mind_map: dict) -> bool:
        """
        Validate the mind map structure for nodes, edges, hierarchy, and validity.

        Args:
            mind_map: The mind map dict with nodes and edges

        Returns:
            True if valid, False otherwise
        """
        if (
            not isinstance(mind_map, dict)
            or "nodes" not in mind_map
            or "edges" not in mind_map
        ):
            logger.error("Mind map missing 'nodes' or 'edges' keys")
            return False
        nodes = mind_map["nodes"]
        edges = mind_map["edges"]
        if not isinstance(nodes, list) or not isinstance(edges, list):
            logger.error("Nodes and edges must be lists")
            return False
        node_ids = set()
        for node in nodes:
            if (
                not isinstance(node, dict)
                or "id" not in node
                or "label" not in node
                or "level" not in node
            ):
                logger.error("Node missing 'id', 'label', or 'level'")
                return False
            node_ids.add(node["id"])
        for edge in edges:
            if (
                not isinstance(edge, dict)
                or "source" not in edge
                or "target" not in edge
            ):
                logger.error("Edge missing 'source' or 'target'")
                return False
            if edge["source"] not in node_ids or edge["target"] not in node_ids:
                logger.error("Edge references non-existent node")
                return False
        # Check hierarchy: ensure levels are consistent, no cycles (basic check)
        levels = {node["id"]: node["level"] for node in nodes}
        for edge in edges:
            if levels[edge["target"]] != levels[edge["source"]] + 1:
                logger.error("Invalid hierarchy: target level not source level + 1")
                return False
        # Check for root
        roots = [node for node in nodes if node["level"] == 0]
        if len(roots) != 1:
            logger.error("Must have exactly one root node with level 0")
            return False
        logger.info("Mind map validation passed")
        return True

    def generate_mind_map(self, note_content: str) -> dict:
        """
        Transform notes into a mind map JSON structure with nodes and edges.
        Uses Mathstral fallback if formula extraction is detected as complex.

        Args:
            note_content: Original study notes

        Returns:
            JSON object with nodes and edges structure
        """
        use_fallback = self._is_formula_too_complex(note_content)

        prompt = f"""Convert the following study notes into a mind map JSON structure with nodes and edges.

Requirements:
1. Create nodes with unique id, label (text), and level (0 for root, 1 for direct children, etc.)
2. Create edges with source and target ids to represent connections
3. Ensure hierarchical structure: edges only from parent to child, levels increase by 1
4. Return ONLY valid JSON (no markdown, no extra text)

JSON Structure (follow exactly):
{{
    "nodes": [
        {{"id": "root", "label": "Main Topic Name", "level": 0}},
        {{"id": "child1", "label": "Major Concept 1", "level": 1}},
        {{"id": "child2", "label": "Major Concept 2", "level": 1}},
        {{"id": "grandchild1", "label": "Detail 1", "level": 2}}
    ],
    "edges": [
        {{"source": "root", "target": "child1"}},
        {{"source": "root", "target": "child2"}},
        {{"source": "child1", "target": "grandchild1"}}
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
            data.setdefault("nodes", [])
            data.setdefault("edges", [])
            return data

        try:
            if use_fallback:
                logger.info("Using Mathstral fallback for mind map generation")
                result = self._call_mathstral_fallback(prompt, max_tokens=2500)
            else:
                result = self._call_qwen_model(prompt, max_tokens=2500)
            parsed = _parse_mind_map_result(result)
            if self._validate_mind_map(parsed):
                return parsed
            else:
                logger.warning("Parsed mind map failed validation, using mock")
                return self._generate_mock_mind_map(note_content)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse mind map JSON: {e}")
            if not use_fallback:
                try:
                    logger.info("JSON parsing failed, attempting Mathstral fallback")
                    result = self._call_mathstral_fallback(prompt, max_tokens=2500)
                    parsed = _parse_mind_map_result(result)
                    if self._validate_mind_map(parsed):
                        return parsed
                    else:
                        logger.warning(
                            "Fallback parsed mind map failed validation, using mock"
                        )
                        return self._generate_mock_mind_map(note_content)
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed to parse: {fallback_error}")
            return self._generate_mock_mind_map(note_content)
        except Exception as e:
            logger.error(f"Failed to generate mind map: {e}")
            logger.warning("All API calls failed for mind map, using mock response")
            return self._generate_mock_mind_map(note_content)

    def generate_study_artifacts(self, note_content: str) -> dict:
        """
        Generate both cheat sheet and mind map artifacts from notes.
        Mind map automatically routes to Mathstral fallback for complex formula extraction.

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
            result["metadata"]["model_used"]["cheat_sheet"] = "Qwen"
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
            logger.info(
                f"Mind map generated with {len(mind_map.get('nodes', []))} nodes"
            )
        except Exception as e:
            error_msg = f"Mind map generation failed: {e}"
            logger.error(error_msg)
            result["metadata"]["errors"].append(error_msg)

        result["success"] = (
            result["cheat_sheet"] is not None or result["mind_map"] is not None
        )
        return result
