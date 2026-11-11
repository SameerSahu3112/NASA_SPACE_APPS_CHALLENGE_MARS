/**
 * ASTRONOMICAL TIME SERVICE
 * 
 * Accurately converts between standard Gregorian UTC calendar dates,
 * Julian Dates (JD), and Julian centuries from epoch J2000.0 (T),
 * with support for Barycentric Dynamical Time (TDB).
 * 
 * Reference: US Naval Observatory / Astronomical Almanac
 */

// Standard J2000.0 epoch: 2000 January 1, 12:00:00 TT (JD 2451545.0)
export const J2000_EPOCH_JD = 2451545.0;

// Days per Julian Century
export const DAYS_PER_JULIAN_CENTURY = 36525.0;

// Seconds between TAI and UTC (at modern epoch, including 37 leap seconds) + 32.184s offset for TT/TDB
// TT - UTC = 37s + 32.184s = 69.184s
export const TT_MINUS_UTC_SECONDS = 69.184;

/**
 * Calculates the astronomical Julian Date (JD) from a standard JavaScript Date (UTC).
 * Uses the rigorous Fliegel & Van Flandern / Astronomical Almanac algorithm.
 */
export function dateToJulianDate(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1; // 1-12
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  const jd = Math.floor(365.25 * (year + 4716)) +
             Math.floor(30.6001 * (month + 1)) +
             day + dayFraction + B - 1524.5;

  return jd;
}

/**
 * Converts Julian Date (JD) back to UTC Date.
 */
export function julianDateToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;

  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const dayWithFrac = b - d - Math.floor(30.6001 * e) + f;
  const day = Math.floor(dayWithFrac);
  const dayFraction = dayWithFrac - day;

  let month = e < 14 ? e - 1 : e - 13;
  let year = month > 2 ? c - 4716 : c - 4715;

  const totalSeconds = Math.round(dayFraction * 86400 * 1000) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds));
  return date;
}

/**
 * Calculates Julian Centuries from J2000.0 (T) for use in JPL polynomial orbital rates.
 * T = (JD - 2451545.0) / 36525
 */
export function julianDateToCenturies(jd: number): number {
  return (jd - J2000_EPOCH_JD) / DAYS_PER_JULIAN_CENTURY;
}

/**
 * Formats a Date object to ISO-like UTC representation: YYYY-MM-DD HH:mm:ss UTC
 */
export function formatUtcDateTime(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s} UTC`;
}

/**
 * Formats an epoch date string for NASA JPL Horizons API query: YYYY-MM-DD
 */
export function formatHorizonsDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

