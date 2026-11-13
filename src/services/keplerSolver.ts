/**
 * NUMERICALLY STABLE KEPLERIAN ORBITAL MECHANICS ENGINE
 * 
 * Implements Kepler's Laws, Newton-Raphson Kepler Equation Solver,
 * and 3D coordinate transformations from the orbital plane to the
 * J2000 Heliocentric Ecliptic frame.
 * 
 * Formulas:
 * 1. Kepler's Equation: M = E - e * sin(E)
 * 2. Orbital Plane Coordinates:
 *    x' = a * (cos(E) - e)
 *    y' = a * sqrt(1 - e^2) * sin(E)
 *    z' = 0
 * 3. 3D Rotation Matrix to J2000 Ecliptic:
 *    R = Rz(-node) * Rx(-I) * Rz(-omega)
 */

import {
  ASTRONOMICAL_UNIT_KM,
  HELIOCENTRIC_MU_AU_DAY,
  PLANETS_SCIENTIFIC_REGISTRY,
  ScientificPlanetDefinition,
} from './planetaryData';
import { julianDateToCenturies } from './timeService';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CalculatedOrbitalParameters {
  planetId: string;
  name: string;
  epochJd: number;
  epochDateUtc: Date;
  
  // Keplerian Elements at Epoch
  semiMajorAxisAU: number;       // a (AU)
  semiMinorAxisAU: number;       // b (AU)
  eccentricity: number;          // e
  inclinationDeg: number;        // I (deg)
  longitudeOfAscendingNodeDeg: number; // Omega (deg)
  argumentOfPerihelionDeg: number;     // omega (deg)
  longitudeOfPerihelionDeg: number;    // varpi (deg)
  meanLongitudeDeg: number;      // L (deg)
  meanAnomalyDeg: number;        // M (deg)
  eccentricAnomalyDeg: number;   // E (deg)
  trueAnomalyDeg: number;        // nu (deg)

  // Derived Physical Dynamics
  orbitalPeriodDays: number;     // P (days)
  orbitalPeriodYears: number;    // P (years)
  meanMotionDegPerDay: number;   // n (deg/day)
  perihelionDistanceAU: number;  // q = a(1-e) (AU)
  aphelionDistanceAU: number;    // Q = a(1+e) (AU)
  currentDistanceAU: number;     // r (AU)
  currentDistanceKm: number;     // r (km)

  // Cartesian Heliocentric J2000 State Vectors
  positionAU: Vector3D;          // [X, Y, Z] in AU
  positionKm: Vector3D;          // [X, Y, Z] in km
  velocityAuPerDay: Vector3D;    // [Vx, Vy, Vz] in AU/day
  velocityKmPerSec: Vector3D;    // [Vx, Vy, Vz] in km/s
  totalSpeedKmPerSec: number;    // |V| in km/s

  // Specific Geometric Markers in J2000 Ecliptic 3D
  perihelionPositionAU: Vector3D;
  aphelionPositionAU: Vector3D;
  ascendingNodePositionAU: Vector3D;
  descendingNodePositionAU: Vector3D;

  // Closed Elliptical 3D Trajectory Points (AU)
  orbitTrajectoryAU: Vector3D[];

  // Ephemeris / Accuracy Status
  dataSource: 'NASA JPL Keplerian Rates (Table 1/2)' | 'NASA JPL Horizons Ephemeris (VECTORS)';
  isNumericalHorizons: boolean;
  retrievalTimestamp: number;
}

/**
 * Normalizes an angle in degrees to [0, 360)
 */
