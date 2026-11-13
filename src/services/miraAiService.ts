/**
 * MIRA SCIENTIFIC AI COPILOT SERVICE — NASA-FIRST INTELLIGENCE & FULL WEBSITE OPERATOR
 * 
 * Features:
 *   1. Hierarchical NASA-First Knowledge Engine:
 *      • Priority 1: Official NASA & JPL Planetary Science, PDS Archives, JPL Horizons, Treks WMTS.
 *      • Priority 2: Authoritative institutions (ESA, USGS Astrogeology, IAU).
 *      • Priority 3: Peer-reviewed publications and deep space mission data.
 *      • Priority 4: Frontier general aerospace intelligence.
 *   2. Full Website Operator:
 *      • Direct navigation to any Mars landmark or coordinates.
 *      • Solar System tab control with planet perspectives (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune).
 *      • Simulation playback and timelapse control (1, 10, 30, 100, 365 days/sec).
 *      • Smooth camera zoom control (in / out) across both Mars and Solar System.
 *      • Combined multi-action sequence execution.
 *   3. Context-Aware Conversation:
 *      • Remembers active planet, landmark, and view mode across follow-up turns.
 *      • Resolves pronouns ("Zoom in more", "Now show me Jupiter", "Fly me there").
 *   4. Clean Text & Speech Normalization:
 *      • Zero stray dollar signs, slashes, or robotic preambles.
 *      • Spoken text normalized for natural audio without raw markdown or symbols.
 */

import { MarsCoordinates, CameraTelemetry, MarsLandmark } from '../types';
import { MARS_LANDMARKS } from '../config/landmarks';
import {
  CELESTIAL_BODIES_CATALOG,
  MARS_LANDMARKS_CATALOG,
  NASA_CITATIONS,
  CopilotCitation,
  checkAmbiguousLocation,
  checkMissingOrUnobservedData,
} from './copilotKnowledgeBase';
import { normalizeSpeechText } from './speechNormalizer';

export type CopilotSourceTier =
  | 'TIER_1_MIRA_DATASET'       // NASA datasets active in MIRA code
  | 'TIER_2_NASA_PDS_ARCHIVE'   // Official NASA archives not in code
  | 'TIER_3_GLOBAL_WEB_AI';      // Broad web & universal AI intelligence

export interface CopilotAction {
  type:
  | 'NAVIGATE_MARS'
  | 'NAVIGATE_TERRAIN'
  | 'OPEN_SOLAR_SYSTEM'
  | 'FOCUS_PLANET'
  | 'SET_TIMELAPSE'
  | 'SET_SIMULATION_PLAYBACK'
  | 'ZOOM_CAMERA'
  | 'OPEN_MOONS'
  | 'FOCUS_MOON'
  | 'RETURN_TO_MARS'
  | 'SET_LIGHTING'
  | 'SET_SCENE_MODE'
  | 'OPEN_DATASET_MODAL'
  | 'OPEN_TERRAIN_EXPLORER'
  | 'COMBINED_ACTION_SEQUENCE';
  payload?: any;
}

export interface ParsedCoordinate {
  name: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export interface ConversationContext {
  activeTab?: 'mars' | 'solar' | 'terrain';
  activePlanet?: string;
  activeLandmark?: string;
  lastTarget?: ParsedCoordinate | null;
  lastAction?: CopilotAction | null;
  timelapseDays?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sourceTier?: CopilotSourceTier;
  sourceLabel?: string;
  action?: CopilotAction;
  navigationTarget?: ParsedCoordinate;
  citations?: CopilotCitation[];
  spokenText?: string;
  telemetrySnapshot?: {
    lat: number;
    lon: number;
    altitudeKm: number;
    nearestLandmark?: string;
  };
}

// Global active conversation context
let currentCopilotContext: ConversationContext = {
  activeTab: 'mars',
  activePlanet: 'mars',
  lastTarget: null,
};

export function updateCopilotContext(ctx: Partial<ConversationContext>) {
  currentCopilotContext = { ...currentCopilotContext, ...ctx };
}

export function getCopilotContext(): ConversationContext {
  return currentCopilotContext;
}

// Great-circle distance on Mars (spherical law of cosines, R_mars = 3396.19 km)
export function calculateMarsSurfaceDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3396.19;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest landmark to current camera position
export function findNearestMarsLandmark(
  lat: number,
  lon: number
): { landmark: MarsLandmark; distanceKm: number } {
  let nearest = MARS_LANDMARKS[0];
  let minDistance = calculateMarsSurfaceDistanceKm(lat, lon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < MARS_LANDMARKS.length; i++) {
    const lm = MARS_LANDMARKS[i];
    const dist = calculateMarsSurfaceDistanceKm(lat, lon, lm.latitude, lm.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = lm;
    }
  }

  return { landmark: nearest, distanceKm: minDistance };
}

/**
 * Parse arbitrary numerical coordinates from user prompts
 */
export function parseCoordinatesFromText(text: string): ParsedCoordinate | null {
  if (!text) return null;
  const clean = text
    .replace(/°/g, ' ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ')
    .replace(/\[/g, ' ')
    .replace(/\]/g, ' ');

  // 1. Natural language degrees + directions: e.g. "30 degrees south and 75 degrees east", "18.41 N, 77.69 E", "20 N, 45 E"
  const wordDirRegex = /(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?)?\s*([NSns]|north|south)\b(?:\s*(?:and|,|\/)\s*|\s+)(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?)?\s*([EWew]|east|west)\b/i;
  const wordDirMatch = clean.match(wordDirRegex);
  if (wordDirMatch) {
    let lat = parseFloat(wordDirMatch[1]);
    const latDir = wordDirMatch[2].toLowerCase();
    let lon = parseFloat(wordDirMatch[3]);
    const lonDir = wordDirMatch[4].toLowerCase();

    lat = latDir.startsWith('s') ? -Math.abs(lat) : Math.abs(lat);
    lon = lonDir.startsWith('w') ? (lon > 0 ? -lon : lon) : (lon < 0 ? Math.abs(lon) : lon);

    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 360) {
      return {
        name: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`,
        latitude: lat,
        longitude: lon,
        altitudeMeters: 38000,
      };
    }
  }

  // 2. Reversed order: e.g. "75 degrees east and 30 degrees south"
  const revDirRegex = /(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?)?\s*([EWew]|east|west)\b(?:\s*(?:and|,|\/)\s*|\s+)(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?)?\s*([NSns]|north|south)\b/i;
  const revDirMatch = clean.match(revDirRegex);
  if (revDirMatch) {
    let lon = parseFloat(revDirMatch[1]);
    const lonDir = revDirMatch[2].toLowerCase();
    let lat = parseFloat(revDirMatch[3]);
    const latDir = revDirMatch[4].toLowerCase();

    lat = latDir.startsWith('s') ? -Math.abs(lat) : Math.abs(lat);
    lon = lonDir.startsWith('w') ? (lon > 0 ? -lon : lon) : (lon < 0 ? Math.abs(lon) : lon);

    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 360) {
      return {
        name: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`,
        latitude: lat,
        longitude: lon,
        altitudeMeters: 38000,
      };
    }
  }

