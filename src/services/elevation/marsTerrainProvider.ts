/**
 * PROJECT MIRA — MARS 3D TERRAIN PROVIDER
 * 
 * Custom Cesium TerrainProvider integrating the unified MarsElevationEngine
 * directly into Cesium's GlobeSurfaceTile rendering pipeline.
 * 
 * Key Architectural Features:
 * 1. Geometric Ellipsoidal Normal Displacement: Displaces mesh vertices along the
 *    true ellipsoidal normal of the reference ellipsoid (IAU 2015 / MOLA Triaxial).
 * 2. Shared Source of Truth: Uses exact elevation values from `MarsElevationEngine`.
 * 3. Skirt Generation: Automatically constructs heightmap skirts to eliminate cracks
 *    at tile boundaries, polar regions, and the 180° longitude seam.
 * 4. Zero Imagery Distortion: Uses matching GeographicTilingScheme on Mars dimensions.
 */

import * as Cesium from 'cesium';
import { MarsElevationEngine } from './marsElevationEngine';

export interface MarsTerrainProviderOptions {
  gridWidth?: number;  // Default 65 vertices per tile edge (canonical Cesium standard: 2^n + 1)
  gridHeight?: number; // Default 65 vertices per tile edge
  verticalExaggeration?: number; // Default 2.0x for geological relief discernment
}

/**
 * Creates a Cesium CustomHeightmapTerrainProvider bound to the verified Mars elevation engine.
 */
export function createMarsTerrainProvider(
  marsEllipsoid: Cesium.Ellipsoid,
  options: MarsTerrainProviderOptions = {}
): Cesium.CustomHeightmapTerrainProvider {
  const engine = MarsElevationEngine.getInstance();
  const width = options.gridWidth ?? 65;
  const height = options.gridHeight ?? 65;
  const exaggeration = options.verticalExaggeration ?? 2.0;

  const tilingScheme = new Cesium.GeographicTilingScheme({
    ellipsoid: marsEllipsoid,
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1,
    rectangle: Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0),
  });

  const provider = new Cesium.CustomHeightmapTerrainProvider({
    ellipsoid: marsEllipsoid,
    tilingScheme: tilingScheme,
    width: width,
    height: height,
    callback: (x: number, y: number, level: number) => {
      // Calculate tile geographic bounding rectangle
      const rect = tilingScheme.tileXYToRectangle(x, y, level);
      const westDeg = Cesium.Math.toDegrees(rect.west);
      const southDeg = Cesium.Math.toDegrees(rect.south);
      const eastDeg = Cesium.Math.toDegrees(rect.east);
      const northDeg = Cesium.Math.toDegrees(rect.north);

      // Generate 2D heightmap from unified elevation engine
      return engine.getTileHeightmap(westDeg, southDeg, eastDeg, northDeg, width, height, exaggeration);
    },
  });

  return provider;
}

