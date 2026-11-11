"""
JPL Horizons State Vector Schemas
Matches MIRA frontend HorizonsStateVector interface exactly.
"""

from typing import Optional
from pydantic import BaseModel

class Vector3D(BaseModel):
    x: float
    y: float
    z: float

class HorizonsStateVector(BaseModel):
    commandId: str
    targetName: str
    epochJd: float
    epochCalendarTdb: str
    positionAU: Vector3D
    positionKm: Vector3D
    velocityAuPerDay: Vector3D
    velocityKmPerSec: Vector3D
    totalSpeedKmPerSec: float
    distanceAU: float
    distanceKm: float
    lightTimeMinutes: float
    rangeRateKmPerSec: float
    rawText: str
    retrievedAt: int

class HorizonsQueryResponse(BaseModel):
    success: bool
    data: Optional[HorizonsStateVector] = None
    error: Optional[str] = None
