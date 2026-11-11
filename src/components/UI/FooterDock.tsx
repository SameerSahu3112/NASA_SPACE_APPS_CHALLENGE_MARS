import React from 'react';
import { TERRAIN_EXPLORER_ENABLED } from '../../config/terrainConfig';

interface FooterDockProps {
  activeTab: 'mars' | 'solar' | 'terrain' | 'dashboard' | 'analysis' | 'compare';
  onSelectTab: (tab: 'mars' | 'solar' | 'terrain' | 'dashboard' | 'analysis' | 'compare') => void;
  onResetCamera?: () => void;
  onToggleTools?: () => void;
  showTools?: boolean;
  onToggleAiCopilot?: () => void;
  isAiCopilotOpen?: boolean;
}

export const FooterDock: React.FC<FooterDockProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-30 pointer-events-none select-none flex items-center justify-center px-4">
      {/* Outer Aerospace Nav Dock - Exact Classic Capsule matching 2D/3D & Solar/Ambient design */}
      <div className="pointer-events-auto bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl">
        
        {/* 1. Mars Globe Tab */}
        <button
          onClick={() => onSelectTab('mars')}
          title="3D Mars Globe Surface Exploration"
          className={`px-3.5 sm:px-4 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'mars'
              ? 'bg-[#ea580c] text-white shadow-[0_0_14px_rgba(234,88,12,0.8)] border border-orange-400/60'
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
          }`}
        >
          <img 
            src="/assets/dock_mars_icon_exact.png" 
            alt="Mars Globe" 
            className="w-4 h-4 rounded-full object-cover shrink-0 drop-shadow-[0_0_4px_rgba(234,88,12,0.6)]" 
          />
          <span>Mars Globe</span>
        </button>

        {/* 2. Solar System Tab */}
        <button
          onClick={() => onSelectTab('solar')}
          title="3D Scientific Solar System Simulation"
          className={`px-3.5 sm:px-4 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'solar'
              ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(14,165,233,0.8)] border border-cyan-400/60'
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
          }`}
        >
          <img 
            src="/assets/dock_solar_icon_exact.png" 
            alt="Solar System" 
            className="w-4 h-4 object-contain shrink-0 drop-shadow-[0_0_4px_rgba(56,189,248,0.6)]" 
          />
          <span>Solar System</span>
        </button>

        {/* 3. Terrain Explorer Tab */}
        {TERRAIN_EXPLORER_ENABLED && (
          <button
            onClick={() => onSelectTab('terrain')}
            title="Mars 3D Oblique & Rover-Eye Terrain Explorer"
            className={`px-3.5 sm:px-4 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'terrain'
                ? 'bg-[#059669] text-white shadow-[0_0_14px_rgba(16,185,129,0.8)] border border-emerald-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
            }`}
          >
            <img 
              src="/assets/olympus_mons_precise.png" 
              alt="Terrain Explorer" 
              className="w-4 h-4 object-contain shrink-0 drop-shadow-[0_0_4px_rgba(16,185,129,0.6)]" 
            />
            <span>Terrain Explorer</span>
          </button>
        )}

      </div>
    </div>
  );
};
