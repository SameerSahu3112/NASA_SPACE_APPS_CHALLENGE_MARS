/**
 * NASA JPL SCIENTIFIC PLANETARY CONSTANTS & KEPLERIAN ORBITAL DATA
 * 
 * Source: NASA Jet Propulsion Laboratory (JPL) Solar System Dynamics Group
 * Reference: Keplerian Elements for Approximate Positions of the Major Planets (1800-2050)
 * URL: https://ssd.jpl.nasa.gov/planets/approx_pos.html
 * 
 * Reference Frame: Heliocentric J2000 Mean Ecliptic and Equinox
 */

export const ASTRONOMICAL_UNIT_KM = 149597870.7; // Exactly 1 AU in km
export const GAUSSIAN_GRAVITATIONAL_CONSTANT = 0.01720209895; // k
export const HELIOCENTRIC_MU_AU_DAY = GAUSSIAN_GRAVITATIONAL_CONSTANT * GAUSSIAN_GRAVITATIONAL_CONSTANT; // ~0.000295912208 AU^3/day^2
export const HELIOCENTRIC_MU_KM_S = 1.32712440018e11; // km^3/s^2
export const SPEED_OF_LIGHT_KM_S = 299792.458; // km/s

export interface JplKeplerianElements {
  // Elements at J2000.0 epoch
  a0: number;      // Semi-major axis (AU)
  e0: number;      // Eccentricity
  I0: number;      // Inclination (degrees)
  L0: number;      // Mean longitude (degrees)
  peri0: number;   // Longitude of perihelion (degrees)
  node0: number;   // Longitude of ascending node (degrees)

  // Secular rates per Julian century from J2000.0
  adot: number;    // AU / century
  edot: number;    // / century
  Idot: number;    // degrees / century
  Ldot: number;    // degrees / century
  peridot: number; // degrees / century
  nodedot: number; // degrees / century

  // Optional outer planet perturbation terms (b*T^2 + c*cos(f*T) + s*sin(f*T))
  extra?: {
    b: number;
    c: number;
    s: number;
    f: number;
  };
}

export interface PlanetPhysicalCharacteristics {
  id: string;
  commandId: string; // NASA JPL Horizons NAIF body ID
  name: string;
  type: string;
  colorHex: string;
  diameterKm: number;
  massKg: string;
  densityGcm3: number;
  rotationPeriodHours: number;
  axialTiltDeg: number;
  moonsCount: number;
  nominalPeriodDays: number;
  nominalPeriodYears: number;
  visualScaleRadius: number; // Legacy scale
  relativeToEarthDiameter: number; // Strict NASA ratio of equatorial diameter to Earth (Earth = 1.000)
  isMars?: boolean;
  description: string;
  scientificSignificance: string;
  keyFeatures: string[];
}

export interface ScientificPlanetDefinition {
  characteristics: PlanetPhysicalCharacteristics;
  keplerian: JplKeplerianElements;
}

