import os
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
import uuid
from typing import Optional

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_FILE_SIZE_MB = 50
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: Optional[str] = None  # Optionally get from auth if available
):
    # Validate extension
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    # Validate size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail="File too large (max 50 MB).")

    # Unique file name
    unique_name = f"{uuid.uuid4().hex}_{int(datetime.utcnow().timestamp())}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Optionally store metadata in DB (pseudo-code, adapt as needed)
    # db.add(UploadedFile(...))
    # db.commit()

    return JSONResponse({
        "success": True,
        "filename": unique_name,
        "original_filename": file.filename,
        "size_mb": round(size_mb, 2),
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
    })
