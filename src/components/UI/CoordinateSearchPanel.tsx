import React, { useState, useMemo } from 'react';
import { 
  Crosshair, 
  X, 
  ChevronDown, 
  Target,
  Navigation
} from 'lucide-react';
import { calculateMarsSurfaceDistanceKm } from '../../services/miraAiService';
import { 
  JezeroCraterThumb, 
  OlympusMonsThumb, 
  VallesMarinerisThumb, 
  GaleCraterThumb
} from './Thumbnails';

interface CoordinateSearchPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  onNavigateToCoordinates: (lat: number, lon: number) => void;
}

export const CoordinateSearchPanel: React.FC<CoordinateSearchPanelProps> = ({
  isOpen,
  onClose,
  onNavigateToCoordinates,
}) => {
  const [latValue, setLatValue] = useState('0.00');
  const [latDir, setLatDir] = useState<'N' | 'S'>('N');
  const [lonValue, setLonValue] = useState('0.00');
  const [lonDir, setLonDir] = useState<'E' | 'W'>('E');
  const [activePreset, setActivePreset] = useState<string>('jezero');
  const [isApproaching, setIsApproaching] = useState(false);

  // 4 Core Landmarks matching user reference layout (2x2 grid)
  const PRESETS = [
    { 
      id: 'jezero', 
      label: 'Jezero', 
      sub: '(0°, 0°)', 
      trueLat: 18.38, 
      trueLon: 77.58, 
      dispLat: '0.00', 
      dispLatDir: 'N' as const, 
      dispLon: '0.00', 
      dispLonDir: 'E' as const,
      Icon: JezeroCraterThumb
    },
    { 
      id: 'olympus', 
      label: 'Olympus', 
      sub: 'Mons', 
      trueLat: 18.65, 
      trueLon: 226.20, 
      dispLat: '18.65', 
      dispLatDir: 'N' as const, 
      dispLon: '133.80', 
      dispLonDir: 'W' as const,
      Icon: OlympusMonsThumb
    },
    { 
      id: 'valles', 
      label: 'Valles Marineris', 
      sub: '', 
      trueLat: -13.90, 
      trueLon: 300.80, 
      dispLat: '13.90', 
      dispLatDir: 'S' as const, 
      dispLon: '59.20', 
      dispLonDir: 'W' as const,
      Icon: VallesMarinerisThumb
    },
    { 
      id: 'gale', 
      label: 'Gale Crater', 
      sub: '', 
      trueLat: -5.37, 
      trueLon: 137.44, 
      dispLat: '5.37', 
      dispLatDir: 'S' as const, 
      dispLon: '137.44', 
      dispLonDir: 'E' as const,
      Icon: GaleCraterThumb
    },
  ];

  // Calculate parsed degrees
  const currentLatitude = useMemo(() => {
    const num = parseFloat(latValue.replace('°', '')) || 0;
    return latDir === 'S' ? -Math.abs(num) : Math.abs(num);
  }, [latValue, latDir]);

  const currentLongitude = useMemo(() => {
    const num = parseFloat(lonValue.replace('°', '')) || 0;
    return lonDir === 'W' ? -Math.abs(num) : Math.abs(num);
  }, [lonValue, lonDir]);

  // Geodesic distance from Jezero Crater origin (0, 0)
  const distanceFromJezeroKm = useMemo(() => {
    if (activePreset === 'jezero') return 0;
    const target = PRESETS.find((p) => p.id === activePreset);
    if (target) {
      return Math.round(calculateMarsSurfaceDistanceKm(target.trueLat, target.trueLon, 18.38, 77.58));
    }
    return Math.round(calculateMarsSurfaceDistanceKm(currentLatitude, currentLongitude, 18.38, 77.58));
  }, [activePreset, currentLatitude, currentLongitude]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setLatValue(preset.dispLat);
    setLatDir(preset.dispLatDir);
    setLonValue(preset.dispLon);
    setLonDir(preset.dispLonDir);
  };

  const handleFly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsApproaching(true);

    const match = PRESETS.find((p) => p.id === activePreset);
    if (match) {
      onNavigateToCoordinates(match.trueLat, match.trueLon);
    } else {
      onNavigateToCoordinates(currentLatitude, currentLongitude);
    }

    setTimeout(() => setIsApproaching(false), 2200);
  };

  return (
    <div className="w-[calc(100vw-32px)] max-w-[310px] sm:w-[320px] pointer-events-auto select-none">
      {/* Dark Translucent Glass Card - Compact & Balanced (No huge spaces) */}
      <div className="bg-gradient-to-b from-[#081629]/95 via-[#050D1B]/95 to-[#040914]/95 backdrop-blur-2xl border border-[#FF8A00]/40 rounded-2xl p-3 sm:p-3.5 shadow-[0_0_20px_rgba(255,138,0,0.18)] space-y-2.5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-0.5 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#FF8A00] drop-shadow-[0_0_8px_rgba(255,138,0,0.8)] shrink-0" />
            <h2 className="text-[11.5px] sm:text-[12px] font-title-sci font-bold tracking-wider text-white uppercase">
              COORDINATE ENTRY
            </h2>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Close Coordinate Entry"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Inputs */}
        <form onSubmit={handleFly} className="space-y-2">
          {/* Latitude */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-300 shrink-0">
              LATITUDE
            </span>
            <div className="bg-[#061120]/80 border border-white/10 rounded-lg px-2.5 py-1 flex items-center justify-between flex-1 max-w-[155px] shadow-inner">
              <input
                type="text"
                value={latValue.includes('°') ? latValue : `${latValue}°`}
                onChange={(e) => {
                  setLatValue(e.target.value.replace('°', ''));
                  setActivePreset('');
                }}
                className="flex-1 min-w-0 bg-transparent text-[11px] font-mono font-medium text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setLatDir((d) => (d === 'N' ? 'S' : 'N'))}
                className="text-slate-300 hover:text-white font-mono font-bold text-[10px] flex items-center gap-0.5 cursor-pointer pl-1.5 border-l border-white/10 shrink-0"
              >
                <span>{latDir}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Longitude */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-300 shrink-0">
              LONGITUDE
            </span>
            <div className="bg-[#061120]/80 border border-white/10 rounded-lg px-2.5 py-1 flex items-center justify-between flex-1 max-w-[155px] shadow-inner">
              <input
                type="text"
                value={lonValue.includes('°') ? lonValue : `${lonValue}°`}
                onChange={(e) => {
                  setLonValue(e.target.value.replace('°', ''));
                  setActivePreset('');
                }}
                className="flex-1 min-w-0 bg-transparent text-[11px] font-mono font-medium text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setLonDir((d) => (d === 'E' ? 'W' : 'E'))}
                className="text-slate-300 hover:text-white font-mono font-bold text-[10px] flex items-center gap-0.5 cursor-pointer pl-1.5 border-l border-white/10 shrink-0"
              >
                <span>{lonDir}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* 2x2 Landmark Squares Grid */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {PRESETS.map((preset) => {
              const isSelected = activePreset === preset.id;
              const { Icon } = preset;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-lg border flex items-center gap-2 text-left transition-all duration-200 cursor-pointer select-none min-h-[44px] ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#FF6200]/30 via-[#FF8A00]/15 to-[#050D1B]/80 border-[#FF8A00] ring-1 ring-[#FF8A00]/50 shadow-[0_0_14px_rgba(255,138,0,0.35)]'
                      : 'bg-[#061120]/70 hover:bg-[#081629]/90 border-white/10 hover:border-orange-500/30 text-slate-300 hover:text-white shadow-sm'
                  }`}
                >
                  <Icon className="w-6 h-6 shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
                  <div className="flex flex-col justify-center leading-tight min-w-0 flex-1">
                    <span className="text-[10.5px] sm:text-[11px] font-sans font-bold text-white tracking-tight truncate">
                      {preset.label}
                    </span>
                    <span className={`text-[8.5px] sm:text-[9px] font-sans min-h-[12px] flex items-center ${isSelected ? 'text-amber-200/90 font-medium' : 'text-slate-400'}`}>
                      {preset.sub || ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Distance from Jezero Row */}
          <div className="flex items-center justify-between text-[10.5px] px-0.5 py-0.5">
            <div className="flex items-center gap-1.5 text-[#FF8A00] font-sans font-medium">
              <Target className="w-3.5 h-3.5 text-[#FF8A00]" />
              <span>Distance from Jezero:</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#FF8A00] font-mono-sci font-bold">
              <div className="w-3 h-3 rounded-full border border-[#FF8A00] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]" />
              </div>
              <span className="text-white">{distanceFromJezeroKm} km</span>
            </div>
          </div>

          {/* FLY TO DESTINATION BUTTON */}
          <div className="pt-0.5">
            <button
              type="submit"
              disabled={isApproaching}
              className="w-full h-9 sm:h-10 px-3 rounded-xl bg-gradient-to-r from-[#FF6200] via-[#FF8A00] to-[#FFA726] hover:brightness-110 active:scale-[0.99] text-white font-title-sci font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,98,0,0.5)] border border-[#FFB52E]/60 transition-all cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 fill-white text-white transform rotate-45 ${isApproaching ? 'animate-pulse' : ''}`} />
              <span>{isApproaching ? 'IN APPROACH...' : 'FLY TO DESTINATION >'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
