from fastapi import APIRouter
from models.schemas import HealthResponse
from services.model_service import model_service
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        model_loaded=model_service.is_loaded,
        timestamp=datetime.now().isoformat()
    )