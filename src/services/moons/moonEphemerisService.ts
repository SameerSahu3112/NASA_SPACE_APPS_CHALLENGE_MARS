/**
 * NASA PROJECT MIRA — MARTIAN SATELLITE EPHEMERIS & MECHANICS SERVICE
 * 
 * Provides high-precision ephemeris calculations for Mars's natural satellites:
 * - Phobos (IAU / Horizons ID: 401)
 * - Deimos (IAU / Horizons ID: 402)
 * 
 * Reference Frame: Mars-Centered Mars-Fixed (MCMF) / Body Equator ICRF
 * Center Body: Mars System Barycenter / Center (500@499)
 * 
 * Data Sources:
 * - NASA JPL Horizons API: https://ssd.jpl.nasa.gov/api/horizons.api
 * - NASA Mars Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
 * - NASA PDS Small Bodies Node (Thomas et al. shape & geodesy)
 */

export interface MoonStateVector {
  moonId: 'phobos' | 'deimos';
  timestamp: number; // Unix timestamp in ms
  simulationTimeSec: number;
  // Mars-relative Cartesian coordinates in METERS
  position: { x: number; y: number; z: number };
  // Mars-relative Cartesian velocity in METERS / SEC
  velocity: { x: number; y: number; z: number };
  distanceMeters: number;
  distanceKm: number;
  altitudeKm: number;
  speedKmPerSec: number;
  angularSpeedDegPerHour: number;
  orbitalPeriodHours: number;
  ephemerisSource: 'JPL_HORIZONS' | 'KEPLER_PROPAGATOR';
}

export interface MoonMetadata {
  id: 'phobos' | 'deimos';
  name: string;
  commandId: string;
  modelUri: string;
  modelScale: number; // GLB units are in km -> 1000.0 converts to meters
  meshDimensionsKm: {
    longAxis: number;
    intermediateAxis: number;
    shortAxis: number;
    spanX: number;
    spanY: number;
    spanZ: number;
  };
  nasaFactSheetDimensionsKm: {
    longAxis: number;
    intermediateAxis: number;
    shortAxis: number;
    meanRadius: number;
  };
  orbit: {
    semiMajorAxisKm: number;
    eccentricity: number;
    inclinationDeg: number;
    periodHours: number;
    meanSpeedKmPerSec: number;
    meanAngularSpeedDegPerHour: number;
  };
  tidalLocking: {
    synchronous: boolean;
    rotationPeriodHours: number;
    marsFacingVector: { x: number; y: number; z: number };
  };
}

// Mars Physical Constants (NASA Mars Fact Sheet & IAU)
export const MARS_CONSTANTS = {
  equatorialRadiusMeters: 3396190,
  polarRadiusMeters: 3376200,
  equatorialRadiusKm: 3396.19,
  gravitationalParameterKm3S2: 42828.375214, // GM_Mars in km^3 / s^2
  gravitationalParameterM3S2: 4.2828375214e13, // GM_Mars in m^3 / s^2
  // Scientifically authentic Mars rotational parameters (IAU 2015 / NASA JPL)
  siderealDaySeconds: 88642.663, // 24h 37m 22.663s
  angularVelocityRadPerSec: 7.08821808e-5, // 2*PI / 88642.663
  degPerDay: 350.89198226,
  iauW0Deg: 176.630, // IAU 2015 prime meridian offset at J2000.0
  j2000EpochMs: 946728000000, // Date.UTC(2000, 0, 1, 12, 0, 0)
};

/**
 * Computes official IAU/NASA Mars axial rotation angle (in radians) for a given UTC timestamp.
 * Used for synchronization with the shared simulation clock.
 */
export function computeMarsRotationAngle(epochMs: number): number {
  const d = (epochMs - MARS_CONSTANTS.j2000EpochMs) / 86400000.0;
  const wDeg = (MARS_CONSTANTS.iauW0Deg + MARS_CONSTANTS.degPerDay * d) % 360.0;
  return (wDeg * Math.PI) / 180.0;
}

