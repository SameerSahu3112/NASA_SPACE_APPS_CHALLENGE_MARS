import React, { useState } from 'react';
import * as Cesium from 'cesium';
import { calculateMarsRoute, MarsRouteResult, RouteObjective } from '../../services/elevation/marsRoutePlanner';

interface Props {
  viewer: Cesium.Viewer | null;
}

const DEFAULTS = {
  startLat: '18.38',
  startLon: '77.58',
  goalLat: '18.63',
  goalLon: '78.25',
};

export const MarsRoutePlanner: React.FC<Props> = ({ viewer }) => {
  const [expanded, setExpanded] = useState(false);
  const [startLat, setStartLat] = useState(DEFAULTS.startLat);
  const [startLon, setStartLon] = useState(DEFAULTS.startLon);
  const [goalLat, setGoalLat] = useState(DEFAULTS.goalLat);
  const [goalLon, setGoalLon] = useState(DEFAULTS.goalLon);
  const [objective, setObjective] = useState<RouteObjective>('balanced');
  const [maxSlope, setMaxSlope] = useState('25');
  const [mass, setMass] = useState('100');
  const [speed, setSpeed] = useState('0.05');
  const [energyBudget, setEnergyBudget] = useState('');
  const [timeBudget, setTimeBudget] = useState('');
  const [result, setResult] = useState<MarsRouteResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearRoute = () => {
    if (viewer && !viewer.isDestroyed()) {
      ['mira-rover-route', 'mira-rover-start', 'mira-rover-goal'].forEach(id => viewer.entities.removeById(id));
    }
    setResult(null);
    setError('');
  };

  const drawRoute = (route: MarsRouteResult) => {
    if (!viewer || viewer.isDestroyed()) throw new Error('Mars globe is not ready.');
    clearRoute();
    const ellipsoid = viewer.scene.globe.ellipsoid;
    // The current Cesium terrain provider applies 2x vertical exaggeration.
    // Keep the line slightly above the displayed terrain to prevent z-fighting.
    const positions = route.points.map(point => {
      const height = point.elevationMeters * 2 + 120;
      return ellipsoid.cartographicToCartesian(
        Cesium.Cartographic.fromDegrees(point.longitude, point.latitude, height)
      );
    });

    viewer.entities.add({
      id: 'mira-rover-route',
      name: 'MIRA Optimized Rover Route',
      polyline: {
        positions,
        width: 5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.18,
          color: Cesium.Color.fromCssColorString('#ff6b35'),
        }),
        clampToGround: false,
      },
    });

    const start = route.points[0];
    const goal = route.points[route.points.length - 1];
    const marker = (id: string, label: string, point: typeof start, color: Cesium.Color) => {
      const pos = ellipsoid.cartographicToCartesian(
        Cesium.Cartographic.fromDegrees(point.longitude, point.latitude, point.elevationMeters * 2 + 180)
      );
      viewer.entities.add({
        id,
        name: label,
        position: pos,
        point: { pixelSize: 12, color, outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: {
          text: label,
          font: 'bold 13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    };
    marker('mira-rover-start', 'ROVER START', start, Cesium.Color.LIME);
    marker('mira-rover-goal', 'MISSION TARGET', goal, Cesium.Color.CYAN);

    viewer.camera.flyTo({
      destination: ellipsoid.cartographicToCartesian(
        Cesium.Cartographic.fromDegrees(
          (start.longitude + goal.longitude) / 2,
          (start.latitude + goal.latitude) / 2,
          Math.max(180_000, route.metrics.distanceKm * 18_000)
        )
      ),
      duration: 1.8,
    });
  };

  const handlePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const number = (value: string, name: string) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) throw new Error(`${name} must be a valid number.`);
        return parsed;
      };
      const route = await calculateMarsRoute(
        {
          latitude: number(startLat, 'Start latitude'),
          longitude: number(startLon, 'Start longitude'),
        },
        {
          latitude: number(goalLat, 'Destination latitude'),
          longitude: number(goalLon, 'Destination longitude'),
        },
        {
          objective,
          massKg: number(mass, 'Rover mass'),
          rollingResistance: 0.05,
          drivetrainEfficiency: 0.70,
          maxSpeedMps: number(speed, 'Maximum speed'),
          maxSlopeDeg: number(maxSlope, 'Maximum slope'),
          energyBudgetWh: energyBudget.trim() ? number(energyBudget, 'Energy budget') : undefined,
          timeBudgetHours: timeBudget.trim() ? number(timeBudget, 'Time budget') : undefined,
        }
      );
      drawRoute(route);
      setResult(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-4 top-1/2 z-[9999] w-[min(390px,calc(100vw-2rem))] -translate-y-1/2 pointer-events-auto">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-auto flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-600 px-5 py-3 text-sm font-extrabold tracking-wider text-white shadow-2xl ring-2 ring-orange-300/50 backdrop-blur-xl hover:bg-orange-500"
        >
          <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_10px_#fb923c]" />
          SHORTEST PATH / ROUTE PLANNER
        </button>
      ) : (
        <section className="max-h-[min(78vh,760px)] overflow-y-auto rounded-2xl border border-orange-400/30 bg-[#080e19]/95 p-4 text-slate-100 shadow-2xl backdrop-blur-xl">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold tracking-[0.25em] text-orange-300">MIRA / NAVIGATION SYSTEM</div>
              <h2 className="mt-1 text-lg font-bold tracking-wide">ROVER ROUTE PLANNER</h2>
              <p className="text-[10px] text-slate-400">Global MOLA terrain · 0.25° planning grid</p>
            </div>
            <button onClick={() => setExpanded(false)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Collapse planner">✕</button>
          </header>

          <form onSubmit={handlePlan} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-300">START LATITUDE
                <input type="number" step="0.01" min="-90" max="90" value={startLat} onChange={e => setStartLat(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-orange-400" />
              </label>
              <label className="text-[11px] text-slate-300">START LONGITUDE
                <input type="number" step="0.01" min="-180" max="180" value={startLon} onChange={e => setStartLon(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-orange-400" />
              </label>
              <label className="text-[11px] text-slate-300">TARGET LATITUDE
                <input type="number" step="0.01" min="-90" max="90" value={goalLat} onChange={e => setGoalLat(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-orange-400" />
              </label>
              <label className="text-[11px] text-slate-300">TARGET LONGITUDE
                <input type="number" step="0.01" min="-180" max="180" value={goalLon} onChange={e => setGoalLon(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-orange-400" />
              </label>
            </div>

            <label className="block text-[11px] text-slate-300">ROUTE OPTIMIZATION
              <select value={objective} onChange={e => setObjective(e.target.value as RouteObjective)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-400">
                <option value="balanced">Balanced: distance + energy + time + terrain</option>
                <option value="shortest">Shortest distance</option>
                <option value="lowest_energy">Lowest estimated energy</option>
                <option value="fastest">Fastest estimated travel time</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-300">ROVER MASS (KG)
                <input type="number" min="1" value={mass} onChange={e => setMass(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white" />
              </label>
              <label className="text-[11px] text-slate-300">MAX SPEED (M/S)
                <input type="number" min="0.001" step="0.001" value={speed} onChange={e => setSpeed(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white" />
              </label>
              <label className="text-[11px] text-slate-300">MAX SLOPE (DEG)
                <input type="number" min="1" max="89" value={maxSlope} onChange={e => setMaxSlope(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white" />
              </label>
              <label className="text-[11px] text-slate-300">ENERGY BUDGET (WH)
                <input type="number" min="0.01" placeholder="No limit" value={energyBudget} onChange={e => setEnergyBudget(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white" />
              </label>
            </div>
            <label className="block text-[11px] text-slate-300">TIME BUDGET (HOURS, OPTIONAL)
              <input type="number" min="0.01" placeholder="No limit" value={timeBudget} onChange={e => setTimeBudget(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" />
            </label>

            <div className="flex gap-2">
              <button type="submit" disabled={loading || !viewer} className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-3 text-xs font-extrabold tracking-widest text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'CALCULATING ROUTE…' : 'CALCULATE OPTIMAL ROUTE'}
              </button>
              <button type="button" onClick={clearRoute} className="rounded-xl border border-white/15 px-3 py-3 text-xs font-bold text-slate-300 hover:bg-white/10">CLEAR</button>
            </div>
            {!viewer && <p className="text-xs text-amber-300">Waiting for Mars globe initialization…</p>}
          </form>

          {error && <div className="mt-3 rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-xs text-red-200">{error}</div>}

          {result && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/25 p-3">
                <div className="text-[10px] font-bold tracking-widest text-emerald-300">ROUTE GENERATED · {result.objective.toUpperCase()}</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Metric label="DISTANCE" value={`${result.metrics.distanceKm.toFixed(1)} km`} />
                  <Metric label="ENERGY (EST.)" value={`${result.metrics.estimatedEnergyWh.toFixed(1)} Wh`} />
                  <Metric label="TIME (EST.)" value={`${result.metrics.estimatedTimeHours.toFixed(1)} h`} />
                  <Metric label="MAX SLOPE" value={`${result.metrics.maximumSlopeDeg.toFixed(1)}°`} />
                  <Metric label="ROUGHNESS" value={`${result.metrics.meanRoughnessMeters.toFixed(1)} m`} />
                  <Metric label="NODES EXPLORED" value={result.metrics.exploredNodes.toLocaleString()} />
                </div>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-950/20 p-3 text-[10px] leading-relaxed text-amber-100">
                <strong>DATA LIMITATION:</strong> {result.source.limitation}
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">{result.warning}</p>
              <p className="text-[10px] text-slate-500">Snapped grid endpoints: {result.snappedStart.latitude.toFixed(2)}°, {result.snappedStart.longitude.toFixed(2)}° → {result.snappedGoal.latitude.toFixed(2)}°, {result.snappedGoal.longitude.toFixed(2)}°.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-[9px] tracking-wider text-slate-400">{label}</div>
    <div className="mt-0.5 text-sm font-bold tabular-nums text-white">{value}</div>
  </div>
);