export const PLANETS_SCIENTIFIC_REGISTRY: Record<string, ScientificPlanetDefinition> = {
  mercury: {
    characteristics: {
      id: 'mercury',
      commandId: '199',
      name: 'Mercury',
      type: 'Terrestrial Planet',
      colorHex: '#9ca3af', // Silvery gray basalt
      diameterKm: 4879.4,
      massKg: '3.3011 × 10²³',
      densityGcm3: 5.427,
      rotationPeriodHours: 1407.6, // 58.6 days (3:2 spin-orbit resonance)
      axialTiltDeg: 0.034,
      moonsCount: 0,
      nominalPeriodDays: 87.969,
      nominalPeriodYears: 0.2408,
      visualScaleRadius: 1.4,
      relativeToEarthDiameter: 4879.4 / 12742.0, // ~0.3829 (Mercury is 38.3% of Earth's diameter)
      description: 'The innermost planet, Mercury possesses the highest orbital eccentricity (e ≈ 0.2056) and inclination (7.005°) among major planets, experiencing extreme temperature swings (-180°C to +430°C).',
      scientificSignificance: 'Its high orbital eccentricity and perihelion precession of 43 arcseconds/century provided historical empirical proof of Einstein’s General Relativity.',
      keyFeatures: ['Highest orbital speed (47.36 km/s)', '3:2 spin-orbit resonance', 'Enormous metallic core (~85% planetary radius)', 'Heavily cratered Caloris Basin'],
    },
    keplerian: {
      a0: 0.38709927, adot: 0.00000037,
      e0: 0.20563593, edot: 0.00001906,
      I0: 7.00497902, Idot: -0.00594749,
      L0: 252.25032350, Ldot: 149472.67411175,
      peri0: 77.45779628, peridot: 0.16047689,
      node0: 48.33076593, nodedot: -0.12534081,
    },
  },

  venus: {
    characteristics: {
      id: 'venus',
      commandId: '299',
      name: 'Venus',
      type: 'Terrestrial Planet',
      colorHex: '#facc15', // Pale yellowish amber clouds
      diameterKm: 12103.6,
      massKg: '4.8675 × 10²⁴',
      densityGcm3: 5.243,
      rotationPeriodHours: -5832.5, // Retrograde rotation
      axialTiltDeg: 177.36,
      moonsCount: 0,
      nominalPeriodDays: 224.701,
      nominalPeriodYears: 0.6152,
      visualScaleRadius: 2.2,
      relativeToEarthDiameter: 12103.6 / 12742.0, // ~0.9499 (Venus is 95.0% of Earth's diameter)
      description: 'Earth’s structural twin, shrouded in thick reflective sulfuric acid clouds with a 92-bar carbon dioxide atmosphere causing a runaway greenhouse effect (465°C).',
      scientificSignificance: 'Venus has the lowest orbital eccentricity in the solar system (e = 0.0067), describing an orbit that is the most circular of all planets.',
      keyFeatures: ['Most circular orbit (e ≈ 0.0067)', 'Retrograde clockwise rotation', 'Super-rotating atmosphere', 'Surface atmospheric pressure of 9.2 MPa'],
    },
    keplerian: {
      a0: 0.72333566, adot: 0.00000390,
      e0: 0.00677672, edot: -0.00004107,
      I0: 3.39467605, Idot: -0.00078890,
      L0: 181.97909950, Ldot: 58517.81538729,
      peri0: 131.60246718, peridot: 0.00268329,
      node0: 76.67984255, nodedot: -0.27769418,
    },
  },

  earth: {
    characteristics: {
      id: 'earth',
      commandId: '399',
      name: 'Earth',
      type: 'Terrestrial Planet (Oasis)',
      colorHex: '#38bdf8', // Azure oceans & white clouds
      diameterKm: 12742.0,
      massKg: '5.97237 × 10²⁴',
      densityGcm3: 5.514,
      rotationPeriodHours: 23.934,
      axialTiltDeg: 23.44,
      moonsCount: 1, // The Moon (Luna)
      nominalPeriodDays: 365.256,
      nominalPeriodYears: 1.0000,
      visualScaleRadius: 2.4,
      relativeToEarthDiameter: 1.0000, // Earth reference standard (12,742 km)
      description: 'The baseline planetary standard for the Astronomical Unit (1 AU). Characterized by dynamic nitrogen-oxygen atmosphere, liquid hydrosphere, and plate tectonics.',
      scientificSignificance: 'Reference standard for J2000 Ecliptic coordinate plane (I = 0.000° at J2000 epoch). Orbit is slightly eccentric (e = 0.0167), reaching perihelion in early January.',
      keyFeatures: ['Reference plane definition (J2000 Ecliptic)', 'Active planetary geomagnetic dynamo', 'Complex biogeochemical cycles', 'Major natural satellite: Moon (3,474 km)'],
    },
    keplerian: {
      a0: 1.00000261, adot: 0.00000562,
      e0: 0.01671123, edot: -0.00004392,
      I0: -0.00001531, Idot: -0.01294668,
      L0: 100.46457166, Ldot: 35999.37244981,
      peri0: 102.93768193, peridot: 0.32327364,
      node0: 0.00000000, nodedot: 0.00000000,
    },
  },

  mars: {
    characteristics: {
      id: 'mars',
      commandId: '499',
      name: 'Mars',
      type: 'Terrestrial Planet (MIRA Focus)',
      colorHex: '#ef4444', // Ferric rust orange-red
      diameterKm: 6779.0,
      massKg: '6.4171 × 10²³',
      densityGcm3: 3.933,
      rotationPeriodHours: 24.623, // 1 sol = 24h 37m 22s
      axialTiltDeg: 25.19,
      moonsCount: 2, // Phobos & Deimos
      nominalPeriodDays: 686.980,
      nominalPeriodYears: 1.8808,
      visualScaleRadius: 1.8,
      relativeToEarthDiameter: 6779.0 / 12742.0, // ~0.5320 (Mars is 53.2% of Earth's diameter)
      isMars: true,
      description: 'The primary focus of Project MIRA. A cold desert world with a significant eccentricity (e = 0.0934), generating intense seasonal climate variations between aphelion and perihelion.',
      scientificSignificance: 'Mars’s pronounced eccentricity led Johannes Kepler to formulate his First and Second Laws of Planetary Motion in 1609, revolutionizing celestial mechanics.',
      keyFeatures: ['Olympus Mons (21.9 km shield volcano)', 'Valles Marineris (4,000 km grand canyon)', 'Natural satellites: Phobos & Deimos', 'Seasonal CO₂ polar ice caps'],
    },
    keplerian: {
      a0: 1.52371034, adot: 0.00001847,
      e0: 0.09339410, edot: 0.00007882,
      I0: 1.84969142, Idot: -0.00813131,
      L0: -4.55343205, Ldot: 19140.30268499,
      peri0: -23.94362959, peridot: 0.44441088,
      node0: 49.55953891, nodedot: -0.29257343,
    },
  },

  jupiter: {
    characteristics: {
      id: 'jupiter',
      commandId: '599',
      name: 'Jupiter',
      type: 'Gas Giant',
      colorHex: '#d97706', // Ochre & brownish ammonia bands
      diameterKm: 139820.0,
      massKg: '1.8982 × 10²⁷',
      densityGcm3: 1.326,
      rotationPeriodHours: 9.925,
      axialTiltDeg: 3.13,
      moonsCount: 95,
      nominalPeriodDays: 4332.589,
      nominalPeriodYears: 11.862,
      visualScaleRadius: 4.8,
      relativeToEarthDiameter: 139820.0 / 12742.0, // ~10.9732 (Jupiter is 10.97× larger than Earth)
      description: 'The solar system’s most massive planet (318 Earth masses). Its immense gravitational field acts as a planetary stabilizer, perturbing inner and outer planetary orbits.',
      scientificSignificance: 'Jupiter’s gravitational resonance creates the Kirkwood gaps in the asteroid belt and governs the orbits of Trojan asteroids at Lagrange points L4 and L5.',
      keyFeatures: ['Great Red Spot anticyclonic vortex', 'Strongest planetary magnetic field', '95 confirmed moons (Io, Europa, Ganymede, Callisto)', 'Rapid 9.9-hour rotation causing polar flattening'],
    },
    keplerian: {
      a0: 5.20288700, adot: -0.00011607,
      e0: 0.04838624, edot: -0.00013253,
      I0: 1.30439695, Idot: -0.00183714,
      L0: 34.39644051, Ldot: 3034.74612775,
      peri0: 14.72847983, peridot: 0.21252668,
      node0: 100.47390909, nodedot: 0.20469106,
      extra: {
        b: -0.00012452,
        c: 0.06064060,
        s: -0.35635438,
        f: 38.35125000,
      },
    },
  },

  saturn: {
    characteristics: {
      id: 'saturn',
      commandId: '699',
      name: 'Saturn',
      type: 'Gas Giant (Ringed)',
      colorHex: '#fde047', // Pale golden yellow
      diameterKm: 116460.0,
      massKg: '5.6834 × 10²⁶',
      densityGcm3: 0.687, // Less dense than water
      rotationPeriodHours: 10.656,
      axialTiltDeg: 26.73,
      moonsCount: 146,
      nominalPeriodDays: 10759.22,
      nominalPeriodYears: 29.457,
      visualScaleRadius: 4.0,
      relativeToEarthDiameter: 116460.0 / 12742.0, // ~9.1398 (Saturn is 9.14× larger than Earth)
      description: 'Spectacular gas giant adorned with an extensive ring system of water-ice particles spanning 282,000 km in diameter, yet only 10 to 30 meters thick on average.',
      scientificSignificance: 'Saturn exhibits the lowest bulk density of any planet in the solar system (0.687 g/cm³), meaning it would float in a sufficiently large ocean.',
      keyFeatures: ['Majestic ring system (A, B, C rings & Cassini Division)', 'Polar hexagonal jet stream', 'Titan (thick nitrogen atmosphere with liquid methane seas)', 'Enceladus (cryovolcanic water plumes)'],
    },
    keplerian: {
      a0: 9.53667594, adot: -0.00125060,
      e0: 0.05386179, edot: -0.00050991,
      I0: 2.48599187, Idot: 0.00193609,
      L0: 49.95424423, Ldot: 1222.49362201,
      peri0: 92.59887831, peridot: -0.41897216,
      node0: 113.66242448, nodedot: -0.28867794,
      extra: {
        b: 0.00025899,
        c: -0.13434469,
        s: 0.87320147,
        f: 38.35125000,
      },
    },
  },

  uranus: {
    characteristics: {
      id: 'uranus',
      commandId: '799',
      name: 'Uranus',
      type: 'Ice Giant',
      colorHex: '#2dd4bf', // Cyan-teal methane haze
      diameterKm: 50724.0,
      massKg: '8.6810 × 10²⁵',
      densityGcm3: 1.270,
      rotationPeriodHours: -17.24, // Retrograde
      axialTiltDeg: 97.77, // Extreme lateral tilt
      moonsCount: 28,
      nominalPeriodDays: 30685.4,
      nominalPeriodYears: 84.011,
      visualScaleRadius: 3.2,
      relativeToEarthDiameter: 50724.0 / 12742.0, // ~3.9808 (Uranus is 3.98× larger than Earth)
      description: 'An aquamarine ice giant characterized by an extreme 97.8° axial tilt, rolling along its 84-year orbit on its side, causing extreme 42-year continuous polar nights and days.',
      scientificSignificance: 'Its cold upper atmosphere (-224°C) contains trace atmospheric methane that absorbs red light, imparting its serene pale cyan appearance.',
      keyFeatures: ['97.8° extreme axial tilt ("rolling on its side")', 'Faintest internal heat release of giant planets', 'Complex retrograde magnetosphere tilted 59°', 'System of 13 narrow dark rings'],
    },
    keplerian: {
      a0: 19.18916464, adot: -0.00196176,
      e0: 0.04725744, edot: -0.00004397,
      I0: 0.77263783, Idot: -0.00242939,
      L0: 313.23810451, Ldot: 428.48202785,
      peri0: 170.95427630, peridot: 0.40805281,
      node0: 74.01692503, nodedot: 0.04240589,
      extra: {
        b: 0.00058331,
        c: -0.97731849,
        s: 0.17689245,
        f: 7.67025000,
      },
    },
  },

  neptune: {
    characteristics: {
      id: 'neptune',
      commandId: '899',
      name: 'Neptune',
      type: 'Ice Giant',
      colorHex: '#3b82f6', // Deep cobalt azure
      diameterKm: 49244.0,
      massKg: '1.02413 × 10²⁶',
      densityGcm3: 1.638,
      rotationPeriodHours: 16.11,
      axialTiltDeg: 28.32,
      moonsCount: 16,
      nominalPeriodDays: 60189.0,
      nominalPeriodYears: 164.79,
      visualScaleRadius: 3.1,
      relativeToEarthDiameter: 49244.0 / 12742.0, // ~3.8647 (Neptune is 3.86× larger than Earth)
      description: 'The outermost major planet, located at ~30.1 AU. A dynamic ice giant home to the fastest supersonic winds recorded in the solar system, exceeding 2,100 km/h.',
      scientificSignificance: 'Neptune was the first planet discovered via mathematical prediction rather than empirical observation in 1846, based on gravitational perturbations in Uranus’s orbit.',
      keyFeatures: ['Supersonic winds up to 2,100 km/h', 'Deep azure color from atmospheric methane', 'Triton: retrograde captured Kuiper Belt object with nitrogen geysers', 'Discovered mathematically by Le Verrier & Adams'],
    },
    keplerian: {
      a0: 30.06992276, adot: 0.00026291,
      e0: 0.00859048, edot: 0.00005105,
      I0: 1.77004347, Idot: 0.00035372,
      L0: -55.12002969, Ldot: 218.45945325,
      peri0: 44.96476227, peridot: -0.32241464,
      node0: 131.78422574, nodedot: -0.00508664,
      extra: {
        b: -0.00041348,
        c: 0.68346318,
        s: -0.10162547,
        f: 7.67025000,
      },
    },
  },
};

export const ORDERED_PLANET_KEYS = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

