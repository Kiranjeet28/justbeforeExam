"""Services module for justBeforExam backend"""


from .ai_service import AIService
from .upload_service import router as upload_router

__all__ = ["AIService", "upload_router"]
