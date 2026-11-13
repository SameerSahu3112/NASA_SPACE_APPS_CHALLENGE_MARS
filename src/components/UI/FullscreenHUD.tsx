import React from 'react';
import { 
  Minimize2, 
  Play, 
  Pause, 
  Orbit, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Crosshair
} from 'lucide-react';
import { MarsCoordinates } from '../../types';

interface FullscreenHUDProps {
  onExitFullscreen: () => void;
  showPhobos: boolean;
  onTogglePhobos: () => void;
  showDeimos: boolean;
  onToggleDeimos: () => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  coordinates: MarsCoordinates | null;
}

export const FullscreenHUD: React.FC<FullscreenHUDProps> = ({
  onExitFullscreen,
  showPhobos,
  onTogglePhobos,
  showDeimos,
  onToggleDeimos,
  showOrbits,
  onToggleOrbits,
  isPaused,
  onTogglePause,
  isAutoRotating,
  onToggleAutoRotate,
  onZoomIn,
  onZoomOut,
  coordinates,
}) => {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none select-none">
      {/* 1. TOP-RIGHT MINIMAL FLOATING CONTROLS */}
      <div className="absolute top-3 sm:top-5 right-3 sm:right-6 pointer-events-auto flex items-center gap-2 max-w-[calc(100vw-24px)] overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="bg-[#141822]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5">
          {/* Moon Toggles */}
          <button
            type="button"
            onClick={onTogglePhobos}
            title={showPhobos ? 'Hide Phobos' : 'Show Phobos'}
            className={`px-2 py-1 rounded-xl text-[11px] font-mono-sci font-bold transition-all cursor-pointer ${
              showPhobos 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            PHOBOS
          </button>

          <button
            type="button"
            onClick={onToggleDeimos}
            title={showDeimos ? 'Hide Deimos' : 'Show Deimos'}
            className={`px-2 py-1 rounded-xl text-[11px] font-mono-sci font-bold transition-all cursor-pointer ${
              showDeimos 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            DEIMOS
          </button>

          <button
            type="button"
            onClick={onToggleOrbits}
            title={showOrbits ? 'Hide Orbital Guides' : 'Show Orbital Guides'}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              showOrbits 
                ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/40' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Orbit className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Pause / Resume Moon Animation */}
          <button
            type="button"
            onClick={onTogglePause}
            title={isPaused ? 'Resume Moons Motion' : 'Pause Moons Motion'}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isPaused 
                ? 'bg-amber-500 text-slate-950' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>

          {/* Automatic Turntable Rotation Toggle */}
          <button
            type="button"
            onClick={onToggleAutoRotate}
            title={isAutoRotating ? 'Stop Automatic Rotation' : 'Start Automatic Rotation'}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isAutoRotating 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-950 animate-pulse' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom In & Out */}
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Exit Fullscreen Button */}
          <button
            type="button"
            onClick={onExitFullscreen}
            title="Exit Fullscreen Cinematic Mode (ESC)"
            className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MINIMAL BOTTOM WATERMARK & LIVE COORDINATES */}
      <div className="absolute bottom-5 left-6 pointer-events-auto flex items-center gap-3">
        {coordinates && (
          <div className="bg-[#141822]/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span className="font-mono-sci text-xs text-orange-400 font-bold">
              {coordinates.formatted}
            </span>
          </div>
        )}

        <div className="text-[10px] font-mono-sci text-slate-500/80 px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
          CINEMATIC MODE • PRESS ESC TO EXIT
        </div>
      </div>
    </div>
  );
};