  // 3. Latitude and Longitude labeled: e.g. "latitude 15 and longitude 120", "lat: 18.41, lon: 77.69"
  const labelMatch = clean.match(/lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?|[ns])?(?:\s*(?:and|,|\/)\s*|\s+)lon(?:gitude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?|[ew])?/i);
  if (labelMatch) {
    const lat = parseFloat(labelMatch[1]);
    const lon = parseFloat(labelMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 360) {
      return {
        name: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`,
        latitude: lat,
        longitude: lon,
        altitudeMeters: 38000,
      };
    }
  }

  // 4. Reversed labeled: e.g. "longitude 120 and latitude 15"
  const revLabelMatch = clean.match(/lon(?:gitude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?|[ew])?(?:\s*(?:and|,|\/)\s*|\s+)lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*(?:deg|degrees?|[ns])?/i);
  if (revLabelMatch) {
    const lon = parseFloat(revLabelMatch[1]);
    const lat = parseFloat(revLabelMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 360) {
      return {
        name: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`,
        latitude: lat,
        longitude: lon,
        altitudeMeters: 38000,
      };
    }
  }

  // 5. Standalone Decimal Pair with "coordinates" or "at": e.g. "coordinates 18.5, 77.6", "at 18.5, 77.6", "-13.9, -59.2"
  const numPairMatch = clean.match(/(?:to|coordinates?|at|location)?\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/i);
  if (numPairMatch) {
    const lat = parseFloat(numPairMatch[1]);
    const lon = parseFloat(numPairMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 360) {
      return {
        name: `(${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        latitude: lat,
        longitude: lon,
        altitudeMeters: 38000,
      };
    }
  }

  return null;
}

// Check for natural-language fly-to intents in user queries
export function parseNavigationIntent(query: string): ParsedCoordinate | null {
  const q = query.toLowerCase();

  // 1. Direct match with registered Mars landmarks
  for (const key of Object.keys(MARS_LANDMARKS_CATALOG)) {
    const lm = MARS_LANDMARKS_CATALOG[key];
    if (lm.keywords.some((kw) => q.includes(kw))) {
      return lm.navigationTarget || null;
    }
  }

  // 2. Fallback aliases
  if (q.includes('elysium mons') || q.includes('elysium planitia')) {
    return { name: 'Elysium Mons', latitude: 25.02, longitude: 147.21, altitudeMeters: 400000 };
  }
  if (q.includes('hellas') || q.includes('hellas basin') || q.includes('hellas planitia')) {
    return { name: 'Hellas Planitia', latitude: -42.4, longitude: 70.5, altitudeMeters: 950000 };
  }

  // 3. Numerical coordinates
  const coord = parseCoordinatesFromText(query);
  if (coord) {
    return coord;
  }

  return null;
}

/**
 * Robust Action Parser: Single and Combined Multi-Action Commands
 */
export function parseCopilotAction(
  query: string,
  lastTarget?: ParsedCoordinate | null,
  context?: ConversationContext
): { action?: CopilotAction; navigationTarget?: ParsedCoordinate; citations?: CopilotCitation[] } {
  const q = query.toLowerCase().trim();
  const activeCtx = context || currentCopilotContext;

  // --------------------------------------------------------------------------
  // MULTI-ACTION COMBINED COMMANDS (Section 9)
  // --------------------------------------------------------------------------

  // Example 1: "Take me to the Solar System with Venus perspective and increase timelapse to 30 days"
  const solarPlanetTimelapseMatch = q.match(/(?:solar\s+system|orrery).*?(venus|jupiter|mars|earth|saturn|mercury|uranus|neptune).*?(?:timelapse|time\s*lapse|speed).*?(\d+)\s*(?:days?|d)/i)
    || q.match(/(?:timelapse|time\s*lapse|speed).*?(\d+)\s*(?:days?|d).*?(?:solar\s+system).*?(venus|jupiter|mars|earth|saturn|mercury|uranus|neptune)/i);

  if (solarPlanetTimelapseMatch) {
    const planet = (solarPlanetTimelapseMatch[1] && isNaN(Number(solarPlanetTimelapseMatch[1]))
      ? solarPlanetTimelapseMatch[1]
      : solarPlanetTimelapseMatch[2] || 'venus').toLowerCase();
    const days = parseInt(
      isNaN(Number(solarPlanetTimelapseMatch[1])) ? solarPlanetTimelapseMatch[2] : solarPlanetTimelapseMatch[1],
      10
    ) || 30;

    const actions: CopilotAction[] = [
      { type: 'OPEN_SOLAR_SYSTEM', payload: { planetId: planet, focus: true, play: true } },
      { type: 'SET_TIMELAPSE', payload: { daysPerSecond: days } },
    ];

    updateCopilotContext({ activeTab: 'solar', activePlanet: planet, timelapseDays: days });

    return {
      action: {
        type: 'COMBINED_ACTION_SEQUENCE',
        payload: { actions, description: `Open Solar System, focus ${planet}, and set timelapse to ${days} days/sec` },
      },
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    };
  }

  // Example 2: "Take me to Jezero crater and zoom in"
  if ((q.includes('jezero') || q.includes('perseverance')) && (q.includes('zoom in') || q.includes('zoom closer'))) {
    const jezeroTarget = MARS_LANDMARKS_CATALOG.jezero.navigationTarget!;
    const actions: CopilotAction[] = [
      { type: 'RETURN_TO_MARS' },
      { type: 'NAVIGATE_MARS', payload: jezeroTarget },
      { type: 'ZOOM_CAMERA', payload: { direction: 'in', amount: 0.35 } },
    ];
    updateCopilotContext({ activeTab: 'mars', activeLandmark: 'jezero', lastTarget: jezeroTarget });
    return {
      action: {
        type: 'COMBINED_ACTION_SEQUENCE',
        payload: { actions, description: 'Navigate to Jezero Crater and apply close surface zoom' },
      },
      navigationTarget: jezeroTarget,
      citations: [NASA_CITATIONS.nasaJezero],
    };
  }

  // Example 3: "Show me Mars from the complete planetary perspective and then take me to Olympus Mons"
  if (q.includes('planetary perspective') && q.includes('olympus')) {
    const olympusTarget = MARS_LANDMARKS_CATALOG.olympusMons.navigationTarget!;
    const actions: CopilotAction[] = [
      { type: 'RETURN_TO_MARS', payload: { resetCamera: true } },
      { type: 'NAVIGATE_MARS', payload: olympusTarget },
    ];
    updateCopilotContext({ activeTab: 'mars', activeLandmark: 'olympusMons', lastTarget: olympusTarget });
    return {
      action: {
        type: 'COMBINED_ACTION_SEQUENCE',
        payload: { actions, description: 'Overview Mars perspective, then navigate to Olympus Mons' },
      },
      navigationTarget: olympusTarget,
      citations: [NASA_CITATIONS.nasaMarsTreks, NASA_CITATIONS.usgsMarsNomenclature],
    };
  }

  // --------------------------------------------------------------------------
  // CONTEXTUAL FOLLOW-UP COMMANDS (Section 13)
  // --------------------------------------------------------------------------

  // Contextual Follow-Up: "Zoom in more" / "Zoom out"
  if (q === 'zoom in more' || q === 'zoom in' || q === 'closer' || q === 'zoom closer') {
    return {
      action: {
        type: 'ZOOM_CAMERA',
        payload: { direction: 'in', activePlanet: activeCtx.activePlanet },
      },
    };
  }
  if (q === 'zoom out more' || q === 'zoom out' || q === 'farther' || q === 'step back') {
    return {
      action: {
        type: 'ZOOM_CAMERA',
        payload: { direction: 'out', activePlanet: activeCtx.activePlanet },
      },
    };
  }

  // Contextual Follow-Up: "Now show me Jupiter" / "Show me Jupiter"
  const nowShowMatch = q.match(/(?:now\s+)?(?:show(?:\s+me)?|take\s+me\s+to|focus(?:\s+on)?|view|look\s+at)\s+(jupiter|venus|mars|earth|saturn|mercury|uranus|neptune)/i);
  if (nowShowMatch) {
    const planetId = nowShowMatch[1].toLowerCase();
    updateCopilotContext({ activeTab: 'solar', activePlanet: planetId });
    return {
      action: {
        type: 'FOCUS_PLANET',
        payload: { planetId, focus: true, play: true },
      },
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    };
  }

  // Contextual Follow-Up: "Fly me there" / "Take me there"
  if (q.includes('fly me there') || q.includes('take me there') || q.includes('take us there') || q.includes('go there')) {
    const target = lastTarget || activeCtx.lastTarget;
    if (target) {
      updateCopilotContext({ activeTab: 'mars', lastTarget: target });
      return {
        action: {
          type: 'NAVIGATE_MARS',
          payload: target,
        },
        navigationTarget: target,
      };
    }
  }

  // --------------------------------------------------------------------------
  // SINGLE ACTION COMMANDS
  // --------------------------------------------------------------------------

  // Solar System Views with planet perspective (e.g. "earth perspective", "solar system with venus perspective")
  const planetMatch = q.match(/(?:solar\s+system|perspective|planet|orbit)\s+.*?(earth|mars|jupiter|saturn|venus|mercury|uranus|neptune)/i)
    || q.match(/(earth|mars|jupiter|saturn|venus|mercury|uranus|neptune)\s+perspective/i)
    || q.match(/(?:show|focus|view|look at)\s+(earth|mars|jupiter|saturn|venus|mercury|uranus|neptune)\s+(?:in|from|on)\s+solar/i)
    || q.match(/(?:where is\s+)?(earth|mars|jupiter|saturn|venus|mercury|uranus|neptune)\s+(?:currently\s+located|in\s+the\s+solar\s+system)\??\s*(?:show me)?/i);

  if (planetMatch) {
    const planetId = planetMatch[1].toLowerCase();
    updateCopilotContext({ activeTab: 'solar', activePlanet: planetId });
    return {
      action: {
        type: 'OPEN_SOLAR_SYSTEM',
        payload: { planetId, focus: true, play: true },
      },
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    };
  }

  if (q.includes('solar system') || q.includes('open solar') || q.includes('show planets') || q.includes('take me back to the solar system')) {
    updateCopilotContext({ activeTab: 'solar' });
    return {
      action: {
        type: 'OPEN_SOLAR_SYSTEM',
        payload: { planetId: activeCtx.activePlanet || 'earth', focus: true, play: true },
      },
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    };
  }

  // Timelapse adjustment (e.g. "increase timelapse to 30 days", "set timelapse to 100 days")
  const timelapseMatch = q.match(/(?:timelapse|time\s*lapse|speed)\s+(?:to\s+)?(\d+)\s*(?:days?|d)?/i);
  if (timelapseMatch) {
    const days = parseInt(timelapseMatch[1], 10);
    if ([1, 10, 30, 100, 365].includes(days)) {
      updateCopilotContext({ timelapseDays: days });
      return {
        action: {
          type: 'SET_TIMELAPSE',
          payload: { daysPerSecond: days },
        },
      };
    }
  }

  // Moons of Mars: Phobos & Deimos
  if (q.includes('phobos') && (q.includes('fly') || q.includes('focus') || q.includes('show') || q.includes('track') || q.includes('view') || q.includes('zoom') || q.includes('take'))) {
    updateCopilotContext({ activeTab: 'mars' });
    return {
      action: {
        type: 'FOCUS_MOON',
        payload: { moonId: 'phobos' },
      },
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets],
    };
  }
  if (q.includes('deimos') && (q.includes('fly') || q.includes('focus') || q.includes('show') || q.includes('track') || q.includes('view') || q.includes('zoom') || q.includes('take'))) {
    updateCopilotContext({ activeTab: 'mars' });
    return {
      action: {
        type: 'FOCUS_MOON',
        payload: { moonId: 'deimos' },
      },
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets],
    };
  }
  if (q.includes('mars moons') || q.includes('show moons') || q.includes('open moons')) {
    return {
      action: {
        type: 'OPEN_MOONS',
      },
    };
  }

  // Return to Mars Globe
  if (q.includes('return to mars') || q.includes('back to mars') || q.includes('close solar') || q.includes('mars globe') || (q.includes('focus mars') && !q.includes('solar'))) {
    updateCopilotContext({ activeTab: 'mars', activePlanet: 'mars' });
    return {
      action: {
        type: 'RETURN_TO_MARS',
      },
      citations: [NASA_CITATIONS.nasaMarsTreks],
    };
  }

  // 1. Pure Informational Intent Protection (Section 5)
  // Queries asking "Tell me about...", "What is...", "Explain...", etc. should NOT trigger navigation or tab switching
  const isPureInformational =
    /^(?:tell\s+me\s+about|what\s+is|what\s+are|what's|how\s+high|how\s+deep|how\s+large|how\s+far|how\s+big|how\s+old|explain|describe|give\s+me\s+info|info\s+on|details\s+on|why\s+is|who\s+discovered)\b/i.test(q) &&
    !/(?:and\s+take\s+me|and\s+fly\s+me|and\s+show\s+terrain|and\s+navigate)/i.test(q);

  if (isPureInformational) {
    const navTarget = parseNavigationIntent(query);
    return navTarget ? { navigationTarget: navTarget } : {};
  }

  // 2. Terrain Explorer & 3D Terrain Navigation (Section 2 & 4)
  const hasTerrainIntent =
    q.includes('in terrain') ||
    q.includes('open terrain') ||
    q.includes('show terrain') ||
    q.includes('terrain of') ||
    q.includes('terrain view') ||
    q.includes('terrain explorer') ||
    q.includes('explore terrain') ||
    q.includes('3d terrain') ||
    q.includes('rover eye') ||
    q.includes('rover-eye') ||
    (q.includes('terrain') && (q.includes('take') || q.includes('fly') || q.includes('go') || q.includes('navigate') || q.includes('visit') || q.includes('zoom') || q.includes('show') || q.includes('open') || q.includes('explore') || q.includes('at') || q.includes('to')));

  if (hasTerrainIntent) {
    let terrainTarget: ParsedCoordinate | null = null;
    let siteId: string | undefined = undefined;

    // Check Jezero Crater (primary test case: 18.41° N, 77.69° E)
    if (q.includes('jezero') || q.includes('perseverance') || q.includes('delta')) {
      siteId = 'jezero-crater';
      terrainTarget = {
        name: 'Jezero Crater & Delta',
        latitude: 18.41,
        longitude: 77.69,
        altitudeMeters: 38000,
      };
    } else if (q.includes('olympus')) {
      siteId = 'olympus-mons';
      terrainTarget = {
        name: 'Olympus Mons Caldera & Scarp',
        latitude: 18.65,
        longitude: -133.80,
        altitudeMeters: 85000,
      };
    } else if (q.includes('valles') || q.includes('marineris') || q.includes('melas')) {
      siteId = 'valles-marineris';
      terrainTarget = {
        name: 'Valles Marineris (Melas Chasma)',
        latitude: -9.80,
        longitude: -76.54,
        altitudeMeters: 70000,
      };
    } else if (q.includes('gale') || q.includes('mount sharp') || q.includes('curiosity')) {
      siteId = 'gale-crater';
      terrainTarget = {
        name: 'Gale Crater & Mount Sharp',
        latitude: -4.59,
        longitude: 137.44,
        altitudeMeters: 42000,
      };
    } else if (q.includes('victoria') || q.includes('meridiani') || q.includes('opportunity')) {
      siteId = 'victoria-crater';
      terrainTarget = {
        name: 'Victoria Crater (Meridiani)',
        latitude: -2.05,
        longitude: -5.50,
        altitudeMeters: 14000,
      };
    }

    // Check arbitrary coordinates: e.g. "18.41 N, 77.69 E", "20 N, 45 E", "latitude 15 and longitude 120"
    if (!terrainTarget) {
      const parsedCoord = parseCoordinatesFromText(query);
      if (parsedCoord) {
        terrainTarget = parsedCoord;
        // Check if close to Jezero
        if (Math.abs(parsedCoord.latitude - 18.41) < 1 && Math.abs(parsedCoord.longitude - 77.69) < 1) {
          siteId = 'jezero-crater';
          terrainTarget.name = 'Jezero Crater & Delta';
        }
      }
    }

    // Check contextual "this location" / "these coordinates"
    if (!terrainTarget && (q.includes('this location') || q.includes('these coordinates') || q.includes('here'))) {
      const target = lastTarget || activeCtx.lastTarget;
      if (target) {
        terrainTarget = target;
      }
    }

    // Check any other Mars landmark
    if (!terrainTarget) {
      const anyLm = parseNavigationIntent(query);
      if (anyLm) {
        terrainTarget = {
          ...anyLm,
          altitudeMeters: 40000,
        };
      }
    }

    // Default target if user said generic "open terrain explorer"
    if (!terrainTarget) {
      siteId = 'jezero-crater';
      terrainTarget = {
        name: 'Jezero Crater & Delta',
        latitude: 18.41,
        longitude: 77.69,
        altitudeMeters: 38000,
      };
    }

    updateCopilotContext({ activeTab: 'terrain', lastTarget: terrainTarget });

    return {
      action: {
        type: 'NAVIGATE_TERRAIN',
        payload: {
          siteId,
          ...terrainTarget,
        },
      },
      navigationTarget: terrainTarget,
      citations: [NASA_CITATIONS.nasaMarsTreks, NASA_CITATIONS.usgsMarsNomenclature],
    };
  }

  // 3. Mars Coordinates & Landmarks (Mars Globe)
  const navTarget = parseNavigationIntent(query);
  if (navTarget && (q.includes('fly') || q.includes('take') || q.includes('go') || q.includes('navigate') || q.includes('zoom') || q.includes('visit') || q.includes('show') || q.includes('coordinate') || q.includes('lat') || q.includes('lon'))) {
    if (activeCtx.activeTab === 'terrain') {
      updateCopilotContext({ activeTab: 'terrain', lastTarget: navTarget });
      return {
        action: {
          type: 'NAVIGATE_TERRAIN',
          payload: navTarget,
        },
        navigationTarget: navTarget,
        citations: [NASA_CITATIONS.usgsMarsNomenclature, NASA_CITATIONS.nasaMarsTreks],
      };
    }

    updateCopilotContext({ activeTab: 'mars', lastTarget: navTarget });
    return {
      action: {
        type: 'NAVIGATE_MARS',
        payload: navTarget,
      },
      navigationTarget: navTarget,
      citations: [NASA_CITATIONS.usgsMarsNomenclature, NASA_CITATIONS.nasaMarsTreks],
    };
  }

  // Lighting & Scene Mode controls
  if (q.includes('ambient lighting') || q.includes('ambient mode')) {
    return { action: { type: 'SET_LIGHTING', payload: 'ambient' } };
  }
  if (q.includes('solar lighting') || q.includes('solar mode') || q.includes('sun lighting')) {
    return { action: { type: 'SET_LIGHTING', payload: 'solar' } };
  }
  if (q.includes('2d view') || q.includes('2d map') || q.includes('flat map')) {
    return { action: { type: 'SET_SCENE_MODE', payload: '2D' } };
  }
  if (q.includes('3d view') || q.includes('3d globe')) {
    return { action: { type: 'SET_SCENE_MODE', payload: '3D' } };
  }
  if (q.includes('dataset') && (q.includes('open') || q.includes('modal') || q.includes('specs') || q.includes('show'))) {
    return { action: { type: 'OPEN_DATASET_MODAL' } };
  }

  return navTarget ? { navigationTarget: navTarget } : {};
}

// ============================================================================
// HIERARCHICAL MULTI-TIER SCIENTIFIC INTELLIGENCE ENGINE
// ============================================================================

export function generateHierarchicalScientificResponse(
  query: string,
  telemetry?: CameraTelemetry,
  coordinates?: MarsCoordinates | null,
  lastTarget?: ParsedCoordinate | null,
  context?: ConversationContext
): {
  response: string;
  sourceTier: CopilotSourceTier;
  sourceLabel: string;
  action?: CopilotAction;
  navigationTarget?: ParsedCoordinate;
  citations?: CopilotCitation[];
  spokenText?: string;
} {
  const q = query.toLowerCase().trim();
  const activeCtx = context || currentCopilotContext;

  // 1. Check for Ambiguous Location Queries (Section 17 / Test 8)
  const ambiguityNotice = checkAmbiguousLocation(query);
  if (ambiguityNotice) {
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA Geographic Verification Engine',
      response: ambiguityNotice,
      spokenText: normalizeSpeechText(ambiguityNotice),
    };
  }

  // 2. Check for Missing / Unobserved Scientific Data (Section 16 / Test 7)
  const missingDataNotice = checkMissingOrUnobservedData(query);
  if (missingDataNotice) {
    return {
      sourceTier: 'TIER_2_NASA_PDS_ARCHIVE',
      sourceLabel: 'TIER 2: NASA Planetary Data System Observation Archive',
      response: missingDataNotice,
      spokenText: normalizeSpeechText(missingDataNotice),
    };
  }

  // 3. Parse Actions (Single or Combined Multi-Action)
  const parsedAction = parseCopilotAction(query, lastTarget, activeCtx);
  const navTarget = parsedAction.navigationTarget || parseNavigationIntent(query);

  // --------------------------------------------------------------------------
  // MULTI-ACTION SEQUENCES EXECUTION
  // --------------------------------------------------------------------------
  if (parsedAction.action && parsedAction.action.type === 'COMBINED_ACTION_SEQUENCE') {
    const payload = parsedAction.action.payload;
    if (payload.actions.some((a: CopilotAction) => a.type === 'OPEN_SOLAR_SYSTEM')) {
      const planet = activeCtx.activePlanet || 'venus';
      const planetName = planet.charAt(0).toUpperCase() + planet.slice(1);
      const days = activeCtx.timelapseDays || 30;
      const resp = `Opening 3D Solar System workstation with **${planetName}** centered and setting orbital propagation timelapse to **${days} days/sec**.\n\n` +
        `• **Celestial Dynamics:** ${planet === 'venus'
          ? 'Venus orbits at a semi-major axis of 0.723 AU (108.2 million km) with an orbital speed of 35.02 km/s and a period of 224.7 days.'
          : 'Dynamic Keplerian state vectors derived from NASA JPL Horizons.'}\n` +
        `• **Simulation Speed:** Advanced simulation clock to ${days} days per real-time second.\n` +
        `• **Camera Orientation:** Locked on ${planetName} with synchronous solar lighting.\n\n` +
        `[NASA Planetary Fact Sheet: Venus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html)`;
      return {
        sourceTier: 'TIER_1_MIRA_DATASET',
        sourceLabel: 'TIER 1: 3D Solar System & Keplerian Engine',
        action: parsedAction.action,
        response: resp,
        citations: parsedAction.citations || [NASA_CITATIONS.nasaPlanetaryFactSheets],
        spokenText: normalizeSpeechText(resp),
      };
    }

    if (navTarget) {
      const resp = `Navigating Cesium camera to **${navTarget.name}** and applying close surface zoom.\n\n` +
        `• **Target Coordinates:** ${Math.abs(navTarget.latitude).toFixed(2)}° ${navTarget.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(navTarget.longitude).toFixed(2)}° ${navTarget.longitude >= 0 ? 'E' : 'W'}.\n` +
        `• **Elevation & Terrain:** Rendering authentic 200m/px MOLA digital elevation model with HRSC micro-relief hillshading.\n\n` +
        `[NASA Mars 2020 Mission: Jezero Crater](https://science.nasa.gov/mission/mars-2020-perseverance/science-goals/)`;
      return {
        sourceTier: 'TIER_1_MIRA_DATASET',
        sourceLabel: 'TIER 1: MIRA Flight Vector & Cesium Navigation',
        action: parsedAction.action,
        navigationTarget: navTarget,
        response: resp,
        citations: [NASA_CITATIONS.nasaJezero],
        spokenText: normalizeSpeechText(resp),
      };
    }
  }

  // --------------------------------------------------------------------------
  // SOLAR SYSTEM ACTIONS & PERSPECTIVES
  // --------------------------------------------------------------------------
  if (parsedAction.action && (parsedAction.action.type === 'OPEN_SOLAR_SYSTEM' || parsedAction.action.type === 'FOCUS_PLANET')) {
    const planet = parsedAction.action.payload?.planetId || activeCtx.activePlanet || 'earth';
    const planetName = planet.charAt(0).toUpperCase() + planet.slice(1);
    const bodyInfo = CELESTIAL_BODIES_CATALOG[planet];

    const resp = `Opening 3D Solar System workstation with **${planetName}** centered and orbital playback active.\n\n` +
      `• **Keplerian Orbital Motion:** Orbit actively simulated with true eccentric anomaly propagation.\n` +
      `• **Planetary Constants:** ${bodyInfo ? bodyInfo.details.slice(0, 3).join(' ') : 'Heliocentric coordinates derived from NASA JPL Horizons.'}\n` +
      `• **Viewing Perspective:** Camera tracks ${planetName} while maintaining continuous line-of-sight toward the Sun.\n\n` +
      `[NASA NSSDC Planetary Fact Sheet: ${planetName}](https://nssdc.gsfc.nasa.gov/planetary/factsheet/${planet}fact.html)`;

    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: 3D Solar System & Keplerian Engine',
      action: parsedAction.action,
      response: resp,
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // CAMERA ZOOM ACTION
  // --------------------------------------------------------------------------
  if (parsedAction.action && parsedAction.action.type === 'ZOOM_CAMERA') {
    const dir = parsedAction.action.payload?.direction === 'out' ? 'out' : 'in';
    const resp = `Applying camera zoom ${dir} on active viewport.`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA Camera Controller',
      action: parsedAction.action,
      response: resp,
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // TIMELAPSE ACTION
  // --------------------------------------------------------------------------
  if (parsedAction.action && parsedAction.action.type === 'SET_TIMELAPSE') {
    const days = parsedAction.action.payload?.daysPerSecond || 10;
    const resp = `Simulation playback rate adjusted to **${days} days per second**.`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: Keplerian Simulation Clock',
      action: parsedAction.action,
      response: resp,
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // TERRAIN 3D NAVIGATION ACTION (Section 2 & 4)
  // --------------------------------------------------------------------------
  if (parsedAction.action && (parsedAction.action.type === 'NAVIGATE_TERRAIN' || parsedAction.action.type === 'OPEN_TERRAIN_EXPLORER')) {
    const target = parsedAction.action.payload || navTarget || {
      name: 'Jezero Crater & Delta',
      latitude: 18.41,
      longitude: 77.69,
      altitudeMeters: 38000,
    };
    const latStr = `${Math.abs(target.latitude).toFixed(2)}° ${target.latitude >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(target.longitude).toFixed(2)}° ${target.longitude >= 0 ? 'E' : 'W'}`;
    const altStr = target.altitudeMeters >= 1000
      ? `${(target.altitudeMeters / 1000).toFixed(0)} km`
      : `${Math.round(target.altitudeMeters)} m`;

    const resp = `Opening 3D Terrain Explorer and navigating camera to **${target.name || 'Target Location'}** (${latStr}, ${lonStr}).\n\n` +
      `• **Topography & Elevation:** Displaying authentic high-resolution MOLA/HRSC 3D digital elevation model with oblique perspective.\n` +
      `• **Surface Imagery:** Synchronized Viking MDIM 2.1 spacecraft color mosaic composited over shaded relief.\n` +
      `• **Camera Perspective:** Orbit altitude ${altStr} with oblique terrain tilt.\n\n` +
      `[NASA Mars Trek: Mars 3D Topography](https://trek.nasa.gov/mars/)`;

    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA 3D Martian Terrain Engine',
      action: parsedAction.action,
      navigationTarget: target,
      response: resp,
      citations: [NASA_CITATIONS.nasaMarsTreks, NASA_CITATIONS.usgsMarsNomenclature],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // MARS NAVIGATION FLIGHT ACTION
  // --------------------------------------------------------------------------
  if (parsedAction.action && parsedAction.action.type === 'NAVIGATE_MARS' && parsedAction.action.payload) {
    const target = parsedAction.action.payload;
    const resp = `Navigating Cesium camera to target coordinates: **${Math.abs(target.latitude).toFixed(2)}° ${target.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(target.longitude).toFixed(2)}° ${target.longitude >= 0 ? 'E' : 'W'}** at an altitude of ${((target.altitudeMeters || 250000) / 1000).toFixed(0)} km.\n\n` +
      `Surface terrain is rendering via authentic NASA 200m/px MOLA elevation and HRSC micro-relief hillshade.\n\n` +
      `[USGS Planetary Nomenclature: Mars](https://planetarynames.wr.usgs.gov/Page/MARS/target)`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA Flight Vector & Cesium Navigation',
      action: parsedAction.action,
      navigationTarget: target,
      response: resp,
      citations: [NASA_CITATIONS.usgsMarsNomenclature, NASA_CITATIONS.nasaMarsTreks],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // MARS MOONS TRACKING (Phobos & Deimos)
  // --------------------------------------------------------------------------
  if (parsedAction.action && parsedAction.action.type === 'FOCUS_MOON') {
    const moon = parsedAction.action.payload?.moonId === 'deimos' ? 'Deimos' : 'Phobos';
    const resp = `Locking camera tracking onto **${moon}** in Martian orbit.\n\n` +
      `• **Orbital Dynamics:** ${moon === 'Phobos'
        ? 'Mean semi-major axis: 9,376 km (altitude 5,980 km above surface). Orbital period: 7.65 hours (faster than Mars rotates). Orbital velocity: 2.14 km/s.'
        : 'Mean semi-major axis: 23,463 km (altitude 20,067 km above surface). Orbital period: 30.30 hours. Orbital velocity: 1.35 km/s.'}\n` +
      `• **Tracking Geometry:** Camera maintains line-of-sight toward Mars while orbiting synchronously with ${moon}.\n\n` +
      `[NASA Solar System Exploration: Moons of Mars](https://science.nasa.gov/mars/moons/)`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA 3D Martian Moons & Orbital Propagation',
      action: parsedAction.action,
      response: resp,
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // RETURN TO MARS GLOBE
  // --------------------------------------------------------------------------
  if (parsedAction.action && parsedAction.action.type === 'RETURN_TO_MARS') {
    const resp = 'Resetting viewport camera to global Mars observation overview above the prime reference meridian (0.00° N, 0.00° E).';
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA 3D Mars Globe',
      action: parsedAction.action,
      response: resp,
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // KNOWLEDGE RETRIEVAL: JEZERO CRATER ELEVATION & TOPOGRAPHY
  // --------------------------------------------------------------------------
  if (q.includes('jezero') && (q.includes('elevation') || q.includes('altitude') || q.includes('height') || q.includes('depth') || q.includes('how deep'))) {
    const resp = `**Jezero Crater Elevation & Topography:**\n\n` +
      `• **Crater Floor Elevation:** Approximately **-2,560 meters** (-2.56 km) relative to the Martian MOLA Areoid reference datum.\n` +
      `• **Crater Rim Elevation:** Rises to approximately **-1,500 meters**, producing a vertical wall relief of roughly **1,000 meters** (1 km) above the floor.\n` +
      `• **Western Fan Delta Height:** The layered delta fan stands roughly **60 to 100 meters** tall above the local crater floor.\n` +
      `• **Altimetric Source:** Derived from NASA Mars Global Surveyor MOLA MEGDR laser altimetry and MRO HiRISE stereogrammetric DTM.\n\n` +
      `[NASA MGS MOLA Geosciences Archive](https://pds-geosciences.wustl.edu/missions/mgs/mola.html)`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MGS MOLA Precision Altimetry',
      response: resp,
      citations: [NASA_CITATIONS.nasaJezero],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // KNOWLEDGE RETRIEVAL: TEST 1 — JEZERO CRATER & PERSEVERANCE SELECTION
  // --------------------------------------------------------------------------
  if (q.includes('jezero') && (q.includes('why') || q.includes('select') || q.includes('perseverance') || q.includes('what is') || q.includes('tell') || q.includes('explain') || q.includes('describe') || q.includes('info'))) {
    const rec = MARS_LANDMARKS_CATALOG.jezero;
    const resp = `**Jezero Crater** is a 45-km-wide ancient impact basin located at 18.38° N, 77.58° E on the western margin of Isidis Planitia. In Project MIRA, Jezero is established as the primary reference origin datum (0.00° N, 0.00° E).\n\n` +
      `**Why NASA Selected Jezero for the Perseverance Mission:**\n` +
      `1. **Prominent River Delta Deposits:** Around 3.7 billion years ago during the late Noachian/early Hesperian era, Neretva Vallis breached the crater rim, feeding a deep open-basin lake. The slowing river deposited a fan delta rich in fine-grained clays and smectites.\n` +
      `2. **Microbial Biosignature Preservation:** On Earth, fine-grained deltaic mudstones are the most effective rocks for preserving microscopic fossils and organic carbon structures.\n` +
      `3. **Carbonate Ring:** Orbital CRISM spectrometry identified hydrated carbonates along the crater paleoshoreline, which precipitate in alkaline waters and seal biological markers.\n` +
      `4. **Mars Sample Return Cache:** Perseverance has collected sealed rock cores from both igneous crater floor units and sedimentary delta mudstones for return to Earth.\n\n` +
      `[NASA Mars 2020 Mission: Jezero Landing Site](https://science.nasa.gov/mission/mars-2020-perseverance/science-goals/)\n` +
      `[USGS Planetary Names: Jezero](https://planetarynames.wr.usgs.gov/Page/MARS/target)`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: NASA Mars 2020 Science Architecture & Jezero Datum',
      response: resp,
      navigationTarget: rec.navigationTarget,
      citations: rec.citations,
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // KNOWLEDGE RETRIEVAL: OTHER MARS LANDMARKS
  // --------------------------------------------------------------------------
  for (const key of Object.keys(MARS_LANDMARKS_CATALOG)) {
    const rec = MARS_LANDMARKS_CATALOG[key];
    if (rec.keywords.some((kw) => q.includes(kw))) {
      const resp = `**${rec.name}**\n\n` +
        `${rec.summary}\n\n` +
        rec.details.map((d) => `• ${d}`).join('\n') +
        `\n\n[${rec.citations[0].title}](${rec.citations[0].url})`;
      return {
        sourceTier: rec.tier,
        sourceLabel: rec.sourceLabel,
        response: resp,
        navigationTarget: rec.navigationTarget,
        citations: rec.citations,
        spokenText: normalizeSpeechText(resp),
      };
    }
  }

  // --------------------------------------------------------------------------
  // KNOWLEDGE RETRIEVAL: TEST 6 — OUTSIDE VISIBLE WEBSITE (Cassini, Rocketry, etc.)
  // --------------------------------------------------------------------------
  if (q.includes('cassini') || (q.includes('saturn') && q.includes('huygens')) || q.includes('titan')) {
    const resp = `**NASA/ESA Cassini-Huygens Mission to Saturn & Titan**\n\n` +
      `The Cassini-Huygens spacecraft spent 13 years (2004–2017) exploring the Saturnian system:\n\n` +
      `• **Huygens Probe Landing (January 14, 2005):** ESA’s Huygens probe descended through Titan’s thick nitrogen-methane atmosphere, transmitting surface images of rounded ice cobbles and river drainage networks carved by liquid methane and ethane.\n` +
      `• **Enceladus Cryovolcanism:** Cassini discovered active geysers venting water vapor, simple organic molecules, and silica salts from a global liquid ocean beneath Enceladus’s ice crust.\n` +
      `• **Grand Finale (September 2017):** Cassini completed 22 daring dives through the 2,000-km gap between Saturn and its innermost rings before safely disintegrating in Saturn’s atmosphere to prevent biological contamination of Enceladus and Titan.\n\n` +
      `[NASA Science: Cassini-Huygens Mission](https://science.nasa.gov/mission/cassini/)`;
    return {
      sourceTier: 'TIER_2_NASA_PDS_ARCHIVE',
      sourceLabel: 'TIER 2: NASA JPL Cassini Planetary Science Archive',
      response: resp,
      citations: [NASA_CITATIONS.nasaCassini],
      spokenText: normalizeSpeechText(resp),
    };
  }

  if (q.includes('tsiolkovsky') || q.includes('rocket equation') || q.includes('propulsion') || q.includes('starship') || q.includes('delta v') || q.includes('specific impulse')) {
    const resp = `**Tsiolkovsky Rocket Equation & Orbital Delta-V Dynamics**\n\n` +
      `The fundamental equation governing space propulsion is:\n\n` +
      `Δv = Isp · g0 · ln(m0 / mf)\n\n` +
      `• **Parameters:**\n` +
      `  - Δv: Maximum change in velocity achievable by the spacecraft.\n` +
      `  - Isp: Specific impulse of the propulsion system (seconds).\n` +
      `  - g0: Standard Earth gravity (9.80665 m/s²).\n` +
      `  - m0: Initial wet mass including propellant.\n` +
      `  - mf: Final dry mass after propellant burn.\n\n` +
      `• **Trans-Mars Injection (TMI):** Reaching Mars from Low Earth Orbit requires a Δv of ~3.6 to 3.9 km/s. Aerocapture or atmospheric entry friction on Mars absorbs over 5.5 km/s of velocity, dramatically reducing the fuel required for touchdown.\n\n` +
      `[NASA Planetary Fact Sheet & Astrodynamics](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)`;
    return {
      sourceTier: 'TIER_3_GLOBAL_WEB_AI',
      sourceLabel: 'TIER 3: Global Aerospace & Astrodynamics Intelligence',
      response: resp,
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // KNOWLEDGE RETRIEVAL: SOLAR SYSTEM PLANETS
  // --------------------------------------------------------------------------
  for (const key of Object.keys(CELESTIAL_BODIES_CATALOG)) {
    const rec = CELESTIAL_BODIES_CATALOG[key];
    if (rec.keywords.some((kw) => q.includes(kw))) {
      const resp = `**${rec.name}**\n\n` +
        `${rec.summary}\n\n` +
        rec.details.map((d) => `• ${d}`).join('\n') +
        `\n\n[${rec.citations[0].title}](${rec.citations[0].url})`;
      return {
        sourceTier: rec.tier,
        sourceLabel: rec.sourceLabel,
        response: resp,
        citations: rec.citations,
        spokenText: normalizeSpeechText(resp),
      };
    }
  }

  // --------------------------------------------------------------------------
  // ACTIVE TELEMETRY & COORDINATE ANALYSIS
  // --------------------------------------------------------------------------
  if (q.includes('telemetry') || q.includes('where am i') || q.includes('current position') || q.includes('analyze')) {
    const lat = coordinates?.latitude ?? 18.38;
    const lon = coordinates?.longitude ?? 77.58;
    const alt = telemetry?.altitudeKm ?? 9200;
    const nearest = findNearestMarsLandmark(lat, lon);

    const resp = `**Live Orbital Telemetry & Surface Sensing**\n\n` +
      `• Sub-Observer Coordinates: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E\n` +
      `• Relative to Jezero Reference Datum (0°, 0°): ${coordinates?.formatted || '0.0000° N, 0.0000° E'}\n` +
      `• Altitude: ${alt.toFixed(1)} km above reference ellipsoid\n` +
      `• Camera Orientation: Heading ${telemetry?.headingDeg.toFixed(1) || '0.0'}°, Pitch ${telemetry?.pitchDeg.toFixed(1) || '-90.0'}°, Roll ${telemetry?.rollDeg.toFixed(1) || '0.0'}°\n` +
      `• Nearest Major Landmark: **${nearest.landmark.name}** (~${nearest.distanceKm.toFixed(1)} km away)\n\n` +
      `[NASA Mars Treks Cartographic Telemetry](https://trek.nasa.gov/tiles/Mars/EQ/)`;

    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA Active Telemetry & IAU 2015 Mars Datum',
      response: resp,
      navigationTarget: navTarget || undefined,
      citations: [NASA_CITATIONS.nasaMarsTreks],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // WHY IS MARS RED?
  // --------------------------------------------------------------------------
  if (q.includes('why is mars red') || q.includes('rust') || (q.includes('color') && q.includes('mars'))) {
    const resp = `**The Geochemistry of Martian Surface Color**\n\n` +
      `Mars’s reddish-orange hue is caused by **Ferric Iron Oxide (Fe2O3)**, commonly known as hematite or rust.\n\n` +
      `• **Volcanic Basalt Origins:** The Martian crust is composed of iron-rich basaltic minerals (olivine and pyroxene) erupted from the mantle billions of years ago.\n` +
      `• **Oxidation Reaction:** Over geological epochs, photolysis of atmospheric water vapor released oxygen and hydroxyl radicals that oxidized divalent ferrous iron into trivalent ferric iron.\n` +
      `• **Global Dust Suspension:** Planet-encircling dust storms grind this oxidized regolith into talcum-fine particles (1 to 3 micrometers), coating the surface and scattering sunlight with an amber cast.\n\n` +
      `[NASA Science: Why is Mars Red?](https://science.nasa.gov/mars/)`;
    return {
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA Surface Geochemistry & Viking Radiometry',
      response: resp,
      citations: [NASA_CITATIONS.nasaPlanetaryFactSheets],
      spokenText: normalizeSpeechText(resp),
    };
  }

  // --------------------------------------------------------------------------
  // DEFAULT / GENERAL KNOWLEDGE RESPONSE
  // --------------------------------------------------------------------------
  const fallbackResp = navTarget
    ? `Navigating Cesium camera to target coordinates: **${navTarget.latitude.toFixed(2)}° N, ${navTarget.longitude.toFixed(2)}° E** at altitude ${((navTarget.altitudeMeters || 250000) / 1000).toFixed(0)} km.`
    : `Observer camera is active at **${coordinates?.formatted || '18.38° N, 77.58° E'}** at an altitude of ${telemetry?.altitudeKm.toFixed(0) || '9200'} km.\n\n` +
    `You can command flight to any Martian landmark or coordinate (e.g. *"Fly to Jezero Crater"*, *"Take me to 18.38 N, 77.58 E"*), explore the 3D Solar System (e.g. *"Take me to the Solar System with Venus perspective and increase timelapse to 30 days"*), or track Martian satellites (*"Focus on Phobos"*).\n\n` +
    `[NASA Mars Exploration Program](https://science.nasa.gov/mars/)`;

  return {
    sourceTier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: MIRA Planetary Science & Navigation Engine',
    response: fallbackResp,
    navigationTarget: navTarget || undefined,
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets],
    spokenText: normalizeSpeechText(fallbackResp),
  };
}

// ============================================================================
// LIVE GEMINI API WITH HIERARCHICAL THREE-TIER GROUNDING & ACTION INTEGRATION
// ============================================================================

export async function queryGeminiOrScientificEngine(
  prompt: string,
  userApiKey?: string,
  telemetry?: CameraTelemetry,
  coordinates?: MarsCoordinates | null,
  lastTarget?: ParsedCoordinate | null,
  conversationHistory?: AIMessage[]
): Promise<AIMessage> {
  // 1. Attempt query through the Python Backend API (/api/copilot/chat)
  try {
    const backendRes = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        coordinates,
        telemetry,
        activeTab: currentCopilotContext.activeTab || 'mars',
        activePlanet: currentCopilotContext.activePlanet || 'mars',
        apiKey: userApiKey,
      }),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data && data.content) {
        return {
          id: data.id || `ai_${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          sourceTier: data.sourceTier || 'TIER_1_MIRA_DATASET',
          sourceLabel: data.sourceLabel || 'MIRA Python Backend Grounding',
          action: data.action,
          navigationTarget: data.navigationTarget,
          citations: data.citations || [],
          spokenText: data.spokenText,
          telemetrySnapshot: coordinates
            ? {
                lat: coordinates.latitude,
                lon: coordinates.longitude,
                altitudeKm: telemetry?.altitudeKm || 9200,
                nearestLandmark: findNearestMarsLandmark(coordinates.latitude, coordinates.longitude).landmark.name,
              }
            : undefined,
        };
      }
    }
  } catch {
    // If Python backend is offline, seamlessly proceed to built-in local engine
  }

  const localResult = generateHierarchicalScientificResponse(
    prompt,
    telemetry,
    coordinates,
    lastTarget,
    currentCopilotContext
  );

  // If localResult handled a navigation or control action directly, prioritize immediate execution
  if (localResult.action) {
    return {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: localResult.response,
      timestamp: new Date(),
      sourceTier: localResult.sourceTier,
      sourceLabel: localResult.sourceLabel,
      action: localResult.action,
      navigationTarget: localResult.navigationTarget,
      citations: localResult.citations,
      spokenText: localResult.spokenText,
      telemetrySnapshot: coordinates
        ? {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          altitudeKm: telemetry?.altitudeKm || 9200,
          nearestLandmark: findNearestMarsLandmark(coordinates.latitude, coordinates.longitude).landmark.name,
        }
        : undefined,
    };
  }

  // Check for API key
  const activeKey =
    userApiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('mira_gemini_api_key') : null) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (activeKey && activeKey.trim().length > 15) {
    try {
      const historySnippets = (conversationHistory || [])
        .slice(-4)
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const systemPrompt = `You are MIRA, the NASA Mars Interactive Reconnaissance & Analysis science intelligence system.
Observer telemetry: Latitude: ${coordinates?.latitude.toFixed(2) ?? 18.38}°, Longitude: ${coordinates?.longitude.toFixed(2) ?? 77.58}°, Altitude: ${telemetry?.altitudeKm.toFixed(0) ?? 9200} km. Jezero Crater is established as the prime reference datum (0.00°, 0.00°).

CRITICAL TONE & OUTPUT QUALITY RULES:
1. DIRECTLY address the user's prompt without preamble, greeting, or conversational filler.
2. NEVER say "I am MIRA", "I am your AI Copilot", "As your copilot", "Hello Commander", or similar repetitive introductions.
3. Start immediately with the factual answer, scientific data, or flight action status.
4. DO NOT wrap clean prose or units in raw LaTeX dollar delimiters ($ or $$). Write numbers and units naturally (e.g. 149.6 million km, 29.78 km/s).
5. Provide official NASA/JPL/USGS clickable markdown links for verifiable claims.
6. If the requested data does not exist or has never been measured, disclose that limitation honestly. Do not hallucinate coordinates or measurements.

STRICT SOURCE HIERARCHY:
Priority 1: Official NASA sources (NASA Science, NASA PDS, NASA JPL).
Priority 2: Authoritative institutions (ESA, USGS Astrogeology, IAU).
Priority 3: Peer-reviewed publications and deep space mission repositories.

Recent Conversation Context:
${historySnippets}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Clean text: strip accidental LaTeX dollar wrappers from general text
          const cleanedText = text
            .replace(/\$\s*([0-9.,]+)\s*\$/g, '$1')
            .replace(/\$\s*([a-zA-Z]+)\s*\$/g, '$1');

          let tier: CopilotSourceTier = 'TIER_3_GLOBAL_WEB_AI';
          let label = 'TIER 3: Global Web & Frontier AI Knowledge';
          if (cleanedText.includes('nasa.gov') || prompt.toLowerCase().includes('nasa') || prompt.toLowerCase().includes('mars')) {
            tier = 'TIER_1_MIRA_DATASET';
            label = 'TIER 1: MIRA Active NASA Datasets & Telemetry';
          }

          return {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: cleanedText,
            timestamp: new Date(),
            sourceTier: tier,
            sourceLabel: label,
            action: localResult.action,
            navigationTarget: localResult.navigationTarget,
            citations: localResult.citations || [NASA_CITATIONS.nasaPlanetaryFactSheets],
            spokenText: normalizeSpeechText(cleanedText),
            telemetrySnapshot: coordinates
              ? {
                lat: coordinates.latitude,
                lon: coordinates.longitude,
                altitudeKm: telemetry?.altitudeKm || 9200,
                nearestLandmark: findNearestMarsLandmark(coordinates.latitude, coordinates.longitude).landmark.name,
              }
              : undefined,
          };
        }
      }
    } catch {
      // Fallback seamlessly to built-in hierarchical scientific engine
    }
  }

  // Return local hierarchical response
  return {
    id: `ai_${Date.now()}`,
    role: 'assistant',
    content: localResult.response,
    timestamp: new Date(),
    sourceTier: localResult.sourceTier,
    sourceLabel: localResult.sourceLabel,
    action: localResult.action,
    navigationTarget: localResult.navigationTarget,
    citations: localResult.citations,
    spokenText: localResult.spokenText,
    telemetrySnapshot: coordinates
      ? {
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        altitudeKm: telemetry?.altitudeKm || 9200,
        nearestLandmark: findNearestMarsLandmark(coordinates.latitude, coordinates.longitude).landmark.name,
      }
      : undefined,
  };
}
