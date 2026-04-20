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


class Quiz(Base):
    """
    Represents a generated quiz.

    Quizzes are created from topics or notes using RAG, containing MCQs and short-answer questions.

    Attributes:
        id: Unique identifier for the quiz
        topic: The topic or notes used to generate the quiz
        questions: JSON string containing the quiz questions (MCQs and short answers)
        source_refs: JSON string containing source references (chunk_ids or URLs)
        created_at: When the quiz was generated (UTC)
    """

    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(
        String(500), nullable=False, comment="Topic or notes used for quiz generation"
    )
    questions = Column(
        Text,
        nullable=False,
        comment="JSON string of quiz questions (MCQs and short answers)",
    )
    source_refs = Column(
        Text, nullable=True, comment="JSON string of source references"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="UTC timestamp when quiz was generated",
    )

    def __repr__(self) -> str:
        """String representation of Quiz."""
        return f"<Quiz(id={self.id}, topic={self.topic}, created_at={self.created_at})>"


class UserLink(Base):
    """
    Represents a personalized link stored for a user.

    Links are validated, processed, and stored with embeddings in Pinecone.
    """

    __tablename__ = "user_links"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True, comment="User identifier")
    url = Column(String(2000), nullable=False, index=True, comment="The link URL")
    title = Column(String(500), nullable=True, comment="Extracted or provided title")
    topic = Column(String(200), nullable=True, index=True, comment="Detected topic")
    content = Column(Text, nullable=True, comment="Extracted clean text content")
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="UTC timestamp when link was added",
    )

    # Constraints and indexes
    __table_args__ = (
        Index("ix_user_link_user_url", "user_id", "url", unique=True),
        Index("ix_user_link_user_topic", "user_id", "topic"),
    )

    def __repr__(self) -> str:
        """String representation of UserLink."""
        return f"<UserLink(id={self.id}, user_id={self.user_id}, url={self.url})>"


class LinkUsage(Base):
    """
    Tracks usage statistics for user links to enable history-based ranking.
    """

    __tablename__ = "link_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_link_id = Column(
        Integer,
        nullable=False,
        index=True,
        comment="Foreign key to user_links.id",
    )
    user_id = Column(String(100), nullable=False, index=True, comment="User identifier")
    access_count = Column(
        Integer, default=0, nullable=False, comment="Number of times accessed"
    )
    last_accessed = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="Last access timestamp",
    )

    # Foreign key constraint
    __table_args__ = (
        Index("ix_link_usage_user_link", "user_link_id"),
        Index("ix_link_usage_user_access", "user_id", "last_accessed"),
    )

    def __repr__(self) -> str:
        """String representation of LinkUsage."""
        return f"<LinkUsage(id={self.id}, user_link_id={self.user_link_id}, access_count={self.access_count})>"
