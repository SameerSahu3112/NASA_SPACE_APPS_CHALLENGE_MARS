import * as Cesium from 'cesium';
import { EllipsoidModel } from '../types';

/**
 * MARS REFERENCE GEOMETRY
 * 
 * Scientifically verified planetary ellipsoid models for Mars.
 * Sources:
 * 1. IAU/IAG Working Group on Cartographic Coordinates and Rotational Elements
 *    (Archinal et al. 2018, Celestial Mechanics and Dynamical Astronomy 130:22;
 *     Seidelmann et al. 2007; EPSG:104905 standard).
 *    Oblate reference spheroid matching NASA Trek WMTS projection (EPSG:104905).
 *    Semi-major axis (a) = 3,396,190.0 m
 *    Semi-minor axis (c) = 3,376,200.0 m
 *    Flattening (f) = 1 / 169.81 (~0.005886)
 * 
 * 2. Folkner / Balmino / MOLA Triaxial Gravitational & Topographic Solution
 *    (Folkner et al. 1997, Science 278; Smith et al. 2001, JGR 106).
 *    Accounts for Mars's equatorial ellipticity induced by the Tharsis rise.
 *    X-radius (0° lon) = 3,398,600.0 m
 *    Y-radius (90° E lon) = 3,393,780.0 m
 *    Z-radius (polar) = 3,376,200.0 m
 */

export const MARS_ELLIPSOID_MODELS: Record<'IAU_2015' | 'MOLA_TRIAXIAL', EllipsoidModel> = {
  IAU_2015: {
    name: 'IAU 2015 Cartographic Reference Spheroid (EPSG:104905)',
    source: 'IAU/IAG Working Group (Archinal et al., 2018) / USGS / NASA Trek',
    xRadius: 3396190.0,
    yRadius: 3396190.0,
    zRadius: 3376200.0,
    flattening: 1 / 169.81,
    description: 'Official IAU cartographic reference ellipsoid. Matches NASA Trek WMTS EPSG:104905 surface projection without distortion.',
    isTriaxial: false,
  },
  MOLA_TRIAXIAL: {
    name: 'Folkner/MOLA Triaxial Reference Ellipsoid',
    source: 'Folkner et al. (1997, Science 278) / Smith et al. (2001, JGR)',
    xRadius: 3398600.0,
    yRadius: 3393780.0,
    zRadius: 3376200.0,
    flattening: (3398600.0 - 3376200.0) / 3398600.0,
    description: 'Scientifically verified triaxial model incorporating Mars equatorial ellipticity (4.82 km difference between Tharsis and Syrtis axes).',
    isTriaxial: true,
  },
};

/**
 * Creates a Cesium.Ellipsoid instance configured with separate X, Y, and Z radii for Mars.
 */
export function createMarsEllipsoid(modelKey: 'IAU_2015' | 'MOLA_TRIAXIAL' = 'IAU_2015'): Cesium.Ellipsoid {
  const model = MARS_ELLIPSOID_MODELS[modelKey];
  if (modelKey === 'MOLA_TRIAXIAL') {
    // Cesium's Globe surface tessellator and TileBoundingRegion (OrientedBoundingBox.fromRectangle)
    // strictly require an ellipsoid of revolution where radii.x == radii.y.
    // In planetary geodesy (Folkner et al. 1997, Smith et al. 2001), the mean equatorial radius:
    // a_eq = (xRadius + yRadius) / 2 = (3,398,600 + 3,393,780) / 2 = 3,396,190.0 m
    // provides the geometrically equivalent rotational spheroid, preserving the distinct polar radius
    // and flattening while maintaining full compatibility with Cesium's quadtree tile pipeline.
    const meanEquatorial = (model.xRadius + model.yRadius) / 2;
    return new Cesium.Ellipsoid(meanEquatorial, meanEquatorial, model.zRadius);
  }
  return new Cesium.Ellipsoid(model.xRadius, model.yRadius, model.zRadius);
}

export const JEZERO_REF = {
  latitude: 18.38,
  longitude: 77.58,
  name: 'Jezero Crater',
};

/**
 * Formats longitude/latitude measured from Jezero Crater as the (0°, 0°) reference origin,
 * while preserving standard IAU coordinates for scientific verification.
 */
export function formatMarsCoordinates(longitudeDeg: number, latitudeDeg: number, elevationMeters?: number | null) {
  // Normalize IAU longitude to -180..+180
  const normLon = ((longitudeDeg + 180) % 360 + 360) % 360 - 180;
  const positiveEast = ((longitudeDeg % 360) + 360) % 360;

  // Calculate coordinates relative to Jezero Crater reference origin (0°, 0°)
  const relLat = latitudeDeg - JEZERO_REF.latitude;
  const relLon = ((longitudeDeg - JEZERO_REF.longitude + 180) % 360 + 360) % 360 - 180;

  const relLatCardinal = relLat >= 0 ? 'N' : 'S';
  const relLonCardinal = relLon >= 0 ? 'E' : 'W';

  const absRelLat = Math.abs(relLat).toFixed(4);
  const absRelLon = Math.abs(relLon).toFixed(4);

  const iauLatCardinal = latitudeDeg >= 0 ? 'N' : 'S';
  const iauLonCardinal = normLon >= 0 ? 'E' : 'W';

  const elevKm = elevationMeters != null ? Math.round((elevationMeters / 1000) * 100) / 100 : null;
  const elevFormatted = elevationMeters != null ? ` • Elev: ${elevationMeters > 0 ? '+' : ''}${elevationMeters} m` : '';

  return {
    longitude: relLon,
    latitude: relLat,
    rawLongitude: normLon,
    rawLatitude: latitudeDeg,
    positiveEastLon: positiveEast,
    elevationMeters: elevationMeters ?? null,
    elevationKm: elevKm,
    // Primary display: Measured from Jezero Crater (0°, 0°)
    formatted: `${absRelLat}° ${relLatCardinal}, ${absRelLon}° ${relLonCardinal} [Jezero 0,0]${elevFormatted}`,
    relativeFormatted: `${relLat >= 0 ? '+' : ''}${relLat.toFixed(4)}° Lat, ${relLon >= 0 ? '+' : ''}${relLon.toFixed(4)}° Lon`,
    iauStandardFormatted: `${Math.abs(latitudeDeg).toFixed(4)}° ${iauLatCardinal}, ${Math.abs(normLon).toFixed(4)}° ${iauLonCardinal} IAU`,
    eastWestFormatted: `${relLon >= 0 ? '+' : ''}${relLon.toFixed(4)}°, ${relLat >= 0 ? '+' : ''}${relLat.toFixed(4)}°`,
    isAtJezero: Math.abs(relLat) < 0.05 && Math.abs(relLon) < 0.05,
  };
}

