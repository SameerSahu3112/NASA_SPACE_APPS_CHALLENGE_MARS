import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Compass, 
  Globe2, 
  Orbit, 
  Database, 
  GitCompare, 
  Clock, 
  Layers, 
  Maximize2, 
  Minimize2,
  ZoomIn
} from 'lucide-react';
import { SolarSystem3D } from '../SolarSystem/SolarSystem3D';
import { ScientificDashboard } from '../SolarSystem/ScientificDashboard';
import { PlanetaryDatabase } from '../SolarSystem/PlanetaryDatabase';
import { OrbitalComparison } from '../SolarSystem/OrbitalComparison';
import { calculateAllPlanets } from '../../services/keplerSolver';
import { 
  dateToJulianDate, 
  formatUtcDateTime 
} from '../../services/timeService';
import { 
  ORDERED_PLANET_KEYS, 
  PLANETS_SCIENTIFIC_REGISTRY 
} from '../../services/planetaryData';

interface SolarSystemViewProps {
  isOpen: boolean;
  onClose: () => void;
  onFocusMars: () => void;
  initialTab?: '3d' | 'data' | 'dashboard' | 'database' | 'compare';
  initialPlanetId?: string | null;
  initialDaysPerSecond?: number;
  zoomTrigger?: number;
}

type SolarTab = '3d' | 'data' | 'dashboard' | 'database' | 'compare';

