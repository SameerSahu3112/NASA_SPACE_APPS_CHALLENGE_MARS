"""
NASA Project MIRA — Backend Configuration
Zero-dependency robust settings loader using standard library and Pydantic v2.
"""

import os
from pathlib import Path
from typing import List
from pydantic import BaseModel, Field

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"

def load_dotenv(env_path: Path):
    """Simple, robust .env reader without requiring python-dotenv."""
    if not env_path.is_file():
        return
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'").strip('"')
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"[Config] Warning loading .env: {e}")

# Load .env file if present
load_dotenv(ENV_FILE)

class Settings(BaseModel):
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "127.0.0.1"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "true").lower() in ("true", "1", "yes"))
    
    # CORS
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://10.139.249.230:5173,http://172.16.61.166:5173",
        ).split(",")
        if origin.strip()
    ])
    
    # AI Copilot
    GEMINI_API_KEY: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # NASA JPL Horizons
    HORIZONS_API_BASE_URL: str = Field(
        default_factory=lambda: os.getenv("HORIZONS_API_BASE_URL", "https://ssd.jpl.nasa.gov/api/horizons.api")
    )
    HORIZONS_CACHE_TTL_SECONDS: int = Field(
        default_factory=lambda: int(os.getenv("HORIZONS_CACHE_TTL_SECONDS", "3600"))
    )
    
    # USGS BigTIFF
    USGS_S3_DEM_URL: str = Field(
        default_factory=lambda: os.getenv(
            "USGS_S3_DEM_URL",
            "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif"
        )
    )

settings = Settings()
