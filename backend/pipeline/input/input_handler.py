"""Input Handler: Processes sources and extracts text content."""

from typing import Any, Dict, List, Optional

from database import get_db
from models import Source
from services.ai_service import TextExtractor


class InputHandler:
    """Handles input processing for the LLM pipeline."""

    def __init__(self):
        pass

    def get_sources_text(
        self, source_ids: Optional[List[int]] = None, source_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extract text content from sources.

        Args:
            source_ids: Specific source IDs to process, or None for all
            source_type: Filter by source type ('video', 'link', 'note')

        Returns:
            {
                "combined_text": str,
                "sources": List[Dict],
                "total_sources": int
            }
        """
        db = next(get_db())
        try:
            query = db.query(Source)
            if source_ids:
                query = query.filter(Source.id.in_(source_ids))
            if source_type:
                query = query.filter(Source.type == source_type)

            sources = query.all()

            combined_text = ""
            source_list = []

            for source in sources:
                text = self._extract_text_from_source(source)
                if text:
                    combined_text += text + "\n\n"
                    source_list.append(
                        {
                            "id": source.id,
                            "type": source.type,
                            "content": text[:200] + "..." if len(text) > 200 else text,
                            "timestamp": source.timestamp.isoformat(),
                        }
                    )

            return {
                "combined_text": combined_text.strip(),
                "sources": source_list,
                "total_sources": len(sources),
            }
        finally:
            db.close()

    def _extract_text_from_source(self, source: Source) -> str:
        """Extract text content from a single source."""
        if source.type == "video":
            return self._extract_video_text(source)
        elif source.type == "link":
            return self._extract_link_text(source)
        elif source.type == "note":
            return source.content
        else:
            return ""

    def _extract_video_text(self, source: Source) -> str:
        """Extract transcript from YouTube video."""
        try:
            if source.video_id:
                transcript = TextExtractor.extract_from_youtube(source.video_id)
                return f"Video Transcript ({source.video_id}):\n{transcript}"
            return ""
        except Exception:
            return source.content or ""

    def _extract_link_text(self, source: Source) -> str:
        """Extract text from web link."""
        try:
            # Use TextExtractor for link processing
            text = TextExtractor.extract_from_url(source.content)
            return f"Web Content:\n{text}"
        except Exception:
            return source.content or ""
