"""
Mars Elevation Query Schemas
"""

from typing import Optional
from pydantic import BaseModel

class ElevationQueryResponse(BaseModel):
    latitude: float
    longitude: float
    elevationMeters: Optional[float] = None
    dataset: str
    status: str
    resolutionMeters: float = 200.0
    referenceSurface: str = "MOLA_AREOID"
