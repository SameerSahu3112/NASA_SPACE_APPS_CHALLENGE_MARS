"""
Keplerian Mechanics & Planetary State Vector API Route
Endpoint: /api/kepler
"""

from fastapi import APIRouter, HTTPException, Query
from app.services.kepler_service import (
    compute_heliocentric_state,
    PLANET_ELEMENTS_J2000,
)

router = APIRouter(prefix="/kepler", tags=["kepler"])

@router.get("/planet/{planet_id}")
async def get_planet_kepler_state(
    planet_id: str,
    days_from_j2000: float = Query(0.0, description="Days elapsed since J2000.0 epoch (JD 2451545.0)"),
):
    """
    Computes precise Keplerian orbital elements and J2000 heliocentric
    state vectors for a given planet.
    """
    try:
        return compute_heliocentric_state(planet_id, days_from_j2000)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/system")
async def get_entire_solar_system(
    days_from_j2000: float = Query(0.0, description="Days elapsed since J2000.0 epoch"),
):
    """
    Computes J2000 heliocentric state vectors for all 8 major Solar System planets.
    """
    results = {}
    for p_id in PLANET_ELEMENTS_J2000.keys():
        results[p_id] = compute_heliocentric_state(p_id, days_from_j2000)
    return {
        "epochDaysFromJ2000": days_from_j2000,
        "planets": results,
    }
