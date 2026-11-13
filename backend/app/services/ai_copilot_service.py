"""
MIRA Scientific AI Copilot Service (Python)
Hierarchical NASA-First Intelligence & Full Website Operator
"""

import re
import uuid
from typing import Dict, Any, Optional, List, Tuple
import httpx

from app.config import settings
from app.schemas.copilot import (
    CopilotChatRequest,
    CopilotChatResponse,
    CopilotAction,
    ParsedCoordinate,
    CopilotCitation,
)
from app.utils.speech_normalizer import normalize_speech_text

# Authoritative Mars Landmark Catalog
LANDMARKS_CATALOG: Dict[str, Dict[str, Any]] = {
    "jezero crater": {
        "name": "Jezero Crater",
        "latitude": 18.38,
        "longitude": 77.58,
        "altitudeMeters": 450000,
        "terrainAltitudeMeters": 35000,
        "elevationMeters": -2500,
        "summary": "Jezero Crater is a 45-km-wide impact basin hosting an ancient fan-delta deposited approximately 3.7 billion years ago by a paleolake breach. Active landing site of NASA's Mars 2020 Perseverance rover.",
    },
    "olympus mons": {
        "name": "Olympus Mons",
        "latitude": 18.65,
        "longitude": -133.8,
        "altitudeMeters": 900000,
        "terrainAltitudeMeters": 45000,
        "elevationMeters": 21287,
        "summary": "Olympus Mons is the largest volcano in the Solar System, rising over 21.2 km above the MOLA datum with a 600-km-wide shield formed by slow-cooling basaltic lava flows.",
    },
    "valles marineris": {
        "name": "Valles Marineris",
        "latitude": -13.9,
        "longitude": -59.2,
        "altitudeMeters": 1200000,
        "terrainAltitudeMeters": 50000,
        "elevationMeters": -7000,
        "summary": "Valles Marineris is a massive canyon system spanning over 4,000 km along the Martian equator, reaching depths of up to 7 km and widths of 200 km.",
    },
    "gale crater": {
        "name": "Gale Crater",
        "latitude": -5.4,
        "longitude": 137.8,
        "altitudeMeters": 500000,
        "terrainAltitudeMeters": 35000,
        "elevationMeters": -4400,
        "summary": "Gale Crater is a 154-km impact basin centered on Aeolis Mons (Mount Sharp). Explored by NASA's Curiosity rover, confirming ancient habitable fluvio-lacustrine environments.",
    },
    "south polar cap": {
        "name": "South Polar Cap",
        "latitude": -85.0,
        "longitude": 0.0,
        "altitudeMeters": 900000,
        "terrainAltitudeMeters": 40000,
        "elevationMeters": 3200,
        "summary": "Planum Australe consists of layered deposits of water ice and dust capped by a seasonal 8-meter dry ice (CO2) slab.",
    },
    "north polar cap": {
        "name": "North Polar Cap",
        "latitude": 85.0,
        "longitude": 0.0,
        "altitudeMeters": 900000,
        "terrainAltitudeMeters": 40000,
        "elevationMeters": -2000,
        "summary": "Planum Boreum consists of permanent water-ice spiral troughs and layered deposits surrounded by Vastitas Borealis.",
    },
    "phobos": {
        "name": "Phobos",
        "summary": "Phobos is the larger inner moon of Mars, orbiting at 9,376 km with an orbital period of 7.65 hours. Tidally locked and spiraling inward at ~1.8 cm/year.",
    },
    "deimos": {
        "name": "Deimos",
        "summary": "Deimos is the outer moon of Mars, orbiting at 23,463 km with a 30.3-hour orbital period. Characterized by a thick regolith blanket filling craters.",
    },
}

PLANETS_CATALOG: Dict[str, Dict[str, Any]] = {
    "mercury": {"id": "mercury", "name": "Mercury", "period": "87.97 days", "distance": "0.387 AU"},
    "venus": {"id": "venus", "name": "Venus", "period": "224.70 days", "distance": "0.723 AU"},
    "earth": {"id": "earth", "name": "Earth", "period": "365.25 days", "distance": "1.000 AU"},
    "mars": {"id": "mars", "name": "Mars", "period": "686.98 days", "distance": "1.524 AU"},
    "jupiter": {"id": "jupiter", "name": "Jupiter", "period": "11.86 years", "distance": "5.204 AU"},
    "saturn": {"id": "saturn", "name": "Saturn", "period": "29.45 years", "distance": "9.582 AU"},
    "uranus": {"id": "uranus", "name": "Uranus", "period": "84.02 years", "distance": "19.20 AU"},
    "neptune": {"id": "neptune", "name": "Neptune", "period": "164.8 years", "distance": "30.05 AU"},
}

