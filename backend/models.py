from datetime import datetime

from database import Base
from sqlalchemy import CheckConstraint, Column, DateTime, Index, Integer, String, Text


class Source(Base):
    """
    Represents a study material source (video, link, or note).

    Supported types:
    - 'video': YouTube video transcripts
    - 'link': Web content/articles
    - 'note': User-created notes

    Attributes:
        id: Unique identifier for the source
        type: Type of source (video, link, note)
        content: The actual content/text from the source
        timestamp: When the source was created (UTC)
        video_id: YouTube video ID (only for video type)
    """

    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(
        String(20),
        nullable=False,
        index=True,
        comment="Type of source: video, link, or note",
    )
    content = Column(
        Text, nullable=False, comment="The actual content/text from the source"
    )
    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="UTC timestamp when source was created",
    )
    video_id = Column(
        String(20),
        nullable=True,
        index=True,
        comment="YouTube video ID (only for video type sources)",
    )

    # Constraints and indexes
    __table_args__ = (
        CheckConstraint(
            "type IN ('video', 'link', 'note')", name="ck_source_valid_type"
        ),
        Index("ix_source_type_timestamp", "type", "timestamp"),
    )

    def __repr__(self) -> str:
        """String representation of Source."""
        return f"<Source(id={self.id}, type={self.type}, timestamp={self.timestamp})>"


class Report(Base):
    """
    Represents a generated study report/document.

    Reports are created from one or more sources and contain
    study materials (markdown formatted).

    Attributes:
        id: Unique identifier for the report
        title: Optional title for the report
        content: The generated study material (markdown format)
        timestamp: When the report was generated (UTC)
        source_ids: Comma-separated source IDs or "all" for all sources
    """

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False, comment="Markdown formatted study material")
    title = Column(
        String(255), nullable=True, index=True, comment="Optional title for the report"
    )
    source_ids = Column(
        String(500),
        nullable=True,
        comment="Comma-separated source IDs or 'all' for all sources",
    )
    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="UTC timestamp when report was generated",
    )

    # Indexes for common queries
    __table_args__ = (Index("ix_report_timestamp_title", "timestamp", "title"),)

    def __repr__(self) -> str:
        """String representation of Report."""
        return f"<Report(id={self.id}, title={self.title}, timestamp={self.timestamp})>"

    def get_source_ids_list(self) -> list[int]:
        """
        Parse source_ids string into a list of integers.

        Returns:
            List of source IDs, or empty list if source_ids is None or "all"
        """
        if not self.source_ids or self.source_ids.strip().lower() == "all":
            return []

        try:
            return [
                int(sid.strip()) for sid in self.source_ids.split(",") if sid.strip()
            ]
        except (ValueError, AttributeError):
            return []