export const MOONS_METADATA: Record<'phobos' | 'deimos', MoonMetadata> = {
  phobos: {
    id: 'phobos',
    name: 'Phobos',
    commandId: '401',
    modelUri: '/models/phobos.glb',
    modelScale: 1000.0, // Authentic 1:1 physical meter scaling
    meshDimensionsKm: {
      longAxis: 27.04,
      intermediateAxis: 24.37,
      shortAxis: 20.52,
      spanX: 24.37,
      spanY: 20.52,
      spanZ: 27.04,
    },
    nasaFactSheetDimensionsKm: {
      longAxis: 26.06,
      intermediateAxis: 22.80,
      shortAxis: 18.28,
      meanRadius: 11.08,
    },
    orbit: {
      semiMajorAxisKm: 9376.0,
      eccentricity: 0.0151,
      inclinationDeg: 1.093,
      periodHours: 7.65384,
      meanSpeedKmPerSec: 2.138,
      meanAngularSpeedDegPerHour: 47.035,
    },
    tidalLocking: {
      synchronous: true,
      rotationPeriodHours: 7.65384,
      marsFacingVector: { x: -1, y: 0, z: 0 },
    },
  },
  deimos: {
    id: 'deimos',
    name: 'Deimos',
    commandId: '402',
    modelUri: '/models/deimos.glb',
    modelScale: 1000.0, // Authentic 1:1 physical meter scaling
    meshDimensionsKm: {
      longAxis: 15.01,
      intermediateAxis: 11.87,
      shortAxis: 10.51,
      spanX: 15.01,
      spanY: 11.87,
      spanZ: 10.51,
    },
    nasaFactSheetDimensionsKm: {
      longAxis: 15.0,
      intermediateAxis: 12.1,
      shortAxis: 10.4,
      meanRadius: 6.2,
    },
    orbit: {
      semiMajorAxisKm: 23463.0,
      eccentricity: 0.0005,
      inclinationDeg: 1.793,
      periodHours: 30.29856,
      meanSpeedKmPerSec: 1.351,
      meanAngularSpeedDegPerHour: 11.882,
    },
    tidalLocking: {
      synchronous: true,
      rotationPeriodHours: 30.29856,
      marsFacingVector: { x: -1, y: 0, z: 0 },
    },
  },
};

// In-memory cache for state vectors
const STATE_VECTOR_CACHE = new Map<string, MoonStateVector>();

/**
 * Solves Kepler's equation M = E - e*sin(E) using Newton-Raphson method
 */
function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  let eAnomaly = meanAnomalyRad;
  const tolerance = 1e-12;
  const maxIter = 50;
  for (let i = 0; i < maxIter; i++) {
    const f = eAnomaly - eccentricity * Math.sin(eAnomaly) - meanAnomalyRad;
    const fPrime = 1 - eccentricity * Math.cos(eAnomaly);
    const delta = f / fPrime;
    eAnomaly -= delta;
    if (Math.abs(delta) < tolerance) break;
  }
  return eAnomaly;
}

/**
 * Computes high-precision two-body Keplerian state vector relative to Mars center
 */