export const SolarSystemView: React.FC<SolarSystemViewProps> = ({
  isOpen,
  onClose,
  onFocusMars,
  initialTab,
  initialPlanetId,
  initialDaysPerSecond,
  zoomTrigger,
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<SolarTab>(initialTab || '3d');
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(initialPlanetId || 'mars');
  const [focusTrigger, setFocusTrigger] = useState<number>(initialPlanetId ? Date.now() : 0);

  useEffect(() => {
    if (initialTab) {
      if (initialTab === '3d') {
        setActiveTab('3d');
      } else {
        setActiveTab('data');
        setTimeout(() => {
          const elId = initialTab === 'compare' ? 'orbital-comparison-section' :
                       initialTab === 'database' ? 'planetary-database-section' :
                       'scientific-dashboard-section';
          document.getElementById(elId)?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialPlanetId && isOpen) {
      setSelectedPlanetId(initialPlanetId);
      setFocusTrigger(Date.now());
      setIsPlaying(true);
      setActiveTab('3d');
    }
  }, [initialPlanetId, isOpen]);

  useEffect(() => {
    if (initialDaysPerSecond !== undefined) {
      setDaysPerSecond(initialDaysPerSecond);
    }
  }, [initialDaysPerSecond]);

  useEffect(() => {
    if (zoomTrigger) {
      setFocusTrigger(zoomTrigger);
    }
  }, [zoomTrigger]);

  // Simulation Time & Dynamics State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeDirection, setTimeDirection] = useState<1 | -1>(1); // 1 = forward, -1 = reverse
  const [daysPerSecond, setDaysPerSecond] = useState<number>(10); // Simulation speed: 10 days of orbital motion per real-time second

  // 3D Visual Customization Options - Default to True 1:1 NASA Scientific Scale
  const [scaleMode, setScaleMode] = useState<'scientific' | 'exploration'>('scientific');
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showEclipticGrid, setShowEclipticGrid] = useState<boolean>(true);
  const [showOrbitalPlanes, setShowOrbitalPlanes] = useState<boolean>(true);
  const [showApsides, setShowApsides] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [inclinationMultiplier, setInclinationMultiplier] = useState<number>(1.0); // 1.0 = Strict NASA JPL True 1:1 Inclination Angle

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Animation frame loop ref
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  // Calculate planetary orbits dynamically based on simulation epoch
  const jd = useMemo(() => dateToJulianDate(currentDate), [currentDate]);
  const planetsData = useMemo(() => calculateAllPlanets(jd), [jd]);

  // SIMULATION TICK ANIMATION LOOP
  useEffect(() => {
    if (!isOpen) return;

    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        // Advance simulation time: daysPerSecond * dt * timeDirection
        const daysToAdvance = daysPerSecond * dt * timeDirection;
        setCurrentDate((prev) => new Date(prev.getTime() + daysToAdvance * 86400000));
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isPlaying, daysPerSecond, timeDirection]);

  // Hotkey navigation between tabs
  useEffect(() => {
    if (!isOpen) return;
    const handleKeys = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '1') setActiveTab('3d');
      else if (e.key === '2') {
        setActiveTab('data');
        document.getElementById('scientific-dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      else if (e.key === '3') {
        setActiveTab('data');
        document.getElementById('planetary-database-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      else if (e.key === '4') {
        setActiveTab('data');
        document.getElementById('orbital-comparison-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isOpen]);

  // Jump to specific landmark astronomical dates
  const handleJumpToEpoch = (target: 'now' | 'j2000' | 'perseverance_landing' | 'apollo11') => {
    if (target === 'now') {
      setCurrentDate(new Date());
    } else if (target === 'j2000') {
      setCurrentDate(new Date('2000-01-01T12:00:00Z'));
    } else if (target === 'perseverance_landing') {
      setCurrentDate(new Date('2021-02-18T20:55:00Z')); // Perseverance landing in Jezero Crater
    } else if (target === 'apollo11') {
      setCurrentDate(new Date('1969-07-20T20:17:00Z')); // Apollo 11 Lunar Landing
    }
  };

  if (!isOpen) return null;

  const selectedData = planetsData[selectedPlanetId] || planetsData['mars'];

  return (
    <div className={`fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-200 select-none ${
      isFullscreen ? 'p-0' : 'p-2 sm:p-4'
    }`}>
      {/* 1. TOP AEROSPACE HEADER */}
      <div className="bg-[#121620]/90 border border-white/10 rounded-2xl p-3 sm:px-5 sm:py-3.5 mb-2 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Project Branding & Ephemeris Subtitle */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-title-sci font-bold text-xs sm:text-sm md:text-base text-slate-100 tracking-wide truncate">
                NASA SCIENTIFIC 3D SOLAR SYSTEM
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono-sci px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 font-semibold uppercase shrink-0">
                J2000 Ecliptic
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono-sci text-slate-400 truncate">
              NASA JPL Horizons State Vectors • 3D Keplerian Mechanics • 8 Planets
            </p>
          </div>
        </div>

        {/* Center: Classic 3D View | Planetary Data Capsule (Matching Mars Globe 2D/3D Capsule) */}
        <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl shrink-0">
          {/* 1. 3D View */}
          <button
            onClick={() => setActiveTab('3d')}
            title="3D Keplerian Solar System Simulation"
            className={`px-3.5 sm:px-4 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === '3d'
                ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(14,165,233,0.8)] border border-cyan-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
            <span>3D View</span>
          </button>

          {/* 2. Planetary Data */}
          <button
            onClick={() => setActiveTab('data')}
            title="Planetary Scientific Data & Ephemerides"
            className={`px-3.5 sm:px-4 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab !== '3d'
                ? 'bg-[#ea580c] text-white shadow-[0_0_14px_rgba(234,88,12,0.8)] border border-orange-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span>Planetary Data</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Focus Mars Globe */}
          <button
            onClick={() => {
              onClose();
              onFocusMars();
            }}
            title="Return focus to the 3D Mars globe surface"
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-sci text-xs font-semibold shadow-lg shadow-red-950 transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Focus Mars Globe</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="cursor-pointer p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE VIEWPORT */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex flex-col">
        {activeTab === '3d' && (
          <div className="flex-1 relative w-full h-full flex flex-col md:flex-row overflow-hidden">
            {/* Main 3D Canvas Stage */}
            <div className="flex-1 relative w-full h-full min-h-[450px]">
              <SolarSystem3D
                planetsData={planetsData}
                selectedPlanetId={selectedPlanetId}
                onSelectPlanet={(id) => {
                  setSelectedPlanetId(id);
                  setFocusTrigger(Date.now());
                }}
                scaleMode={scaleMode}
                showOrbits={showOrbits}
                showLabels={showLabels}
                showEclipticGrid={showEclipticGrid}
                showOrbitalPlanes={showOrbitalPlanes}
                showVectors={false}
                showApsides={showApsides}
                showNodes={showNodes}
                inclinationMultiplier={inclinationMultiplier}
                focusTrigger={focusTrigger}
              />

              {/* OVERLAY 1: SIMULATION TIME CONTROLLER (Bottom Left) */}
              <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
                {/* Active Epoch Bar */}
                <div className="bg-[#121620]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-3 font-mono-sci text-xs">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Simulation Epoch (UTC):</span>
                    <strong className="text-slate-100 text-[11px]">{formatUtcDateTime(currentDate)}</strong>
                  </div>
                  <span className="text-slate-600">|</span>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Julian Date:</span>
                    <strong className="text-sky-300 text-[11px]">{jd.toFixed(4)}</strong>
                  </div>
                </div>

                {/* Playback Controls Pill */}
                <div className="bg-[#121620]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-wrap items-center gap-2 font-mono-sci text-xs">
                  {/* Play/Pause */}
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="cursor-pointer p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                    title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Reverse / Forward Classic Capsule */}
                  <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-0.5 flex items-center gap-0.5 shadow-md">
                    <button
                      onClick={() => setTimeDirection(1)}
                      title="Forward orbital simulation time"
                      className={`px-2.5 h-6 rounded-full text-[10px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
                        timeDirection === 1
                          ? 'bg-[#0284c7] text-white shadow-[0_0_8px_rgba(14,165,233,0.7)] border border-cyan-400/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      FWD
                    </button>
                    <button
                      onClick={() => setTimeDirection(-1)}
                      title="Reverse orbital simulation time"
                      className={`px-2.5 h-6 rounded-full text-[10px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
                        timeDirection === -1
                          ? 'bg-[#ea580c] text-white shadow-[0_0_8px_rgba(234,88,12,0.7)] border border-orange-400/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      REV
                    </button>
                  </div>

                  {/* Speed Multipliers Classic Capsule */}
                  <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-0.5 flex items-center gap-0.5 shadow-md">
                    {[1, 10, 30, 100, 365].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setDaysPerSecond(spd)}
                        className={`px-2 h-6 rounded-full text-[10px] font-mono-sci font-bold transition-all cursor-pointer ${
                          daysPerSecond === spd
                            ? 'bg-[#0284c7] text-white shadow-[0_0_8px_rgba(14,165,233,0.7)] border border-cyan-400/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        {spd}d/s
                      </button>
                    ))}
                  </div>

                  {/* Epoch Presets */}
                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                    <button
                      onClick={() => handleJumpToEpoch('now')}
                      className="cursor-pointer px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                      title="Jump to current real-time UTC date"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleJumpToEpoch('j2000')}
                      className="cursor-pointer px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                      title="Jump to Standard J2000.0 Epoch (2000-Jan-01)"
                    >
                      J2000
                    </button>
                    <button
                      onClick={() => handleJumpToEpoch('perseverance_landing')}
                      className="cursor-pointer px-2 py-1 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-[10px] font-semibold"
                      title="Jump to Perseverance landing in Jezero Crater (2021-Feb-18)"
                    >
                      Perseverance Landing
                    </button>
                  </div>
                </div>
              </div>

              {/* OVERLAY 2: 3D DISPLAY & GEOMETRY TOGGLES (Bottom Right) */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-[#121620]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl text-[10px] font-mono-sci pointer-events-auto">
                {/* Scale Mode Switcher */}
                <button
                  onClick={() => setScaleMode((m) => (m === 'scientific' ? 'exploration' : 'scientific'))}
                  className={`cursor-pointer px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                    scaleMode === 'scientific'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-orange-600 text-white shadow-sm'
                  }`}
                  title={scaleMode === 'scientific' ? 'Proportional true AU distances' : 'Perceptual scaled distances'}
                >
                  {scaleMode === 'scientific' ? 'SCALE: TRUE AU' : 'SCALE: EXPLORATION'}
                </button>

                <div className="h-4 w-px bg-slate-800" />

                {/* Orbits Toggle */}
                <button
                  onClick={() => setShowOrbits((o) => !o)}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors ${
                    showOrbits ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle 3D Elliptical Orbit Lines"
                >
                  Orbits
                </button>

                {/* Ecliptic Grid Toggle */}
                <button
                  onClick={() => setShowEclipticGrid((g) => !g)}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors ${
                    showEclipticGrid ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle J2000 Ecliptic Reference Plane Grid"
                >
                  Ecliptic
                </button>

                {/* Orbital Plane Toggle */}
                <button
                  onClick={() => setShowOrbitalPlanes((p) => !p)}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors ${
                    showOrbitalPlanes ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle Tilted Orbital Plane Disc"
                >
                  Plane
                </button>

                {/* Inclination Angle Multiplier (NASA 1:1 vs Enhanced) */}
                <button
                  onClick={() => setInclinationMultiplier((m) => (m === 1.0 ? 2.5 : m === 2.5 ? 4.0 : 1.0))}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors font-bold ${
                    inclinationMultiplier === 1.0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                  title="Cycle between True 1:1 NASA Inclination Angle and enhanced visual elevation"
                >
                  Inc: {inclinationMultiplier === 1.0 ? '1:1 NASA' : `${inclinationMultiplier}×`}
                </button>

                {/* Apsides Toggle */}
                <button
                  onClick={() => setShowApsides((a) => !a)}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors ${
                    showApsides ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle Perihelion & Aphelion Markers"
                >
                  Apsides
                </button>

                {/* Labels Toggle */}
                <button
                  onClick={() => setShowLabels((l) => !l)}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors ${
                    showLabels ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle Planetary Labels"
                >
                  Labels
                </button>

                {/* Nodes Toggle */}
                <button
                  onClick={() => setShowNodes((n) => !n)}
                  className={`cursor-pointer px-2 py-1.5 rounded-xl transition-colors ${
                    showNodes ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle Ascending & Descending Node Markers"
                >
                  Nodes
                </button>
              </div>
            </div>

            {/* Right: Quick Planet Selector Sidebar */}
            <div className="w-full md:w-72 lg:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#0f131c]/95 p-3 sm:p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono-sci font-bold uppercase tracking-wider text-slate-400">
                    Planetary Roster // Click to Orbit
                  </span>
                  <span className="text-[10px] font-mono-sci text-orange-400 font-bold">
                    8 Major Planets
                  </span>
                </div>

                <div className="space-y-1.5">
                  {ORDERED_PLANET_KEYS.map((k) => {
                    const isSelected = selectedPlanetId === k;
                    const p = planetsData[k];
                    const def = PLANETS_SCIENTIFIC_REGISTRY[k];
                    const chars = def?.characteristics;

                    return (
                      <div
                        key={k}
                        onClick={() => {
                          setSelectedPlanetId(k);
                          setFocusTrigger(Date.now());
                        }}
                        className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          chars?.isMars
                            ? 'bg-red-950/30 border-red-500/60 ring-1 ring-red-500/40'
                            : isSelected
                            ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/50'
                            : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={`/textures/planets/${k}.jpg`}
                            alt={chars?.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0 shadow-md border border-white/20"
                            onError={(e) => {
                              // Fallback if image load error
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-title-sci font-bold text-xs text-slate-100">
                                {chars?.name}
                              </span>
                              {chars?.isMars && (
                                <span className="text-[8px] font-mono-sci px-1 rounded bg-red-600 text-white font-bold">
                                  MIRA
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono-sci text-slate-400">
                              r = {p?.currentDistanceAU.toFixed(3)} AU
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono-sci text-[10px]">
                          <div className="text-emerald-400 font-semibold">{p?.totalSpeedKmPerSec.toFixed(1)} km/s</div>
                          <div className="text-slate-500">I = {p?.inclinationDeg.toFixed(1)}°</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Planet Quick Action Card */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono-sci">
                  <span className="text-slate-400">Active Body:</span>
                  <strong className="text-orange-400">{selectedData.name}</strong>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setFocusTrigger(Date.now());
                    }}
                    className="cursor-pointer py-1.5 px-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono-sci text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                    title="Glide camera very close to this planet (matching Mars zoom scale)"
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span>Zoom Close</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPlanetId(null as any);
                    }}
                    className="cursor-pointer py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-sci text-[10px] font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                    title="Zoom camera out to entire solar system overview"
                  >
                    <Orbit className="w-3 h-3" />
                    <span>Global View</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('data');
                    setTimeout(() => {
                      document.getElementById('scientific-dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="cursor-pointer w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono-sci text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Inspect Full Scientific Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLANETARY DATA (ALL 3 SCIENTIFIC SECTIONS INTEGRATED) */}
        {activeTab !== '3d' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 w-full flex flex-col items-center space-y-8 scroll-smooth">
            <div className="w-full max-w-6xl space-y-10 pb-16">
              
              {/* Sticky Sub-Navigation Bar */}
              <div className="sticky top-0 z-20 py-2.5 px-4 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-title-sci font-bold text-xs uppercase tracking-wider text-slate-200">
                    Planetary Scientific Repository
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono-sci">
                  <button
                    onClick={() => document.getElementById('scientific-dashboard-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="cursor-pointer px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    1. Scientific Dashboard
                  </button>
                  <button
                    onClick={() => document.getElementById('planetary-database-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="cursor-pointer px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    2. Planetary Database
                  </button>
                  <button
                    onClick={() => document.getElementById('orbital-comparison-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="cursor-pointer px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    3. Compare Orbits
                  </button>
                </div>
              </div>

              {/* 1. SCIENTIFIC DASHBOARD SECTION */}
              <section id="scientific-dashboard-section" className="scroll-mt-20 space-y-4">
                <div className="border-b border-slate-800/80 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-title-sci font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wide flex items-center gap-2">
                      <Compass className="w-4 h-4 text-orange-400" />
                      <span>Scientific Planetary Dashboard & Orbital Telemetry</span>
                    </h2>
                    <p className="text-[11px] font-mono-sci text-slate-400 mt-0.5">
                      Real-time Keplerian orbital elements, heliocentric state vectors, and live NASA JPL Horizons ephemeris for the active planet.
                    </p>
                  </div>
                </div>

                <ScientificDashboard
                  planetData={selectedData}
                  currentDate={currentDate}
                />
              </section>

              {/* 2. PLANETARY DATABASE SECTION */}
              <section id="planetary-database-section" className="scroll-mt-20 space-y-4 pt-6 border-t border-slate-800/70">
                <div className="border-b border-slate-800/80 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-title-sci font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wide flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Solar System Planetary Database & Ephemeris Specifications</span>
                    </h2>
                    <p className="text-[11px] font-mono-sci text-slate-400 mt-0.5">
                      Astrophysical parameters across all 8 major planets, multi-column sortable table, and instant CSV / JSON export.
                    </p>
                  </div>
                </div>

                <PlanetaryDatabase
                  planetsData={planetsData}
                  selectedPlanetId={selectedPlanetId}
                  onSelectPlanet={(id) => {
                    setSelectedPlanetId(id);
                    document.getElementById('scientific-dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  currentDate={currentDate}
                />
              </section>

              {/* 3. COMPARE ORBITS SECTION */}
              <section id="orbital-comparison-section" className="scroll-mt-20 space-y-4 pt-6 border-t border-slate-800/70">
                <div className="border-b border-slate-800/80 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-title-sci font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wide flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-amber-400" />
                      <span>Multi-Planet Orbital Comparison & Kinematic Analysis</span>
                    </h2>
                    <p className="text-[11px] font-mono-sci text-slate-400 mt-0.5">
                      Multi-planet comparative telemetry, velocity benchmarks, eccentricity variance, and comparative matrix.
                    </p>
                  </div>
                </div>

                <OrbitalComparison planetsData={planetsData} />
              </section>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
