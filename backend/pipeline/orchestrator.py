"""Orchestrator: Coordinates the multi-LLM pipeline execution."""

import logging
from typing import Any, Dict, List, Optional

from utils.config_manager import ConfigManager

from .input.input_handler import InputHandler
from .models.model_wrapper import get_model_registry
from .postprocessing.post_processor import PostProcessor

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """Orchestrates the multi-LLM pipeline execution."""

    def __init__(self):
        """Initialize orchestrator with config-driven settings."""
        try:
            self.config = ConfigManager.get_pipeline_config()
            logger.info("Loaded pipeline config from TOML")
        except Exception as e:
            logger.warning(f"Failed to load pipeline config: {e}. Using defaults.")
            self.config = {}

        self.input_handler = InputHandler()
        self.model_registry = get_model_registry()

        # Initialize post-processor with output format from config
        output_config = self.config.get("output", {})
        default_format = output_config.get("format", "json")
        include_metadata = output_config.get("include_metadata", True)

        self.post_processor = PostProcessor(default_format=default_format)
        self.output_format = default_format
        self.include_metadata = include_metadata

        logger.info(f"Pipeline orchestrator initialized with format: {default_format}")

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

            response = {
                "status": "success",
                "notes": formatted_notes,
            }

            if self.include_metadata:
                response["metadata"] = {
                    "model_used": result["model"],
                    "sources_count": input_data["total_sources"],
                    "input_length": len(input_data["combined_text"]),
                }

            return response

        except Exception as e:
            logger.error(f"Pipeline error in generate_study_notes: {str(e)}")
            return self.post_processor.format_error_response(
                f"Pipeline error: {str(e)}"
            )

    def generate_artifacts(
        self,
        source_ids: Optional[List[int]] = None,
        source_type: Optional[str] = None,
        content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate mind map and cheat sheet artifacts.

        Pipeline:
        1. Extract text from sources or use provided content
        2. Generate artifacts using artifact service
        3. Post-process and validate
        """
        try:
            # Step 1: Input processing
            if content:
                # Use provided content directly
                combined_text = content
                sources_count = 0
            else:
                # Get content from sources
                input_data = self.input_handler.get_sources_text(
                    source_ids, source_type
                )
                combined_text = input_data["combined_text"]
                sources_count = input_data["total_sources"]

            if not combined_text:
                return self.post_processor.format_error_response(
                    "No content found in sources"
                )

            # Step 2: Model call
            model = self.model_registry.get("artifact")
            if not model:
                return self.post_processor.format_error_response(
                    "Artifact model not available"
                )

            result = model.generate(combined_text)

            if result["status"] != "success":
                return self.post_processor.format_error_response(
                    f"Artifact generation failed: {result.get('error', 'Unknown error')}"
                )

            # Step 3: Post-processing
            artifacts = result["content"]
            processed = self.post_processor.combine_artifacts(
                notes="",
                mind_map=artifacts.get("mind_map"),
                cheat_sheet=artifacts.get("cheat_sheet"),
            )

            response = {
                "status": "success",
                "artifacts": processed,
            }

            if self.include_metadata:
                response["metadata"] = {
                    "model_used": result["model"],
                    "sources_count": sources_count,
                    "input_length": len(combined_text),
                    "has_complex_formulas": artifacts.get("metadata", {}).get(
                        "has_complex_formulas", False
                    ),
                }

            return response

        except Exception as e:
            logger.error(f"Pipeline error in generate_artifacts: {str(e)}")
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
                notes_result.get("status") != "success"
                and artifacts_result.get("status") != "success"
            ):
                return self.post_processor.format_error_response(
                    "Both notes and artifacts generation failed"
                )

            combined = {}

            if notes_result.get("status") == "success":
                combined.update(notes_result)

            if artifacts_result.get("status") == "success":
                combined["artifacts"] = artifacts_result["artifacts"]
                if "metadata" not in combined:
                    combined["metadata"] = {}
                combined["metadata"].update(artifacts_result.get("metadata", {}))

            combined["status"] = "success"
            return combined

        except Exception as e:
            logger.error(f"Pipeline error in generate_complete_package: {str(e)}")
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
