/**
 * NASA JPL HORIZONS EPHEMERIS CLIENT & PARSER
 * 
 * Retrieves numerical Cartesian state vectors (X, Y, Z, Vx, Vy, Vz)
 * from the NASA Jet Propulsion Laboratory (JPL) Horizons API:
 * 
 * Reference: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 * Endpoint: /api/horizons.api (proxied via Vite) or direct https://ssd.jpl.nasa.gov/api/horizons.api
 * 
 * Center: @10 (Sun Center Body)
 * Ref System: J2000
 * Ref Plane: ECLIPTIC
 * Time System: TDB (Barycentric Dynamical Time)
 * Vector Corrections: NONE (Geometric State Vectors)
 * Output Units: AU-D (Astronomical Units and Days)
 */

import { ASTRONOMICAL_UNIT_KM } from './planetaryData';
import { Vector3D } from './keplerSolver';
import { formatHorizonsDate } from './timeService';

export interface HorizonsStateVector {
  commandId: string;
  targetName: string;
  epochJd: number;
  epochCalendarTdb: string;
  positionAU: Vector3D;
  positionKm: Vector3D;
  velocityAuPerDay: Vector3D;
  velocityKmPerSec: Vector3D;
  totalSpeedKmPerSec: number;
  distanceAU: number;
  distanceKm: number;
  lightTimeMinutes: number;
  rangeRateKmPerSec: number;
  rawText: string;
  retrievedAt: number;
}

// In-memory cache for fast interactive response
const HORIZONS_CACHE = new Map<string, HorizonsStateVector>();

/**
 * Builds the URL query parameters for JPL Horizons vector request
 */
function buildHorizonsQuery(commandId: string, startDateStr: string, stopDateStr: string): string {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${commandId}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'",
    CENTER: "'@10'", // Sun Center
    START_TIME: `'${startDateStr}'`,
    STOP_TIME: `'${stopDateStr}'`,
    STEP_SIZE: "'1d'",
    REF_PLANE: "'ECLIPTIC'",
    REF_SYSTEM: "'J2000'",
    VEC_CORR: "'NONE'", // Pure geometric vectors
    OUT_UNITS: "'AU-D'", // AU and AU/day
    CSV_FORMAT: "'YES'",
  });
  return params.toString();
}

/**
 * Parses the raw text returned between $$SOE and $$EOE in JPL Horizons output
 */
