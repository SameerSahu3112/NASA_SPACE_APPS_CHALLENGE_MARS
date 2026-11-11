import React, { useState } from 'react';
import { 
  GitCompare, 
  HelpCircle, 
  Sparkles, 
  TrendingUp,
  Activity
} from 'lucide-react';
import { CalculatedOrbitalParameters } from '../../services/keplerSolver';
import { ORDERED_PLANET_KEYS, PLANETS_SCIENTIFIC_REGISTRY } from '../../services/planetaryData';

interface OrbitalComparisonProps {
  planetsData: Record<string, CalculatedOrbitalParameters>;
}

export const OrbitalComparison: React.FC<OrbitalComparisonProps> = ({ planetsData }) => {
  // Initially compare Mercury, Earth, Mars, and Neptune
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['mercury', 'earth', 'mars', 'neptune']);
  const [activeMetric, setActiveMetric] = useState<'speed' | 'eccentricity' | 'period' | 'distance'>('speed');

  const togglePlanet = (key: string) => {
    if (selectedKeys.includes(key)) {
      if (selectedKeys.length > 1) {
        setSelectedKeys(selectedKeys.filter((k) => k !== key));
      }
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const comparedPlanets = selectedKeys.map((k) => planetsData[k]).filter(Boolean);

  // Maximum values for comparative bar charts
  const maxSpeed = Math.max(...comparedPlanets.map((p) => p.totalSpeedKmPerSec), 50);
  const maxEcc = Math.max(...comparedPlanets.map((p) => p.eccentricity), 0.25);
  const maxPeriod = Math.max(...comparedPlanets.map((p) => p.orbitalPeriodYears), 170);
  const maxDist = Math.max(...comparedPlanets.map((p) => p.semiMajorAxisAU), 35);

  return (
    <div className="space-y-6 text-xs font-sans text-slate-300">
      {/* 1. Selector Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono-sci font-bold text-slate-200">
            <GitCompare className="w-4 h-4 text-orange-400" />
            <span>Select Planets to Compare (Multi-Select)</span>
          </div>
          <span className="text-[10px] font-mono-sci text-slate-400">
            {selectedKeys.length} of 8 selected
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {ORDERED_PLANET_KEYS.map((k) => {
            const isSelected = selectedKeys.includes(k);
            const def = PLANETS_SCIENTIFIC_REGISTRY[k];
            const chars = def?.characteristics;

            return (
              <button
                key={k}
                onClick={() => togglePlanet(k)}
                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-mono-sci font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-sky-500/20 border border-sky-400/60 text-sky-200 shadow-sm'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: chars?.colorHex || '#fff' }}
                />
                <span>{chars?.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Comparative Bar Charts */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono-sci font-bold text-xs text-slate-100">
            <Activity className="w-4 h-4 text-orange-400" />
            <span>Interactive Orbital Metrics Visualizer</span>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/80 border border-slate-800 p-1 text-[10px] font-mono-sci flex-wrap sm:flex-nowrap">
            {[
              { id: 'speed', label: 'Orbital Speed (km/s)' },
              { id: 'eccentricity', label: 'Eccentricity (e)' },
              { id: 'period', label: 'Period (Years)' },
              { id: 'distance', label: 'Distance (AU)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                className={`cursor-pointer px-2.5 py-1 rounded-lg transition-all font-semibold ${
                  activeMetric === m.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Bars */}
        <div className="space-y-2 pt-1 font-mono-sci">
          {comparedPlanets.map((p) => {
            const def = PLANETS_SCIENTIFIC_REGISTRY[p.planetId];
            const chars = def?.characteristics;

            let val = 0;
            let max = 1;
            let displayVal = '';

            if (activeMetric === 'speed') {
              val = p.totalSpeedKmPerSec;
              max = maxSpeed;
              displayVal = `${val.toFixed(2)} km/s`;
            } else if (activeMetric === 'eccentricity') {
              val = p.eccentricity;
              max = maxEcc;
              displayVal = val.toFixed(4);
            } else if (activeMetric === 'period') {
              val = p.orbitalPeriodYears;
              max = maxPeriod;
              displayVal = `${val.toFixed(2)} yr`;
            } else {
              val = p.semiMajorAxisAU;
              max = maxDist;
              displayVal = `${val.toFixed(3)} AU`;
            }

            const pct = Math.max(3, Math.min(100, (val / max) * 100));

            return (
              <div key={p.planetId} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: chars?.colorHex || '#fff' }}
                    />
                    <strong className="text-slate-200">{p.name}</strong>
                  </div>
                  <span className="text-orange-400 font-bold">{displayVal}</span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: chars?.colorHex || '#38bdf8',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Side-by-Side Comparative Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {comparedPlanets.map((p) => {
          const def = PLANETS_SCIENTIFIC_REGISTRY[p.planetId];
          const chars = def?.characteristics;

          return (
            <div
              key={p.planetId}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                chars?.isMars
                  ? 'bg-red-950/20 border-red-500/40 ring-1 ring-red-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: chars?.colorHex || '#fff' }}
                    />
                    <span className="font-title-sci font-bold text-sm text-slate-100">
                      {p.name}
                    </span>
                  </div>
                  {chars?.isMars && (
                    <span className="text-[9px] font-mono-sci px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">
                      MIRA TARGET
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 font-mono-sci text-[10.5px]">
                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Semi-Major Axis (a):</span>
                    <strong className="text-slate-200">{p.semiMajorAxisAU.toFixed(3)} AU</strong>
                  </div>

                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Eccentricity (e):</span>
                    <strong className={p.eccentricity > 0.08 ? 'text-orange-400' : 'text-slate-200'}>
                      {p.eccentricity.toFixed(4)}
                    </strong>
                  </div>

                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Inclination (I):</span>
                    <strong className={p.inclinationDeg > 5 ? 'text-amber-400' : 'text-slate-200'}>
                      {p.inclinationDeg.toFixed(2)}°
                    </strong>
                  </div>

                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Orbital Period (P):</span>
                    <strong className="text-slate-200">{p.orbitalPeriodYears.toFixed(2)} yr</strong>
                  </div>

                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Perihelion (q):</span>
                    <strong className="text-emerald-400">{p.perihelionDistanceAU.toFixed(3)} AU</strong>
                  </div>

                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Aphelion (Q):</span>
                    <strong className="text-cyan-400">{p.aphelionDistanceAU.toFixed(3)} AU</strong>
                  </div>

                  <div className="flex justify-between p-1 rounded bg-slate-950/50">
                    <span className="text-slate-400">Orbital Velocity:</span>
                    <strong className="text-emerald-300">{p.totalSpeedKmPerSec.toFixed(2)} km/s</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-snug">
                {chars?.scientificSignificance}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Rigorous Scientific Explanations */}
      <div className="space-y-3">
        <h3 className="font-mono-sci font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Scientific Principles: Planetary Orbital Mechanics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Explanation 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-mono-sci font-bold text-xs text-orange-300">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Why Mercury’s Orbit is Highly Eccentric vs. Venus’s Circular Orbit</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Mercury possesses an orbital eccentricity of <strong>e ≈ 0.2056</strong>, while Venus has the most circular orbit in the solar system at <strong>e ≈ 0.0068</strong>. Mercury’s proximity to the Sun subjects it to intense gravitational tidal interactions, coupled with secular chaotic resonance perturbations between Jupiter and Mercury over billion-year timescales. In contrast, Venus’s larger mass and orbital spacing dampened its primordial eccentric perturbations.
            </p>
          </div>

          {/* Explanation 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-mono-sci font-bold text-xs text-sky-300">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Kepler’s Third Law: Why Neptune Takes 164.8 Earth Years</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Johannes Kepler’s Third Law establishes that the square of a planet’s orbital period is directly proportional to the cube of its semi-major axis: <code>P² ∝ a³</code>. Because Neptune orbits at <strong>a ≈ 30.07 AU</strong>, its orbital period is <code>P = (30.07)^(1.5) ≈ 164.8 years</code>. Furthermore, solar gravitational acceleration weakens inversely with the square of distance (<code>g = GM/r²</code>), causing Neptune’s orbital speed to drop to only <strong>5.43 km/s</strong> compared to Mercury’s <strong>47.36 km/s</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
