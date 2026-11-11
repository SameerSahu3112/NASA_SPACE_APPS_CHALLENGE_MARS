/**
 * PROJECT MIRA — MARS PLANETARY COORDINATE & DATUM TRANSFORMS
 * 
 * Mathematically rigorous coordinate and vertical datum conversions for Mars.
 * Respects IAU 2015 Planetocentric coordinates and Folkner/MOLA Triaxial solutions.
 * 
 * Reference Standards:
 * 1. IAU/IAG Working Group on Cartographic Coordinates (Archinal et al., 2018)
 * 2. Folkner et al. (1997, Science 278) / Smith et al. (2001, JGR 106)
 * 3. NASA GSFC Mars Gravity Model GMM-2B/3 Areoid Solutions
 */

import { MARS_ELLIPSOID_MODELS } from '../../config/marsEllipsoid';

export class CoordinateTransforms {
  /**
   * Normalizes any longitude in degrees into the standard [-180, +180] range.
   */
  public static normalizeLon180(lonDeg: number): number {
    return ((lonDeg + 180) % 360 + 360) % 360 - 180;
  }

  /**
   * Normalizes any longitude in degrees into the positive-east [0, 360] range.
   */
  public static normalizeLon360(lonDeg: number): number {
    return ((lonDeg % 360) + 360) % 360;
  }

  /**
   * Clamps latitude to valid planetary bounds [-90, +90].
   */
  public static clampLat(latDeg: number): number {
    return Math.max(-90, Math.min(90, latDeg));
  }

  /**
   * Computes the geometric reference radius of the IAU 2015 oblate spheroid
   * at planetocentric latitude phi (radians).
   */
  public static getSpheroidRadiusAtLatitude(latRad: number): number {
    const a = MARS_ELLIPSOID_MODELS.IAU_2015.xRadius; // 3,396,190.0 m
    const c = MARS_ELLIPSOID_MODELS.IAU_2015.zRadius; // 3,376,200.0 m

    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    const a2 = a * a;
    const c2 = c * c;
    const a4 = a2 * a2;
    const c4 = c2 * c2;

    const num = a4 * cosLat * cosLat + c4 * sinLat * sinLat;
    const den = a2 * cosLat * cosLat + c2 * sinLat * sinLat;

    return Math.sqrt(num / den);
  }

  /**
   * Computes the triaxial reference surface radius at (lonRad, latRad)
   * incorporating equatorial ellipticity (Tharsis vs Syrtis major axes).
   */
  public static getTriaxialRadiusAtCoordinates(lonRad: number, latRad: number): number {
    const a = MARS_ELLIPSOID_MODELS.MOLA_TRIAXIAL.xRadius; // 3,398,600.0 m
    const b = MARS_ELLIPSOID_MODELS.MOLA_TRIAXIAL.yRadius; // 3,393,780.0 m
    const c = MARS_ELLIPSOID_MODELS.MOLA_TRIAXIAL.zRadius; // 3,376,200.0 m

    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);
    const cosLon = Math.cos(lonRad);
    const sinLon = Math.sin(lonRad);

    const termX = (cosLat * cosLon) / a;
    const termY = (cosLat * sinLon) / b;
    const termZ = sinLat / c;

    const invR2 = termX * termX + termY * termY + termZ * termZ;
    return 1.0 / Math.sqrt(invR2);
  }

  /**
   * Converts Planetocentric latitude (angle from center to surface point)
   * to Planetographic latitude for a given semi-major (a) and semi-minor (c) axis.
   */
  public static planetocentricToPlanetographic(latCentricRad: number, a = 3396190, c = 3376200): number {
    // tan(phi_graphic) = (a^2 / c^2) * tan(phi_centric)
    const factor = (a * a) / (c * c);
    return Math.atan(factor * Math.tan(latCentricRad));
  }

  /**
   * Converts Planetographic latitude to Planetocentric latitude.
   */
  public static planetographicToPlanetocentric(latGraphicRad: number, a = 3396190, c = 3376200): number {
    // tan(phi_centric) = (c^2 / a^2) * tan(phi_graphic)
    const factor = (c * c) / (a * a);
    return Math.atan(factor * Math.tan(latGraphicRad));
  }
}

