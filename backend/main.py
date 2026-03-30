from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.api_core import exceptions as google_api_exceptions
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from youtube_transcript_api._errors import YouTubeTranscriptApiException

from database import Base, engine, get_db
from rag.config import ModelConfig
from rag.processor import StudyMaterialEngine, MultiModelNotesGenerator
from rag.agent import run_agent
from models import Report, Source
from schemas import ReportCreate, ReportRead, SourceCreate, SourceRead
from services import AIService, upload_router
from services.ai_service import RateLimitExceeded
from services.artifact_service import ArtifactTransformationService
from services.youtube_transcript_service import (
    fetch_youtube_transcript_bundle,
    transcript_api_user_message,
)
from utils import extract_youtube_video_id


class ReportRequest(BaseModel):
    source_ids: list[str] = []
    prompt: str = ""
    save: bool = False  # Optional: save report to database
    title: str | None = None  # Optional: report title


class CheatSheetRequest(BaseModel):
    source_ids: list[int] = []
    topic: str = ""


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


class TransformNotesRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        description="Generated study notes to transform into artifacts",
    )


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
    Generate Markdown exam notes from source text with three-tier fallback:
    
    TIER 1 (Primary): Groq
    TIER 2 (Fallback): HuggingFace (if Groq rate limited)
    TIER 3 (Error): Return error with countdown timer
    
    Returns rate limit info if all providers are exhausted.
    """
    try:
        generator = MultiModelNotesGenerator()
        result = generator.generate_full_notes(payload.content)
        
        # If rate limited, return 429 with retry info
        if result["status"] == "rate_limited":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": result["error"],
                    "message": result["content"],
                    "retry_after": result["retry_after"],
                    "retry_at": result["retry_at"],
                }
            )
        
        # Success - return notes with metadata
        response = {
            "markdown": result["content"],
            "model": result["engine"],
            "engine_used": result["engine"],
            "status": result["status"],
        }
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except HTTPException:
        raise  # Re-raise HTTPException for rate limits
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e


@app.post("/api/transform-notes")
def transform_notes_to_artifacts(payload: TransformNotesRequest) -> dict[str, Any]:
    """
    Transform generated study notes into specialized artifacts:
    
    - Artifact A (Cheat Sheet): Bullet-pointed summary with LaTeX formulas
    - Artifact B (Mind Map): Hierarchical JSON structure
    
    Uses Qwen2.5-72B-Instruct model for transformation.
    """
    try:
        service = ArtifactTransformationService()
        result = service.generate_study_artifacts(payload.content)
        
        if not result["success"]:
            # Some or all artifacts failed
            if result["metadata"]["errors"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "message": "Artifact generation partially failed",
                        "errors": result["metadata"]["errors"],
                        "cheat_sheet": result["cheat_sheet"],
                        "mind_map": result["mind_map"],
                    }
                )
        
        return {
            "success": True,
            "artifacts": {
                "cheat_sheet": result["cheat_sheet"],
                "mind_map": result["mind_map"],
            },
            "metadata": result["metadata"],
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except HTTPException:
        raise  # Re-raise HTTPException for partial failures
    except RuntimeError as e:
        # Check if it's a rate limit error
        if "rate limited" in str(e).lower() or "429" in str(e):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": str(e),
                    "message": "Artifact transformation service rate limited. Please retry in a moment.",
                }
            ) from e
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Artifact transformation failed: {str(e)}",
        ) from e


@app.post("/api/youtube/transcript")
def youtube_transcript(payload: YouTubeTranscriptRequest) -> dict[str, Any]:
    """
    Return timed captions and oEmbed title/channel for a YouTube video.
    """
    try:
        return fetch_youtube_transcript_bundle(payload.url.strip())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except YouTubeTranscriptApiException as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=transcript_api_user_message(e),
        ) from e


@app.post("/api/sources", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")

    db.delete(source)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/generate-report")
def generate_report(payload: ReportRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Generate a comprehensive study report from saved sources.
    Fetches all or specified sources from the database, concatenates their content,
    and uses the modular AI service to generate a formatted Markdown report.
    """
    try:
        # Fetch sources from database
        if payload.source_ids:
            sources = db.query(Source).filter(Source.id.in_(payload.source_ids)).all()
        else:
            sources = db.query(Source).all()

        if not sources:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No sources found. Please add some sources first.",
            )

        # Concatenate source content
        sources_text = "\n\n---\n\n".join(
            [f"[{source.type.upper()}] {source.content}" for source in sources]
        )

        # Initialize AI service
        ai_service = AIService()

        # Generate report
        report = ai_service.generate_study_report(sources_text)

        return {
            "success": True,
            "report": report,
            "sources_count": len(sources),
            "provider": ai_service.provider_name,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post("/api/generate-notes")
def generate_notes(db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Generate comprehensive study notes from all saved sources using RAG.
    Fetches all sources, uses RAG to generate formatted Markdown notes with citations.
    """
    try:
        # Fetch all sources from database
        sources = db.query(Source).all()

        if not sources:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No sources found. Please add some sources first.",
            )

        # Convert sources to format expected by RAG
        sources_data = [
            {
                "id": source.id,
                "type": source.type,
                "content": source.content,
            }
            for source in sources
        ]

        # Initialize AI service
        ai_service = AIService()

        # Generate study notes with RAG
        result = ai_service.generate_notes_with_rag(sources_data)

        return {
            "success": True,
            "notes": result["notes"],
            "citations": result.get("citations", []),
            "sources_count": result.get("sources_count", len(sources)),
            "provider": result.get("provider", "unknown"),
        }

    except RateLimitExceeded as e:
        # Return 429 with clear rate limit message
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post("/api/generate-notes-legacy")
def generate_notes_legacy(db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Legacy endpoint: Generate study notes without RAG (concatenation-based).
    Kept for backward compatibility.
    """
    try:
        # Fetch all sources from database
        sources = db.query(Source).all()

        if not sources:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No sources found. Please add some sources first.",
            )

        # Concatenate source content
        sources_text = "\n\n---\n\n".join(
            [f"[{source.type.upper()}] {source.content}" for source in sources]
        )

        # Initialize AI service
        ai_service = AIService()

        # Generate study notes (legacy method)
        notes = ai_service.generate_study_notes(sources_text)

        return {
            "success": True,
            "notes": notes,
            "sources_count": len(sources),
            "provider": ai_service.provider_name,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}",
        )


@app.post("/api/reports", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
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
def generate_cheat_sheet(payload: CheatSheetRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Generate a cheat sheet/study notes from specified sources using Hugging Face RAG.
    
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
        
        # Fetch sources from database
        sources = db.query(Source).filter(Source.id.in_(payload.source_ids)).all()
        
        if not sources:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No sources found with the provided IDs",
            )
        
        # Extract text from sources
        from services.ai_service import TextExtractor
        
        source_texts = []
        for source in sources:
            if source.type == "video" and source.video_id:
                # Extract YouTube transcript
                text = TextExtractor.extract_from_youtube(source.video_id)
            elif source.type == "link":
                # Extract from URL
                text = TextExtractor.extract_from_url(source.content)
            else:
                # Use content directly for notes
                text = source.content
            
            source_texts.append(text)
        
        # Generate notes using Hugging Face RAG
        ai_service = AIService()
        result = ai_service.generate_rag_notes(source_texts, topic=payload.topic)
        
        return {
            "success": True,
            "notes": result["notes"],
            "sources_count": result["sources_count"],
            "provider": result["provider"],
            "topic": payload.topic,
        }
    
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )
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
