"""Post Processor: Formats and combines LLM outputs."""

import json
import re
from typing import Any, Dict, List, Optional


class PostProcessor:
    """Handles post-processing of LLM pipeline outputs."""

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
        """Combine all artifacts into final output."""
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
