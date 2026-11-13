import React, { useState, useMemo } from 'react';
import { 
  Mountain, 
  Search, 
  ChevronUp, 
  ChevronDown,
  ChevronRight,
  X 
} from 'lucide-react';
import { MarsLandmark } from '../../types';
import { MARS_LANDMARKS } from '../../config/landmarks';
import { 
  OlympusMonsThumb, 
  VallesMarinerisThumb, 
  JezeroCraterThumb, 
  GaleCraterThumb 
} from './Thumbnails';

interface LandmarkPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  activeLandmark: MarsLandmark | null;
  onSelectLandmark: (landmark: MarsLandmark) => void;
  onReturnToGlobal: () => void;
}

type LandmarkCategory = 'ALL' | 'VOLCANOES' | 'CANYONS' | 'CRATERS';

export const LandmarkPanel: React.FC<LandmarkPanelProps> = ({
  isOpen,
  onClose,
  activeLandmark,
  onSelectLandmark,
}) => {
  const [activeCategory, setActiveCategory] = useState<LandmarkCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Map landmark id to its authentic SVG thumbnail component
  const getThumbnailComponent = (id: string) => {
    switch (id) {
      case 'olympus-mons':
        return <OlympusMonsThumb className="w-10 h-10 rounded-lg shrink-0 object-cover border border-white/10" />;
      case 'valles-marineris':
        return <VallesMarinerisThumb className="w-10 h-10 rounded-lg shrink-0 object-cover border border-white/10" />;
      case 'jezero-crater':
        return <JezeroCraterThumb className="w-10 h-10 rounded-lg shrink-0 object-cover border border-white/10" />;
      case 'gale-crater':
        return <GaleCraterThumb className="w-10 h-10 rounded-lg shrink-0 object-cover border border-white/10" />;
      default:
        return <JezeroCraterThumb className="w-10 h-10 rounded-lg shrink-0 object-cover border border-white/10" />;
    }
  };

  // Format concise dimensions line matching screenshot
  const getDimensionLine = (lm: MarsLandmark) => {
    if (lm.id === 'olympus-mons') return 'Diameter: 600 km • Elevation: 21.9 km';
    if (lm.id === 'valles-marineris') return 'Length: 4,000 km • Depth: 7 km';
    if (lm.id === 'jezero-crater') return 'Diameter: 49 km • Depth: 1.5 km';
    if (lm.id === 'gale-crater') return 'Diameter: 154 km • Depth: 5 km';
    if (lm.id === 'north-polar-cap') return 'Diameter: 1,000 km • Elevation: 2 km';
    if (lm.id === 'south-polar-cap') return 'Diameter: 1,400 km • Elevation: 3 km';
    return `Diameter: ${lm.diameterKm} km`;
  };

  const getCleanType = (type: string) => {
    if (type.toLowerCase().includes('volcano')) return 'Shield Volcano';
    if (type.toLowerCase().includes('canyon')) return 'Canyon System';
    if (type.toLowerCase().includes('crater')) return 'Impact Crater';
    if (type.toLowerCase().includes('polar')) return 'Polar Ice Cap';
    return type;
  };

  const filteredLandmarks = useMemo(() => {
    return MARS_LANDMARKS.filter((lm) => {
      // Category filter
      if (activeCategory === 'VOLCANOES' && !lm.type.toLowerCase().includes('volcano')) return false;
      if (activeCategory === 'CANYONS' && !lm.type.toLowerCase().includes('canyon')) return false;
      if (activeCategory === 'CRATERS' && !lm.type.toLowerCase().includes('crater')) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        lm.name.toLowerCase().includes(q) ||
        lm.type.toLowerCase().includes(q) ||
        lm.description.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="w-[305px] sm:w-[320px] pointer-events-auto select-none">
      {/* Dark Translucent Glass Card matching user image */}
      <div className="bg-[#0b101b]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-4.5 shadow-2xl shadow-black/80 space-y-3 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            <h2 className="text-[12px] font-black tracking-wider text-orange-400 font-sans uppercase">
              MARTIAN LANDMARKS
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed((c) => !c)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Category Tabs: ALL | VOLCANOES | CANYONS | CRATERS */}
            <div className="flex items-center justify-between gap-1 bg-[#121827]/80 p-1 rounded-xl border border-white/10 text-[9.5px] font-mono-sci font-bold">
              {(['ALL', 'VOLCANOES', 'CANYONS', 'CRATERS'] as LandmarkCategory[]).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ea580c] text-white shadow-[0_0_10px_rgba(234,88,12,0.6)] font-extrabold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmarks..."
                className="w-full bg-[#121827]/90 border border-white/10 focus:border-orange-500/50 rounded-xl pl-8.5 pr-3 py-1.5 text-[11px] font-mono-sci text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Landmarks List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
              {filteredLandmarks.map((lm) => {
                const isSelected = activeLandmark?.id === lm.id || (!activeLandmark && lm.id === 'jezero-crater');
                return (
                  <div
                    key={lm.id}
                    onClick={() => onSelectLandmark(lm)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ea580c]/15 border-orange-500 shadow-[0_0_12px_rgba(234,88,12,0.35)]'
                        : 'bg-[#121827]/70 hover:bg-[#182136] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Thumbnail + Details */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getThumbnailComponent(lm.id)}
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-[11.5px] font-bold text-white tracking-tight truncate">
                          {lm.name}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono-sci truncate">
                          {getCleanType(lm.type)}
                        </span>
                        <span className="text-[8.5px] text-slate-500 font-mono-sci truncate mt-0.5">
                          {getDimensionLine(lm)}
                        </span>
                      </div>
                    </div>

                    {/* Navigation indicator arrow */}
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isSelected ? 'text-orange-400' : 'text-slate-500'
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
