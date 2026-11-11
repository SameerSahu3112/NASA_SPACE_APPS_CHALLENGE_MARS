export interface MoonScientificData {
  id: 'phobos' | 'deimos';
  name: string;
  greekMeaning: string;
  astronomicalDiameterKm: number;
  triaxialDimensionsKm: string;
  massKg: string;
  orbitalRadiusKm: number;
  altitudeAboveMarsKm: number;
  orbitalPeriodHours: number;
  orbitalInclinationDeg: number;
  discoveryDate: string;
  discoverer: string;
  spectralType: string;
  visualScaleFactor: string;
  scientificDescription: string;
  tidalFate: string;
  colorHex: string;
  orbitColorHex: string;
}

export const PHOBOS_DATA: MoonScientificData = {
  id: 'phobos',
  name: 'Phobos',
  greekMeaning: 'Fear / Panic (Companion of Ares)',
  astronomicalDiameterKm: 22.2,
  triaxialDimensionsKm: '27.0 × 22.0 × 18.0 km',
  massKg: '1.0659 × 10¹⁶ kg',
  orbitalRadiusKm: 9376,
  altitudeAboveMarsKm: 5980,
  orbitalPeriodHours: 7.654,
  orbitalInclinationDeg: 1.093,
  discoveryDate: 'August 18, 1877',
  discoverer: 'Asaph Hall (US Naval Observatory)',
  spectralType: 'C-type (Carbonaceous asteroid analog)',
  visualScaleFactor: 'Educational Scale: mesh radius enhanced for orbital visibility. True diameter is 22.2 km.',
  scientificDescription: 'Phobos is the larger and innermost of Mars’s two natural satellites. It orbits closer to its primary than any other known planetary moon in the Solar System, completing an orbit in just 7 hours and 39 minutes.',
  tidalFate: 'Phobos orbits inside Mars’s synchronous orbit radius (20,428 km). Tidal friction decelerates Phobos, causing it to spiral inward at ~1.8 cm/year. In 30 to 50 million years, it will cross the Roche limit and either collide with Mars or shatter into a planetary debris ring.',
  colorHex: '#8c827a',
  orbitColorHex: '#38bdf8', // Cyan orbital trail
};

export const DEIMOS_DATA: MoonScientificData = {
  id: 'deimos',
  name: 'Deimos',
  greekMeaning: 'Dread / Terror (Companion of Ares)',
  astronomicalDiameterKm: 12.4,
  triaxialDimensionsKm: '15.0 × 12.2 × 10.4 km',
  massKg: '1.4762 × 10¹⁵ kg',
  orbitalRadiusKm: 23463,
  altitudeAboveMarsKm: 20067,
  orbitalPeriodHours: 30.312,
  orbitalInclinationDeg: 1.793,
  discoveryDate: 'August 12, 1877',
  discoverer: 'Asaph Hall (US Naval Observatory)',
  spectralType: 'D-type (Primitive volatile-rich silicate analog)',
  visualScaleFactor: 'Educational Scale: mesh radius enhanced for orbital visibility. True diameter is 12.4 km.',
  scientificDescription: 'Deimos is the outer and smaller moon of Mars. Covered by a thick blanket of pulverized regolith up to 100 meters deep, its craters appear partially filled and smoothed compared to Phobos’s stark topography.',
  tidalFate: 'Because Deimos orbits outside Mars’s synchronous orbit radius (20,428 km), tidal interactions gradually transfer angular momentum from Mars to the moon, causing Deimos to slowly spiral outward into deep space.',
  colorHex: '#b5a695',
  orbitColorHex: '#fb923c', // Amber orbital trail
};

