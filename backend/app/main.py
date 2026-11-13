"""
NASA Project MIRA — Python Backend Application
FastAPI Production Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.health import router as health_router
from app.api.horizons import router as horizons_router
from app.api.copilot import router as copilot_router
from app.api.elevation import router as elevation_router
from app.api.kepler import router as kepler_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup banner
    print("=" * 60)
    print("🚀 NASA PROJECT MIRA — PYTHON BACKEND INITIALIZED")
    print(f"📡 Environment: {settings.ENVIRONMENT}")
    print(f"🌐 Host: {settings.HOST}:{settings.PORT}")
    print(f"🔒 CORS Origins: {settings.CORS_ORIGINS}")
    print("🛰️ Services: JPL Horizons, Copilot AI, Kepler Engine, MOLA Elevation")
    print("=" * 60)
    yield
    print("🛑 NASA PROJECT MIRA — PYTHON BACKEND SHUTDOWN COMPLETE")

app = FastAPI(
    title="NASA Project MIRA — Scientific Backend API",
    description="Python/FastAPI backend powering NASA Project MIRA planetary exploration atlas.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for seamless communication with frontend Vite/React
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(health_router)  # Also allow direct /health
app.include_router(horizons_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")
app.include_router(elevation_router, prefix="/api")
app.include_router(kepler_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "project": "NASA Project MIRA",
        "description": "Martian Interactive Reconnaissance Atlas Python Backend",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "horizons": "/api/horizons",
            "copilot": "/api/copilot/chat",
            "elevation": "/api/elevation",
            "kepler_planet": "/api/kepler/planet/{planet_id}",
            "kepler_system": "/api/kepler/system",
        }
    }
