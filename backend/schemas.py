import json
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


class QuizGenerateRequest(BaseModel):
    """
    Schema for generating a quiz.

    Input is either a topic or notes string.
    """

    input: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Topic or notes to generate quiz from",
        examples=["Machine Learning Basics", "Notes on Python data structures..."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "input": "Python programming fundamentals",
            }
        }
    )


class QuizRead(BaseModel):
    """
    Schema for reading/returning a quiz.

    Returned by the API when fetching existing quizzes.
    """

    id: int = Field(..., description="Unique identifier for the quiz")
    topic: str = Field(..., description="Topic used to generate the quiz")
    questions: dict = Field(..., description="Quiz questions (MCQs and short answers)")
    source_refs: dict | None = Field(default=None, description="Source references")
    created_at: datetime = Field(
        ..., description="UTC timestamp when quiz was generated"
    )

    @field_validator("questions", mode="before")
    @classmethod
    def parse_questions(cls, v: str | dict) -> dict:
        """Parse questions JSON string to dict."""
        if isinstance(v, str):
            return json.loads(v)
        return v

    @field_validator("source_refs", mode="before")
    @classmethod
    def parse_source_refs(cls, v: str | dict | None) -> dict | None:
        """Parse source_refs JSON string to dict."""
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = ConfigDict(from_attributes=True)


class QuizUpdate(BaseModel):
    """
    Schema for updating an existing quiz.

    All fields are optional - only provided fields will be updated.
    """

    topic: str | None = Field(
        default=None,
        max_length=500,
        description="New topic (if updating)",
    )
    questions: dict | None = Field(
        default=None, description="New questions (if updating)"
    )

    model_config = ConfigDict(
        json_schema_extra={"example": {"topic": "Updated Quiz Topic"}}
    )


class QuizListResponse(BaseModel):
    """
    Schema for listing quizzes with pagination.
    """

    items: list[QuizRead] = Field(..., description="List of quizzes")
    total: int = Field(..., ge=0, description="Total number of quizzes available")
    page: int = Field(default=1, ge=1, description="Current page number")
    page_size: int = Field(default=20, ge=1, description="Number of items per page")

    model_config = ConfigDict(from_attributes=True)


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


class QuizListResponse(BaseModel):
    """
    Schema for listing quizzes with pagination.
    """

    items: list[QuizRead] = Field(..., description="List of quizzes")
    total: int = Field(..., ge=0, description="Total number of quizzes available")
    page: int = Field(default=1, ge=1, description="Current page number")
    page_size: int = Field(default=20, ge=1, description="Number of items per page")

    model_config = ConfigDict(from_attributes=True)


