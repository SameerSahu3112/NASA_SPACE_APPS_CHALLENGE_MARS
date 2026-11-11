import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileSpreadsheet, 
  FileCode,
  Check
} from 'lucide-react';
import { CalculatedOrbitalParameters } from '../../services/keplerSolver';
import { ORDERED_PLANET_KEYS, PLANETS_SCIENTIFIC_REGISTRY } from '../../services/planetaryData';

interface PlanetaryDatabaseProps {
  planetsData: Record<string, CalculatedOrbitalParameters>;
  selectedPlanetId: string | null;
  onSelectPlanet: (id: string) => void;
  currentDate: Date;
}

type SortField = 
  | 'name' 
  | 'semiMajorAxisAU' 
  | 'eccentricity' 
  | 'inclinationDeg' 
  | 'orbitalPeriodDays' 
  | 'perihelionDistanceAU' 
  | 'aphelionDistanceAU' 
  | 'currentDistanceAU' 
  | 'totalSpeedKmPerSec';

export const PlanetaryDatabase: React.FC<PlanetaryDatabaseProps> = ({
  planetsData,
  selectedPlanetId,
  onSelectPlanet,
  currentDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('semiMajorAxisAU');
  const [sortAsc, setSortAsc] = useState(true);
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedPlanets = useMemo(() => {
    const list = ORDERED_PLANET_KEYS.map((k) => planetsData[k]).filter(Boolean);

    const filtered = list.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [planetsData, searchTerm, sortField, sortAsc]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Planet',
      'SemiMajorAxis_AU',
      'Eccentricity',
      'Inclination_deg',
      'Period_days',
      'Period_years',
      'Perihelion_AU',
      'Aphelion_AU',
      'CurrentDistance_AU',
      'CurrentVelocity_kms',
      'Position_X_AU',
      'Position_Y_AU',
      'Position_Z_AU',
      'Epoch_JD',
    ];

    const rows = ORDERED_PLANET_KEYS.map((key) => {
      const p = planetsData[key];
      if (!p) return '';
      return [
        p.name,
        p.semiMajorAxisAU.toFixed(6),
        p.eccentricity.toFixed(6),
        p.inclinationDeg.toFixed(4),
        p.orbitalPeriodDays.toFixed(2),
        p.orbitalPeriodYears.toFixed(4),
        p.perihelionDistanceAU.toFixed(6),
        p.aphelionDistanceAU.toFixed(6),
        p.currentDistanceAU.toFixed(6),
        p.totalSpeedKmPerSec.toFixed(3),
        p.positionAU.x.toFixed(6),
        p.positionAU.y.toFixed(6),
        p.positionAU.z.toFixed(6),
        p.epochJd.toFixed(4),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NASA_JPL_SolarSystem_Ephemeris_${currentDate.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedStatus('CSV Exported');
    setTimeout(() => setExportedStatus(null), 3000);
  };

  // Export selected planet as JSON
  const handleExportJson = () => {
    const target = selectedPlanetId ? planetsData[selectedPlanetId] : planetsData['mars'];
    if (!target) return;

    const exportData = {
      agency: 'NASA / JPL Solar System Dynamics Group',
      dataset: 'JPL Planetary Orbital Ephemerides',
      exportDateUtc: new Date().toISOString(),
      epochUtc: currentDate.toISOString(),
      epochJd: target.epochJd,
      referenceFrame: 'Heliocentric J2000 Mean Ecliptic and Equinox',
      units: {
        distance: 'Astronomical Units (AU)',
        velocity: 'km/s',
        angles: 'degrees',
        period: 'Earth days and years',
      },
      planet: {
        id: target.planetId,
        name: target.name,
        keplerianElements: {
          semiMajorAxisAU: target.semiMajorAxisAU,
          semiMinorAxisAU: target.semiMinorAxisAU,
          eccentricity: target.eccentricity,
          inclinationDeg: target.inclinationDeg,
          longitudeOfAscendingNodeDeg: target.longitudeOfAscendingNodeDeg,
          argumentOfPerihelionDeg: target.argumentOfPerihelionDeg,
          longitudeOfPerihelionDeg: target.longitudeOfPerihelionDeg,
          meanLongitudeDeg: target.meanLongitudeDeg,
          meanAnomalyDeg: target.meanAnomalyDeg,
          eccentricAnomalyDeg: target.eccentricAnomalyDeg,
          trueAnomalyDeg: target.trueAnomalyDeg,
        },
        dynamics: {
          orbitalPeriodDays: target.orbitalPeriodDays,
          orbitalPeriodYears: target.orbitalPeriodYears,
          meanMotionDegPerDay: target.meanMotionDegPerDay,
          perihelionDistanceAU: target.perihelionDistanceAU,
          aphelionDistanceAU: target.aphelionDistanceAU,
          currentDistanceAU: target.currentDistanceAU,
          currentDistanceKm: target.currentDistanceKm,
          currentVelocityKmSec: target.velocityKmPerSec,
          totalSpeedKmSec: target.totalSpeedKmPerSec,
        },
        stateVectorsJ2000: {
          positionAU: target.positionAU,
          positionKm: target.positionKm,
        },
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${target.name.toLowerCase()}_jpl_ephemeris_${currentDate.toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedStatus(`JSON Exported (${target.name})`);
    setTimeout(() => setExportedStatus(null), 3000);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search planets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono-sci focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCsv}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono-sci text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download full 8-planet database as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono-sci text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download selected planet state vectors as JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON</span>
          </button>

          {exportedStatus && (
            <span className="text-[10px] font-mono-sci text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-500/30">
              <Check className="w-3 h-3" />
              <span>{exportedStatus}</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Sortable Data Table */}
      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-2xl">
        <table className="w-full text-left border-collapse font-mono-sci text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[9px] tracking-wider">
              <th onClick={() => handleSort('name')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Planet</span>
                  {sortField === 'name' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('semiMajorAxisAU')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Axis (a, AU)</span>
                  {sortField === 'semiMajorAxisAU' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('eccentricity')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Ecc. (e)</span>
                  {sortField === 'eccentricity' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('inclinationDeg')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Inc. (I, °)</span>
                  {sortField === 'inclinationDeg' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('orbitalPeriodDays')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Period (P)</span>
                  {sortField === 'orbitalPeriodDays' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('perihelionDistanceAU')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Peri. (q, AU)</span>
                  {sortField === 'perihelionDistanceAU' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('aphelionDistanceAU')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Aph. (Q, AU)</span>
                  {sortField === 'aphelionDistanceAU' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('currentDistanceAU')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Dist. (r, AU)</span>
                  {sortField === 'currentDistanceAU' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
              <th onClick={() => handleSort('totalSpeedKmPerSec')} className="p-2.5 cursor-pointer hover:text-slate-200">
                <div className="flex items-center gap-1">
                  <span>Speed (|V|, km/s)</span>
                  {sortField === 'totalSpeedKmPerSec' ? (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedPlanets.map((p) => {
              const isSelected = selectedPlanetId === p.planetId;
              const def = PLANETS_SCIENTIFIC_REGISTRY[p.planetId];
              const chars = def?.characteristics;

              return (
                <tr
                  key={p.planetId}
                  onClick={() => onSelectPlanet(p.planetId)}
                  className={`cursor-pointer transition-colors ${
                    chars?.isMars
                      ? 'bg-red-950/20 hover:bg-red-950/40'
                      : isSelected
                      ? 'bg-sky-950/30 hover:bg-sky-950/50'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <td className="p-2.5 flex items-center gap-2 font-semibold">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: chars?.colorHex || '#fff' }}
                    />
                    <span className={chars?.isMars ? 'text-red-400 font-bold' : isSelected ? 'text-sky-300 font-bold' : 'text-slate-200'}>
                      {p.name}
                    </span>
                    {chars?.isMars && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-red-600 text-white font-bold">
                        MIRA
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-300">{p.semiMajorAxisAU.toFixed(4)}</td>
                  <td className="p-2.5 text-slate-300">{p.eccentricity.toFixed(4)}</td>
                  <td className="p-2.5 text-slate-300">{p.inclinationDeg.toFixed(3)}°</td>
                  <td className="p-2.5 text-slate-300">{p.orbitalPeriodDays.toFixed(1)}d</td>
                  <td className="p-2.5 text-emerald-400">{p.perihelionDistanceAU.toFixed(4)}</td>
                  <td className="p-2.5 text-cyan-400">{p.aphelionDistanceAU.toFixed(4)}</td>
                  <td className="p-2.5 font-bold text-sky-300">{p.currentDistanceAU.toFixed(4)}</td>
                  <td className="p-2.5 font-bold text-emerald-300">{p.totalSpeedKmPerSec.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] font-mono-sci text-slate-500 flex items-center justify-between px-1">
        <span>Source: NASA JPL Planetary Positions & Secular Rates • Coordinate Origin: Sun Center (@10)</span>
        <span>All 8 major planets populated dynamically</span>
      </div>
    </div>
  );
};