export function normalizeAngleDeg(deg: number): number {
  let angle = deg % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Normalizes an angle in degrees to [-180, 180)
 */
export function normalizeAngle180Deg(deg: number): number {
  let angle = normalizeAngleDeg(deg);
  if (angle > 180) angle -= 360;
  return angle;
}

/**
 * Solves Kepler's Equation: M = E - e * sin(E) for Eccentric Anomaly E
 * using cubic-convergent Newton-Raphson iteration with machine epsilon stability.
 * 
 * @param M_rad Mean anomaly in radians
 * @param e Orbital eccentricity (0 <= e < 1)
 * @param tolerance Convergence threshold in radians (default: 1e-13)
 * @param maxIterations Maximum iteration limit
 */
export function solveKeplerEquation(
  M_rad: number,
  e: number,
  tolerance = 1e-13,
  maxIterations = 30
): number {
  // Normalize M to [-pi, pi]
  let M = M_rad % (2 * Math.PI);
  if (M > Math.PI) M -= 2 * Math.PI;
  if (M < -Math.PI) M += 2 * Math.PI;

  // Initial estimate: Danby / Gooding starting value
  let E = e < 0.8 ? M : Math.PI;
  if (e > 0.8 && M !== 0) {
    E = M + Math.sign(M) * 0.85 * e;
  }

  for (let i = 0; i < maxIterations; i++) {
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);
    const f = E - e * sinE - M;
    const fPrime = 1 - e * cosE;

    // Standard Newton step with Halley's correction for rapid quadratic/cubic convergence
    const fDoublePrime = e * sinE;
    const delta = f / (fPrime - (0.5 * f * fDoublePrime) / fPrime);

    E -= delta;
    if (Math.abs(delta) < tolerance) {
      break;
    }
  }

  return E;
}

/**
 * Rotates coordinates from the 2D orbital plane (x', y', 0)
 * into the 3D Heliocentric J2000 Mean Ecliptic frame (X, Y, Z).
 * 
 * Matrix: R = Rz(-node) * Rx(-I) * Rz(-omega)
 */
export function orbitalPlaneToEclipticJ2000(
  xp: number,
  yp: number,
  omegaRad: number,     // Argument of perihelion
  nodeRad: number,      // Longitude of ascending node
  inclinationRad: number // Inclination
): Vector3D {
  const cosOmega = Math.cos(omegaRad);
  const sinOmega = Math.sin(omegaRad);
  const cosNode = Math.cos(nodeRad);
  const sinNode = Math.sin(nodeRad);
  const cosI = Math.cos(inclinationRad);
  const sinI = Math.sin(inclinationRad);

  // Direction cosine unit vectors
  const Px = cosOmega * cosNode - sinOmega * sinNode * cosI;
  const Py = cosOmega * sinNode + sinOmega * cosNode * cosI;
  const Pz = sinOmega * sinI;

  const Qx = -sinOmega * cosNode - cosOmega * sinNode * cosI;
  const Qy = -sinOmega * sinNode + cosOmega * cosNode * cosI;
  const Qz = cosOmega * sinI;

  return {
    x: xp * Px + yp * Qx,
    y: xp * Py + yp * Qy,
    z: xp * Pz + yp * Qz,
  };
}

/**
 * Calculates complete, authoritative 3D orbital dynamics for a planet at a specific Julian Date
 * using NASA JPL Keplerian Elements and Secular Rates.
 */
