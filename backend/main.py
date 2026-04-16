from contextlib import asynccontextmanager
from typing import Any

from database import Base, engine, get_db
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.api_core import exceptions as google_api_exceptions
from models import Report, Source
from pipeline.orchestrator import get_orchestrator
from pydantic import BaseModel, Field
from rag.agent import run_agent
from schemas import ReportCreate, ReportRead, SourceCreate, SourceRead
from services import upload_router
from services.youtube_transcript_service import (
    fetch_youtube_transcript_bundle,
    transcript_api_user_message,
)
from sqlalchemy.orm import Session
from utils import extract_youtube_video_id
from youtube_transcript_api._errors import YouTubeTranscriptApiException


class ReportRequest(BaseModel):
    source_ids: list[str] = []
    prompt: str = ""
    save: bool = False  # Optional: save report to database
    title: str | None = None  # Optional: report title


class YouTubeTranscriptRequest(BaseModel):
    url: str = Field(..., min_length=4, description="Full YouTube watch or share URL")


class GenerateV1Request(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        description="Raw text from user sources (transcripts, article extracts, pasted notes).",
    )


class AgenticRagRequest(BaseModel):
    topic: str = Field(..., min_length=1, description="Exam topic to prepare notes for")
    thread_id: str | None = None  # Optional: session continuity


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown event (if needed in future)


app = FastAPI(title="justBeforExam API", lifespan=lifespan)
app.include_router(upload_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/generate")
def api_v1_generate_study_notes(payload: GenerateV1Request) -> dict:
    """
    Generate Markdown exam notes from source text using the modular pipeline.

    Uses smart LLM switching: Groq primary with Gemini fallback.
    """
    try:
        orchestrator = get_orchestrator()

        # Create temporary source-like data for the pipeline
        input_data = {
            "combined_text": payload.content,
            "sources": [{"content": payload.content[:200] + "..."}],
            "total_sources": 1,
        }

        # Build prompt and generate
        prompt = f"""Create comprehensive study notes from the following content:

{payload.content}

Please structure the notes with:
- Clear headings and subheadings
- Key concepts and definitions
- Important examples and explanations
- Study tips and mnemonics
- Practice questions where relevant

Format as clean, readable markdown."""

        from pipeline.models.model_wrapper import get_model_registry

        model_registry = get_model_registry()
        model = model_registry.get("smart-llm")

        if not model:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Smart LLM not available",
            )

        result = model.generate(prompt)

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Model generation failed: {result.get('error', 'Unknown error')}",
            )

        from pipeline.postprocessing.post_processor import PostProcessor

        post_processor = PostProcessor()
        formatted_notes = post_processor.format_study_notes(result["content"])

        return {
            "markdown": formatted_notes,
            "model": result["model"],
            "engine_used": result["model"],
            "status": "success",
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e


@app.post("/api/youtube/transcript")
def youtube_transcript(payload: YouTubeTranscriptRequest) -> dict[str, Any]:
    """
    Return timed captions and oEmbed title/channel for a YouTube video.
    """
    try:
        return fetch_youtube_transcript_bundle(payload.url.strip())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except YouTubeTranscriptApiException as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=transcript_api_user_message(e),
        ) from e


@app.post(
    "/api/sources", response_model=SourceRead, status_code=status.HTTP_201_CREATED
)
def add_source(payload: SourceCreate, db: Session = Depends(get_db)) -> Source:
    content = payload.content.strip()
    video_id = extract_youtube_video_id(content) if payload.type == "video" else None

    source = Source(type=payload.type, content=content, video_id=video_id)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@app.get("/api/sources", response_model=list[SourceRead])
def get_sources(db: Session = Depends(get_db)) -> list[Source]:
    return db.query(Source).order_by(Source.timestamp.desc()).all()


