from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Report, Source
from schemas import ReportCreate, ReportRead, SourceCreate, SourceRead
from services import AIService
from utils import extract_youtube_video_id


class ReportRequest(BaseModel):
    source_ids: list[str] = []
    prompt: str = ""
    save: bool = False  # Optional: save report to database
    title: str | None = None  # Optional: report title


class CheatSheetRequest(BaseModel):
    topic: str = ""
    notes: str = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown event (if needed in future)


app = FastAPI(title="justBeforExam API", lifespan=lifespan)

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
def generate_cheat_sheet(payload: CheatSheetRequest) -> dict[str, object]:
    # Placeholder for modular AI provider service call
    return {
        "message": "Cheat sheet generator route is ready.",
        "received": payload.model_dump(),
    }
