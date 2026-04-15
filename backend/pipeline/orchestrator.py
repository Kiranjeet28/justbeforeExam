"""Orchestrator: Coordinates the multi-LLM pipeline execution."""

from typing import Any, Dict, List, Optional

from .input.input_handler import InputHandler
from .models.model_wrapper import get_model_registry
from .postprocessing.post_processor import PostProcessor


class PipelineOrchestrator:
    """Orchestrates the multi-LLM pipeline execution."""

    def __init__(self):
        self.input_handler = InputHandler()
        self.model_registry = get_model_registry()
        self.post_processor = PostProcessor()

    def generate_study_notes(
        self,
        source_ids: Optional[List[int]] = None,
        source_type: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate comprehensive study notes.

        Pipeline:
        1. Extract text from sources
        2. Generate notes using smart LLM (Groq + Gemini fallback)
        3. Post-process and format
        """
        try:
            # Step 1: Input processing
            input_data = self.input_handler.get_sources_text(source_ids, source_type)
            if not input_data["combined_text"]:
                return self.post_processor.format_error_response(
                    "No content found in sources"
                )

            # Step 2: Model call
            model = self.model_registry.get("smart-llm")
            if not model:
                return self.post_processor.format_error_response(
                    "Smart LLM not available"
                )

            prompt = self._build_notes_prompt(input_data["combined_text"], topic)
            result = model.generate(prompt)

            if result["status"] != "success":
                return self.post_processor.format_error_response(
                    f"Model generation failed: {result.get('error', 'Unknown error')}"
                )

            # Step 3: Post-processing
            formatted_notes = self.post_processor.format_study_notes(result["content"])

            return {
                "status": "success",
                "notes": formatted_notes,
                "metadata": {
                    "model_used": result["model"],
                    "sources_count": input_data["total_sources"],
                    "input_length": len(input_data["combined_text"]),
                },
            }

        except Exception as e:
            return self.post_processor.format_error_response(
                f"Pipeline error: {str(e)}"
            )

    def generate_artifacts(
        self,
        source_ids: Optional[List[int]] = None,
        source_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate mind map and cheat sheet artifacts.

        Pipeline:
        1. Extract text from sources
        2. Generate artifacts using artifact service
        3. Post-process and validate
        """
        try:
            # Step 1: Input processing
            input_data = self.input_handler.get_sources_text(source_ids, source_type)
            if not input_data["combined_text"]:
                return self.post_processor.format_error_response(
                    "No content found in sources"
                )

            # Step 2: Model call
            model = self.model_registry.get("artifact")
            if not model:
                return self.post_processor.format_error_response(
                    "Artifact model not available"
                )

            result = model.generate(input_data["combined_text"])

            if result["status"] != "success":
                return self.post_processor.format_error_response(
                    f"Artifact generation failed: {result.get('error', 'Unknown error')}"
                )

            # Step 3: Post-processing
            artifacts = result["content"]
            processed = self.post_processor.combine_artifacts(
                notes="",  # Artifacts don't include notes
                mind_map=artifacts.get("mind_map"),
                cheat_sheet=artifacts.get("cheat_sheet"),
            )

            return {
                "status": "success",
                "artifacts": processed,
                "metadata": {
                    "model_used": result["model"],
                    "sources_count": input_data["total_sources"],
                    "input_length": len(input_data["combined_text"]),
                    "has_complex_formulas": artifacts.get("metadata", {}).get(
                        "has_complex_formulas", False
                    ),
                },
            }

        except Exception as e:
            return self.post_processor.format_error_response(
                f"Pipeline error: {str(e)}"
            )

    def generate_complete_package(
        self,
        source_ids: Optional[List[int]] = None,
        source_type: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate complete study package: notes + artifacts.

        Pipeline:
        1. Generate notes
        2. Generate artifacts
        3. Combine results
        """
        try:
            notes_result = self.generate_study_notes(source_ids, source_type, topic)
            artifacts_result = self.generate_artifacts(source_ids, source_type)

            if (
                notes_result["status"] != "success"
                and artifacts_result["status"] != "success"
            ):
                return self.post_processor.format_error_response(
                    "Both notes and artifacts generation failed"
                )

            combined = {}

            if notes_result["status"] == "success":
                combined.update(notes_result)

            if artifacts_result["status"] == "success":
                combined["artifacts"] = artifacts_result["artifacts"]
                # Merge metadata
                if "metadata" not in combined:
                    combined["metadata"] = {}
                combined["metadata"].update(artifacts_result["metadata"])

            combined["status"] = "success"
            return combined

        except Exception as e:
            return self.post_processor.format_error_response(
                f"Pipeline error: {str(e)}"
            )

    def _build_notes_prompt(self, content: str, topic: Optional[str] = None) -> str:
        """Build prompt for study notes generation."""
        topic_section = f"Topic: {topic}\n\n" if topic else ""

        return f"""{topic_section}Create comprehensive study notes from the following content:

{content}

Please structure the notes with:
- Clear headings and subheadings
- Key concepts and definitions
- Important examples and explanations
- Study tips and mnemonics
- Practice questions where relevant

Format as clean, readable markdown."""


# Global orchestrator instance
_orchestrator = None


def get_orchestrator() -> PipelineOrchestrator:
    """Get or create the global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PipelineOrchestrator()
    return _orchestrator