export function parseHorizonsVectorOutput(
  rawText: string,
  commandId: string
): HorizonsStateVector | null {
  const soeIdx = rawText.indexOf('$$SOE');
  const eoeIdx = rawText.indexOf('$$EOE');

  if (soeIdx === -1 || eoeIdx === -1) {
    console.warn('[JPL Horizons] Could not locate $$SOE/$$EOE boundary in response text.');
    return null;
  }

  const ephemBlock = rawText.slice(soeIdx + 5, eoeIdx).trim();
  const lines = ephemBlock.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // We parse the first vector record in the block
  // Format typically:
  // JDTDB = A.D. YYYY-Mon-DD HH:MM:SS.SSSS TDB
  //  X =... Y =... Z =...
  //  VX=... VY=... VZ=...
  //  LT=... RG=... RR=...
  let jd = 0;
  let calendarTdb = '';
  let x = 0, y = 0, z = 0;
  let vx = 0, vy = 0, vz = 0;
  let lt = 0, rg = 0, rr = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('=')) {
      if (line.includes('TDB') || line.includes('A.D.')) {
        const parts = line.split('=');
        jd = parseFloat(parts[0].trim());
        calendarTdb = parts[1]?.trim() || '';
      }

      const xMatch = line.match(/X\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      const yMatch = line.match(/Y\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      const zMatch = line.match(/Z\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      if (xMatch && yMatch && zMatch) {
        x = parseFloat(xMatch[1]);
        y = parseFloat(yMatch[1]);
        z = parseFloat(zMatch[1]);
      }

      const vxMatch = line.match(/VX\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      const vyMatch = line.match(/VY\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      const vzMatch = line.match(/VZ\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      if (vxMatch && vyMatch && vzMatch) {
        vx = parseFloat(vxMatch[1]);
        vy = parseFloat(vyMatch[1]);
        vz = parseFloat(vzMatch[1]);
      }

      const rgMatch = line.match(/RG\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      const rrMatch = line.match(/RR\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      const ltMatch = line.match(/LT\s*=\s*([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/);
      if (rgMatch) rg = parseFloat(rgMatch[1]);
      if (rrMatch) rr = parseFloat(rrMatch[1]);
      if (ltMatch) lt = parseFloat(ltMatch[1]);
    } else if (line.includes(',')) {
      // Parse CSV format: JDTDB, Calendar, X, Y, Z, VX, VY, VZ[, LT, RG, RR]
      const parts = line.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length >= 8) {
        const parsedJd = parseFloat(parts[0]);
        const parsedX = parseFloat(parts[2]);
        const parsedY = parseFloat(parts[3]);
        const parsedZ = parseFloat(parts[4]);
        const parsedVx = parseFloat(parts[5]);
        const parsedVy = parseFloat(parts[6]);
        const parsedVz = parseFloat(parts[7]);
        if (!Number.isNaN(parsedJd) && !Number.isNaN(parsedX) && !Number.isNaN(parsedY) && !Number.isNaN(parsedZ)) {
          jd = parsedJd;
          calendarTdb = parts[1];
          x = parsedX;
          y = parsedY;
          z = parsedZ;
          vx = Number.isNaN(parsedVx) ? vx : parsedVx;
          vy = Number.isNaN(parsedVy) ? vy : parsedVy;
          vz = Number.isNaN(parsedVz) ? vz : parsedVz;
          if (parts.length >= 11) {
            const parsedLt = parseFloat(parts[8]);
            const parsedRg = parseFloat(parts[9]);
            const parsedRr = parseFloat(parts[10]);
            if (!Number.isNaN(parsedLt)) lt = parsedLt;
            if (!Number.isNaN(parsedRg)) rg = parsedRg;
            if (!Number.isNaN(parsedRr)) rr = parsedRr;
          }
        }
      }
    }
  }

  // If distance wasn't explicitly matched, calculate from vector
  const distAU = rg > 0 ? rg : Math.sqrt(x * x + y * y + z * z);
  const auDayToKmSec = ASTRONOMICAL_UNIT_KM / 86400.0;

  const velKmSec: Vector3D = {
    x: vx * auDayToKmSec,
    y: vy * auDayToKmSec,
    z: vz * auDayToKmSec,
  };
  const totalSpeed = Math.sqrt(
    velKmSec.x * velKmSec.x + velKmSec.y * velKmSec.y + velKmSec.z * velKmSec.z
  );

  return {
    commandId,
    targetName: rawText.match(/Target body name:\s*([^\n{]+)/)?.[1]?.trim() || `Body ${commandId}`,
    epochJd: jd,
    epochCalendarTdb: calendarTdb,
    positionAU: { x, y, z },
    positionKm: {
      x: x * ASTRONOMICAL_UNIT_KM,
      y: y * ASTRONOMICAL_UNIT_KM,
      z: z * ASTRONOMICAL_UNIT_KM,
    },
    velocityAuPerDay: { x: vx, y: vy, z: vz },
    velocityKmPerSec: velKmSec,
    totalSpeedKmPerSec: totalSpeed,
    distanceAU: distAU,
    distanceKm: distAU * ASTRONOMICAL_UNIT_KM,
    lightTimeMinutes: lt * 24 * 60, // Light time in minutes
    rangeRateKmPerSec: rr * auDayToKmSec,
    rawText: ephemBlock,
    retrievedAt: Date.now(),
  };
}

/**
 * Fetches state vectors from NASA JPL Horizons for a given planet command ID and date.
 * Automatically tries local proxy first, falls back to direct endpoint, and caches results.
 */
export async function fetchHorizonsStateVector(
  commandId: string,
  targetDate: Date
): Promise<{ success: boolean; data?: HorizonsStateVector; error?: string }> {
  const startDateStr = formatHorizonsDate(targetDate);
  // Stop date is 1 day later
  const stopDate = new Date(targetDate.getTime() + 86400000);
  const stopDateStr = formatHorizonsDate(stopDate);

  const cacheKey = `${commandId}_${startDateStr}`;
  if (HORIZONS_CACHE.has(cacheKey)) {
    return { success: true, data: HORIZONS_CACHE.get(cacheKey) };
  }

  const queryString = buildHorizonsQuery(commandId, startDateStr, stopDateStr);

  // Endpoint candidates: 1. Vite proxy /api/horizons, 2. Direct JPL API
  const endpoints = [
    `/api/horizons?${queryString}`,
    `https://ssd.jpl.nasa.gov/api/horizons.api?${queryString}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.result) {
          const parsed = parseHorizonsVectorOutput(json.result, commandId);
          if (parsed) {
            HORIZONS_CACHE.set(cacheKey, parsed);
            return { success: true, data: parsed };
          }
        }
      }
    } catch (err: unknown) {
      console.warn(`[JPL Horizons] Failed query on ${endpoint}:`, err);
    }
  }

  return {
    success: false,
    error: 'NASA JPL Horizons API request timed out or was blocked by browser CORS. High-accuracy Keplerian solution remains fully active.',
  };
}

