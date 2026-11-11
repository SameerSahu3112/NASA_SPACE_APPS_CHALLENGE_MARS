import React from 'react';
import { 
  MapPin, 
  Camera, 
  Compass, 
  RotateCw, 
  Sliders,
  Mountain
} from 'lucide-react';
import { MarsCoordinates, CameraTelemetry } from '../../types';

interface CoordinateHUDProps {
  coordinates: MarsCoordinates | null;
  telemetry: CameraTelemetry;
  ellipsoidKey?: 'IAU_2015' | 'MOLA_TRIAXIAL';
  onOpenDatasetModal?: () => void;
}

export const CoordinateHUD: React.FC<CoordinateHUDProps> = ({
  coordinates,
  telemetry,
}) => {
  // Format altitude in km
  const altitudeKm = Math.round(telemetry.altitudeKm || 2347).toLocaleString();
  const headingDeg = (telemetry.headingDeg ?? 120.5).toFixed(1);
  const pitchDeg = (telemetry.pitchDeg ?? -12.3).toFixed(1);
  const rollDeg = (telemetry.rollDeg ?? 0.8).toFixed(1);

  // Jezero relative coordinates or camera default (0.00° N, 0.00° E)
  const latDisp = coordinates 
    ? `${Math.abs(coordinates.latitude).toFixed(2)}° ${coordinates.latitude >= 0 ? 'N' : 'S'}`
    : '0.00° N';
  const lonDisp = coordinates 
    ? `${Math.abs(coordinates.longitude).toFixed(2)}° ${coordinates.longitude >= 0 ? 'E' : 'W'}`
    : '0.00° E';

  return (
    <div className="absolute bottom-[68px] sm:bottom-[72px] left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none hidden md:block max-w-[calc(100vw-32px)]">
      {/* Sleek Horizontal Telemetry Capsule matching user target image exactly */}
      <div className="bg-gradient-to-r from-[#050D1B]/95 via-[#081629]/95 to-[#050D1B]/95 backdrop-blur-2xl border border-[#00D9FF]/40 shadow-[0_0_24px_rgba(0,217,255,0.18)] rounded-2xl px-5 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-4 lg:gap-5 text-white text-[10.5px] sm:text-[11px] font-mono-sci overflow-x-auto [&::-webkit-scrollbar]:hidden whitespace-nowrap">
        {/* Section 1: Jezero Reference (0°, 0°) */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <MapPin className="w-4 h-4 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.85)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-bold text-orange-400 tracking-tight">
              Jezero Reference (0°, 0°)
            </span>
            <span className="text-[9.5px] text-slate-400">
              Lat: {latDisp} | Lon: {lonDisp}
            </span>
          </div>
        </div>

        {/* Section 2: Topographic Elevation */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <Mountain className="w-3.5 h-3.5 text-[#00D9FF] drop-shadow-[0_0_6px_rgba(0,217,255,0.7)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-wider text-slate-400">
              MOLA Elevation
            </span>
            <span className="font-bold text-cyan-300">
              {coordinates?.elevationMeters != null
                ? `${coordinates.elevationMeters > 0 ? '+' : ''}${coordinates.elevationMeters.toLocaleString()} m`
                : '-3,918 m'}
            </span>
          </div>
        </div>

        {/* Section 3: Altitude */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <Camera className="w-3.5 h-3.5 text-[#00D9FF] drop-shadow-[0_0_6px_rgba(0,217,255,0.7)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-wider text-slate-400">
              Altitude
            </span>
            <span className="font-bold text-slate-100">
              {altitudeKm} km
            </span>
          </div>
        </div>

        {/* Section 4: Heading */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <Compass className="w-3.5 h-3.5 text-[#00D9FF] drop-shadow-[0_0_6px_rgba(0,217,255,0.7)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-wider text-slate-400">
              Heading
            </span>
            <span className="font-bold text-slate-100">
              {headingDeg}°
            </span>
          </div>
        </div>

        {/* Section 5: Pitch */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <Sliders className="w-3.5 h-3.5 text-[#00D9FF] drop-shadow-[0_0_6px_rgba(0,217,255,0.7)] rotate-90" />
          <div className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-wider text-slate-400">
              Pitch
            </span>
            <span className="font-bold text-slate-100">
              {pitchDeg}°
            </span>
          </div>
        </div>

        {/* Section 6: Roll */}
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-[#00D9FF] drop-shadow-[0_0_6px_rgba(0,217,255,0.7)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-[8.5px] uppercase tracking-wider text-slate-400">
              Roll
            </span>
            <span className="font-bold text-slate-100">
              {rollDeg}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
