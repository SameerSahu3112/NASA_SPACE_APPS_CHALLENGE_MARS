import React, { useState } from 'react';
import { 
  Database, 
  Orbit, 
  Compass, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { CalculatedOrbitalParameters } from '../../services/keplerSolver';
import { PLANETS_SCIENTIFIC_REGISTRY } from '../../services/planetaryData';
import { formatUtcDateTime } from '../../services/timeService';
import { fetchHorizonsStateVector, HorizonsStateVector } from '../../services/horizonsService';

interface ScientificDashboardProps {
  planetData: CalculatedOrbitalParameters | null;
  currentDate: Date;
  onApplyHorizonsVector?: (vector: HorizonsStateVector) => void;
}

export const ScientificDashboard: React.FC<ScientificDashboardProps> = ({
  planetData,
  currentDate,
  onApplyHorizonsVector,
}) => {
  const [isFetchingHorizons, setIsFetchingHorizons] = useState(false);
  const [horizonsResult, setHorizonsResult] = useState<HorizonsStateVector | null>(null);
  const [horizonsError, setHorizonsError] = useState<string | null>(null);

  if (!planetData) {
    return (
      <div className="p-6 text-center text-slate-400 font-mono-sci text-xs">
        Select a planet from the 3D viewport or roster to inspect its scientific parameters.
      </div>
    );
  }

  const def = PLANETS_SCIENTIFIC_REGISTRY[planetData.planetId];
  const chars = def?.characteristics;

  const handleFetchHorizons = async () => {
    if (!chars) return;
    setIsFetchingHorizons(true);
    setHorizonsError(null);

    const res = await fetchHorizonsStateVector(chars.commandId, currentDate);
    setIsFetchingHorizons(false);

    if (res.success && res.data) {
      setHorizonsResult(res.data);
      onApplyHorizonsVector?.(res.data);
    } else {
      setHorizonsError(res.error || 'Failed to retrieve ephemeris from NASA JPL Horizons.');
    }
  };

  return (
    <div className="space-y-5 text-xs font-sans text-slate-300">
      {/* 1. Header & Classification Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-md shrink-0"
              style={{ backgroundColor: chars?.colorHex || '#38bdf8' }}
            />
            <h2 className="font-title-sci font-bold text-base text-slate-100">
              {planetData.name.toUpperCase()}
            </h2>
            <span className="text-[10px] font-mono-sci px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-semibold uppercase">
              NAIF ID: {chars?.commandId}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {horizonsResult ? (
              <span className="flex items-center gap-1 text-[10px] font-mono-sci px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>JPL HORIZONS EPHEMERIS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono-sci px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-semibold">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>JPL KEPLERIAN SOLUTION</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          {chars?.description}
        </p>

        {chars?.scientificSignificance && (
          <div className="text-[10.5px] text-sky-300/90 bg-sky-950/30 p-2 rounded-lg border border-sky-500/20">
            <strong>Scientific Insight:</strong> {chars.scientificSignificance}
          </div>
        )}
      </div>

      {/* 2. NASA JPL Horizons Online Live Ephemeris Query */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono-sci text-xs font-bold text-slate-200">
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isFetchingHorizons ? 'animate-spin' : ''}`} />
            <span>NASA JPL Horizons State Vector Verification</span>
          </div>

          <button
            onClick={handleFetchHorizons}
            disabled={isFetchingHorizons}
            className="cursor-pointer px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-mono-sci text-[10px] font-semibold transition-colors flex items-center gap-1.5"
          >
            {isFetchingHorizons ? 'Querying Horizons...' : 'Query Horizons Ephemeris'}
          </button>
        </div>

        {horizonsError && (
          <div className="flex items-center gap-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-mono-sci">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>{horizonsError}</span>
          </div>
        )}

        {horizonsResult && (
          <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 space-y-1 font-mono-sci text-[10px] text-emerald-200">
            <div className="font-bold flex items-center justify-between">
              <span>Epoch: {horizonsResult.epochCalendarTdb} (JD {horizonsResult.epochJd.toFixed(4)})</span>
              <span className="text-emerald-400">Target: {horizonsResult.targetName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[9.5px]">
              <div>X: {horizonsResult.positionAU.x.toFixed(6)} AU</div>
              <div>Y: {horizonsResult.positionAU.y.toFixed(6)} AU</div>
              <div>Z: {horizonsResult.positionAU.z.toFixed(6)} AU</div>
              <div>Vx: {horizonsResult.velocityKmPerSec.x.toFixed(3)} km/s</div>
              <div>Vy: {horizonsResult.velocityKmPerSec.y.toFixed(3)} km/s</div>
              <div>Vz: {horizonsResult.velocityKmPerSec.z.toFixed(3)} km/s</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Section A: Keplerian Orbital Properties */}
      <div className="space-y-2.5">
        <h3 className="font-mono-sci font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <Orbit className="w-3.5 h-3.5 text-orange-400" />
          <span>Keplerian Orbital Properties</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono-sci text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Semi-Major Axis (a)</span>
            <span className="text-slate-100 font-semibold">{planetData.semiMajorAxisAU.toFixed(6)} AU</span>
            <span className="text-slate-500 block text-[9px]">{(planetData.semiMajorAxisAU * 149597870.7 / 1e6).toFixed(2)}M km</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Semi-Minor Axis (b)</span>
            <span className="text-slate-100 font-semibold">{planetData.semiMinorAxisAU.toFixed(6)} AU</span>
            <span className="text-slate-500 block text-[9px]">b = a√(1-e²)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Orbital Eccentricity (e)</span>
            <span className="text-slate-100 font-semibold">{planetData.eccentricity.toFixed(6)}</span>
            <span className="text-slate-500 block text-[9px]">{planetData.eccentricity < 0.05 ? 'Nearly circular' : 'Pronounced ellipse'}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Orbital Inclination (I)</span>
            <span className="text-slate-100 font-semibold">{planetData.inclinationDeg.toFixed(4)}°</span>
            <span className="text-slate-500 block text-[9px]">Relative to J2000 Ecliptic</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Ascending Node (Ω)</span>
            <span className="text-slate-100 font-semibold">{planetData.longitudeOfAscendingNodeDeg.toFixed(4)}°</span>
            <span className="text-slate-500 block text-[9px]">Ecliptic plane crossing</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Arg. of Perihelion (ω)</span>
            <span className="text-slate-100 font-semibold">{planetData.argumentOfPerihelionDeg.toFixed(4)}°</span>
            <span className="text-slate-500 block text-[9px]">ω = ϖ - Ω</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Perihelion Distance (q)</span>
            <span className="text-emerald-400 font-semibold">{planetData.perihelionDistanceAU.toFixed(6)} AU</span>
            <span className="text-slate-500 block text-[9px]">q = a(1-e)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Aphelion Distance (Q)</span>
            <span className="text-cyan-400 font-semibold">{planetData.aphelionDistanceAU.toFixed(6)} AU</span>
            <span className="text-slate-500 block text-[9px]">Q = a(1+e)</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Orbital Period (P)</span>
            <span className="text-slate-100 font-semibold">{planetData.orbitalPeriodDays.toFixed(1)} days</span>
            <span className="text-slate-500 block text-[9px]">({planetData.orbitalPeriodYears.toFixed(3)} Earth yrs)</span>
          </div>
        </div>
      </div>

      {/* 4. Section B: Current Position & Velocity State Vectors */}
      <div className="space-y-2.5">
        <h3 className="font-mono-sci font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Heliocentric J2000 State Vectors at Selected Epoch</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono-sci text-[11px]">
          {/* Coordinates */}
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Heliocentric Position (J2000 Ecliptic)
            </span>
            <div className="space-y-0.5 text-[10.5px]">
              <div>X: <strong className="text-slate-100">{planetData.positionAU.x.toFixed(6)} AU</strong> ({(planetData.positionKm.x / 1e6).toFixed(2)}M km)</div>
              <div>Y: <strong className="text-slate-100">{planetData.positionAU.y.toFixed(6)} AU</strong> ({(planetData.positionKm.y / 1e6).toFixed(2)}M km)</div>
              <div>Z: <strong className="text-slate-100">{planetData.positionAU.z.toFixed(6)} AU</strong> ({(planetData.positionKm.z / 1e6).toFixed(2)}M km)</div>
              <div className="pt-1 border-t border-slate-800 text-sky-300">
                Range (r): <strong>{planetData.currentDistanceAU.toFixed(6)} AU</strong> ({(planetData.currentDistanceKm / 1e6).toFixed(2)}M km)
              </div>
            </div>
          </div>

          {/* Velocities & Anomalies */}
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Orbital Velocity & Anomalies
            </span>
            <div className="space-y-0.5 text-[10.5px]">
              <div>Vx: <strong className="text-slate-100">{planetData.velocityKmPerSec.x.toFixed(2)} km/s</strong></div>
              <div>Vy: <strong className="text-slate-100">{planetData.velocityKmPerSec.y.toFixed(2)} km/s</strong></div>
              <div>Vz: <strong className="text-slate-100">{planetData.velocityKmPerSec.z.toFixed(2)} km/s</strong></div>
              <div className="pt-1 border-t border-slate-800 text-emerald-400">
                Speed |V|: <strong>{planetData.totalSpeedKmPerSec.toFixed(2)} km/s</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Anomalies row */}
        <div className="grid grid-cols-3 gap-2 font-mono-sci text-[10px]">
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-slate-500 block uppercase">Mean Anomaly (M)</span>
            <span className="text-slate-200 font-bold">{planetData.meanAnomalyDeg.toFixed(3)}°</span>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-slate-500 block uppercase">Eccentric Anomaly (E)</span>
            <span className="text-slate-200 font-bold">{planetData.eccentricAnomalyDeg.toFixed(3)}°</span>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-slate-500 block uppercase">True Anomaly (ν)</span>
            <span className="text-slate-200 font-bold">{planetData.trueAnomalyDeg.toFixed(3)}°</span>
          </div>
        </div>
      </div>

      {/* 5. Section C: Scientific Metadata & Ephemeris Specifications */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <h3 className="font-mono-sci font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scientific Metadata & Ephemeris Specifications</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-sci text-[10px]">
          <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
            <span className="text-slate-500 block uppercase">Primary Source</span>
            <span className="text-slate-200 font-semibold">NASA JPL Solar System Dynamics</span>
          </div>

          <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
            <span className="text-slate-500 block uppercase">Coordinate Frame</span>
            <span className="text-slate-200 font-semibold">Heliocentric J2000 Ecliptic</span>
          </div>

          <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
            <span className="text-slate-500 block uppercase">Time Standard</span>
            <span className="text-slate-200 font-semibold">Barycentric Dynamical Time (TDB)</span>
          </div>

          <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
            <span className="text-slate-500 block uppercase">Epoch JD</span>
            <span className="text-slate-200 font-semibold">{planetData.epochJd.toFixed(4)}</span>
          </div>
        </div>

        <div className="text-[10px] font-mono-sci text-slate-500 flex items-center justify-between pt-1">
          <span>Active Simulation Date: {formatUtcDateTime(currentDate)}</span>
          <a
            href="https://ssd.jpl.nasa.gov/horizons/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
          >
            <span>JPL Horizons Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
