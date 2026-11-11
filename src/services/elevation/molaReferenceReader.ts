/**
 * PROJECT MIRA — NASA MOLA MEGDR GLOBAL TOPOGRAPHY READER
 * 
 * Provides instantaneous, synchronous planetary elevation queries and base
 * terrain grid sampling from the official NASA GSFC MOLA Mission Experiment
 * Gridded Data Record (MEGT90N000CB.IMG).
 * 
 * Grid Characteristics:
 * - Dimensions: 1440 columns x 720 rows
 * - Resolution: 0.25° x 0.25° (~15 km/pixel)
 * - Encoding: MSB (Big-Endian) signed 16-bit integer (Int16BE)
 * - Datum: MOLA Areoid (gravitational equipotential datum GMM-2B/3)
 * - Longitude origin: 0° East to 360° East
 * - Latitude origin: +90° North to -90° South
 */

export class MolaReferenceReader {
  private static instance: MolaReferenceReader | null = null;
  private data: DataView | null = null;
  private isLoaded = false;
  private loadPromise: Promise<boolean> | null = null;

  public static readonly COLS = 1440;
  public static readonly ROWS = 720;
  public static readonly DEG_PER_PIXEL = 0.25;

  private constructor() {}

  public static getInstance(): MolaReferenceReader {
    if (!MolaReferenceReader.instance) {
      MolaReferenceReader.instance = new MolaReferenceReader();
    }
    return MolaReferenceReader.instance;
  }

  /**
   * Initializes the reader with an existing ArrayBuffer or fetches it from public URL.
   */
  public async initialize(bufferOrUrl?: ArrayBuffer | string): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        if (bufferOrUrl instanceof ArrayBuffer) {
          this.data = new DataView(bufferOrUrl);
          this.isLoaded = true;
          return true;
        }

        const url = typeof bufferOrUrl === 'string' ? bufferOrUrl : '/mars_mola_megdr_global_topography.bin';

        // Load binary elevation raster via fetch
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`[MOLA Reader] Failed to load ${url}: HTTP ${res.status}`);
          return false;
        }
        const buf = await res.arrayBuffer();
        this.data = new DataView(buf);
        this.isLoaded = true;
        return true;
      } catch (err) {
        console.warn('[MOLA Reader] Initialization error:', err);
        return false;
      }
    })();

    return this.loadPromise;
  }

  public get isReady(): boolean {
    return this.isLoaded && this.data !== null;
  }

  /**
   * Directly samples raw elevation at (lonDeg, latDeg) in meters above MOLA areoid.
   */
  public getElevationNearest(lonDeg: number, latDeg: number): number | null {
    if (!this.data) return null;

    // Normalize longitude to 0 .. 360 East
    const normLon = ((lonDeg % 360) + 360) % 360;
    const clampedLat = Math.max(-90, Math.min(90, latDeg));

    const col = Math.min(MolaReferenceReader.COLS - 1, Math.floor(normLon * 4));
    const row = Math.min(MolaReferenceReader.ROWS - 1, Math.floor((90 - clampedLat) * 4));

    const byteOffset = (row * MolaReferenceReader.COLS + col) * 2;
    if (byteOffset < 0 || byteOffset + 1 >= this.data.byteLength) return null;

    const val = this.data.getInt16(byteOffset, false); // false = Big-Endian (MSB)
    return val === -32768 ? null : val;
  }

  /**
   * Bilinearly interpolates elevation for smoother sub-grid values.
   */
  public getElevationBilinear(lonDeg: number, latDeg: number): number | null {
    if (!this.data) return null;

    const normLon = ((lonDeg % 360) + 360) % 360;
    const clampedLat = Math.max(-90, Math.min(90, latDeg));

    const colExact = normLon * 4;
    const rowExact = (90 - clampedLat) * 4;

    const c0 = Math.floor(colExact) % MolaReferenceReader.COLS;
    const c1 = (c0 + 1) % MolaReferenceReader.COLS;
    const r0 = Math.min(MolaReferenceReader.ROWS - 1, Math.max(0, Math.floor(rowExact)));
    const r1 = Math.min(MolaReferenceReader.ROWS - 1, Math.max(0, r0 + 1));

    const fx = colExact - Math.floor(colExact);
    const fy = rowExact - Math.floor(rowExact);

    const getVal = (r: number, c: number) => {
      const off = (r * MolaReferenceReader.COLS + c) * 2;
      const v = this.data!.getInt16(off, false);
      return v === -32768 ? null : v;
    };

    const v00 = getVal(r0, c0);
    const v10 = getVal(r0, c1);
    const v01 = getVal(r1, c0);
    const v11 = getVal(r1, c1);

    if (v00 === null || v10 === null || v01 === null || v11 === null) {
      return v00 ?? v10 ?? v01 ?? v11 ?? null;
    }

    const top = v00 * (1 - fx) + v10 * fx;
    const bottom = v01 * (1 - fx) + v11 * fx;
    return Math.round(top * (1 - fy) + bottom * fy);
  }

  /**
   * Samples a complete 2D heightmap grid for a geographic bounding box [west, south, east, north].
   * Suitable for instant Cesium HeightmapTerrainData generation.
   */
  public sampleGrid(
    westDeg: number,
    southDeg: number,
    eastDeg: number,
    northDeg: number,
    gridWidth: number,
    gridHeight: number,
    verticalExaggeration = 2.0
  ): Float32Array {
    const result = new Float32Array(gridWidth * gridHeight);
    if (!this.data) return result;

    for (let j = 0; j < gridHeight; j++) {
      // In Cesium HeightmapTessellator, row 0 is North, row (gridHeight - 1) is South
      const v = j / (gridHeight - 1);
      const lat = northDeg - v * (northDeg - southDeg);

      for (let i = 0; i < gridWidth; i++) {
        // Col 0 is West, col (gridWidth - 1) is East
        const u = i / (gridWidth - 1);
        const lon = westDeg + u * (eastDeg - westDeg);

        const elev = this.getElevationBilinear(lon, lat) ?? 0;
        result[j * gridWidth + i] = elev * verticalExaggeration;
      }
    }

    return result;
  }
}