export function computeKeplerStateVector(
  moonId: 'phobos' | 'deimos',
  simTimeSeconds: number,
  epochMs: number = Date.now()
): MoonStateVector {
  const meta = MOONS_METADATA[moonId];
  const { semiMajorAxisKm, eccentricity, inclinationDeg, periodHours } = meta.orbit;

  const mu = MARS_CONSTANTS.gravitationalParameterKm3S2;
  const aKm = semiMajorAxisKm;
  const e = eccentricity;
  const incRad = (inclinationDeg * Math.PI) / 180.0;
  const periodSeconds = periodHours * 3600.0;

  // Mean motion n in rad/s
  const n = (2.0 * Math.PI) / periodSeconds;

  // Base phase offsets for aesthetically distinct initial orbital positions
  const basePhaseRad = moonId === 'phobos' ? 0.85 : 2.45;
  const meanAnomaly = (basePhaseRad + n * simTimeSeconds) % (2.0 * Math.PI);

  // Eccentric anomaly E
  const eccAnomaly = solveKepler(meanAnomaly, e);

  // True anomaly nu
  const sinNu = (Math.sqrt(1.0 - e * e) * Math.sin(eccAnomaly)) / (1.0 - e * Math.cos(eccAnomaly));
  const cosNu = (Math.cos(eccAnomaly) - e) / (1.0 - e * Math.cos(eccAnomaly));
  const trueAnomaly = Math.atan2(sinNu, cosNu);

  // Distance r in km from Mars center
  const rKm = (aKm * (1.0 - e * e)) / (1.0 + e * Math.cos(trueAnomaly));

  // Instantaneous orbital speed via vis-viva equation: v^2 = mu * (2/r - 1/a)
  const vKmPerSec = Math.sqrt(Math.max(0, mu * (2.0 / rKm - 1.0 / aKm)));

  // Orbital plane coordinates
  const xOrb = rKm * Math.cos(trueAnomaly);
  const yOrb = rKm * Math.sin(trueAnomaly);

  // Velocity components in orbital plane
  const pKm = aKm * (1.0 - e * e);
  const hOrb = Math.sqrt(mu * pKm); // Specific angular momentum
  const vxOrb = -(mu / hOrb) * Math.sin(trueAnomaly);
  const vyOrb = (mu / hOrb) * (e + Math.cos(trueAnomaly));

  // Rotate to Mars Equatorial plane (inclined by incRad)
  // X = xOrb
  // Y = yOrb * cos(inc)
  // Z = yOrb * sin(inc)
  const xKm = xOrb;
  const yKm = yOrb * Math.cos(incRad);
  const zKm = yOrb * Math.sin(incRad);

  const vxKm = vxOrb;
  const vyKm = vyOrb * Math.cos(incRad);
  const vzKm = vyOrb * Math.sin(incRad);

  // Convert to meters for Cesium world coordinates
  const xM = xKm * 1000.0;
  const yM = yKm * 1000.0;
  const zM = zKm * 1000.0;

  const vxM = vxKm * 1000.0;
  const vyM = vyKm * 1000.0;
  const vzM = vzKm * 1000.0;

  const altitudeKm = rKm - MARS_CONSTANTS.equatorialRadiusKm;
  const angularSpeedDegPerHour = (vKmPerSec / rKm) * (180.0 / Math.PI) * 3600.0;

  return {
    moonId,
    timestamp: epochMs,
    simulationTimeSec: simTimeSeconds,
    position: { x: xM, y: yM, z: zM },
    velocity: { x: vxM, y: vyM, z: vzM },
    distanceMeters: rKm * 1000.0,
    distanceKm: rKm,
    altitudeKm,
    speedKmPerSec: vKmPerSec,
    angularSpeedDegPerHour,
    orbitalPeriodHours: periodHours,
    ephemerisSource: 'KEPLER_PROPAGATOR',
  };
}

/**
 * Attempts to query NASA JPL Horizons API for true Cartesian state vectors.
 * Gracefully falls back to Kepler propagator if unavailable or blocked by CORS.
 */