@app.delete("/api/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: int, db: Session = Depends(get_db)) -> Response:
    source = db.query(Source).filter(Source.id == source_id).first()
    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    db.delete(source)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/generate-report")
def generate_report(
    payload: ReportRequest, db: Session = Depends(get_db)
) -> dict[str, object]:
    """
    Generate a comprehensive study report from saved sources using the pipeline.
    """
    try:
        orchestrator = get_orchestrator()

        # Convert string IDs to integers
        source_ids = None
        if payload.source_ids:
            try:
                source_ids = [int(sid) for sid in payload.source_ids if sid.strip()]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid source_ids format",
                )

        result = orchestrator.generate_study_notes(source_ids=source_ids)

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Report generation failed: {result.get('error', 'Unknown error')}",
            )

        return {
            "success": True,
            "report": result["notes"],
            "sources_count": result["metadata"]["sources_count"],
            "provider": result["metadata"]["model_used"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post("/api/generate-notes")
def generate_notes(db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Generate comprehensive study notes from all saved sources using the pipeline.
    """
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.generate_study_notes()

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Notes generation failed: {result.get('error', 'Unknown error')}",
            )

        return {
            "success": True,
            "notes": result["notes"],
            "citations": [],  # Pipeline doesn't provide citations yet
            "sources_count": result["metadata"]["sources_count"],
            "provider": result["metadata"]["model_used"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post("/api/generate-notes-legacy")
def generate_notes_legacy(db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Legacy endpoint: Generate study notes using the pipeline (backward compatibility).
    """
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.generate_study_notes()

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Notes generation failed: {result.get('error', 'Unknown error')}",
            )

        return {
            "success": True,
            "notes": result["notes"],
            "sources_count": result["metadata"]["sources_count"],
            "provider": result["metadata"]["model_used"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post(
    "/api/reports", response_model=ReportRead, status_code=status.HTTP_201_CREATED
)
def save_report(payload: ReportCreate, db: Session = Depends(get_db)) -> Report:
    """Save a generated report to the database."""
    try:
        report = Report(
            content=payload.content,
            title=payload.title or "Untitled Report",
            source_ids=payload.source_ids or "all",
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save report: {str(e)}",
        )


@app.get("/api/reports", response_model=list[ReportRead])
def get_reports(db: Session = Depends(get_db), limit: int = 50) -> list[Report]:
    """Retrieve saved reports (most recent first)."""
    return db.query(Report).order_by(Report.timestamp.desc()).limit(limit).all()


@app.get("/api/reports/{report_id}", response_model=ReportRead)
def get_report(report_id: int, db: Session = Depends(get_db)) -> Report:
    """Retrieve a specific report by ID."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    return report


@app.delete("/api/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: int, db: Session = Depends(get_db)) -> Response:
    """Delete a saved report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    db.delete(report)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/generate-cheat-sheet")
def generate_cheat_sheet(
    payload: CheatSheetRequest, db: Session = Depends(get_db)
) -> dict[str, object]:
    """
    Generate a cheat sheet/study notes from specified sources using the pipeline.

    Args:
        payload: CheatSheetRequest with source_ids and optional topic
        db: Database session

    Returns:
        Dict with generated notes and sources_count
    """
    try:
        # Validate input
        if not payload.source_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please specify at least one source_id",
            )

        orchestrator = get_orchestrator()
        result = orchestrator.generate_study_notes(
            source_ids=payload.source_ids, topic=payload.topic
        )

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cheat sheet generation failed: {result.get('error', 'Unknown error')}",
            )

        return {
            "success": True,
            "notes": result["notes"],
            "sources_count": result["metadata"]["sources_count"],
            "provider": result["metadata"]["model_used"],
            "topic": payload.topic,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post("/api/agent/generate-notes-streaming")
async def generate_notes_streaming(payload: AgenticRagRequest):
    """
    Stream exam notes generation with real-time status updates using the agentic RAG.

    Returns a streaming response with status updates like:
    - "📋 Planning research strategy..."
    - "🔍 Researching '[topic]'..."
    - "⚡ Groq rate limited - Switched to Gemini..."
    - "✓ Formatting complete"

    Final message contains the complete notes.
    """

    def generate_stream():
        try:
            # Run the agent
            result = run_agent(payload.topic, payload.thread_id)

            # Stream status updates first
            for status_msg in result.get("status_updates", []):
                yield f"data: {{'status': '{status_msg}'}}\n\n"

            # Stream the final notes
            yield f"data: {{'type': 'final', 'notes': {repr(result.get('notes', ''))}}}\n\n"

            # Stream metadata
            yield f"data: {{'type': 'metadata', 'context_length': {len(result.get('context_data', ''))}, 'web_search_performed': {bool(result.get('web_research'))}}}\n\n"

        except Exception as e:
            yield f"data: {{'error': '{str(e)}'}}\n\n"

    return StreamingResponse(generate_stream(), media_type="text/event-stream")


@app.post("/api/agent/generate-notes")
def generate_notes_with_agent(payload: AgenticRagRequest) -> dict[str, object]:
    """
    Generate exam notes using the agentic RAG with:
    - HuggingFace embeddings + FAISS vector store retrieval
    - Groq LLM with intelligent Gemini fallback
    - Multi-stage pipeline: Planner → Researcher → Writer → Formatter

    Returns:
        Complete result including notes, status updates, and metadata
    """
    try:
        result = run_agent(payload.topic, payload.thread_id)

        return {
            "success": True,
            "topic": result.get("topic"),
            "notes": result.get("notes"),
            "status_updates": result.get("status_updates", []),
            "context_data": result.get("context_data", ""),
            "web_research": result.get("web_research", ""),
            "research_plan": result.get("research_plan", ""),
            "draft_notes": result.get("draft_notes", ""),
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )
