import { MarsElevationEngine } from './marsElevationEngine';

export type RouteObjective = 'shortest' | 'lowest_energy' | 'fastest' | 'balanced';

export interface RoverRouteOptions {
  objective: RouteObjective;
  massKg: number;
  rollingResistance: number;
  drivetrainEfficiency: number;
  maxSpeedMps: number;
  maxSlopeDeg: number;
  energyBudgetWh?: number;
  timeBudgetHours?: number;
}

export interface MarsRoutePoint {
  latitude: number;
  longitude: number;
  elevationMeters: number;
}

export interface MarsRouteResult {
  points: MarsRoutePoint[];
  metrics: {
    distanceKm: number;
    estimatedEnergyWh: number;
    estimatedTimeHours: number;
    maximumSlopeDeg: number;
    meanRoughnessMeters: number;
    gridSpacingKm: number;
    exploredNodes: number;
  };
  source: {
    name: string;
    resolution: string;
    datum: string;
    limitation: string;
  };
  objective: RouteObjective;
  snappedStart: MarsRoutePoint;
  snappedGoal: MarsRoutePoint;
  warning: string;
}

type Label = {
  id: number;
  row: number;
  col: number;
  cost: number;
  distanceM: number;
  energyWh: number;
  timeHours: number;
  roughnessSum: number;
  steps: number;
  parentId: number | null;
  active: boolean;
};

const DEG = Math.PI / 180;
const MARS_RADIUS_M = 3_389_500;
const MOLA_STEP_DEG = 0.25;
const MOLA_COLS = 1440;
const MOLA_ROWS = 720;

const WEIGHTS: Record<RouteObjective, [number, number, number, number]> = {
  shortest: [1, 0, 0, 0],
  lowest_energy: [0.05, 0.80, 0.05, 0.10],
  fastest: [0.05, 0.05, 0.80, 0.10],
  balanced: [0.30, 0.30, 0.25, 0.15],
};

function normalizeLongitude(lon: number): number {
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

function globalColumn(lon: number): number {
  return Math.round((((lon % 360) + 360) % 360) / MOLA_STEP_DEG) % MOLA_COLS;
}

function globalRow(lat: number): number {
  return Math.max(0, Math.min(MOLA_ROWS - 1, Math.round((90 - lat) / MOLA_STEP_DEG)));
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = lat1 * DEG;
  const p2 = lat2 * DEG;
  const dp = (lat2 - lat1) * DEG;
  const dl = normalizeLongitude(lon2 - lon1) * DEG;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * MARS_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

class MinHeap {
  private items: Array<{ id: number; priority: number }> = [];
  get size(): number { return this.items.length; }
  push(item: { id: number; priority: number }): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p].priority <= item.priority) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = item;
  }
  pop(): { id: number; priority: number } | undefined {
    if (!this.items.length) return undefined;
    const root = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length) {
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= this.items.length) break;
        if (child + 1 < this.items.length && this.items[child + 1].priority < this.items[child].priority) child++;
        if (this.items[child].priority >= last.priority) break;
        this.items[i] = this.items[child];
        i = child;
      }
      this.items[i] = last;
    }
    return root;
  }
}

function key(row: number, col: number): number {
  return row * 100_000 + col;
}

export async function calculateMarsRoute(
  start: { latitude: number; longitude: number },
  goal: { latitude: number; longitude: number },
  options: RoverRouteOptions,
): Promise<MarsRouteResult> {
  if (!Number.isFinite(start.latitude) || !Number.isFinite(start.longitude) ||
      !Number.isFinite(goal.latitude) || !Number.isFinite(goal.longitude) ||
      Math.abs(start.latitude) > 90 || Math.abs(goal.latitude) > 90) {
    throw new Error('Enter valid Mars latitude (-90 to 90) and longitude values.');
  }
  if (options.massKg <= 0 || options.maxSpeedMps <= 0 ||
      options.drivetrainEfficiency <= 0 || options.drivetrainEfficiency > 1 ||
      options.maxSlopeDeg <= 0 || options.maxSlopeDeg >= 90) {
    throw new Error('Rover parameters are outside valid ranges.');
  }

  const engine = MarsElevationEngine.getInstance();
  const ready = await engine.initialize();
  if (!ready) throw new Error('MOLA elevation data could not be loaded. Check that public/mars_mola_megdr_global_topography.bin is available.');

  const startRow = globalRow(start.latitude);
  const goalRow = globalRow(goal.latitude);
  const startCol = globalColumn(start.longitude);
  const goalColRaw = globalColumn(goal.longitude);
  let colDelta = goalColRaw - startCol;
  if (colDelta > MOLA_COLS / 2) colDelta -= MOLA_COLS;
  if (colDelta < -MOLA_COLS / 2) colDelta += MOLA_COLS;
  const goalCol = startCol + colDelta;

  const padding = 10;
  const minRow = Math.max(0, Math.min(startRow, goalRow) - padding);
  const maxRow = Math.min(MOLA_ROWS - 1, Math.max(startRow, goalRow) + padding);
  const minCol = Math.min(startCol, goalCol) - padding;
  const maxCol = Math.max(startCol, goalCol) + padding;
  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  if (rows * cols > 45_000 || rows > 240 || cols > 240) {
    throw new Error('The selected endpoints are too far apart for this regional planner. Choose a smaller mission region (approximately under 45° in either grid direction).');
  }

  const startNode = { row: startRow - minRow, col: startCol - minCol };
  const goalNode = { row: goalRow - minRow, col: goalCol - minCol };
  const elevation = new Float32Array(rows * cols);
  const roughness = new Float32Array(rows * cols);
  const valid = new Uint8Array(rows * cols);
  const latAt = (r: number) => 90 - (minRow + r) * MOLA_STEP_DEG;
  const lonAt = (c: number) => normalizeLongitude(((minCol + c) * MOLA_STEP_DEG));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = engine.sampleMarsElevationSync(latAt(r), lonAt(c));
      const idx = r * cols + c;
      if (value !== null && Number.isFinite(value)) {
        elevation[idx] = value;
        valid[idx] = 1;
      }
    }
  }
  if (!valid[startNode.row * cols + startNode.col] || !valid[goalNode.row * cols + goalNode.col]) {
    throw new Error('Start or destination has no valid MOLA elevation sample.');
  }

  // Local 3x3 elevation standard deviation is a coarse terrain-roughness proxy.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const samples: number[] = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && valid[rr * cols + cc]) {
          samples.push(elevation[rr * cols + cc]);
        }
      }
      const mean = samples.reduce((a, b) => a + b, 0) / Math.max(samples.length, 1);
      roughness[r * cols + c] = Math.sqrt(samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / Math.max(samples.length, 1));
    }
  }

  const weights = WEIGHTS[options.objective];
  const maxSlope = options.maxSlopeDeg * DEG;
  const labels: Label[] = [];
  const labelsAtNode = new Map<number, number[]>();
  const heap = new MinHeap();
  const startLabel: Label = {
    id: 0, row: startNode.row, col: startNode.col, cost: 0,
    distanceM: 0, energyWh: 0, timeHours: 0, roughnessSum: 0,
    steps: 0, parentId: null, active: true,
  };
  labels.push(startLabel);
  labelsAtNode.set(key(startNode.row, startNode.col), [0]);
  heap.push({ id: 0, priority: 0 });

  const directions = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  let explored = 0;
  let finalLabel: Label | null = null;

  while (heap.size) {
    const entry = heap.pop()!;
    const current = labels[entry.id];
    if (!current.active) continue;
    if (current.row === goalNode.row && current.col === goalNode.col) {
      finalLabel = current;
      break;
    }
    explored++;
    if (explored > 1_000_000) throw new Error('Planner expansion limit reached. Use a smaller region or coarser planning window.');

    const lat1 = latAt(current.row);
    const lon1 = lonAt(current.col);
    const z1 = elevation[current.row * cols + current.col];

    for (const [dr, dc] of directions) {
      const rr = current.row + dr, cc = current.col + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      const idx = rr * cols + cc;
      if (!valid[idx]) continue;
      // Do not squeeze diagonally between two no-data cells.
      if (dr !== 0 && dc !== 0 &&
          (!valid[current.row * cols + cc] || !valid[rr * cols + current.col])) continue;
      const lat2 = latAt(rr), lon2 = lonAt(cc);
      const distance = haversineMeters(lat1, lon1, lat2, lon2);
      const dz = elevation[idx] - z1;
      const slope = Math.atan2(Math.abs(dz), distance);
      if (slope > maxSlope) continue;

      const rough = (roughness[current.row * cols + current.col] + roughness[idx]) / 2;
      const rollingJ = options.massKg * 3.71 * options.rollingResistance * Math.cos(slope) * distance;
      const uphillJ = options.massKg * 3.71 * Math.max(dz, 0);
      // Roughness penalty is an explicit proxy, not measured wheel slip.
      const roughnessJ = options.massKg * 3.71 * 0.005 * rough * distance;
      const energyWh = (rollingJ + uphillJ + roughnessJ) /
        options.drivetrainEfficiency / 3600;
      const slopeFraction = Math.min(slope / maxSlope, 1);
      const roughFraction = Math.min(rough / 1000, 1);
      const speed = options.maxSpeedMps * Math.max(0.15, 1 - 0.55 * slopeFraction - 0.20 * roughFraction);
      const timeHours = distance / speed / 3600;
      const roughnessCost = rough * distance;

      const nextDistance = current.distanceM + distance;
      const nextEnergy = current.energyWh + energyWh;
      const nextTime = current.timeHours + timeHours;
      if (options.energyBudgetWh !== undefined && nextEnergy > options.energyBudgetWh) continue;
      if (options.timeBudgetHours !== undefined && nextTime > options.timeBudgetHours) continue;

      const edgeCost =
        weights[0] * (distance / 1000) +
        weights[1] * (energyWh / 100) +
        weights[2] * (timeHours / 10) +
        weights[3] * (roughnessCost / 1_000_000);
      const nextCost = current.cost + edgeCost;
      const nodeKey = key(rr, cc);
      const existing = labelsAtNode.get(nodeKey) ?? [];

      // Multi-label dominance: preserve alternatives that trade cost, energy and time.
      let dominated = false;
      for (const id of existing) {
        const old = labels[id];
        if (old.active && old.cost <= nextCost && old.energyWh <= nextEnergy && old.timeHours <= nextTime) {
          dominated = true;
          break;
        }
      }
      if (dominated) continue;

      for (const id of existing) {
        const old = labels[id];
        if (old.active && nextCost <= old.cost && nextEnergy <= old.energyWh && nextTime <= old.timeHours) {
          old.active = false;
        }
      }

      const next: Label = {
        id: labels.length, row: rr, col: cc, cost: nextCost,
        distanceM: nextDistance, energyWh: nextEnergy, timeHours: nextTime,
        roughnessSum: current.roughnessSum + rough,
        steps: current.steps + 1, parentId: current.id, active: true,
      };
      labels.push(next);
      labelsAtNode.set(nodeKey, [...existing.filter(id => labels[id].active), next.id]);
      heap.push({ id: next.id, priority: nextCost });
    }
  }

  if (!finalLabel) {
    throw new Error('No feasible route found under the selected slope and resource constraints. Try a different destination or relax the rover limits.');
  }

  const routeLabels: Label[] = [];
  let cursor: Label | undefined = finalLabel;
  while (cursor) {
    routeLabels.push(cursor);
    cursor = cursor.parentId === null ? undefined : labels[cursor.parentId];
  }
  routeLabels.reverse();

  const points = routeLabels.map(label => ({
    latitude: latAt(label.row),
    longitude: lonAt(label.col),
    elevationMeters: elevation[label.row * cols + label.col],
  }));
  let maxSlopeDeg = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const d = haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
    maxSlopeDeg = Math.max(maxSlopeDeg, Math.atan2(Math.abs(b.elevationMeters - a.elevationMeters), d) / DEG);
  }
  const end = routeLabels[routeLabels.length - 1];
  const gridSpacingKm = MARS_RADIUS_M * MOLA_STEP_DEG * DEG / 1000;
  return {
    points,
    metrics: {
      distanceKm: end.distanceM / 1000,
      estimatedEnergyWh: end.energyWh,
      estimatedTimeHours: end.timeHours,
      maximumSlopeDeg: maxSlopeDeg,
      meanRoughnessMeters: end.roughnessSum / Math.max(end.steps, 1),
      gridSpacingKm,
      exploredNodes: explored,
    },
    source: {
      name: 'NASA MGS MOLA MEGDR global topography',
      resolution: '0.25° grid (~14.8 km north-south at all latitudes; east-west decreases toward poles)',
      datum: 'MOLA areoid',
      limitation: 'Global planning scale only. This grid cannot resolve rover-scale rocks, dunes, small hazards, or local wheel traction.',
    },
    objective: options.objective,
    snappedStart: points[0],
    snappedGoal: points[points.length - 1],
    warning: 'Prototype estimate only. MOLA global grid is too coarse for operational rover safety. Use regional HiRISE/HRSC DEMs and rover-calibrated mobility/energy models before making fine-scale navigation claims.',
  };
}
