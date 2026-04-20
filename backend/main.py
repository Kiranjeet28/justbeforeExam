import json
from contextlib import asynccontextmanager
from typing import Any, List

from database import Base, engine, get_db
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.api_core import exceptions as google_api_exceptions
from models import LinkUsage, Quiz, QuizResult, Report, Source, User, UserLink
from pipeline.orchestrator import get_orchestrator
from pydantic import BaseModel, Field
from rag.agent import run_agent
from rag.personalized_links import (
    get_personalized_links_manager,
    preprocess_and_store_link,
    retrieve_personalized_links,
    track_link_access,
)
from rag.personalized_recommendations import (
    generate_personalized_recommendations,
    get_personalized_recommendations,
)
from rag.quiz_evaluation import evaluate_quiz_answers
from rag.quiz_generator import generate_quiz, save_quiz
from schemas import (
    PersonalizedRecommendation,
    QuizEvaluation,
    QuizGenerateRequest,
    QuizListResponse,
    QuizRead,
    QuizSubmission,
    ReportCreate,
    ReportRead,
    SourceCreate,
    SourceRead,
    UserLinkCreate,
    UserLinkListResponse,
    UserLinkRead,
    UserRead,
    UserUpdate,
)
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


class CheatSheetRequest(BaseModel):
    source_ids: list[int] = Field(
        ..., description="List of source IDs to generate cheat sheet from"
    )
    topic: str | None = None  # Optional: specific topic focus


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
            result = run_agent(payload.topic, payload.thread_id or "")

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
        result = run_agent(payload.topic, payload.thread_id or "")

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


@app.post(
    "/api/user-links", response_model=UserLinkRead, status_code=status.HTTP_201_CREATED
)
def add_user_link(payload: UserLinkCreate, db: Session = Depends(get_db)) -> UserLink:
    """Add and process a personalized link for a user."""
    try:
        result = preprocess_and_store_link(payload.user_id, payload.url, payload.title)

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"],
            )

        # Fetch the created link
        link = db.query(UserLink).filter(UserLink.id == result["link_id"]).first()
        if not link:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Link created but not found",
            )

        return link

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add link: {str(e)}",
        )


@app.get("/api/user-links", response_model=UserLinkListResponse)
def get_user_links(
    user_id: str,
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
    topic: str | None = None,
) -> UserLinkListResponse:
    """Retrieve user's links with optional topic filtering."""
    query = db.query(UserLink).filter(UserLink.user_id == user_id)

    if topic:
        query = query.filter(UserLink.topic.ilike(f"%{topic}%"))

    total = query.count()
    links = (
        query.order_by(UserLink.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return UserLinkListResponse(
        items=links, total=total, page=page, page_size=page_size
    )


@app.get("/api/user-links/{link_id}", response_model=UserLinkRead)
def get_user_link(
    link_id: int, user_id: str, db: Session = Depends(get_db)
) -> UserLink:
    """Retrieve a specific user link."""
    link = (
        db.query(UserLink)
        .filter(UserLink.id == link_id, UserLink.user_id == user_id)
        .first()
    )

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found",
        )

    # Track access
    track_link_access(user_id, link_id)

    return link


@app.delete("/api/user-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_link(
    link_id: int, user_id: str, db: Session = Depends(get_db)
) -> Response:
    """Delete a user link."""
    manager = get_personalized_links_manager()
    success = manager.delete_link(user_id, link_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found or deletion failed",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/user-links/search")
def search_user_links(
    user_id: str,
    query: str = Field(..., min_length=1, description="Search query"),
    topic: str | None = None,
    top_k: int = 10,
) -> dict[str, object]:
    """Search personalized links using vector similarity."""
    try:
        results = retrieve_personalized_links(user_id, query, topic, top_k)

        return {
            "success": True,
            "query": query,
            "results": results,
            "total": len(results),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@app.post("/api/quiz/evaluate", response_model=QuizEvaluation)
def evaluate_quiz_endpoint(payload: QuizSubmission) -> QuizEvaluation:
    """Evaluate quiz answers and detect weak areas."""
    try:
        result = evaluate_quiz_answers(
            payload.user_id, payload.quiz_id, payload.answers
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}",
        )


@app.get("/api/users/{user_id}", response_model=UserRead)
def get_user(user_id: str, db: Session = Depends(get_db)) -> User:
    """Get user information including weak topics."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@app.put("/api/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: str, payload: UserUpdate, db: Session = Depends(get_db)
) -> User:
    """Update user information."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if payload.weak_topics is not None:
        user.weak_topics = json.dumps(payload.weak_topics)

    db.commit()
    db.refresh(user)
    return user


@app.get("/api/quiz-results", response_model=list[dict])
def get_quiz_results(
    user_id: str,
    db: Session = Depends(get_db),
    limit: int = 10,
) -> list[dict]:
    """Get user's quiz results."""
    results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == user_id)
        .order_by(QuizResult.created_at.desc())
        .limit(limit)
        .all()
    )

    # Parse JSON fields for response
    response = []
    for r in results:
        response.append(
            {
                "id": r.id,
                "quiz_id": r.quiz_id,
                "score": r.score,
                "accuracy": r.accuracy,
                "answers": json.loads(r.answers),
                "mistakes": json.loads(r.mistakes) if r.mistakes else [],
                "created_at": r.created_at,
            }
        )

    return response