export async function fetchHorizonsStateVector(
  moonId: 'phobos' | 'deimos',
  simTimeSeconds: number,
  epochDate: Date = new Date()
): Promise<MoonStateVector> {
  const cacheKey = `${moonId}_${Math.floor(simTimeSeconds / 60)}`;
  if (STATE_VECTOR_CACHE.has(cacheKey)) {
    return STATE_VECTOR_CACHE.get(cacheKey)!;
  }

  const meta = MOONS_METADATA[moonId];
  const commandId = meta.commandId; // '401' or '402'

  // Format date for Horizons: YYYY-MM-DD HH:MM
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = epochDate.getUTCFullYear();
  const mm = pad(epochDate.getUTCMonth() + 1);
  const dd = pad(epochDate.getUTCDate());
  const hh = pad(epochDate.getUTCHours());
  const min = pad(epochDate.getUTCMinutes());
  const startTime = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

  const nextDate = new Date(epochDate.getTime() + 10 * 60 * 1000); // 10 minutes later
  const stopYyyy = nextDate.getUTCFullYear();
  const stopMm = pad(nextDate.getUTCMonth() + 1);
  const stopDd = pad(nextDate.getUTCDate());
  const stopHh = pad(nextDate.getUTCHours());
  const stopMin = pad(nextDate.getUTCMinutes());
  const stopTime = `${stopYyyy}-${stopMm}-${stopDd} ${stopHh}:${stopMin}`;

  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${commandId}'`,
    CENTER: "'500@499'", // Mars Center Body
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'",
    REF_PLANE: "'BODY EQUATOR'",
    REF_SYSTEM: "'ICRF'",
    START_TIME: `'${startTime}'`,
    STOP_TIME: `'${stopTime}'`,
    STEP_SIZE: "'5m'",
    VEC_CORR: "'NONE'",
    OUT_UNITS: "'KM-S'",
    CSV_FORMAT: "'YES'",
  });

  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const rawResult = data.result || '';
      const soe = rawResult.indexOf('$$SOE');
      const eoe = rawResult.indexOf('$$EOE');

      if (soe !== -1 && eoe !== -1) {
        const lines = rawResult.slice(soe + 5, eoe).trim().split('\n');
        for (const line of lines) {
          const parts = line.split(',').map((p: string) => p.trim());
          if (parts.length >= 8) {
            // CSV: JDTDB, Calendar, X, Y, Z, VX, VY, VZ
            const xKm = parseFloat(parts[2]);
            const yKm = parseFloat(parts[3]);
            const zKm = parseFloat(parts[4]);
            const vxKm = parseFloat(parts[5]);
            const vyKm = parseFloat(parts[6]);
            const vzKm = parseFloat(parts[7]);

            if (!isNaN(xKm) && !isNaN(yKm) && !isNaN(zKm)) {
              const rKm = Math.sqrt(xKm * xKm + yKm * yKm + zKm * zKm);
              const vKm = Math.sqrt(vxKm * vxKm + vyKm * vyKm + vzKm * vzKm);
              const altitudeKm = rKm - MARS_CONSTANTS.equatorialRadiusKm;
              const angularSpeedDegPerHour = (vKm / rKm) * (180.0 / Math.PI) * 3600.0;

              const vector: MoonStateVector = {
                moonId,
                timestamp: epochDate.getTime(),
                simulationTimeSec: simTimeSeconds,
                position: { x: xKm * 1000.0, y: yKm * 1000.0, z: zKm * 1000.0 },
                velocity: { x: vxKm * 1000.0, y: vyKm * 1000.0, z: vzKm * 1000.0 },
                distanceMeters: rKm * 1000.0,
                distanceKm: rKm,
                altitudeKm,
                speedKmPerSec: vKm,
                angularSpeedDegPerHour,
                orbitalPeriodHours: meta.orbit.periodHours,
                ephemerisSource: 'JPL_HORIZONS',
              };

              STATE_VECTOR_CACHE.set(cacheKey, vector);
              return vector;
            }
          }
        }
      }
    }
  } catch (err) {
    // Graceful fallback to analytical Kepler propagator
  }

  const fallback = computeKeplerStateVector(moonId, simTimeSeconds, epochDate.getTime());
  STATE_VECTOR_CACHE.set(cacheKey, fallback);
  return fallback;
}

/**
 * Computes pre-calculated points for the orbital path polyline in Mars Equatorial frame
 */
export function generateOrbitalPathPoints(
  moonId: 'phobos' | 'deimos',
  stepDeg: number = 2
): Array<{ x: number; y: number; z: number }> {
  const meta = MOONS_METADATA[moonId];
  const { semiMajorAxisKm, eccentricity, inclinationDeg } = meta.orbit;
  const aKm = semiMajorAxisKm;
  const e = eccentricity;
  const incRad = (inclinationDeg * Math.PI) / 180.0;

  const points: Array<{ x: number; y: number; z: number }> = [];

  for (let deg = 0; deg <= 360; deg += stepDeg) {
    const rad = (deg * Math.PI) / 180.0;
    const rKm = (aKm * (1.0 - e * e)) / (1.0 + e * Math.cos(rad));
    const xKm = rKm * Math.cos(rad);
    const yKm = rKm * Math.sin(rad) * Math.cos(incRad);
    const zKm = rKm * Math.sin(rad) * Math.sin(incRad);

    points.push({
      x: xKm * 1000.0,
      y: yKm * 1000.0,
      z: zKm * 1000.0,
    });
  }

  return points;
}

