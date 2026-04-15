"""Post Processor: Formats and combines LLM outputs with JSON and TOML support."""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

try:
    import toml

    TOML_AVAILABLE = True
except ImportError:
    TOML_AVAILABLE = False


class PostProcessor:
    """Handles post-processing of LLM pipeline outputs in JSON and TOML formats."""

    def __init__(self, default_format: str = "json"):
        """Initialize PostProcessor.

        Args:
            default_format: Default output format (\"json\" or \"toml\")
        """
        self.default_format = default_format.lower()
        if self.default_format not in ["json", "toml"]:
            self.default_format = "json"

    # ==================== JSON Methods (Existing) ====================

    def format_study_notes(self, content: str) -> str:
        """Format study notes with proper markdown structure."""
        if not content:
            return ""

        # Ensure proper markdown headers
        content = re.sub(r"^#+\s*", "# ", content, flags=re.MULTILINE)

        # Add table of contents if not present
        if "## Table of Contents" not in content and len(content.split("\n")) > 20:
            toc = self._generate_toc(content)
            if toc:
                content = f"## Table of Contents\n{toc}\n\n{content}"

        return content.strip()

    def format_cheat_sheet(self, content: str) -> str:
        """Format cheat sheet with LaTeX math support."""
        if not content:
            return ""

        # Ensure LaTeX delimiters for math
        content = re.sub(r"\$([^$]+)\$", r"$\1$", content)  # Normalize inline math
        content = re.sub(r"\$\$([^$]+)\$\$", r"$\1$", content)  # Normalize display math

        return content.strip()

    def validate_mind_map(self, mind_map: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean mind map JSON."""
        if not isinstance(mind_map, dict):
            return {"nodes": [], "edges": []}

        # Ensure required structure
        if "nodes" not in mind_map:
            mind_map["nodes"] = []
        if "edges" not in mind_map:
            mind_map["edges"] = []

        # Validate nodes
        valid_nodes = []
        for node in mind_map.get("nodes", []):
            if isinstance(node, dict) and "id" in node and "label" in node:
                valid_nodes.append(node)

        mind_map["nodes"] = valid_nodes

        return mind_map

    def combine_artifacts(
        self,
        notes: str,
        mind_map: Optional[Dict[str, Any]] = None,
        cheat_sheet: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Combine all artifacts into final output (JSON)."""
        result = {"notes": self.format_study_notes(notes)}

        if mind_map:
            result["mind_map"] = self.validate_mind_map(mind_map)

        if cheat_sheet:
            result["cheat_sheet"] = self.format_cheat_sheet(cheat_sheet)

        return result

    def _generate_toc(self, content: str) -> str:
        """Generate table of contents from headers."""
        lines = content.split("\n")
        toc_lines = []

        for line in lines:
            if line.startswith("# "):
                toc_lines.append(
                    f"- [{line[2:]}](#{line[2:].lower().replace(' ', '-')})"
                )
            elif line.startswith("## "):
                toc_lines.append(
                    f"  - [{line[3:]}](#{line[3:].lower().replace(' ', '-')})"
                )

        return "\n".join(toc_lines) if toc_lines else ""

    def format_error_response(
        self, error: str, fallback_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """Format error responses."""
        result = {
            "error": error,
            "status": "error",
        }

        if fallback_content:
            result["fallback_content"] = fallback_content

        return result

    # ==================== TOML Methods (New) ====================

    def _to_toml(self, data: Dict[str, Any]) -> str:
        """Convert a dictionary to TOML string format."""
        if not TOML_AVAILABLE:
            raise ImportError(
                "toml package not installed. Install with: pip install toml"
            )

        try:
            return toml.dumps(data)
        except Exception as e:
            raise ValueError(f"Failed to convert to TOML: {str(e)}")

    def _mind_map_dict_to_toml_compatible(self, mind_map: dict) -> dict:
        """Convert mind map dict to TOML-compatible structure."""
        toml_structure = {
            "metadata": {
                "type": "mind_map",
                "node_count": len(mind_map.get("nodes", [])),
                "edge_count": len(mind_map.get("edges", [])),
            },
            "nodes": {},
            "edges": {},
        }

        # Convert nodes list to dict with id as key
        for i, node in enumerate(mind_map.get("nodes", [])):
            node_key = f"node_{i}"
            toml_structure["nodes"][node_key] = {
                "id": node.get("id", ""),
                "label": node.get("label", ""),
                "level": node.get("level", 0),
            }

        # Convert edges list to dict with index as key
        for i, edge in enumerate(mind_map.get("edges", [])):
            edge_key = f"edge_{i}"
            toml_structure["edges"][edge_key] = {
                "source": edge.get("source", ""),
                "target": edge.get("target", ""),
            }

        return toml_structure

    def _cheat_sheet_to_toml_compatible(self, cheat_sheet: str) -> dict:
        """Convert cheat sheet markdown to TOML-compatible structure."""
        lines = cheat_sheet.split("\n")
        sections = {}
        current_section = "general"
        current_items = []

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                # Save previous section
                if current_items:
                    sections[current_section] = current_items
                # Start new section
                current_section = stripped.lstrip("#").strip().lower().replace(" ", "_")
                current_items = []
            elif stripped.startswith("-") and stripped:
                # Add bullet point to current section
                current_items.append(stripped[1:].strip())

        # Save final section
        if current_items:
            sections[current_section] = current_items

        return {
            "metadata": {
                "type": "cheat_sheet",
                "section_count": len(sections),
            },
            "content": sections,
        }

    def validate_mind_map_toml(
        self, mind_map: Union[Dict[str, Any], str]
    ) -> Dict[str, Any]:
        """Validate and clean mind map for TOML format."""
        if isinstance(mind_map, str):
            try:
                mind_map = (
                    toml.loads(mind_map) if TOML_AVAILABLE else json.loads(mind_map)
                )
            except Exception:
                return {"nodes": [], "edges": []}

        return self.validate_mind_map(mind_map)

    def format_study_notes_toml(self, content: str) -> str:
        """Format study notes for TOML compatibility."""
        return self.format_study_notes(content)

    def format_cheat_sheet_toml(self, content: str) -> str:
        """Format cheat sheet for TOML compatibility."""
        return self.format_cheat_sheet(content)

    def format_mind_map_toml(self, mind_map: Dict[str, Any]) -> Dict[str, Any]:
        """Convert mind map to TOML-compatible structure."""
        validated = self.validate_mind_map(mind_map)
        return self._mind_map_dict_to_toml_compatible(validated)

    def mind_map_toml(self, note_content: str) -> str:
        """Generate mind map in TOML format string."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        mind_map_dict = {"nodes": [], "edges": []}
        toml_compatible = self._mind_map_dict_to_toml_compatible(mind_map_dict)
        return self._to_toml(toml_compatible)

    def cheat_sheet_toml(self, note_content: str) -> str:
        """Generate cheat sheet in TOML format string."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        toml_compatible = self._cheat_sheet_to_toml_compatible(note_content)
        return self._to_toml(toml_compatible)

    def combine_artifacts_toml(
        self,
        notes: str,
        mind_map: Optional[Dict[str, Any]] = None,
        cheat_sheet: Optional[str] = None,
    ) -> str:
        """Combine all artifacts into TOML format."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        artifact_dict = {
            "metadata": {
                "format": "toml",
                "created_at": datetime.now().isoformat(),
                "version": "1.0",
            },
            "notes": self.format_study_notes_toml(notes),
        }

        if mind_map:
            artifact_dict["mind_map"] = self.format_mind_map_toml(mind_map)

        if cheat_sheet:
            artifact_dict["cheat_sheet"] = self._cheat_sheet_to_toml_compatible(
                cheat_sheet
            )

        return self._to_toml(artifact_dict)

    # ==================== Format Conversion Methods ====================

    def json_to_toml(self, json_data: Union[str, Dict[str, Any]]) -> str:
        """Convert JSON format to TOML format."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        if isinstance(json_data, str):
            try:
                data = json.loads(json_data)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string provided")
        else:
            data = json_data

        return self._to_toml(data)

    def toml_to_json(self, toml_data: str) -> Dict[str, Any]:
        """Convert TOML format to JSON (dictionary)."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        try:
            return toml.loads(toml_data)
        except Exception as e:
            raise ValueError(f"Invalid TOML format: {str(e)}")

    def parse_toml_artifact(self, toml_str: str) -> Dict[str, Any]:
        """Parse TOML artifact into structured format."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        try:
            data = toml.loads(toml_str)
        except Exception as e:
            return self.format_error_response(f"Failed to parse TOML: {str(e)}")

        result = {}

        # Extract and validate notes
        if "notes" in data:
            result["notes"] = self.format_study_notes(str(data["notes"]))

        # Extract and validate mind map
        if "mind_map" in data:
            mind_map = data["mind_map"]
            if isinstance(mind_map, dict):
                # Reconstruct nodes and edges from TOML structure
                reconstructed_mm = {
                    "nodes": [v for k, v in mind_map.get("nodes", {}).items()],
                    "edges": [v for k, v in mind_map.get("edges", {}).items()],
                }
                result["mind_map"] = self.validate_mind_map(reconstructed_mm)

        # Extract and validate cheat sheet
        if "cheat_sheet" in data:
            result["cheat_sheet"] = self.format_cheat_sheet(str(data["cheat_sheet"]))

        return result

    def format_artifact_to_toml(
        self, artifact: Dict[str, Any], include_metadata: bool = True
    ) -> str:
        """Convert any artifact dictionary to TOML format."""
        if not TOML_AVAILABLE:
            raise ImportError("toml package not installed")

        toml_artifact = {}

        if include_metadata:
            toml_artifact["metadata"] = {
                "format": "toml",
                "created_at": datetime.now().isoformat(),
                "version": "1.0",
            }

        # Validate and add notes
        if "notes" in artifact:
            toml_artifact["notes"] = self.format_study_notes(str(artifact["notes"]))

        # Validate and add mind map
        if "mind_map" in artifact:
            validated_mm = self.validate_mind_map(artifact["mind_map"])
            toml_artifact["mind_map"] = self.format_mind_map_toml(validated_mm)

        # Validate and add cheat sheet
        if "cheat_sheet" in artifact:
            toml_artifact["cheat_sheet"] = self._cheat_sheet_to_toml_compatible(
                str(artifact["cheat_sheet"])
            )

        return self._to_toml(toml_artifact)

    def convert_to_format(
        self, data: Union[str, Dict[str, Any]], target_format: str = "json"
    ) -> Union[str, Dict[str, Any]]:
        """Convert data to specified format."""
        target_format = target_format.lower()

        if target_format == "json":
            if isinstance(data, str):
                try:
                    return json.loads(data)
                except json.JSONDecodeError:
                    if TOML_AVAILABLE:
                        return self.toml_to_json(data)
                    raise
            return data

        elif target_format == "toml":
            return self.json_to_toml(data)

        else:
            raise ValueError(f"Unsupported format: {target_format}")

    def get_format_info(self) -> Dict[str, Any]:
        """Get information about available formats."""
        return {
            "default_format": self.default_format,
            "json_available": True,
            "toml_available": TOML_AVAILABLE,
            "supported_formats": ["json", "toml"] if TOML_AVAILABLE else ["json"],
        }
