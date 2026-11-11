"""
Copilot Request and Response Schemas
Matches MIRA frontend TypeScript interfaces exactly.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, model_validator

class ParsedCoordinate(BaseModel):
    name: str
    latitude: float
    longitude: float
    altitudeMeters: Optional[float] = None

class CopilotAction(BaseModel):
    type: str
    payload: Optional[Dict[str, Any]] = None

class CopilotCitation(BaseModel):
    label: str
    sourceUrl: str
    datasetName: str

class TelemetrySnapshot(BaseModel):
    lat: float
    lon: float
    altitudeKm: float
    nearestLandmark: Optional[str] = None

class CopilotChatRequest(BaseModel):
    prompt: str = ""
    message: Optional[str] = None
    query: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None
    activeTab: Optional[str] = "mars"
    activePlanet: Optional[str] = "mars"
    apiKey: Optional[str] = None  # Optional user override

    @model_validator(mode="before")
    @classmethod
    def ensure_prompt(cls, data: Any) -> Any:
        if isinstance(data, dict):
            p = data.get("prompt") or data.get("message") or data.get("query") or ""
            data["prompt"] = str(p)
        return data

class CopilotChatResponse(BaseModel):
    id: str
    content: str
    spokenText: str
    sourceTier: str = "TIER_1_MIRA_DATASET"
    sourceLabel: str = "MIRA NASA Scientific Database"
    action: Optional[CopilotAction] = None
    navigationTarget: Optional[ParsedCoordinate] = None
    citations: List[CopilotCitation] = Field(default_factory=list)
    telemetrySnapshot: Optional[TelemetrySnapshot] = None