def parse_navigation_intent(prompt: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    """Recognizes navigation and control commands from user prompt."""
    p = prompt.lower().strip()

    # 1. Coordinate matching: e.g. "18.38 N, 77.58 E" or "-13.9, -59.2"
    coord_m = re.search(
        r'(-?\d+(?:\.\d+)?)\s*°?\s*([NSns])?\s*[,/ ]+\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EWew])?',
        p
    )
    if coord_m:
        val1, dir1, val2, dir2 = coord_m.groups()
        lat = float(val1)
        lon = float(val2)
        if dir1 and dir1.upper() == 'S': lat = -abs(lat)
        if dir2 and dir2.upper() == 'W': lon = -abs(lon)

        is_terrain = any(w in p for w in ['terrain', 'surface', 'ground', '3d terrain', 'fly me', 'land'])
        return (
            "NAVIGATE_TERRAIN" if is_terrain else "NAVIGATE_MARS",
            {
                "target": {
                    "name": f"Coordinates ({lat:.2f}°, {lon:.2f}°)",
                    "latitude": lat,
                    "longitude": lon,
                    "altitudeMeters": 35000 if is_terrain else 450000,
                }
            }
        )

    # 2. Named Landmark matching
    for key, data in LANDMARKS_CATALOG.items():
        if key in p:
            is_terrain = any(w in p for w in ['terrain', 'surface', 'ground', 'fly', 'take me', 'zoom into'])
            target = {
                "name": data["name"],
                "latitude": data.get("latitude", 0),
                "longitude": data.get("longitude", 0),
                "altitudeMeters": data.get("terrainAltitudeMeters", 35000) if is_terrain else data.get("altitudeMeters", 450000),
            }
            return (
                "NAVIGATE_TERRAIN" if is_terrain else "NAVIGATE_MARS",
                {"target": target, "landmark": data}
            )

    # 3. Solar System actions
    if any(w in p for w in ['solar system', 'orbits', 'heliocentric', 'show planets']):
        return ("OPEN_SOLAR_SYSTEM", {})

    for p_key, p_data in PLANETS_CATALOG.items():
        if f"focus {p_key}" in p or f"show {p_key}" in p or f"planet {p_key}" in p:
            return ("FOCUS_PLANET", {"planetId": p_data["id"]})

    # 4. Moon actions
    if 'phobos' in p:
        return ("FOCUS_MOON", {"moonId": "phobos"})
    if 'deimos' in p:
        return ("FOCUS_MOON", {"moonId": "deimos"})
    if any(w in p for w in ['return to mars', 'back to mars']):
        return ("RETURN_TO_MARS", {})

    # 5. Lighting / Scene mode
    if 'solar mode' in p or 'sunlight' in p:
        return ("SET_LIGHTING", {"mode": "solar"})
    if 'ambient mode' in p:
        return ("SET_LIGHTING", {"mode": "ambient"})

    return None

async def query_gemini_api(
    prompt: str,
    api_key: str,
    system_prompt: str,
    client: Optional[httpx.AsyncClient] = None
) -> Optional[str]:
    """Asynchronously calls Google Gemini 2.5 Flash API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 600,
        }
    }

    close_client = client is None
    active_client = client if client is not None else httpx.AsyncClient(timeout=12.0)

    try:
        res = await active_client.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        return None
    except Exception:
        return None
    finally:
        if close_client:
            await active_client.aclose()

def generate_scientific_knowledge_response(prompt: str, parsed_action: Optional[Tuple[str, Dict[str, Any]]]) -> Tuple[str, str, List[CopilotCitation]]:
    """Hierarchical Tier 1 & Tier 2 NASA scientific response generator."""
    citations: List[CopilotCitation] = [
        CopilotCitation(
            label="NASA Planetary Data System (PDS)",
            sourceUrl="https://pds-geosciences.wustl.edu/",
            datasetName="NASA MOLA MEGDR & HRSC Blended DEM"
        ),
        CopilotCitation(
            label="NASA JPL Horizons Ephemeris System",
            sourceUrl="https://ssd.jpl.nasa.gov/horizons/",
            datasetName="DE440/DE441 Planetary & Lunar Ephemeris"
        )
    ]

    p = prompt.lower()

    if parsed_action:
        action_type, payload = parsed_action
        if action_type in ("NAVIGATE_MARS", "NAVIGATE_TERRAIN"):
            target = payload["target"]
            name = target.get("name", "Coordinates")
            lat = target.get("latitude", 0.0)
            lon = target.get("longitude", 0.0)
            dest_mode = "Terrain Explorer" if action_type == "NAVIGATE_TERRAIN" else "Mars Globe"
            content = f"Navigating directly to **{name}** ({abs(lat):.2f}° {'N' if lat >= 0 else 'S'}, {abs(lon):.2f}° {'E' if lon >= 0 else 'W'}) in {dest_mode}. Camera repositioning initiated."
            if "landmark" in payload:
                content += f"\n\n{payload['landmark']['summary']}"
            return content, "TIER_1_MIRA_DATASET", citations

        if action_type == "OPEN_SOLAR_SYSTEM":
            return "Switching to the 3D Keplerian Solar System. Displaying heliocentric orbits for all 8 major planets referenced to the J2000 Ecliptic plane.", "TIER_1_MIRA_DATASET", citations

        if action_type == "FOCUS_PLANET":
            p_id = payload.get("planetId", "mars")
            p_data = PLANETS_CATALOG.get(p_id, {})
            return f"Centering camera perspective on {p_data.get('name', p_id)}. Semi-major axis: {p_data.get('distance', 'N/A')}, Orbital Period: {p_data.get('period', 'N/A')}.", "TIER_1_MIRA_DATASET", citations

        if action_type == "FOCUS_MOON":
            m_id = payload.get("moonId", "phobos")
            m_data = LANDMARKS_CATALOG.get(m_id, {})
            return f"Inspecting {m_id.capitalize()} 3D shape model. {m_data.get('summary', '')}", "TIER_1_MIRA_DATASET", citations

    # Keyword questions
    if "why is mars red" in p:
        return "Mars appears reddish-orange primarily due to abundant iron(III) oxide (ferric oxide / hematite, Fe2O3) in its surface dust and regolith. Millions of years of photochemical weathering in a thin, oxidizing atmosphere rusted the surface iron minerals, while periodic global dust storms disperse these microscopic rusty particles into the atmosphere.", "TIER_1_MIRA_DATASET", citations

    if "water" in p:
        return "Water on Mars is preserved primarily in extensive sub-surface water-ice sheets and polar ice caps (Planum Boreum and Planum Australe). Geomorphological evidence from NASA MOLA elevation, such as dried dendritic river deltas in Jezero and catastrophic outflow channels, confirms voluminous liquid water actively shaped the Martian surface during the Noachian and early Hesperian epochs.", "TIER_1_MIRA_DATASET", citations

    if "jezero" in p:
        d = LANDMARKS_CATALOG["jezero crater"]
        return f"**Jezero Crater** (18.38° N, 77.58° E):\n{d['summary']}\nElevation: -2,500 m below MOLA datum.", "TIER_1_MIRA_DATASET", citations

    if "olympus" in p:
        d = LANDMARKS_CATALOG["olympus mons"]
        return f"**Olympus Mons** (18.65° N, 133.80° W):\n{d['summary']}\nElevation: 21,287 m above MOLA datum.", "TIER_1_MIRA_DATASET", citations

    # Default scientific response
    return f"MIRA AI Copilot: Ready to assist with planetary exploration. You can command me to fly to any crater or coordinates, inspect Phobos or Deimos, or switch between Mars Globe, Terrain Explorer, and Solar System.", "TIER_1_MIRA_DATASET", citations

async def process_copilot_chat(
    req: CopilotChatRequest,
    client: Optional[httpx.AsyncClient] = None
) -> CopilotChatResponse:
    """Processes user chat request, classifies action, queries AI/Engine, and normalizes speech."""
    parsed_action = parse_navigation_intent(req.prompt)

    action: Optional[CopilotAction] = None
    nav_target: Optional[ParsedCoordinate] = None

    if parsed_action:
        action_type, payload = parsed_action
        action = CopilotAction(type=action_type, payload=payload)
        if "target" in payload:
            t = payload["target"]
            nav_target = ParsedCoordinate(
                name=t.get("name", "Coordinates"),
                latitude=t.get("latitude", 0.0),
                longitude=t.get("longitude", 0.0),
                altitudeMeters=t.get("altitudeMeters"),
            )

    active_key = req.apiKey or settings.GEMINI_API_KEY
    raw_content = ""
    source_tier = "TIER_1_MIRA_DATASET"
    citations: List[CopilotCitation] = []

    if active_key:
        sys_prompt = (
            "You are MIRA, the official NASA-grounded Mars Interactive Reconnaissance Atlas AI Copilot. "
            "You provide accurate planetary science data, coordinates, and astronomical parameters. "
            "Never use stray markdown symbols, backslashes, or robotic preambles."
        )
        ai_resp = await query_gemini_api(req.prompt, active_key, sys_prompt, client=client)
        if ai_resp:
            raw_content = ai_resp
            source_tier = "TIER_3_GLOBAL_WEB_AI"

    if not raw_content:
        raw_content, source_tier, citations = generate_scientific_knowledge_response(req.prompt, parsed_action)

    spoken_text = normalize_speech_text(raw_content)

    return CopilotChatResponse(
        id=str(uuid.uuid4()),
        content=raw_content,
        spokenText=spoken_text,
        sourceTier=source_tier,
        sourceLabel="NASA MIRA Planetary Intelligence",
        action=action,
        navigationTarget=nav_target,
        citations=citations,
    )
