from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SourceType = Literal["video", "link", "note"]


class SourceCreate(BaseModel):
    type: SourceType
    content: str = Field(min_length=1)


class SourceRead(BaseModel):
    id: int
    type: SourceType
    content: str
    timestamp: datetime
    video_id: str | None = None

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    content: str = Field(min_length=1)
    title: str | None = None
    source_ids: str | None = None  # "all" or comma-separated IDs


class ReportRead(BaseModel):
    id: int
    content: str
    title: str | None = None
    timestamp: datetime
    source_ids: str | None = None

    class Config:
        from_attributes = True
