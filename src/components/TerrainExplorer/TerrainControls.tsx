import React, { useState } from 'react';
import { 
  Mountain, 
  Eye, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  MapPin
} from 'lucide-react';
import { TERRAIN_EXPLORATION_SITES, TERRAIN_ALTITUDE_PRESETS, TerrainExplorationSite } from '../../config/terrainConfig';
import { MarsSurfaceMode, SurfaceCompositingOptions } from '../../types';
import { DEFAULT_COMPOSITING_OPTIONS } from '../../config/nasaImagery';

export type TerrainImageryMode = MarsSurfaceMode;

interface TerrainControlsProps {
  activeSite: TerrainExplorationSite;
  cameraMode: 'orbit' | 'surface';
  altitudeMeters: number;
  pitchDegrees: number;
  headingDegrees: number;
  verticalExaggeration: number;
  surfaceMode: MarsSurfaceMode;
  compositingOptions?: SurfaceCompositingOptions;
  onSelectSite: (site: TerrainExplorationSite) => void;
  onSelectMode: (mode: 'orbit' | 'surface') => void;
  onChangeAltitude: (altMeters: number) => void;
  onChangePitch: (pitchDeg: number) => void;
  onChangeHeading: (headingDeg: number) => void;
  onToggleExaggeration: () => void;
  onSelectSurfaceMode: (mode: MarsSurfaceMode) => void;
  onUpdateCompositingOptions?: (options: SurfaceCompositingOptions) => void;
  onResetCompositingOptions?: () => void;
  onOpenDatasetModal?: () => void;
  onResetView: () => void;
  onRoverWalk: (direction: 'forward' | 'backward' | 'left' | 'right') => void;
  onRoverTurn: (deltaHeading: number) => void;
  onRoverLook: (deltaPitch: number) => void;
  onExitToGlobe: () => void;
}

