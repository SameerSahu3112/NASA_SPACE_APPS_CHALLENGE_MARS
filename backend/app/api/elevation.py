"""
Mars Elevation Query API Route
Endpoint: /api/elevation
"""

from fastapi import APIRouter, Query
import httpx

from app.schemas.elevation import ElevationQueryResponse
from app.services.elevation_service import get_mars_elevation

router = APIRouter(tags=["elevation"])

@router.get("/elevation", response_model=ElevationQueryResponse)
async def query_elevation(
    lat: float = Query(..., description="Latitude in degrees (-90 to +90)"),
    lon: float = Query(..., description="Longitude in degrees (-180 to +180 or 0 to 360)"),
):
    """
    Returns verified surface elevation (meters above MOLA areoid)
    from USGS HRSC/MOLA 200m DEM or authoritative regional ground truth.
    """
    async with httpx.AsyncClient(timeout=8.0) as client:
        return await get_mars_elevation(lat, lon, client=client)