export function calculatePlanetOrbit(
  planetDef: ScientificPlanetDefinition,
  jd: number,
  trajectorySteps = 720
): CalculatedOrbitalParameters {
  const T = julianDateToCenturies(jd); // Julian centuries from J2000.0
  const kep = planetDef.keplerian;
  const chars = planetDef.characteristics;

  // 1. Keplerian elements at epoch T
  let a = kep.a0 + kep.adot * T;
  let e = kep.e0 + kep.edot * T;
  let I_deg = kep.I0 + kep.Idot * T;
  let L_deg = kep.L0 + kep.Ldot * T;
  let peri_deg = kep.peri0 + kep.peridot * T;
  let node_deg = kep.node0 + kep.nodedot * T;

  // Guard bound eccentricity
  e = Math.max(0.000001, Math.min(0.999999, e));
  a = Math.max(0.1, a);

  // Argument of perihelion: omega = varpi - Omega
  let omega_deg = peri_deg - node_deg;

  // Mean anomaly: M = L - varpi
  let M_deg = L_deg - peri_deg;

  // Include optional outer planet perturbation terms (Jupiter through Neptune)
  if (kep.extra) {
    const fT_rad = (kep.extra.f * T * Math.PI) / 180;
    const extraCorrection =
      kep.extra.b * T * T +
      kep.extra.c * Math.cos(fT_rad) +
      kep.extra.s * Math.sin(fT_rad);
    M_deg += extraCorrection;
  }

  // Normalize angles
  I_deg = normalizeAngleDeg(I_deg);
  node_deg = normalizeAngleDeg(node_deg);
  omega_deg = normalizeAngleDeg(omega_deg);
  peri_deg = normalizeAngleDeg(peri_deg);
  L_deg = normalizeAngleDeg(L_deg);
  const normalizedM_deg = normalizeAngle180Deg(M_deg);

  // Convert to radians for computation
  const I_rad = (I_deg * Math.PI) / 180;
  const node_rad = (node_deg * Math.PI) / 180;
  const omega_rad = (omega_deg * Math.PI) / 180;
  const M_rad = (normalizedM_deg * Math.PI) / 180;

  // 2. Solve Kepler's Equation for Eccentric Anomaly E
  const E_rad = solveKeplerEquation(M_rad, e);
  const E_deg = normalizeAngleDeg((E_rad * 180) / Math.PI);

  // 3. True Anomaly nu
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E_rad)) / (1 - e * Math.cos(E_rad));
  const cosNu = (Math.cos(E_rad) - e) / (1 - e * Math.cos(E_rad));
  const nu_rad = Math.atan2(sinNu, cosNu);
  const nu_deg = normalizeAngleDeg((nu_rad * 180) / Math.PI);

  // 4. Coordinates in orbital plane
  const xp = a * (Math.cos(E_rad) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E_rad);
  const r_au = a * (1 - e * Math.cos(E_rad)); // Instantaneous distance in AU
  const r_km = r_au * ASTRONOMICAL_UNIT_KM;

  // Semi-minor axis: b = a * sqrt(1 - e^2)
  const b = a * Math.sqrt(1 - e * e);

  // Perihelion and Aphelion distances
  const q_au = a * (1 - e);
  const Q_au = a * (1 + e);

  // Orbital Period (Kepler's Third Law): P = a^(3/2) years
  const periodYears = Math.pow(a, 1.5);
  const periodDays = periodYears * 365.25636;
  const meanMotionDegPerDay = 360 / periodDays;

  // 5. Transform position to J2000 Ecliptic Frame
  const posAU = orbitalPlaneToEclipticJ2000(xp, yp, omega_rad, node_rad, I_rad);
  const posKm: Vector3D = {
    x: posAU.x * ASTRONOMICAL_UNIT_KM,
    y: posAU.y * ASTRONOMICAL_UNIT_KM,
    z: posAU.z * ASTRONOMICAL_UNIT_KM,
  };

  // 6. Orbital Velocity (Vis-Viva Equation & state derivative)
  // In orbital plane:
  // dx'/dt = -sqrt(mu * a) / r * sin(E)
  // dy'/dt = sqrt(mu * a * (1 - e^2)) / r * cos(E)
  const factor = Math.sqrt(HELIOCENTRIC_MU_AU_DAY * a) / r_au;
  const v_xp = -factor * Math.sin(E_rad);
  const v_yp = factor * Math.sqrt(1 - e * e) * Math.cos(E_rad);

  const velAU_Day = orbitalPlaneToEclipticJ2000(v_xp, v_yp, omega_rad, node_rad, I_rad);

  // 1 AU/day = 149597870.7 km / 86400 s ≈ 1731.4568368 km/s
  const auDayToKmSec = ASTRONOMICAL_UNIT_KM / 86400.0;
  const velKmSec: Vector3D = {
    x: velAU_Day.x * auDayToKmSec,
    y: velAU_Day.y * auDayToKmSec,
    z: velAU_Day.z * auDayToKmSec,
  };

  const totalSpeedKmSec = Math.sqrt(
    velKmSec.x * velKmSec.x + velKmSec.y * velKmSec.y + velKmSec.z * velKmSec.z
  );

  // 7. Key Geometric Orbital Markers in J2000 Ecliptic
  // Perihelion: E = 0 -> xp = a(1-e), yp = 0
  const perihelionPositionAU = orbitalPlaneToEclipticJ2000(
    a * (1 - e),
    0,
    omega_rad,
    node_rad,
    I_rad
  );

  // Aphelion: E = PI -> xp = -a(1+e), yp = 0
  const aphelionPositionAU = orbitalPlaneToEclipticJ2000(
    -a * (1 + e),
    0,
    omega_rad,
    node_rad,
    I_rad
  );

  // Ascending Node: nu = -omega -> true anomaly when passing ascending node
  const r_asc = (a * (1 - e * e)) / (1 + e * Math.cos(-omega_rad));
  const asc_xp = r_asc * Math.cos(-omega_rad);
  const asc_yp = r_asc * Math.sin(-omega_rad);
  const ascendingNodePositionAU = orbitalPlaneToEclipticJ2000(
    asc_xp,
    asc_yp,
    omega_rad,
    node_rad,
    I_rad
  );

  // Descending Node: nu = PI - omega
  const r_desc = (a * (1 - e * e)) / (1 + e * Math.cos(Math.PI - omega_rad));
  const desc_xp = r_desc * Math.cos(Math.PI - omega_rad);
  const desc_yp = r_desc * Math.sin(Math.PI - omega_rad);
  const descendingNodePositionAU = orbitalPlaneToEclipticJ2000(
    desc_xp,
    desc_yp,
    omega_rad,
    node_rad,
    I_rad
  );

  // 8. Generate Closed 3D Elliptical Trajectory Points (720 sub-degree points for continuous closed LineLoop)
  const orbitTrajectoryAU: Vector3D[] = [];
  for (let i = 0; i < trajectorySteps; i++) {
    const angleE = (i / trajectorySteps) * Math.PI * 2;
    const step_xp = a * (Math.cos(angleE) - e);
    const step_yp = a * Math.sqrt(1 - e * e) * Math.sin(angleE);
    const step_point = orbitalPlaneToEclipticJ2000(step_xp, step_yp, omega_rad, node_rad, I_rad);
    orbitTrajectoryAU.push(step_point);
  }

  // Verification checks for physical sanity
  if (!Number.isFinite(posAU.x) || !Number.isFinite(posAU.y) || !Number.isFinite(posAU.z)) {
    throw new Error(`Numerical instability in Keplerian solver for planet ${chars.name}`);
  }

  return {
    planetId: chars.id,
    name: chars.name,
    epochJd: jd,
    epochDateUtc: new Date((jd - 2440587.5) * 86400000),

    semiMajorAxisAU: a,
    semiMinorAxisAU: b,
    eccentricity: e,
    inclinationDeg: I_deg,
    longitudeOfAscendingNodeDeg: node_deg,
    argumentOfPerihelionDeg: omega_deg,
    longitudeOfPerihelionDeg: peri_deg,
    meanLongitudeDeg: L_deg,
    meanAnomalyDeg: normalizeAngleDeg(M_deg),
    eccentricAnomalyDeg: E_deg,
    trueAnomalyDeg: nu_deg,

    orbitalPeriodDays: periodDays,
    orbitalPeriodYears: periodYears,
    meanMotionDegPerDay: meanMotionDegPerDay,
    perihelionDistanceAU: q_au,
    aphelionDistanceAU: Q_au,
    currentDistanceAU: r_au,
    currentDistanceKm: r_km,

    positionAU: posAU,
    positionKm: posKm,
    velocityAuPerDay: velAU_Day,
    velocityKmPerSec: velKmSec,
    totalSpeedKmPerSec: totalSpeedKmSec,

    perihelionPositionAU,
    aphelionPositionAU,
    ascendingNodePositionAU,
    descendingNodePositionAU,

    orbitTrajectoryAU,

    dataSource: 'NASA JPL Keplerian Rates (Table 1/2)',
    isNumericalHorizons: false,
    retrievalTimestamp: Date.now(),
  };
}

/**
 * Calculates all eight planetary orbits at once.
 */
export function calculateAllPlanets(jd: number): Record<string, CalculatedOrbitalParameters> {
  const result: Record<string, CalculatedOrbitalParameters> = {};
  for (const [id, def] of Object.entries(PLANETS_SCIENTIFIC_REGISTRY)) {
    result[id] = calculatePlanetOrbit(def, jd);
  }
  return result;
}
