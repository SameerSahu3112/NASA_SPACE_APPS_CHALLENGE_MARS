import React from 'react';
import { X, ShieldCheck, Database, Mountain, Info, Compass, Layers, CheckCircle } from 'lucide-react';
import { DATASET_NASA_MOLA_MEGDR, PRESERVED_REGIONAL_GROUND_TRUTH } from '../../services/elevation/datasetRegistry';
import { MARS_ELLIPSOID_MODELS } from '../../config/marsEllipsoid';

interface TerrainProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSiteId: string;
}

export const TerrainProvenanceModal: React.FC<TerrainProvenanceModalProps> = ({
  isOpen,
  onClose,
  activeSiteId,
}) => {
  if (!isOpen) return null;

  const currentRegionalData = Object.values(PRESERVED_REGIONAL_GROUND_TRUTH).find(
    (r) => r.name.toLowerCase().includes(activeSiteId.split('-')[0])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090d16]/95 border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                MIRA 3D Martian Terrain Provenance &amp; Geodesy
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Ground Truth
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scientific documentation of Mars elevation sources, vertical datums, and terrain pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
          
          {/* Active Site Ground Truth Highlight */}
          {currentRegionalData && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-300 font-medium">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  Preserved Regional Ground Truth: {currentRegionalData.name}
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  ±{currentRegionalData.uncertaintyMeters} m accuracy
                </span>
              </div>
              <p className="text-[11.5px] text-slate-300">
                Official Landing Site Characterization: <strong className="text-white">{currentRegionalData.measuredElevationMeters.toLocaleString()} m</strong> above MOLA datum.
              </p>
              <p className="text-[10.5px] text-slate-400 font-mono">
                Source: {currentRegionalData.source}
              </p>
            </div>
          )}

          {/* 1. Global Elevation Baseline */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Database className="w-4 h-4 text-amber-400" />
              <span>1. Global Elevation Baseline: NASA MGS MOLA MEGDR</span>
            </div>
            <p className="text-slate-300">
              The 3D terrain geometry is anchored by the NASA Goddard Space Flight Center MGS MOLA Mission Experiment Gridded Data Record (MEGDR 4 PPD). 
              A verified local 16-bit binary elevation grid (<code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">mars_mola_megdr_global_topography.bin</code>) 
              serves 100% planetary coverage with zero network latency.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10.5px] text-slate-400">
              <div className="bg-slate-950/60 p-2 rounded border border-white/5">
                <div className="text-slate-500">Native Resolution</div>
                <div className="text-slate-200">{DATASET_NASA_MOLA_MEGDR.nativeResolution}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-white/5">
                <div className="text-slate-500">Grid Dimensions</div>
                <div className="text-slate-200">{DATASET_NASA_MOLA_MEGDR.coverage}</div>
              </div>
            </div>
          </div>

          {/* 2. Vertical Datum: MOLA Areoid */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>2. Vertical Reference Datum: MOLA Areoid</span>
            </div>
            <p className="text-slate-300">
              Elevation values in MIRA represent true planetary topography referenced to the <strong>MOLA Areoid</strong>. 
              The Areoid is the Martian gravitational equipotential surface whose average equatorial radius equals the mean equatorial radius of Mars (3,396,000 m), 
              derived from the GSFC GMM-2B spherical harmonic gravity model.
            </p>
          </div>

          {/* 3. Reference Spheroid: IAU 2015 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>3. Geodetic Horizontal Spheroid: IAU 2015 (EPSG:104905)</span>
            </div>
            <p className="text-slate-300">
              Terrain geometry and NASA Trek imagery are projected onto the IAU 2015 cartographic reference spheroid:
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10.5px] text-slate-400">
              <div className="bg-slate-950/60 p-2 rounded border border-white/5">
                <div className="text-slate-500">Semi-Major (a)</div>
                <div className="text-slate-200">{MARS_ELLIPSOID_MODELS.IAU_2015.xRadius.toLocaleString()} m</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-white/5">
                <div className="text-slate-500">Semi-Minor (c)</div>
                <div className="text-slate-200">{MARS_ELLIPSOID_MODELS.IAU_2015.zRadius.toLocaleString()} m</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-white/5">
                <div className="text-slate-500">Flattening (f)</div>
                <div className="text-slate-200">1 / 169.81</div>
              </div>
            </div>
          </div>

          {/* 4. Rover-Eye Collision Guard */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>4. Real-time Terrain Collision &amp; Camera Clamp</span>
            </div>
            <p className="text-slate-300">
              During low-altitude and rover-eye navigation, the camera controller queries the unified elevation engine at 60 Hz. 
              The camera height is strictly clamped to <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded">Z_terrain + eyeHeight</code>, 
              preventing subsurface clipping while traversing mountains, crater rims, or canyon floors.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Strict numerical consistency across query HUD and 3D terrain mesh.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
