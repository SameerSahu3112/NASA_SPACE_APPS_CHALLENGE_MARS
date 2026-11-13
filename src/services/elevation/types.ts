/**
 * PROJECT MIRA — MARS ELEVATION SUBSYSTEM TYPES
 * 
 * Strict TypeScript definitions for the unified scientific Mars elevation engine.
 * Ensures consistent data types across coordinate queries and 3D terrain geometry.
 */

export type ElevationStatus =
  | 'VALID'
  | 'NODATA'
  | 'OUTSIDE_COVERAGE'
  | 'SOURCE_UNAVAILABLE'
  | 'TRANSFORMATION_FAILED'
  | 'INVALID_COORDINATE';

export type VerticalDatum = 'MOLA_AREOID' | 'IAU_2015_SPHEROID' | 'MOLA_TRIAXIAL_ELLIPSOID';

export type InterpolationMethod = 'nearest' | 'bilinear';

export interface ElevationSourceMetadata {
  id: string;
  name: string;
  publisher: string;
  instrument: string;
  version: string;
  officialUrl: string;
  license: string;
  attribution: string;
  nativeResolution: string;
  outputGridSpacing: string;
  coverage: string;
  dataType: string;
  units: string;
  verticalDatum: VerticalDatum;
  nodataValue: number;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

export interface ElevationQueryOptions {
  sourcePriority?: 'auto' | 'usgs_200m_first' | 'mola_megdr_first' | 'local_only';
  interpolation?: InterpolationMethod;
  ellipsoidKey?: 'IAU_2015' | 'MOLA_TRIAXIAL';
  signal?: AbortSignal;
}

export interface MarsElevationResult {
  latitude: number;
  longitude: number;
  normalizedLongitude: number;   // -180° .. +180°
  positiveEastLongitude: number; // 0° .. 360°
  elevationMeters: number | null;
  elevationKm: number | null;
  units: 'meters';
  verticalDatum: VerticalDatum;
  sourceId: string;
  sourceName: string;
  sourceResolution: string;
  status: ElevationStatus;
  samplingMethod: InterpolationMethod;
  ellipsoidalHeightMeters?: number | null;
  uncertaintyMeters?: number;
}

export interface TileElevationRequest {
  x: number;
  y: number;
  level: number;
  westDeg: number;
  southDeg: number;
  eastDeg: number;
  northDeg: number;
  gridWidth: number;
  gridHeight: number;
}

