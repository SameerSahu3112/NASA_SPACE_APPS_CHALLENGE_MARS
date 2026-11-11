"""
Health and Status API Route
"""

from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "NASA Project MIRA Python Backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "features": {
            "ai_copilot": True,
            "jpl_horizons_proxy": True,
            "elevation_engine": True,
            "kepler_solver": True,
            "supabase_free": True,
        }
    }