export const TerrainControls: React.FC<TerrainControlsProps> = ({
  activeSite,
  cameraMode,
  altitudeMeters,
  pitchDegrees,
  headingDegrees,
  verticalExaggeration,
  surfaceMode,
  compositingOptions = DEFAULT_COMPOSITING_OPTIONS,
  onSelectSite,
  onSelectMode,
  onChangeAltitude,
  onChangePitch,
  onChangeHeading,
  onToggleExaggeration,
  onSelectSurfaceMode,
  onUpdateCompositingOptions,
  onResetCompositingOptions,
  onOpenDatasetModal,
  onResetView,
  onRoverWalk,
  onRoverTurn,
  onRoverLook,
  onExitToGlobe,
}) => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  });

  return (
    <>
      {/* 1. TOP AEROSPACE DESTINATION STRIP */}
      <div className="absolute top-3 sm:top-4 left-0 right-0 z-20 pointer-events-none px-3 sm:px-6 flex justify-between items-center gap-2">
        
        {/* Brand / Title & Return Button */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#070b14]/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl px-3 sm:px-4 py-2 shadow-lg">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Mountain className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
              <span>MIRA 3D TERRAIN EXPLORER</span>
              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Google Earth for Mars
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Oblique Topography &bull; Rover Surface View
            </div>
          </div>
        </div>

        {/* Site Selector Classic Capsule (Matching 2D/3D Capsule Style) */}
        <div className="pointer-events-auto hidden md:flex items-center gap-1 bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 shadow-xl max-w-2xl overflow-x-auto">
          {Object.values(TERRAIN_EXPLORATION_SITES).map((site) => {
            const isSelected = activeSite.id === site.id;
            return (
              <button
                key={site.id}
                onClick={() => onSelectSite(site)}
                className={`flex items-center gap-1.5 px-3 h-7 sm:h-8 rounded-full text-[11px] font-mono-sci font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(14,165,233,0.8)] border border-cyan-400/60'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-cyan-200' : 'text-slate-400'}`} />
                <span>{site.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Header Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onOpenDatasetModal && (
            <button
              onClick={onOpenDatasetModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
              title="Configure NASA WMTS datasets & compositing parameters"
            >
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Datasets &amp; Specs</span>
            </button>
          )}
          <button
            onClick={onExitToGlobe}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/90 hover:bg-orange-500 text-white text-xs font-semibold shadow-[0_0_14px_rgba(234,88,12,0.4)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mars Globe</span>
          </button>
        </div>

      </div>

      {/* MOBILE SITE SELECTOR DROPDOWN (visible on small screens) */}
      <div className="absolute top-16 left-3 right-3 z-20 pointer-events-auto md:hidden">
        <select
          value={activeSite.id}
          onChange={(e) => {
            const found = TERRAIN_EXPLORATION_SITES[e.target.value];
            if (found) onSelectSite(found);
          }}
          className="w-full bg-[#070b14]/95 border border-emerald-500/40 text-white rounded-xl px-3 py-2 text-xs font-medium"
        >
          {Object.values(TERRAIN_EXPLORATION_SITES).map((site) => (
            <option key={site.id} value={site.id} className="bg-slate-900 text-white">
              {site.name} ({site.elevationMeters > 0 ? `+${site.elevationMeters}` : site.elevationMeters}m)
            </option>
          ))}
        </select>
      </div>

      {/* 2. FLOATING CONTROL PANEL (Left Side) */}
      <div className="absolute top-28 sm:top-20 left-3 sm:left-6 z-20 pointer-events-none max-w-[280px] sm:max-w-[320px] w-full">
        <div className="pointer-events-auto bg-[#070b14]/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.15)] overflow-hidden text-slate-200">
          
          {/* Panel Header & Collapse Toggle */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/60 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Camera &amp; Exploration Modes</span>
            </div>
            <button
              onClick={() => setIsPanelCollapsed((prev) => !prev)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {!isPanelCollapsed && (
            <div className="p-3.5 space-y-3.5 text-xs">
              
              {/* Camera Mode Toggle (Orbit vs Rover-Eye) - Classic Capsule Style */}
              <div>
                <label className="text-[10px] font-mono-sci uppercase text-slate-400 block mb-1.5">
                  Exploration Mode
                </label>
                <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl">
                  <button
                    onClick={() => onSelectMode('orbit')}
                    className={`flex-1 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      cameraMode === 'orbit'
                        ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(14,165,233,0.8)] border border-cyan-400/60'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <Mountain className="w-3.5 h-3.5 text-cyan-300" />
                    <span>3D Orbit</span>
                  </button>
                  <button
                    onClick={() => onSelectMode('surface')}
                    className={`flex-1 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      cameraMode === 'surface'
                        ? 'bg-[#ea580c] text-white shadow-[0_0_14px_rgba(234,88,12,0.8)] border border-orange-400/60'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-300" />
                    <span>Rover-Eye</span>
                  </button>
                </div>
              </div>

              {/* Altitude Presets & Slider - Classic Capsule Style */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono-sci uppercase text-slate-400 mb-1">
                  <span>Camera Altitude</span>
                  <span className="text-amber-300">
                    {altitudeMeters >= 1000 ? `${(altitudeMeters / 1000).toFixed(1)} km` : `${Math.round(altitudeMeters)} m`}
                  </span>
                </div>
                <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-0.5 flex items-center gap-0.5 shadow-md mb-2">
                  {TERRAIN_ALTITUDE_PRESETS.map((p) => {
                    const isNear = Math.abs(altitudeMeters - p.altitudeMeters) < (p.altitudeMeters * 0.4);
                    return (
                      <button
                        key={p.label}
                        onClick={() => onChangeAltitude(p.altitudeMeters)}
                        className={`flex-1 h-6 rounded-full text-[9px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
                          isNear
                            ? 'bg-[#0284c7] text-white shadow-[0_0_8px_rgba(14,165,233,0.7)] border border-cyan-400/60'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                        }`}
                        title={p.description}
                      >
                        {p.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min="2"
                  max="150000"
                  step="10"
                  value={altitudeMeters}
                  onChange={(e) => onChangeAltitude(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Oblique Pitch / Tilt Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1">
                  <span>Pitch / Oblique Tilt</span>
                  <span className="text-sky-300">{Math.round(pitchDegrees)}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="15"
                  step="1"
                  value={pitchDegrees}
                  onChange={(e) => onChangePitch(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[8.5px] font-mono text-slate-500 mt-0.5">
                  <span>-90° (Top-Down)</span>
                  <span>0° (Horizon)</span>
                  <span>+15° (Look Up)</span>
                </div>
              </div>

              {/* Heading / Compass Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1">
                  <span>Compass Heading</span>
                  <span className="text-purple-300">{Math.round(headingDegrees)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={headingDegrees}
                  onChange={(e) => onChangeHeading(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Geological Relief Exaggeration Toggle */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-200">Vertical Relief</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {verticalExaggeration === 1.0 ? '1.0x True Physical Scale' : '2.0x Topographic Relief'}
                  </div>
                </div>
                <button
                  onClick={onToggleExaggeration}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all ${
                    verticalExaggeration === 2.0
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-slate-800 border-white/10 text-slate-400'
                  }`}
                >
                  {verticalExaggeration.toFixed(1)}x
                </button>
              </div>

              {/* Surface Imagery Modes (Synchronized with Mars Globe) */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400">
                    Surface Imagery Mode
                  </label>
                  {onOpenDatasetModal && (
                    <button
                      onClick={onOpenDatasetModal}
                      className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      title="Open full NASA scientific dataset specifications & controls"
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      <span>Datasets</span>
                    </button>
                  )}
                </div>
                <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl">
                  <button
                    onClick={() => onSelectSurfaceMode('composite')}
                    className={`flex-1 h-7 rounded-full text-[10px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
                      surfaceMode === 'composite'
                        ? 'bg-[#ea580c] text-white shadow-[0_0_12px_rgba(234,88,12,0.8)] border border-orange-400/60'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                    }`}
                    title="Mode 3: Viking Color + MOLA Shaded Relief Composite"
                  >
                    Viking Comp
                  </button>
                  <button
                    onClick={() => onSelectSurfaceMode('color_hillshade')}
                    className={`flex-1 h-7 rounded-full text-[10px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
                      surfaceMode === 'color_hillshade'
                        ? 'bg-[#0284c7] text-white shadow-[0_0_12px_rgba(14,165,233,0.8)] border border-cyan-400/60'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                    }`}
                    title="Mode 2: NASA Topographic Colour Hillshade"
                  >
                    Color Shade
                  </button>
                  <button
                    onClick={() => onSelectSurfaceMode('original')}
                    className={`flex-1 h-7 rounded-full text-[10px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
                      surfaceMode === 'original'
                        ? 'bg-[#475569] text-white shadow-[0_0_12px_rgba(100,116,139,0.8)] border border-slate-400/60'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                    }`}
                    title="Mode 1: Baseline MOLA/HRSC Grayscale Relief"
                  >
                    MOLA Gray
                  </button>
                </div>
              </div>

              {/* Synchronized Real-Time Compositing Controls (when Mode 3: Composite is active) */}
              {surfaceMode === 'composite' && onUpdateCompositingOptions && (
                <div className="space-y-2 bg-orange-950/20 p-2.5 rounded-xl border border-orange-500/20">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-orange-400">
                    <span className="flex items-center gap-1 font-semibold">
                      <Sliders className="w-3 h-3 text-orange-400" />
                      <span>Compositing Sync</span>
                    </span>
                    {onResetCompositingOptions && (
                      <button
                        onClick={onResetCompositingOptions}
                        className="text-[8.5px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Regolith Saturation Slider */}
                  <div>
                    <div className="flex justify-between text-[9.5px] font-mono text-slate-300">
                      <span>Regolith Saturation:</span>
                      <span className="text-orange-400 font-bold">{Math.round(compositingOptions.vikingSaturation * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.60"
                      step="0.05"
                      value={compositingOptions.vikingSaturation}
                      onChange={(e) =>
                        onUpdateCompositingOptions({
                          ...compositingOptions,
                          vikingSaturation: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Viking Color Opacity Slider */}
                  <div>
                    <div className="flex justify-between text-[9.5px] font-mono text-slate-300">
                      <span>Viking Color Opacity:</span>
                      <span className="text-orange-400 font-bold">{Math.round(compositingOptions.vikingAlpha * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="1.00"
                      step="0.02"
                      value={compositingOptions.vikingAlpha}
                      onChange={(e) =>
                        onUpdateCompositingOptions({
                          ...compositingOptions,
                          vikingAlpha: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Terrain Relief Contrast Slider */}
                  <div>
                    <div className="flex justify-between text-[9.5px] font-mono text-slate-300">
                      <span>Terrain Contrast:</span>
                      <span className="text-orange-400 font-bold">{Math.round(compositingOptions.terrainContrast * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.60"
                      step="0.05"
                      value={compositingOptions.terrainContrast}
                      onChange={(e) =>
                        onUpdateCompositingOptions({
                          ...compositingOptions,
                          terrainContrast: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Reset to Site Origin Button */}
              <button
                onClick={onResetView}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset to {activeSite.name.split(' ')[0]} Preset</span>
              </button>

            </div>
          )}

        </div>
      </div>

      {/* 3. ROVER-EYE NAVIGATION D-PAD (Right Side, only when in surface mode) */}
      {cameraMode === 'surface' && (
        <div className="absolute top-28 sm:top-24 right-3 sm:right-6 z-20 pointer-events-none">
          <div className="pointer-events-auto bg-[#070b14]/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3 shadow-xl flex flex-col items-center gap-2 text-slate-300">
            
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-emerald-400 font-bold border-b border-white/10 pb-1">
              <span>ROVER DRIVE</span>
              <span className="text-[9px] text-slate-500">WASD</span>
            </div>

            {/* D-Pad Buttons */}
            <div className="grid grid-cols-3 gap-1.5 p-1">
              <div />
              <button
                onClick={() => onRoverWalk('forward')}
                className="p-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                title="Walk Forward (W / Arrow Up)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button
                onClick={() => onRoverWalk('left')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-all"
                title="Strafe Left (A / Arrow Left)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onRoverWalk('backward')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-all"
                title="Walk Backward (S / Arrow Down)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => onRoverWalk('right')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-all"
                title="Strafe Right (D / Arrow Right)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Turn & Look Row */}
            <div className="grid grid-cols-2 gap-1.5 w-full pt-1 border-t border-white/10 text-[9.5px] font-mono">
              <button
                onClick={() => onRoverTurn(-15)}
                className="py-1 px-2 rounded-lg bg-slate-900 border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-white"
                title="Turn Left 15° (Q)"
              >
                &larr; Turn 15°
              </button>
              <button
                onClick={() => onRoverTurn(15)}
                className="py-1 px-2 rounded-lg bg-slate-900 border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-white"
                title="Turn Right 15° (E)"
              >
                Turn 15° &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 w-full text-[9.5px] font-mono">
              <button
                onClick={() => onRoverLook(5)}
                className="py-1 px-2 rounded-lg bg-slate-900 border border-white/10 hover:border-sky-500/50 text-slate-300 hover:text-white"
                title="Look Up 5° (R)"
              >
                &uarr; Look Up
              </button>
              <button
                onClick={() => onRoverLook(-5)}
                className="py-1 px-2 rounded-lg bg-slate-900 border border-white/10 hover:border-sky-500/50 text-slate-300 hover:text-white"
                title="Look Down 5° (F)"
              >
                &darr; Look Down
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
