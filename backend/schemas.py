import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Type definitions
SourceType = Literal["video", "link", "note"]


class SourceCreate(BaseModel):
    """
    Schema for creating a new study source.

    Supported source types:
    - 'video': YouTube video transcripts
    - 'link': Web content/articles
    - 'note': User-created study notes
    """

    type: SourceType = Field(
        ...,
        description="Type of source: 'video', 'link', or 'note'",
        examples=["video", "link", "note"],
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=100000,
        description="The content/text of the source",
        examples=["This is my study note about quantum physics..."],
    )
    video_id: str | None = Field(
        default=None,
        max_length=20,
        pattern=r"^[a-zA-Z0-9_-]*$",
        description="YouTube video ID (required if type is 'video')",
        examples=["dQw4w9WgXcQ"],
    )

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Ensure type is one of the allowed values."""
        if v not in ["video", "link", "note"]:
            raise ValueError("type must be 'video', 'link', or 'note'")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Ensure content is not just whitespace."""
        if not v or not v.strip():
            raise ValueError("content cannot be empty or whitespace only")
        return v.strip()

    @field_validator("video_id")
    @classmethod
    def validate_video_id(cls, v: str | None) -> str | None:
        """Validate video_id format and consistency with type."""
        if v is not None:
            if not re.match(r"^[a-zA-Z0-9_-]{11}$", v):
                raise ValueError(
                    "video_id must be exactly 11 characters (YouTube format)"
                )
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "video",
                "content": "This video discusses machine learning...",
                "video_id": "dQw4w9WgXcQ",
            }
        }
    )


class SourceRead(BaseModel):
    """
    Schema for reading/returning a study source.

    Returned by the API when fetching existing sources.
    """

    id: int = Field(..., description="Unique identifier for the source")
    type: SourceType = Field(
        ..., description="Type of source: 'video', 'link', or 'note'"
    )
    content: str = Field(..., description="The content/text of the source")
    timestamp: datetime = Field(
        ..., description="UTC timestamp when source was created"
    )
    video_id: str | None = Field(
        default=None, description="YouTube video ID (present only for video sources)"
    )

    model_config = ConfigDict(from_attributes=True)


class SourceUpdate(BaseModel):
    """
    Schema for updating an existing source.

    All fields are optional - only provided fields will be updated.
    """

    type: SourceType | None = Field(
        default=None, description="New source type (if updating)"
    )
    content: str | None = Field(
        default=None,
        min_length=1,
        max_length=100000,
        description="New source content (if updating)",
    )
    video_id: str | None = Field(
        default=None, max_length=20, description="New YouTube video ID (if updating)"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"content": "Updated study notes about quantum mechanics..."}
        }
    )


class ReportCreate(BaseModel):
    """
    Schema for creating a new study report.

    Reports are generated from selected sources and contain
    formatted study materials.
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=500000,
        description="The report content in markdown format",
        examples=["# Quantum Physics\n\n## Key Concepts\n..."],
    )
    title: str | None = Field(
        default=None,
        max_length=255,
        description="Optional human-readable title for the report",
        examples=["My Quantum Physics Notes"],
    )
    source_ids: str | None = Field(
        default=None,
        description="Comma-separated source IDs used to generate this report, or 'all' for all sources",
        examples=["1,2,5", "all"],
    )
    prompt: str | None = Field(
        default=None,
        max_length=5000,
        description="Optional prompt/instructions used to generate the report",
    )

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Ensure content is not just whitespace."""
        if not v or not v.strip():
            raise ValueError("content cannot be empty or whitespace only")
        return v.strip()

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        """Clean and validate title if provided."""
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("source_ids")
    @classmethod
    def validate_source_ids(cls, v: str | None) -> str | None:
        """Validate source_ids format."""
        if v is None:
            return v

        v = v.strip().lower()
        if v == "all":
            return "all"

        # Validate comma-separated IDs
        try:
            ids = [int(sid.strip()) for sid in v.split(",") if sid.strip()]
            if not ids:
                raise ValueError("Invalid source_ids format")
            return ",".join(str(id) for id in ids)
        except ValueError:
            raise ValueError("source_ids must be 'all' or comma-separated integers")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "# Study Guide\n\n## Topic 1\nContent here...",
                "title": "Exam Prep Guide",
                "source_ids": "1,2,3",
            }
        }
    )


class ReportRead(BaseModel):
    """
    Schema for reading/returning a study report.

    Returned by the API when fetching existing reports.
    """

    id: int = Field(..., description="Unique identifier for the report")
    content: str = Field(..., description="The report content in markdown format")
    title: str | None = Field(default=None, description="Optional title for the report")
    timestamp: datetime = Field(
        ..., description="UTC timestamp when report was generated"
    )
    source_ids: str | None = Field(
        default=None, description="Source IDs used to generate this report"
    )

    model_config = ConfigDict(from_attributes=True)


class ReportUpdate(BaseModel):
    """
    Schema for updating an existing report.

    All fields are optional - only provided fields will be updated.
    """

    content: str | None = Field(
        default=None,
        min_length=1,
        max_length=500000,
        description="New report content (if updating)",
    )
    title: str | None = Field(
        default=None, max_length=255, description="New report title (if updating)"
    )

    model_config = ConfigDict(
        json_schema_extra={"example": {"title": "Updated Exam Notes"}}
    )


class SourceListResponse(BaseModel):
    """
    Schema for listing sources with pagination.
    """

    items: list[SourceRead] = Field(..., description="List of sources")
    total: int = Field(..., ge=0, description="Total number of sources available")
    page: int = Field(default=1, ge=1, description="Current page number")
    page_size: int = Field(default=20, ge=1, description="Number of items per page")

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    """
    Schema for listing reports with pagination.
    """

    items: list[ReportRead] = Field(..., description="List of reports")
    total: int = Field(..., ge=0, description="Total number of reports available")
    page: int = Field(default=1, ge=1, description="Current page number")
    page_size: int = Field(default=20, ge=1, description="Number of items per page")

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """
    Schema for error responses.
    """

    detail: str = Field(..., description="Error message")
    error_code: str | None = Field(
        default=None, description="Machine-readable error code"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="When the error occurred"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": "Source not found",
                "error_code": "SOURCE_NOT_FOUND",
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }
    )


class HealthCheckResponse(BaseModel):
    """
    Schema for health check endpoint response.
    """

    status: str = Field(..., description="Service status", examples=["ok", "healthy"])
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the health check was performed",
    )