@app.post("/api/recommendations", response_model=List[PersonalizedRecommendation])
def get_personalized_recommendations_endpoint(
    user_id: str, weak_topics: List[str]
) -> List[PersonalizedRecommendation]:
    """Generate personalized recommendations based on weak areas."""
    try:
        recommendations = generate_personalized_recommendations(user_id, weak_topics)
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation failed: {str(e)}",
        )


@app.post("/api/link-feedback")
def track_link_feedback(
    user_id: str, link_id: int, time_spent: int, clicked: bool = True
):
    """Track link usage feedback for adaptive recommendations."""
    try:
        recommender = get_personalized_recommendations()
        recommender.track_link_feedback(user_id, link_id, time_spent, clicked)
        return {"status": "feedback recorded"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback tracking failed: {str(e)}",
        )


@app.post("/api/link-performance")
def update_link_performance(user_id: str, link_id: int, improvement_score: float):
    """Update performance boost for links that improved quiz scores."""
    try:
        recommender = get_personalized_recommendations()
        recommender.update_performance_boost(user_id, link_id, improvement_score)
        return {"status": "performance updated"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Performance update failed: {str(e)}",
        )


@app.post("/api/generate-quiz")
def generate_quiz_endpoint(payload: QuizGenerateRequest) -> dict[str, object]:
    """
    Generate a quiz using RAG from database sources.

    Input: topic or notes string
    Returns: structured quiz JSON with mcqs, short_questions, source_mapping
    """
    try:
        quiz_data = generate_quiz(payload.input)

        return {
            "success": True,
            "quiz": quiz_data,
            "topic": payload.input,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}",
        )


@app.post("/api/quizzes", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
def save_quiz_endpoint(
    payload: QuizGenerateRequest, db: Session = Depends(get_db)
) -> Quiz:
    """Generate and save a quiz to the database."""
    try:
        quiz_data = generate_quiz(payload.input)
        quiz = save_quiz(payload.input, quiz_data)

        return quiz

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}",
        )


@app.get("/api/quizzes", response_model=list[QuizRead])
def get_quizzes(db: Session = Depends(get_db), limit: int = 50) -> list[Quiz]:
    """Retrieve saved quizzes (most recent first)."""
    return db.query(Quiz).order_by(Quiz.created_at.desc()).limit(limit).all()


@app.get("/api/quizzes/{quiz_id}", response_model=QuizRead)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)) -> Quiz:
    """Retrieve a specific quiz by ID."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    return quiz


@app.delete("/api/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)) -> Response:
    """Delete a saved quiz."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    db.delete(quiz)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
