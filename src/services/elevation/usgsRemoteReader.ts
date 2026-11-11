/**
 * PROJECT MIRA — USGS HRSC/MOLA BLENDED 200M REMOTE BIGTIFF READER
 * 
 * Performs high-precision, sparse HTTP Range reads directly against the official
 * USGS / NASA / ESA authoritative global 200m DEM raster:
 * `Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif` hosted on AWS S3.
 * 
 * Architectural Characteristics:
 * - Direct S3 byte-range access: HTTP 206 Partial Content
 * - Zero full-file download: requests only exact 2-byte or patch windows
 * - Mathematical offset indexing: O(1) row-strip calculation without parsing directory tags repeatedly
 * - Built-in LRU block cache: retains frequently queried regions in memory
 */

export interface RemoteReadOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class UsgsRemoteReader {
  private static instance: UsgsRemoteReader | null = null;

  public static readonly S3_URL = 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif';
  public static readonly IMAGE_WIDTH = 106694;
  public static readonly IMAGE_HEIGHT = 53347;
  public static readonly PIXEL_SCALE_DEG = 0.003374120830641;
  public static readonly ORIGIN_X = -180.0;
  public static readonly ORIGIN_Y = 90.0;
  public static readonly FIRST_ROW_OFFSET = 854272;
  public static readonly BYTES_PER_ROW = 213388;
  public static readonly NODATA_VALUE = -32768;

  // LRU cache for 1KB pixel chunks
  private cache = new Map<number, { data: Int16Array; timestamp: number }>();
  private readonly MAX_CACHE_ENTRIES = 512; // ~512 KB memory footprint

  private constructor() {}

  public static getInstance(): UsgsRemoteReader {
    if (!UsgsRemoteReader.instance) {
      UsgsRemoteReader.instance = new UsgsRemoteReader();
    }
    return UsgsRemoteReader.instance;
  }

  /**
   * Converts longitude and latitude to raster column and row coordinates.
   */
  public coordinatesToPixel(lonDeg: number, latDeg: number): { col: number; row: number } {
    const normLon = ((lonDeg + 180) % 360 + 360) % 360 - 180;
    const clampedLat = Math.max(-90, Math.min(90, latDeg));

    const col = Math.max(0, Math.min(UsgsRemoteReader.IMAGE_WIDTH - 1, Math.floor((normLon - UsgsRemoteReader.ORIGIN_X) / UsgsRemoteReader.PIXEL_SCALE_DEG)));
    const row = Math.max(0, Math.min(UsgsRemoteReader.IMAGE_HEIGHT - 1, Math.floor((UsgsRemoteReader.ORIGIN_Y - clampedLat) / UsgsRemoteReader.PIXEL_SCALE_DEG)));

    return { col, row };
  }

  /**
   * Computes the absolute byte offset within the BigTIFF file for a given (col, row).
   */
  public computeByteOffset(col: number, row: number): number {
    return UsgsRemoteReader.FIRST_ROW_OFFSET + row * UsgsRemoteReader.BYTES_PER_ROW + col * 2;
  }

  /**
   * Fetches a raw byte range via HTTP 206 Partial Content.
   */
  public async fetchByteRange(start: number, end: number, opts: RemoteReadOptions = {}): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);

    try {
      const headers: Record<string, string> = {
        'Range': `bytes=${start}-${end}`,
      };

      const res = await fetch(UsgsRemoteReader.S3_URL, {
        method: 'GET',
        headers,
        signal: opts.signal || controller.signal,
      });

      if (!res.ok && res.status !== 206) {
        throw new Error(`S3 returned HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.arrayBuffer();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Queries exact elevation at (lonDeg, latDeg) in meters above MOLA areoid.
   */
  public async getElevation(lonDeg: number, latDeg: number, opts: RemoteReadOptions = {}): Promise<number | null> {
    const { col, row } = this.coordinatesToPixel(lonDeg, latDeg);
    const byteOffset = this.computeByteOffset(col, row);

    // Check block cache (blocks of 64 pixels = 128 bytes)
    const blockIndex = Math.floor(byteOffset / 128);
    const cached = this.cache.get(blockIndex);
    if (cached) {
      cached.timestamp = Date.now();
      const inBlockPixel = Math.floor((byteOffset % 128) / 2);
      const val = cached.data[inBlockPixel];
      return val === UsgsRemoteReader.NODATA_VALUE ? null : val;
    }

    try {
      // Fetch 64-pixel window to populate block cache
      const blockStart = blockIndex * 128;
      const blockEnd = blockStart + 127;
      const buf = await this.fetchByteRange(blockStart, blockEnd, opts);

      const i16 = new Int16Array(buf);
      this.cache.set(blockIndex, { data: i16, timestamp: Date.now() });

      // Prune LRU if needed
      if (this.cache.size > this.MAX_CACHE_ENTRIES) {
        let oldestKey = -1;
        let oldestTime = Infinity;
        for (const [k, v] of this.cache.entries()) {
          if (v.timestamp < oldestTime) {
            oldestTime = v.timestamp;
            oldestKey = k;
          }
        }
        if (oldestKey !== -1) this.cache.delete(oldestKey);
      }

      const inBlockPixel = Math.floor((byteOffset % 128) / 2);
      const val = i16[inBlockPixel];
      return val === UsgsRemoteReader.NODATA_VALUE ? null : val;
    } catch (err) {
      console.warn('[USGS Reader] Remote fetch error:', err);
      return null;
    }
  }

  /**
   * Clears in-memory block cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

