import React, { useEffect, useState } from 'react';
import { 
  Moon, 
  Play, 
  Pause, 
  Crosshair,
  RotateCcw,
  Info,
  Maximize2
} from 'lucide-react';
import { PhobosThumb, DeimosThumb } from './Thumbnails';
import { MOONS_METADATA, MoonStateVector } from '../../services/moons/moonEphemerisService';

interface MoonControlPanelProps {
  showPhobos: boolean;
  onTogglePhobos: () => void;
  showDeimos: boolean;
  onToggleDeimos: () => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  speedMultiplier?: number;
  onSelectSpeed?: (speed: number) => void;
  onResetToCurrentTime?: () => void;
  selectedMoon: 'phobos' | 'deimos' | null;
  onSelectMoon: (moonId: 'phobos' | 'deimos' | null) => void;
  onFlyToMoon?: (moonId: 'phobos' | 'deimos') => void;
  onReturnToMars?: () => void;
  phobosState?: MoonStateVector | null;
  deimosState?: MoonStateVector | null;
}

export const MoonControlPanel: React.FC<MoonControlPanelProps> = ({
  showPhobos,
  onTogglePhobos,
  showDeimos,
  onToggleDeimos,
  showOrbits,
  onToggleOrbits,
  showLabels = true,
  onToggleLabels,
  isPaused,
  onTogglePause,
  onResetToCurrentTime,
  selectedMoon,
  onSelectMoon,
  onFlyToMoon,
  onReturnToMars,
  phobosState,
  deimosState,
}) => {
  const isMoonsVisible = showPhobos || showDeimos;
  const [radarAngle, setRadarAngle] = useState(0);
  const [showDetailedPanel, setShowDetailedPanel] = useState(true);

  // Animated mini orbital radar (Strictly 1x real-time speed)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setRadarAngle((a) => (a + 0.05) % (2 * Math.PI));
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleToggleAllMoons = () => {
    if (isMoonsVisible) {
      if (showPhobos) onTogglePhobos();
      if (showDeimos) onToggleDeimos();
    } else {
      if (!showPhobos) onTogglePhobos();
      if (!showDeimos) onToggleDeimos();
    }
  };

  // Active moon metadata
  const activeMeta = selectedMoon ? MOONS_METADATA[selectedMoon] : null;
  const activeTelemetry = selectedMoon === 'phobos' ? phobosState : deimosState;

  return (
    <div className="w-[calc(100vw-32px)] max-w-[340px] sm:w-[365px] pointer-events-auto select-none space-y-2.5">
      {/* 1. Classic Glassmorphic Moon Selector Card (Redesigned to Match NASA Mission Control Aesthetic) */}
      <div className="bg-gradient-to-b from-[#081629]/95 via-[#050D1B]/95 to-[#040914]/95 backdrop-blur-2xl border border-[#00D9FF]/40 rounded-2xl p-4 shadow-[0_0_24px_rgba(0,217,255,0.14)] space-y-3 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            <h2 className="text-[12px] font-black tracking-wider text-orange-400 font-sans uppercase">
              MARS MOONS
            </h2>
          </div>

          <div className="flex items-center gap-2 pr-0.5">
            {/* Show/Hide Detailed Scientific Telemetry Toggle */}
            <button
              onClick={() => setShowDetailedPanel((v) => !v)}
              title="Toggle Detailed Scientific Panel"
              className={`p-1.5 rounded-lg text-[10px] transition-all cursor-pointer border ${
                showDetailedPanel 
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(0,217,255,0.3)]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Global Moons Visibility Toggle */}
            <div
              onClick={handleToggleAllMoons}
              title={isMoonsVisible ? 'Hide all natural satellites' : 'Show natural satellites'}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-200 ease-in-out cursor-pointer ${
                isMoonsVisible
                  ? 'bg-gradient-to-r from-[#008FFF] to-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.7)] border border-cyan-300/40'
                  : 'bg-slate-800/90 border border-white/15'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  isMoonsVisible ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Selected Moon Active Exploration Banner */}
        {selectedMoon && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#008FFF]/25 via-[#00D9FF]/15 to-[#082f49]/30 border border-cyan-400/40 text-[10.5px] font-sans shadow-inner">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0 drop-shadow-[0_0_6px_#00D9FF]" />
              <span className="font-bold text-cyan-200 uppercase tracking-wide truncate">
                3D {selectedMoon} Active
              </span>
            </div>
            {onReturnToMars && (
              <button
                onClick={() => {
                  onSelectMoon(null);
                  onReturnToMars();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/30 hover:bg-orange-500/45 border border-orange-400/60 text-orange-200 font-mono-sci text-[9.5px] font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(249,115,22,0.3)] shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Return to Mars</span>
              </button>
            )}
          </div>
        )}

        {/* 3-Column Body: Phobos | Deimos | Mini Orbital Radar */}
        <div className="grid grid-cols-3 gap-2 items-stretch">
          {/* Column 1: Phobos Glassy Card */}
          <div 
            onClick={() => {
              const nextMoon = selectedMoon === 'phobos' ? null : 'phobos';
              onSelectMoon(nextMoon);
              if (nextMoon) {
                onFlyToMoon?.('phobos');
              }
            }}
            className={`w-full py-2.5 px-1.5 rounded-xl border flex flex-col items-center text-center transition-all duration-200 cursor-pointer select-none backdrop-blur-xl ${
              selectedMoon === 'phobos'
                ? 'bg-gradient-to-b from-[#0284c7]/35 via-[#0369a1]/25 to-[#082f49]/45 border-cyan-400 shadow-[0_0_16px_rgba(14,165,233,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] ring-1 ring-cyan-400/40 -translate-y-0.5'
                : 'bg-gradient-to-b from-white/[0.08] via-[#0d1627]/65 to-[#070d19]/85 hover:from-white/[0.14] hover:via-[#131f38]/75 hover:to-[#091122]/90 border-white/[0.18] hover:border-cyan-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_4px_14px_rgba(0,0,0,0.5)] hover:-translate-y-0.5'
            }`}
          >
            <PhobosThumb className="w-7 h-7 rounded-full mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
            <span className="text-[10.5px] font-bold text-white tracking-tight leading-tight">
              Phobos
            </span>
            <span className="text-[8.5px] font-mono-sci text-cyan-300 mt-0.5">
              9,376 km
            </span>
            <span className="text-[8px] font-mono-sci text-slate-400">
              P = 7.65 h
            </span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all ${
              selectedMoon === 'phobos' 
                ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8] scale-110' 
                : 'bg-slate-500/70'
            }`} />
          </div>

          {/* Column 2: Deimos Glassy Card */}
          <div 
            onClick={() => {
              const nextMoon = selectedMoon === 'deimos' ? null : 'deimos';
              onSelectMoon(nextMoon);
              if (nextMoon) {
                onFlyToMoon?.('deimos');
              }
            }}
            className={`w-full py-2.5 px-1.5 rounded-xl border flex flex-col items-center text-center transition-all duration-200 cursor-pointer select-none backdrop-blur-xl ${
              selectedMoon === 'deimos'
                ? 'bg-gradient-to-b from-[#0284c7]/35 via-[#0369a1]/25 to-[#082f49]/45 border-cyan-400 shadow-[0_0_16px_rgba(14,165,233,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] ring-1 ring-cyan-400/40 -translate-y-0.5'
                : 'bg-gradient-to-b from-white/[0.08] via-[#0d1627]/65 to-[#070d19]/85 hover:from-white/[0.14] hover:via-[#131f38]/75 hover:to-[#091122]/90 border-white/[0.18] hover:border-cyan-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_4px_14px_rgba(0,0,0,0.5)] hover:-translate-y-0.5'
            }`}
          >
            <DeimosThumb className="w-7 h-7 rounded-full mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
            <span className="text-[10.5px] font-bold text-white tracking-tight leading-tight">
              Deimos
            </span>
            <span className="text-[8.5px] font-mono-sci text-amber-300 mt-0.5">
              23,463 km
            </span>
            <span className="text-[8px] font-mono-sci text-slate-400">
              P = 30.30 h
            </span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all ${
              selectedMoon === 'deimos' 
                ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8] scale-110' 
                : 'bg-slate-500/70'
            }`} />
          </div>

          {/* Column 3: Mini Orbital Radar Glassy Widget */}
          <div className="w-full py-1.5 px-1.5 rounded-xl bg-gradient-to-b from-white/[0.08] via-[#0a0f1d]/85 to-[#040812]/95 border border-white/[0.18] shadow-[inset_0_1px_1px_rgba(255,255,255,0.22),0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col items-center justify-between relative">
            {/* SVG Radar */}
            <div className="w-[58px] h-[58px] relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 80 80">
                {/* Central Mars */}
                <circle cx="40" cy="40" r="7.5" fill="#ea580c" />
                <circle cx="40" cy="40" r="8.5" stroke="#fed7aa" strokeWidth="0.5" opacity="0.7" fill="none" />

                {/* Inner Orbit Ring (Phobos) */}
                <ellipse cx="40" cy="40" rx="19" ry="17" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.75" fill="none" />
                {/* Phobos dot */}
                <circle 
                  cx={40 + 19 * Math.cos(radarAngle * 3.9)} 
                  cy={40 + 17 * Math.sin(radarAngle * 3.9)} 
                  r="2" 
                  fill="#ffffff" 
                  className="drop-shadow-[0_0_4px_#ffffff]"
                />

                {/* Outer Orbit Ring (Deimos) */}
                <ellipse cx="40" cy="40" rx="33" ry="30" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.65" fill="none" />
                {/* Deimos dot */}
                <circle 
                  cx={40 + 33 * Math.cos(radarAngle)} 
                  cy={40 + 30 * Math.sin(radarAngle)} 
                  r="1.8" 
                  fill="#fcd34d" 
                  className="drop-shadow-[0_0_4px_#fcd34d]"
                />
              </svg>
              <span className="absolute top-0 right-1 text-[7.5px] font-mono-sci text-slate-500">
                AU
              </span>
            </div>

            {/* Unified Simulation Controls: Pause/Resume + Reset to Current Time (Strictly 1x real-time) */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                onClick={onTogglePause}
                title={isPaused ? 'Resume Mars system real-time simulation (1x)' : 'Pause Mars system simulation'}
                className={`p-1 rounded border transition-all cursor-pointer ${
                  isPaused 
                    ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                    : 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                }`}
              >
                {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
              </button>
              
              <button
                onClick={onResetToCurrentTime}
                title="Reset simulation clock to current UTC time (1x real-time)"
                className="px-1.5 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 text-[8.5px] font-mono-sci font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <RotateCcw className="w-2 h-2 text-cyan-400" />
                <span>UTC</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orbit & Label Quick Toggles */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[9.5px] text-slate-400 font-mono-sci">
          <button
            onClick={onToggleOrbits}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              showOrbits 
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(0,217,255,0.3)]' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showOrbits ? 'bg-cyan-400 shadow-[0_0_6px_#00D9FF]' : 'bg-slate-500'}`} />
            <span>Orbits: {showOrbits ? 'ON' : 'OFF'}</span>
          </button>

          {onToggleLabels && (
            <button
              onClick={onToggleLabels}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                showLabels 
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showLabels ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-500'}`} />
              <span>Labels: {showLabels ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {selectedMoon && onReturnToMars && (
            <button
              onClick={() => {
                onSelectMoon(null);
                onReturnToMars();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Mars</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DEDICATED SCIENTIFIC TELEMETRY PANEL: "MARTIAN MOON SYSTEM" */}
      {showDetailedPanel && (
        <div className="bg-gradient-to-b from-[#081629]/95 via-[#050D1B]/95 to-[#040914]/95 backdrop-blur-2xl border border-[#00D9FF]/40 rounded-2xl p-4 shadow-[0_0_24px_rgba(0,217,255,0.14)] space-y-2.5 text-slate-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                <Crosshair className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-[11px] font-black tracking-wider text-white uppercase font-sans">
                MARTIAN MOON SYSTEM
              </span>
            </div>
            <span className="text-[8px] font-mono-sci px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-semibold shadow-[0_0_8px_rgba(0,217,255,0.25)]">
              {activeTelemetry?.ephemerisSource === 'JPL_HORIZONS' ? 'HORIZONS 500@499' : 'KEPLER PROPAGATOR'}
            </span>
          </div>

          {/* Active Moon or Comparison View */}
          {activeMeta ? (
            <div className="space-y-2">
              {/* Moon Badge Header */}
              <div className="flex items-center justify-between gap-1.5 bg-[#061120]/80 p-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {selectedMoon === 'phobos' ? (
                    <PhobosThumb className="w-8 h-8 rounded-full border border-cyan-400/50 shrink-0" />
                  ) : (
                    <DeimosThumb className="w-8 h-8 rounded-full border border-amber-400/50 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] sm:text-[12px] font-bold text-white flex items-center gap-1.5 truncate">
                      <span>{activeMeta.name}</span>
                      <span className="text-[9px] font-normal text-slate-400 truncate">
                        ({selectedMoon === 'phobos' ? 'Ares Companion: Panic' : 'Ares Companion: Dread'})
                      </span>
                    </div>
                    <div className="text-[8px] sm:text-[8.5px] font-mono-sci text-cyan-400 truncate">
                      NASA/JPL 3D Shape Model (glTF 2.0)
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => selectedMoon && onFlyToMoon?.(selectedMoon)}
                  className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[8.5px] sm:text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-[0_0_8px_rgba(0,217,255,0.25)]"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span>Inspect 3D</span>
                </button>
              </div>

              {/* Numerical Scientific Specifications Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono-sci">
                {/* 3D Mesh Dimensions */}
                <div className="bg-black/50 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[7.5px] text-slate-400 uppercase block">Mesh Dimensions</span>
                  <span className="text-slate-100 font-bold block">
                    {activeMeta.meshDimensionsKm.longAxis} × {activeMeta.meshDimensionsKm.intermediateAxis} × {activeMeta.meshDimensionsKm.shortAxis} km
                  </span>
                  <span className="text-[7.5px] text-slate-400 block">
                    Nominal: {activeMeta.nasaFactSheetDimensionsKm.longAxis} × {activeMeta.nasaFactSheetDimensionsKm.intermediateAxis} km
                  </span>
                </div>

                {/* Mean Orbital Distance */}
                <div className="bg-black/50 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[7.5px] text-slate-400 uppercase block">Orbital Distance</span>
                  <span className="text-cyan-300 font-bold block">
                    {activeTelemetry ? `${activeTelemetry.distanceKm.toFixed(1)} km` : `${activeMeta.orbit.semiMajorAxisKm.toLocaleString()} km`}
                  </span>
                  <span className="text-[7.5px] text-slate-400 block">
                    Ratio: {(activeMeta.orbit.semiMajorAxisKm / 3396.19).toFixed(2)} Mars Radii
                  </span>
                </div>

                {/* Instantaneous Velocity & Speed */}
                <div className="bg-black/50 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[7.5px] text-slate-400 uppercase block">Orbital Speed</span>
                  <span className="text-emerald-300 font-bold block">
                    {activeTelemetry ? `${activeTelemetry.speedKmPerSec.toFixed(3)} km/s` : `${activeMeta.orbit.meanSpeedKmPerSec} km/s`}
                  </span>
                  <span className="text-[7.5px] text-slate-400 block">
                    Mean: {activeMeta.orbit.meanSpeedKmPerSec} km/s
                  </span>
                </div>

                {/* Revolution Period & Spin */}
                <div className="bg-black/50 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[7.5px] text-slate-400 uppercase block">Period & Spin</span>
                  <span className="text-amber-300 font-bold block">
                    P = {activeMeta.orbit.periodHours} h
                  </span>
                  <span className="text-[7.5px] text-emerald-400 block">
                    1:1 Tidally Locked
                  </span>
                </div>

                {/* Angular Speed */}
                <div className="bg-black/50 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[7.5px] text-slate-400 uppercase block">Mean Angular Speed</span>
                  <span className="text-slate-200 font-bold block">
                    {activeMeta.orbit.meanAngularSpeedDegPerHour.toFixed(2)}° / hour
                  </span>
                  <span className="text-[7.5px] text-slate-400 block">
                    Inclination: {activeMeta.orbit.inclinationDeg}°
                  </span>
                </div>

                {/* Altitude above Mars surface */}
                <div className="bg-black/50 p-1.5 rounded-lg border border-white/5 space-y-0.5">
                  <span className="text-[7.5px] text-slate-400 uppercase block">Surface Altitude</span>
                  <span className="text-purple-300 font-bold block">
                    {activeTelemetry ? `${activeTelemetry.altitudeKm.toFixed(1)} km` : `${(activeMeta.orbit.semiMajorAxisKm - 3396.19).toFixed(1)} km`}
                  </span>
                  <span className="text-[7.5px] text-slate-400 block">
                    Eccentricity: {activeMeta.orbit.eccentricity}
                  </span>
                </div>
              </div>

              {/* Camera Reset Button */}
              {onReturnToMars && (
                <button
                  onClick={() => {
                    onSelectMoon(null);
                    onReturnToMars();
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-600/40 via-orange-500/40 to-amber-600/40 hover:from-orange-600/50 hover:to-amber-600/50 border border-orange-500/50 text-[10px] font-bold text-orange-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-[0_0_14px_rgba(255,98,0,0.3)]"
                >
                  <RotateCcw className="w-3 h-3 text-orange-300" />
                  <span>RETURN TO MARS GLOBE</span>
                </button>
              )}
            </div>
          ) : (
            /* System-wide Summary when neither moon is individually focused */
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[8.5px] font-mono-sci">
                {/* Phobos Summary Card */}
                <div 
                  onClick={() => {
                    onSelectMoon('phobos');
                    onFlyToMoon?.('phobos');
                  }}
                  className="p-2.5 rounded-xl bg-[#061120]/70 hover:bg-[#081629]/90 border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer transition-all space-y-1 shadow-[0_0_12px_rgba(0,217,255,0.08)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00D9FF]" />
                    <span className="font-bold text-white text-[10px]">Phobos</span>
                  </div>
                  <div className="text-slate-300">R: 9,376 km (2.76 RM)</div>
                  <div className="text-slate-300">P: 7.65 h (v: 2.14 km/s)</div>
                  <div className="text-cyan-300 text-[8px] font-medium">a: 9,379 km</div>
                </div>

                {/* Deimos Summary Card */}
                <div 
                  onClick={() => {
                    onSelectMoon('deimos');
                    onFlyToMoon?.('deimos');
                  }}
                  className="p-2.5 rounded-xl bg-[#061120]/70 hover:bg-[#081629]/90 border border-amber-500/30 hover:border-amber-400/60 cursor-pointer transition-all space-y-1 shadow-[0_0_12px_rgba(255,170,0,0.08)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                    <span className="font-bold text-white text-[10px]">Deimos</span>
                  </div>
                  <div className="text-slate-300">R: 23,463 km (6.91 RM)</div>
                  <div className="text-slate-300">P: 30.30 h (v: 1.35 km/s)</div>
                  <div className="text-amber-300 text-[8px] font-medium">a: 23,460 km</div>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 text-center italic">
                Click Phobos or Deimos above to zoom in and inspect genuine NASA 3D irregular crater geometry.
              </div>
            </div>
          )}

          {/* Subtle Data Source Attribution & More Moon Info link */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] font-mono-sci text-slate-400">
            <span>Data: NASA. Not to scale.</span>
            <button
              onClick={() => {
                const targetMoon = selectedMoon || 'phobos';
                onSelectMoon(targetMoon);
                onFlyToMoon?.(targetMoon);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>More Moon Info</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
