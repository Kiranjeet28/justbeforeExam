from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(20), nullable=False, index=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    video_id = Column(String(20), nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # Markdown content
    title = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    source_ids = Column(String(500), nullable=True)  # Comma-separated IDs or "all"
