import React from 'react';
import { Mountain, Compass, ShieldCheck, Eye, Layers } from 'lucide-react';

interface TerrainTelemetryHUDProps {
  latitude: number;
  longitude: number;
  surfaceElevationMeters: number | null;
  cameraAltitudeMeters: number;
  cameraPitchDegrees: number;
  cameraHeadingDegrees: number;
  cameraMode: 'orbit' | 'surface';
  activeSiteName: string;
  activeSiteBadge: string;
  onOpenProvenance: () => void;
}

export const TerrainTelemetryHUD: React.FC<TerrainTelemetryHUDProps> = ({
  latitude,
  longitude,
  surfaceElevationMeters,
  cameraAltitudeMeters,
  cameraPitchDegrees,
  cameraHeadingDegrees,
  cameraMode,
  activeSiteName,
  activeSiteBadge,
  onOpenProvenance,
}) => {
  // Format latitude
  const latStr = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`;
  
  // Format longitude (-180..+180 and 0..360 E)
  const normLon = ((longitude % 360) + 360) % 360;
  const lonStr = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`;
  const posEastLonStr = `${normLon.toFixed(4)}° E`;

  // Compute AGL (Above Ground Level)
  const groundElev = surfaceElevationMeters ?? 0;
  const aglMeters = Math.max(0, cameraAltitudeMeters - groundElev);

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`;
    }
    return `${Math.round(meters).toLocaleString()} m`;
  };

  return (
    <div className="absolute bottom-16 sm:bottom-18 left-0 right-0 z-20 pointer-events-none px-3 sm:px-6 flex justify-center">
      <div className="pointer-events-auto bg-[#070b14]/92 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_24px_rgba(16,185,129,0.2)] max-w-4xl w-full flex flex-col md:flex-row items-center justify-between gap-3 text-slate-300">
        
        {/* Left Section: Active Site & Mode */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              cameraMode === 'surface' 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 animate-pulse' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              {cameraMode === 'surface' ? <Eye className="w-4 h-4" /> : <Mountain className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                  {activeSiteName}
                </span>
                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  {activeSiteBadge}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span className="uppercase text-emerald-400 font-bold">
                  {cameraMode === 'surface' ? 'Rover-Eye (2.5m AGL)' : 'Oblique 3D Orbit'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                  Clamp Guard Active
                </span>
              </div>
            </div>
          </div>

          {/* Provenance Button */}
          <button
            onClick={onOpenProvenance}
            className="md:hidden px-2 py-1 rounded bg-slate-800/80 border border-white/10 text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
          >
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>Info</span>
          </button>
        </div>

        {/* Center / Right Section: Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto font-mono text-center">
          
          {/* Coordinates */}
          <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="text-[9px] sm:text-[9.5px] text-slate-400 uppercase tracking-wider">Coordinates</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-white font-medium whitespace-nowrap" title={`${latStr}, ${lonStr} (${posEastLonStr})`}>
              {latStr}, {lonStr}
            </div>
          </div>

          {/* Surface Elevation (MOLA Datum) */}
          <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="text-[9px] sm:text-[9.5px] text-slate-400 uppercase tracking-wider">Surface Elevation</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-emerald-400 font-medium whitespace-nowrap">
              {surfaceElevationMeters !== null ? `${surfaceElevationMeters.toLocaleString()} m` : 'Loading...'}
              <span className="text-[9px] text-slate-500 ml-1">MOLA</span>
            </div>
          </div>

          {/* Camera Altitude (AGL) */}
          <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="text-[9px] sm:text-[9.5px] text-slate-400 uppercase tracking-wider">Altitude AGL</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-amber-300 font-medium whitespace-nowrap">
              {formatDistance(aglMeters)}
            </div>
          </div>

          {/* Attitude / Orientation */}
          <div className="bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-white/5 shrink-0">
            <div className="text-[9px] sm:text-[9.5px] text-slate-400 uppercase tracking-wider">Attitude (Pitch/Hdg)</div>
            <div className="text-[10.5px] sm:text-[11.5px] text-sky-300 font-medium flex items-center justify-center gap-1 whitespace-nowrap">
              <Compass className="w-3 h-3 text-sky-400 inline" />
              <span>{Math.round(cameraPitchDegrees)}° / {Math.round(cameraHeadingDegrees)}°</span>
            </div>
          </div>

        </div>

        {/* Provenance Button Desktop */}
        <button
          onClick={onOpenProvenance}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-300 hover:text-white text-xs transition-colors shrink-0"
          title="Inspect scientific DEM dataset and datum documentation"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Scientific Info</span>
        </button>

      </div>
    </div>
  );
};

