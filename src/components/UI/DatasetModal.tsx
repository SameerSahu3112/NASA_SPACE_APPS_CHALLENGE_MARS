import React from 'react';
import { X, ExternalLink, Database, AlertCircle, Sliders, Sparkles } from 'lucide-react';
import { 
  NASA_WMTS_CONFIG, 
  NASA_WMTS_COLOR_HILLSHADE_CONFIG, 
  NASA_WMTS_VIKING_COLOR_CONFIG,
  SURFACE_MODES_METADATA
} from '../../config/nasaImagery';
import { MARS_ELLIPSOID_MODELS } from '../../config/marsEllipsoid';
import { MarsSurfaceMode, SurfaceCompositingOptions } from '../../types';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ellipsoidKey: 'IAU_2015' | 'MOLA_TRIAXIAL';
  onSelectEllipsoid: (key: 'IAU_2015' | 'MOLA_TRIAXIAL') => void;
  useNormalizedWmtsUrl: boolean;
  onToggleNormalizedWmtsUrl: (useNormalized: boolean) => void;
  surfaceMode: MarsSurfaceMode;
  onSelectSurfaceMode: (mode: MarsSurfaceMode) => void;
  compositingOptions: SurfaceCompositingOptions;
  onUpdateCompositingOptions: (options: SurfaceCompositingOptions) => void;
  onResetCompositingOptions: () => void;
}

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  ellipsoidKey,
  onSelectEllipsoid,
  useNormalizedWmtsUrl,
  onToggleNormalizedWmtsUrl,
  surfaceMode,
  onSelectSurfaceMode,
  compositingOptions,
  onUpdateCompositingOptions,
  onResetCompositingOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-3xl w-full max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center shrink-0">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-title-sci font-bold text-xs sm:text-sm md:text-base text-slate-100 truncate">
                SCIENTIFIC DATASET SPECIFICATIONS
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs font-sans">
          {/* SURFACE RENDERING MODES */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* BASELINE CARD */}
              <div
                onClick={() => onSelectSurfaceMode('original')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  surfaceMode === 'original'
                    ? 'bg-slate-800/90 border-slate-400 ring-2 ring-slate-400/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-title-sci font-bold text-sm sm:text-base text-slate-100 tracking-wide uppercase">
                    BASELINE
                  </h3>
                  {surfaceMode === 'original' && (
                    <span className="text-[9px] font-mono-sci px-1.5 py-0.5 rounded bg-slate-600 text-white font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="font-title-sci font-bold text-sm text-slate-100 mb-1">
                  MOLA/HRSC Grayscale
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  Original high-detail shaded relief (200m/px). Deep crater shadows and mountain relief in monochrome.
                </p>
                <div className="text-[10px] font-mono-sci text-slate-500 break-all">
                  Mars_MOLA_blend200ppx_HRSC_Shade
                </div>
              </div>

              {/* NASA COLOR CARD */}
              <div
                onClick={() => onSelectSurfaceMode('color_hillshade')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  surfaceMode === 'color_hillshade'
                    ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-title-sci font-bold text-sm sm:text-base text-amber-300 tracking-wide uppercase">
                    NASA COLOR
                  </h3>
                  {surfaceMode === 'color_hillshade' && (
                    <span className="text-[9px] font-mono-sci px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="font-title-sci font-bold text-sm text-slate-100 mb-1">
                  NASA Color Hillshade
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  MOLA elevation hypsometric color tinting with HRSC shaded relief overlay (200m/px).
                </p>
                <div className="text-[10px] font-mono-sci text-amber-400/80 break-all">
                  Mars_MOLA_blend200ppx_HRSC_ClrShade
                </div>
              </div>

              {/* COMPOSITE CARD */}
              <div
                onClick={() => onSelectSurfaceMode('composite')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  surfaceMode === 'composite'
                    ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-title-sci font-bold text-sm sm:text-base text-orange-400 tracking-wide uppercase">
                    COMPOSITE
                  </h3>
                  {surfaceMode === 'composite' && (
                    <span className="text-[9px] font-mono-sci px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="font-title-sci font-bold text-sm text-slate-100 mb-1">
                  Viking Color + Terrain
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  Spacecraft Viking MDIM 2.1 authentic regolith color (232m/px) composited with MOLA/HRSC relief shading.
                </p>
                <div className="text-[10px] font-mono-sci text-orange-400/80 break-all">
                  Viking_MDIM21 + MOLA_HRSC_Shade
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME COLOR & TERRAIN COMPOSITING PARAMETERS */}
          {surfaceMode === 'composite' && (
            <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-400 font-title-sci font-bold text-sm sm:text-base tracking-wide uppercase">
                  <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 shrink-0" />
                  <span>Real-Time Color & Terrain Compositing Parameters</span>
                </div>
                <button
                  type="button"
                  onClick={onResetCompositingOptions}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono-sci text-slate-300 transition-colors cursor-pointer"
                >
                  Reset Scientific Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Viking Alpha Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono-sci">
                    <span className="text-slate-300">Viking Color Opacity:</span>
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
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block">Controls authentic regolith color density over relief</span>
                </div>

                {/* Terrain Shading Contrast */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono-sci">
                    <span className="text-slate-300">Terrain Relief Contrast:</span>
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
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block">Sharpens crater depths and mountain slope shadows</span>
                </div>

                {/* Viking Saturation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono-sci">
                    <span className="text-slate-300">Regolith Saturation:</span>
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
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 block">Natural iron oxide reddish/brown color intensity</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE WMTS LAYER SPECIFICATIONS */}
          <div className="space-y-3">
            <h3 className="font-mono-sci font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Surface Layer Specifications ({SURFACE_MODES_METADATA[surfaceMode].name})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono-sci text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Active Mode & Layer</span>
                <span className="text-slate-200 font-semibold break-all">{SURFACE_MODES_METADATA[surfaceMode].layer}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Coordinate Reference System</span>
                <span className="text-slate-200 font-semibold">EPSG:104905 (Mars Geographic, lon ±180°, lat ±90°)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Resolution & TileMatrixSet</span>
                <span className="text-slate-200 font-semibold">
                  {SURFACE_MODES_METADATA[surfaceMode].resolution} • default028mm (256×256 px)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase">Scientific Data Source</span>
                <span className="text-slate-200 font-semibold">{SURFACE_MODES_METADATA[surfaceMode].source}</span>
              </div>
            </div>

            {/* RESTful Tile Template & Slash Configuration */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-sci uppercase text-slate-400">
                  Active RESTful Tile Template URL:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono-sci text-slate-400">URL format:</span>
                  <button
                    onClick={() => onToggleNormalizedWmtsUrl(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-sci cursor-pointer ${
                      !useNormalizedWmtsUrl ? 'bg-orange-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Advertised (//)
                  </button>
                  <button
                    onClick={() => onToggleNormalizedWmtsUrl(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-sci cursor-pointer ${
                      useNormalizedWmtsUrl ? 'bg-orange-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Normalized (/)
                  </button>
                </div>
              </div>
              <code className="block p-2 rounded bg-slate-950 text-[10px] font-mono-sci text-orange-300 break-all select-all">
                {surfaceMode === 'color_hillshade'
                  ? (useNormalizedWmtsUrl ? NASA_WMTS_COLOR_HILLSHADE_CONFIG.urlTemplateNormalized : NASA_WMTS_COLOR_HILLSHADE_CONFIG.urlTemplateAdvertised)
                  : surfaceMode === 'composite'
                  ? (useNormalizedWmtsUrl ? NASA_WMTS_VIKING_COLOR_CONFIG.urlTemplateNormalized : NASA_WMTS_VIKING_COLOR_CONFIG.urlTemplateAdvertised)
                  : (useNormalizedWmtsUrl ? NASA_WMTS_CONFIG.urlTemplateNormalized : NASA_WMTS_CONFIG.urlTemplateAdvertised)}
              </code>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={NASA_WMTS_CONFIG.capabilitiesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono-sci text-slate-400 hover:text-white hover:underline"
              >
                <span>MOLA/HRSC Capabilities XML</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={NASA_WMTS_COLOR_HILLSHADE_CONFIG.capabilitiesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono-sci text-amber-400 hover:text-amber-300 hover:underline"
              >
                <span>NASA ClrShade Capabilities XML</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={NASA_WMTS_VIKING_COLOR_CONFIG.capabilitiesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono-sci text-orange-400 hover:text-orange-300 hover:underline"
              >
                <span>Viking MDIM 2.1 Capabilities XML</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* MARS REFERENCE ELLIPSOID SELECTION */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h3 className="font-mono-sci font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
              <span>Mars Planetary Reference Ellipsoid Model</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(MARS_ELLIPSOID_MODELS) as Array<'IAU_2015' | 'MOLA_TRIAXIAL'>).map((key) => {
                const model = MARS_ELLIPSOID_MODELS[key];
                const isSelected = ellipsoidKey === key;

                return (
                  <div
                    key={key}
                    onClick={() => onSelectEllipsoid(key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-950/40 border-orange-500/80 ring-1 ring-orange-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-title-sci font-bold text-xs text-slate-200">
                        {key === 'IAU_2015' ? 'IAU 2015 (Standard)' : 'Folkner Triaxial'}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-mono-sci px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="font-mono-sci text-[10px] text-slate-400 space-y-0.5 mb-2">
                      <div>Rx: {(model.xRadius / 1000).toFixed(2)} km</div>
                      <div>Ry: {(model.yRadius / 1000).toFixed(2)} km</div>
                      <div>Rz: {(model.zRadius / 1000).toFixed(2)} km (Polar)</div>
                      <div>Flattening (f): {model.flattening.toFixed(6)}</div>
                    </div>

                    <div className="text-[10px] text-slate-400/90 leading-relaxed">
                      {model.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] font-mono-sci text-slate-400 text-center sm:text-left">
            Jezero Crater Coordinate Reference Origin (0°, 0°) Preserved
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono-sci text-xs font-bold uppercase transition-colors cursor-pointer shrink-0 shadow-md"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
