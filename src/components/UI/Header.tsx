import React from 'react';
import { 
  Sun, 
  Moon, 
  Globe, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { MarsSurfaceMode } from '../../types';

interface HeaderProps {
  lightingMode: 'solar' | 'ambient';
  onSelectLightingMode: (mode: 'solar' | 'ambient') => void;
  sceneMode: '2D' | '3D';
  onSelectSceneMode: (mode: '2D' | '3D') => void;
  onOpenDatasetModal: () => void;
  wmtsStatus: { loaded: boolean; error: string | null; testing: boolean };
  surfaceMode?: MarsSurfaceMode;
}

// Authentic NASA Meatball Logo
const NasaMeatballLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#0B3D91" />
    {/* White constellation stars */}
    <circle cx="28" cy="28" r="1.5" fill="white" />
    <circle cx="34" cy="40" r="1.2" fill="white" />
    <circle cx="70" cy="30" r="1.5" fill="white" />
    <circle cx="76" cy="42" r="1.2" fill="white" />
    <circle cx="24" cy="62" r="1.2" fill="white" />
    <circle cx="42" cy="74" r="1.5" fill="white" />
    <circle cx="68" cy="70" r="1.2" fill="white" />
    {/* Orbit ellipse */}
    <ellipse cx="50" cy="50" rx="42" ry="16" stroke="white" strokeWidth="2.5" transform="rotate(-30 50 50)" strokeDasharray="90 8 15 8" />
    {/* Red vector / chevron */}
    <path d="M22 68 L50 20 L78 68 L66 68 L50 36 L34 68 Z" fill="#FC3D21" />
    {/* NASA text */}
    <text x="50" y="56" textAnchor="middle" fill="white" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="19" letterSpacing="1.2">NASA</text>
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  lightingMode,
  onSelectLightingMode,
  sceneMode,
  onSelectSceneMode,
  onOpenDatasetModal,
  wmtsStatus,
}) => {
  const is3D = sceneMode === '3D';
  const isAmbient = lightingMode === 'ambient';

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-2 sm:p-3.5 md:p-4 flex items-center justify-between gap-2 sm:gap-3 text-white">
      {/* 1. TOP-LEFT: NASA LOGO + MIRA TITLE + SYSTEM DATASET */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 select-none min-w-0">
        {/* NASA Meatball Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <NasaMeatballLogo className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0 drop-shadow-[0_0_8px_rgba(11,61,145,0.8)]" />
          <div className="flex flex-col">
            <span className="text-sm sm:text-base md:text-lg font-black tracking-widest text-white leading-none font-sans">
              MIRA
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap hidden sm:block">
              Mars Interactive Reconnaissance &amp; Analysis
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 sm:h-7 w-[1px] bg-white/20 hidden md:block mx-0.5 sm:mx-1 shrink-0" />

        {/* SYSTEM STATUS PILL */}
        <button
          onClick={onOpenDatasetModal}
          title="Click to view NASA WMTS dataset specifications & controls"
          className="bg-[#0b101b]/85 hover:bg-[#121929]/95 backdrop-blur-md border border-white/15 hover:border-white/25 rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-xl flex items-center gap-1.5 sm:gap-2.5 transition-all cursor-pointer group shrink min-w-0"
        >
          {/* Neon green pulsing dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${wmtsStatus.error ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${wmtsStatus.error ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-400 shadow-[0_0_10px_#10b981]'}`} />
          </span>

          <div className="flex flex-col items-start leading-tight min-w-0">
            <span className="text-[7.5px] sm:text-[8px] font-mono-sci font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
              SYSTEM STATUS
            </span>
            <span className="text-[10px] sm:text-[10.5px] md:text-[11px] font-mono-sci text-slate-200 tracking-tight flex items-center gap-1 truncate">
              <span className="hidden sm:inline">Mars_MOLA_blend200ppx_HRSC_Shade</span>
              <span className="sm:hidden">Mars MOLA/HRSC</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-transform shrink-0" />
            </span>
          </div>
        </button>
      </div>

      {/* 2. TOP-CENTER: NASA PROJECT MIRA // MARS SURFACE EXPLORATION */}
      <div className="hidden xl:flex items-center gap-2.5 pointer-events-auto select-none shrink-0">
        <div className="h-7 w-[1px] bg-white/15 mr-1" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-extrabold tracking-wider text-white font-sans uppercase">
            NASA PROJECT MIRA //
          </span>
          <span className="text-[10px] font-mono-sci font-bold tracking-[0.2em] text-[#FF8A00] drop-shadow-[0_0_8px_rgba(255,138,0,0.6)] uppercase">
            MARS SURFACE EXPLORATION
          </span>
        </div>
      </div>

      {/* 3. TOP-RIGHT: CLASSIC 3D/2D CAPSULE + SOLAR/AMBIENT CAPSULE + SETTINGS */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 select-none shrink-0">
        {/* VIEW MODE: [3D | 2D] Classic Comfortable Rounded Capsule */}
        <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl">
          <button
            onClick={() => onSelectSceneMode('3D')}
            title="3D Mars Globe View"
            className={`w-12 sm:w-14 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              is3D
                ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(14,165,233,0.8)] border border-cyan-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>3D</span>
          </button>
          <button
            onClick={() => onSelectSceneMode('2D')}
            title="2D Flat Map View"
            className={`w-12 sm:w-14 h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center transition-all cursor-pointer ${
              !is3D
                ? 'bg-[#0284c7] text-white shadow-[0_0_14px_rgba(14,165,233,0.8)] border border-cyan-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>2D</span>
          </button>
        </div>

        {/* LIGHTING MODE: [☀️ Solar | 🌙 Ambient] Classic Comfortable Rounded Capsule */}
        <div className="bg-[#0b101b]/85 backdrop-blur-md border border-white/15 rounded-full p-1 flex items-center gap-1 shadow-xl">
          <button
            onClick={() => onSelectLightingMode('solar')}
            title="Solar Lighting Mode (Real Sun position & shadows)"
            className={`w-[78px] sm:w-[88px] h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !isAmbient
                ? 'bg-[#ea580c] text-white shadow-[0_0_14px_rgba(234,88,12,0.8)] border border-orange-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span>Solar</span>
          </button>
          <button
            onClick={() => onSelectLightingMode('ambient')}
            title="Ambient Lighting Mode (Uniform diffuse illumination)"
            className={`w-[78px] sm:w-[88px] h-7 sm:h-8 rounded-full text-[11px] sm:text-[12px] font-mono-sci font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isAmbient
                ? 'bg-[#ea580c] text-white shadow-[0_0_14px_rgba(234,88,12,0.8)] border border-orange-400/60'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
            <span>Ambient</span>
          </button>
        </div>

        {/* Settings Gear Icon */}
        <button
          onClick={onOpenDatasetModal}
          title="Open Planetary & Dataset Settings"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#081629]/80 hover:bg-[#0b1c33] backdrop-blur-xl border border-white/10 hover:border-orange-500/50 hover:shadow-[0_0_12px_rgba(255,138,0,0.4)] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer group shadow-xl"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    </header>
  );
};
