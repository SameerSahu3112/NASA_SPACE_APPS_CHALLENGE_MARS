import * as Cesium from 'cesium';
import { MarsSurfaceMode, SurfaceCompositingOptions } from '../types';

/**
 * NASA TREK MARS WMTS SCIENTIFIC DATASET CONFIGURATIONS
 * 
 * All three layers share the verified NASA Mars Trek RESTful WMTS specification:
 * - CRS: EPSG:104905 (Mars Geographic, lon -180 to +180, lat -90 to +90)
 * - Tiling Scheme: default028mm (2 columns x 1 row at Level 0, 256x256 px)
 * - Zero full TIFF download: on-demand dynamic 256x256 JPEG tile streaming
 */

export interface WmtsLayerConfig {
  layer: string;
  style: string;
  format: string;
  tileMatrixSetID: string;
  tileMatrixLabels: string[];
  tileWidth: number;
  tileHeight: number;
  minimumLevel: number;
  maximumLevel: number;
  urlTemplateAdvertised: string;
  urlTemplateNormalized: string;
  capabilitiesUrl: string;
  attribution: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

// 1. BASELINE DATASET: MOLA/HRSC Grayscale Shaded Relief (Mode 1)
export const NASA_WMTS_CONFIG: WmtsLayerConfig = {
  layer: 'Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw',
  style: 'default',
  format: 'image/jpeg',
  tileMatrixSetID: 'default028mm',
  tileMatrixLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8'],
  tileWidth: 256,
  tileHeight: 256,
  minimumLevel: 0,
  maximumLevel: 8,
  urlTemplateAdvertised: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  urlTemplateNormalized: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  capabilitiesUrl: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw/1.0.0/WMTSCapabilities.xml',
  attribution: 'Mars surface imagery: NASA MOLA / ESA HRSC shaded relief (200m/pixel), NASA Mars Trek.',
  bounds: {
    west: -180.0,
    south: -90.0,
    east: 180.0,
    north: 90.0,
  },
};

// 2. NASA MARS TREK COLOUR HILLSHADE (Mode 2)
export const NASA_WMTS_COLOR_HILLSHADE_CONFIG: WmtsLayerConfig = {
  layer: 'Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw',
  style: 'default',
  format: 'image/jpeg',
  tileMatrixSetID: 'default028mm',
  tileMatrixLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8'],
  tileWidth: 256,
  tileHeight: 256,
  minimumLevel: 0,
  maximumLevel: 8,
  urlTemplateAdvertised: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  urlTemplateNormalized: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  capabilitiesUrl: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw/1.0.0/WMTSCapabilities.xml',
  attribution: 'NASA Mars Trek: MOLA / HRSC Coloured Topographic Hillshade (200m/pixel).',
  bounds: {
    west: -180.0,
    south: -90.0,
    east: 180.0,
    north: 90.0,
  },
};

// 3. USGS / NASA VIKING ORBITER MDIM 2.1 COLOR MOSAIC (Mode 3 Color Source)
export const NASA_WMTS_VIKING_COLOR_CONFIG: WmtsLayerConfig = {
  layer: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
  style: 'default',
  format: 'image/jpeg',
  tileMatrixSetID: 'default028mm',
  tileMatrixLabels: ['0', '1', '2', '3', '4', '5', '6', '7'],
  tileWidth: 256,
  tileHeight: 256,
  minimumLevel: 0,
  maximumLevel: 7,
  urlTemplateAdvertised: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  urlTemplateNormalized: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
  capabilitiesUrl: 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml',
  attribution: 'USGS Astrogeology / NASA Viking Orbiter MDIM 2.1 Colourized Global Mosaic (~232m/pixel), NASA Mars Trek.',
  bounds: {
    west: -180.0,
    south: -90.0,
    east: 180.0,
    north: 90.0,
  },
};

// Recommended default parameters for Mode 3 compositing
export const DEFAULT_COMPOSITING_OPTIONS: SurfaceCompositingOptions = {
  vikingAlpha: 0.70,        // 70% Viking color blending gives authentic rust/ochre Martian hue without fading topography
  terrainContrast: 1.20,    // +20% terrain contrast sharpens crater rims, ridges, and Valles Marineris canyon walls
  vikingSaturation: 1.25,   // +25% saturation enhances natural iron oxide variations
  vikingBrightness: 1.05,   // +5% brightness balances shadow depth
};

// Mode metadata for UI, HUD, and scientific dataset documentation
export const SURFACE_MODES_METADATA: Record<
  MarsSurfaceMode,
  {
    id: MarsSurfaceMode;
    modeNumber: number;
    name: string;
    shortName: string;
    subtitle: string;
    badge: string;
    layer: string;
    resolution: string;
    source: string;
    description: string;
    attribution: string;
  }
> = {
  original: {
    id: 'original',
    modeNumber: 1,
    name: 'MOLA/HRSC Grayscale Relief',
    shortName: 'Grayscale Relief',
    subtitle: 'Mode 1: Base Shaded Relief (Original Baseline)',
    badge: 'MODE 1: BASELINE RELIEF',
    layer: NASA_WMTS_CONFIG.layer,
    resolution: '200 m/pixel nominal',
    source: 'NASA GSFC MOLA + DLR/ESA Mars Express HRSC',
    description: 'High-contrast monochrome shaded relief combining MOLA laser altimeter topography with HRSC camera shaded relief.',
    attribution: NASA_WMTS_CONFIG.attribution,
  },
  color_hillshade: {
    id: 'color_hillshade',
    modeNumber: 2,
    name: 'NASA Color Hillshade',
    shortName: 'NASA Color Shade',
    subtitle: 'Mode 2: Topographic Hypsometric Tinting',
    badge: 'MODE 2: TOPOGRAPHIC COLOR',
    layer: NASA_WMTS_COLOR_HILLSHADE_CONFIG.layer,
    resolution: '200 m/pixel nominal',
    source: 'NASA Mars Trek / MOLA + HRSC',
    description: 'Official NASA Mars Trek coloured topographic hillshade, mapping elevations into hypsometric tints combined with shaded relief.',
    attribution: NASA_WMTS_COLOR_HILLSHADE_CONFIG.attribution,
  },
  composite: {
    id: 'composite',
    modeNumber: 3,
    name: 'Viking Color + Terrain Composite',
    shortName: 'Viking Composite',
    subtitle: 'Mode 3: Spacecraft Regolith Color & Relief Fusion',
    badge: 'MODE 3: SCIENTIFIC COMPOSITE',
    layer: `${NASA_WMTS_VIKING_COLOR_CONFIG.layer} + ${NASA_WMTS_CONFIG.layer}`,
    resolution: '232 m/pixel (Viking) + 200 m/pixel (HRSC)',
    source: 'USGS Astrogeology Viking MDIM 2.1 + NASA/ESA MOLA/HRSC',
    description: 'Authentic Viking Orbiter spacecraft red/ochre regolith photographic color dynamically composited over high-contrast MOLA/HRSC relief shading.',
    attribution: `${NASA_WMTS_VIKING_COLOR_CONFIG.attribution} / ${NASA_WMTS_CONFIG.attribution}`,
  },
};

/**
 * Creates a Cesium WebMapTileServiceImageryProvider for a specific layer configuration.
 */
export function createLayerImageryProvider(
  config: WmtsLayerConfig,
  marsEllipsoid: Cesium.Ellipsoid,
  options: {
    useNormalizedUrl?: boolean;
    onError?: (error: Error) => void;
  } = {}
): Cesium.WebMapTileServiceImageryProvider {
  const tilingScheme = new Cesium.GeographicTilingScheme({
    ellipsoid: marsEllipsoid,
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1,
    rectangle: Cesium.Rectangle.fromDegrees(
      config.bounds.west,
      config.bounds.south,
      config.bounds.east,
      config.bounds.north
    ),
  });

  const url = options.useNormalizedUrl
    ? config.urlTemplateNormalized
    : config.urlTemplateAdvertised;

  const provider = new Cesium.WebMapTileServiceImageryProvider({
    url: url,
    layer: config.layer,
    style: config.style,
    format: config.format,
    tileMatrixSetID: config.tileMatrixSetID,
    tileMatrixLabels: config.tileMatrixLabels,
    tilingScheme: tilingScheme,
    ellipsoid: marsEllipsoid,
    minimumLevel: config.minimumLevel,
    maximumLevel: config.maximumLevel,
    tileWidth: config.tileWidth,
    tileHeight: config.tileHeight,
    credit: new Cesium.Credit(config.attribution),
  });

  if (options.onError) {
    provider.errorEvent.addEventListener((tileProviderError) => {
      // In Cesium, transient camera zoom/pan tile aborts are normal.
      // Automatically retry transient errors up to 3 times:
      if (tileProviderError.timesRetried < 3) {
        tileProviderError.retry = true;
      } else {
        console.warn(`[NASA WMTS] Tile load persistent error on layer ${config.layer}:`, tileProviderError);
        options.onError?.(new Error(tileProviderError.message || `NASA WMTS tile request failed for ${config.layer}.`));
      }
    });
  }

  return provider;
}

/**
 * Backwards-compatible factory for the original layer
 */
export function createNasaMarsImageryProvider(
  marsEllipsoid: Cesium.Ellipsoid,
  options: {
    useNormalizedUrl?: boolean;
    onError?: (error: Error) => void;
  } = {}
): Cesium.WebMapTileServiceImageryProvider {
  return createLayerImageryProvider(NASA_WMTS_CONFIG, marsEllipsoid, options);
}

/**
 * Test connectivity directly to a NASA tile for a given layer.
 */
export async function testTileConnectivityForLayer(
  config: WmtsLayerConfig,
  useNormalized = false
): Promise<{ success: boolean; status?: number; error?: string }> {
  const template = useNormalized ? config.urlTemplateNormalized : config.urlTemplateAdvertised;
  const testUrl = template
    .replace('{Style}', config.style)
    .replace('{TileMatrixSet}', config.tileMatrixSetID)
    .replace('{TileMatrix}', '0')
    .replace('{TileRow}', '0')
    .replace('{TileCol}', '0');

  try {
    const res = await fetch(testUrl, { method: 'HEAD', mode: 'cors' });
    if (res.ok) {
      return { success: true, status: res.status };
    }
    return { success: false, status: res.status, error: `NASA server returned HTTP ${res.status}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Legacy test connectivity wrapper for default layer
 */
export async function testNasaTileConnectivity(
  useNormalized = false
): Promise<{ success: boolean; status?: number; error?: string }> {
  return testTileConnectivityForLayer(NASA_WMTS_CONFIG, useNormalized);
}

export interface ApplyMarsSurfaceLayersOptions {
  useNormalizedUrl?: boolean;
  onError?: (error: Error) => void;
  onFallbackToOriginal?: () => void;
}

/**
 * Single source of truth for applying Mars surface layers across all viewports (MarsGlobe and TerrainExplorer).
 * Applies exact identical layer configurations, materials, and compositing parameters.
 */
export function applyMarsSurfaceLayers(
  viewer: Cesium.Viewer,
  marsEllipsoid: Cesium.Ellipsoid,
  mode: MarsSurfaceMode,
  compositingOptions: SurfaceCompositingOptions = DEFAULT_COMPOSITING_OPTIONS,
  options: ApplyMarsSurfaceLayersOptions = {}
): Cesium.ImageryLayer[] {
  // Remove existing imagery layers safely
  try {
    viewer.imageryLayers.removeAll();
  } catch (e) {
    console.warn('Error clearing imagery layers:', e);
  }

  if (mode === 'original') {
    // MODE 1: BASELINE GRAYSCALE MOLA/HRSC SHADED RELIEF
    const provider = createLayerImageryProvider(NASA_WMTS_CONFIG, marsEllipsoid, {
      useNormalizedUrl: options.useNormalizedUrl,
      onError: options.onError,
    });
    const layer = viewer.imageryLayers.addImageryProvider(provider);
    layer.alpha = 1.0;
    layer.brightness = 1.0;
    layer.contrast = 1.0;
    return [layer];
  }

  if (mode === 'color_hillshade') {
    // MODE 2: NASA MARS TREK TOPOGRAPHIC COLOUR HILLSHADE
    const provider = createLayerImageryProvider(NASA_WMTS_COLOR_HILLSHADE_CONFIG, marsEllipsoid, {
      useNormalizedUrl: options.useNormalizedUrl,
      onError: (err) => {
        options.onError?.(err);
        options.onFallbackToOriginal?.();
      },
    });
    const layer = viewer.imageryLayers.addImageryProvider(provider);
    layer.alpha = 1.0;
    layer.brightness = 1.0;
    layer.contrast = 1.0;
    return [layer];
  }

  // MODE 3: AUTHENTIC VIKING COLOR + MOLA/HRSC TERRAIN RELIEF FUSION
  const baseProvider = createLayerImageryProvider(NASA_WMTS_CONFIG, marsEllipsoid, {
    useNormalizedUrl: options.useNormalizedUrl,
    onError: (err) => {
      console.warn('[Mode 3 Base Layer Error]:', err);
    },
  });
  const baseLayer = viewer.imageryLayers.addImageryProvider(baseProvider);
  baseLayer.contrast = compositingOptions.terrainContrast;
  baseLayer.brightness = 1.02;

  const topProvider = createLayerImageryProvider(NASA_WMTS_VIKING_COLOR_CONFIG, marsEllipsoid, {
    useNormalizedUrl: options.useNormalizedUrl,
    onError: (err) => {
      console.warn('[Mode 3 Viking Color Error]:', err);
      options.onError?.(err);
      options.onFallbackToOriginal?.();
    },
  });
  const topLayer = viewer.imageryLayers.addImageryProvider(topProvider);
  topLayer.alpha = compositingOptions.vikingAlpha;
  topLayer.contrast = 1.15;
  topLayer.brightness = compositingOptions.vikingBrightness;
  topLayer.saturation = compositingOptions.vikingSaturation;

  return [baseLayer, topLayer];
}

/**
 * Synchronizes real-time layer compositing parameters directly on the GPU without reloading network tiles.
 */
export function updateMarsSurfaceCompositing(
  layers: Cesium.ImageryLayer[],
  mode: MarsSurfaceMode,
  options: SurfaceCompositingOptions = DEFAULT_COMPOSITING_OPTIONS
): void {
  if (mode === 'composite' && layers && layers.length >= 2) {
    const [baseLayer, topLayer] = layers;
    if (baseLayer) {
      baseLayer.contrast = options.terrainContrast;
    }
    if (topLayer) {
      topLayer.alpha = options.vikingAlpha;
      topLayer.brightness = options.vikingBrightness;
      topLayer.saturation = options.vikingSaturation;
    }
  }
}