class UserLinkCreate(BaseModel):
    """
    Schema for adding a new user link.

    Link will be validated, processed, and stored with embeddings.
    """

    user_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User identifier",
        examples=["user123"],
    )
    url: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The link URL to store",
        examples=["https://example.com/article"],
    )
    title: str | None = Field(
        default=None,
        max_length=500,
        description="Optional title for the link",
        examples=["Machine Learning Basics"],
    )

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Basic URL validation."""
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "user123",
                "url": "https://example.com/ml-basics",
                "title": "Machine Learning Basics",
            }
        }
    )


class UserLinkRead(BaseModel):
    """
    Schema for reading/returning a user link.

    Returned by the API when fetching existing links.
    """

    id: int = Field(..., description="Unique identifier for the link")
    user_id: str = Field(..., description="User identifier")
    url: str = Field(..., description="The link URL")
    title: str | None = Field(default=None, description="Link title")
    topic: str | None = Field(default=None, description="Detected topic")
    content: str | None = Field(default=None, description="Extracted content preview")
    weak_topics: list[str] | None = Field(
        default=None, description="Topics user struggles with from this link"
    )
    created_at: datetime = Field(..., description="UTC timestamp when link was added")

    @field_validator("weak_topics", mode="before")
    @classmethod
    def parse_weak_topics(cls, v):
        """Parse weak_topics JSON string to list."""
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = ConfigDict(from_attributes=True)


class UserLinkUpdate(BaseModel):
    """
    Schema for updating an existing user link.

    All fields are optional - only provided fields will be updated.
    """

    title: str | None = Field(
        default=None,
        max_length=500,
        description="New title (if updating)",
    )
    topic: str | None = Field(
        default=None,
        max_length=200,
        description="New topic (if updating)",
    )
    weak_topics: list[str] | None = Field(
        default=None,
        description="Updated list of weak topics (if updating)",
    )

    model_config = ConfigDict(
        json_schema_extra={"example": {"title": "Updated Link Title"}}
    )


class UserLinkListResponse(BaseModel):
    """
    Schema for listing user links with pagination.
    """

    items: list[UserLinkRead] = Field(..., description="List of user links")
    total: int = Field(..., ge=0, description="Total number of links available")
    page: int = Field(default=1, ge=1, description="Current page number")
    page_size: int = Field(default=20, ge=1, description="Number of items per page")

    model_config = ConfigDict(from_attributes=True)


class MCQItem(BaseModel):
    """
    Schema for a single multiple-choice question.
    """

    question: str = Field(..., min_length=10, description="The question text")
    options: list[str] = Field(
        ..., min_items=4, max_items=4, description="Four options labeled A, B, C, D"
    )
    correct_answer: str = Field(
        ..., pattern=r"^[A-D]$", description="Correct answer letter"
    )
    explanation: str = Field(
        ..., min_length=10, description="Explanation of the correct answer"
    )

    @field_validator("options")
    @classmethod
    def validate_options(cls, v):
        if not all(opt.startswith(("A)", "B)", "C)", "D)")) for opt in v):
            raise ValueError("Options must be labeled A, B, C, D")
        return v


class ShortAnswerItem(BaseModel):
    """
    Schema for a single short-answer question.
    """

    question: str = Field(..., min_length=10, description="The question text")
    expected_answer: str = Field(
        ..., min_length=10, description="Expected concise answer"
    )
    key_points: list[str] = Field(
        ..., min_items=1, description="Key points to cover in answer"
    )


class QuizStructure(BaseModel):
    """
    Schema for complete quiz structure.
    """

    mcqs: list[MCQItem] = Field(
        ..., min_items=5, max_items=10, description="Multiple choice questions"
    )
    short_questions: list[ShortAnswerItem] = Field(
        ..., min_items=2, max_items=3, description="Short answer questions"
    )


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


class QuizSubmission(BaseModel):
    """
    Schema for submitting quiz answers.
    """

    user_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User identifier",
        examples=["user123"],
    )
    quiz_id: int = Field(..., description="Quiz ID to evaluate", examples=[1])
    answers: Dict[str, str] = Field(
        ...,
        description="Dictionary of question_id: user_answer",
        examples=[{"mcq_0": "A", "sa_1": "Inheritance allows code reuse"}],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "user123",
                "quiz_id": 1,
                "answers": {"mcq_0": "B", "sa_1": "Polymorphism"},
            }
        }
    )


class QuizEvaluation(BaseModel):
    """
    Schema for quiz evaluation results.
    """

    score: int = Field(..., description="Number of correct answers", ge=0)
    accuracy: float = Field(..., description="Accuracy percentage", ge=0.0, le=100.0)
    mistakes: list[Dict] = Field(
        ...,
        description="List of incorrect questions with details",
        examples=[
            [
                {
                    "question_id": "mcq_0",
                    "topic": "Python",
                    "concept": "Data Types",
                    "user_answer": "B",
                    "correct_answer": "A",
                }
            ]
        ],
    )
    weak_topics: list[str] = Field(
        ...,
        description="Detected weak topics",
        examples=[["Python", "Algorithms"]],
    )
    mistake_summary: Dict = Field(
        ...,
        description="Summary of mistakes by topic",
        examples=[{"Python": 2, "Algorithms": 1}],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "score": 7,
                "accuracy": 70.0,
                "mistakes": [
                    {
                        "question_id": "mcq_0",
                        "topic": "Python",
                        "concept": "Lists",
                        "user_answer": "B",
                        "correct_answer": "A",
                    }
                ],
                "weak_topics": ["Python"],
                "mistake_summary": {"Python": 1},
            }
        }
    )


class UserRead(BaseModel):
    """
    Schema for reading user information.
    """

    id: int = Field(..., description="Unique identifier for the user")
    user_id: str = Field(..., description="User identifier")
    weak_topics: list[str] | None = Field(
        default=None, description="Topics the user struggles with"
    )
    created_at: datetime = Field(..., description="UTC timestamp when user was created")

    @field_validator("weak_topics", mode="before")
    @classmethod
    def parse_weak_topics(cls, v):
        """Parse weak_topics JSON string to list."""
        if isinstance(v, str):
            return json.loads(v)
        return v

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    """
    Schema for updating user information.
    """

    weak_topics: list[str] | None = Field(
        default=None, description="Updated list of weak topics"
    )

    model_config = ConfigDict(
        json_schema_extra={"example": {"weak_topics": ["Python", "Databases"]}}
    )


class PersonalizedRecommendation(BaseModel):
    """
    Schema for personalized recommendations based on weak areas.
    """

    topic: str = Field(..., description="Weak topic area")
    priority: str = Field(
        ...,
        description="Priority level based on mistake frequency",
        examples=["high", "medium", "low"],
    )
    recommended_links: list[Dict[str, str]] = Field(
        ...,
        description="Recommended links with title and URL",
        examples=[
            [
                {
                    "title": "Python Lists Tutorial",
                    "url": "https://example.com/python-lists",
                }
            ]
        ],
    )
    key_concepts: list[str] = Field(
        ...,
        description="Key concepts to focus on",
        examples=[["List indexing", "List methods", "List comprehensions"]],
    )
    short_advice: str = Field(
        ...,
        description="Brief guidance for improvement",
        examples=["Revise list operations from the linked tutorial"],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "topic": "Python",
                "priority": "high",
                "recommended_links": [
                    {
                        "title": "Python Data Structures Guide",
                        "url": "https://example.com/python-data-structures",
                    }
                ],
                "key_concepts": ["Lists", "Dictionaries", "Tuples"],
                "short_advice": "Focus on list comprehensions and dictionary methods",
            }
        }
    )
