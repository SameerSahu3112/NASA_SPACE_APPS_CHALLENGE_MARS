export interface MarsCoordinates {
  longitude: number; // Decimal degrees (-180 to +180)
  latitude: number;  // Decimal degrees (-90 to +90)
  positiveEastLon?: number; // 0 to 360 degrees East
  formatted: string; // e.g. "18.6500° N, 133.8000° W"
  eastWestFormatted: string;
  elevationMeters?: number | null;
  elevationKm?: number | null;
}

export interface CameraTelemetry {
  altitudeKm: number;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export interface MarsLandmark {
  id: string;
  name: string;
  type: string;
  latitude: number;  // Decimal degrees (-90 to +90)
  longitude: number; // Decimal degrees (-180 to +180)
  positiveEastLongitude: number; // 0 to 360 degrees East convention
  diameterKm?: number;
  elevationKm?: number; // Relative to MOLA datum
  description: string;
  scientificSignificance: string;
  recommendedAltitudeMeters: number;
  recommendedPitchDegrees?: number;
  recommendedHeadingDegrees?: number;
}

export type MarsSurfaceMode = 'original' | 'color_hillshade' | 'composite';

export interface SurfaceCompositingOptions {
  vikingAlpha: number;       // 0.0 to 1.0 (recommended default: 0.70)
  terrainContrast: number;   // 0.8 to 1.6 (recommended default: 1.20)
  vikingSaturation: number;  // 0.8 to 1.6 (recommended default: 1.25)
  vikingBrightness: number;  // 0.8 to 1.4 (recommended default: 1.05)
}

export interface EllipsoidModel {
  name: string;
  source: string;
  xRadius: number; // meters
  yRadius: number; // meters
  zRadius: number; // meters
  flattening: number;
  description: string;
  isTriaxial: boolean;
}

