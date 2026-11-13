/**
 * PROJECT MIRA — 3D MARTIAN TERRAIN EXPLORER CONFIGURATION
 * 
 * Defines feature flags, high-resolution scientific sites, camera presets,
 * and elevation ground-truth parameters for Google Earth-style Mars terrain exploration.
 */

export interface TerrainExplorationSite {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  latitude: number;  // Decimal degrees (-90 to +90)
  longitude: number; // Decimal degrees (-180 to +180)
  elevationMeters: number; // Authentic ground elevation above MOLA Areoid
  orbitCamera: {
    altitudeMeters: number;
    pitchDegrees: number;
    headingDegrees: number;
    rollDegrees: number;
  };
  surfaceCamera: {
    latitude: number;
    longitude: number;
    eyeHeightMeters: number; // Height above local terrain (e.g. 2.0m mastcam)
    pitchDegrees: number;
    headingDegrees: number;
  };
  geologicalDescription: string;
  demSource: string;
  scientificSignificance: string;
}

export const TERRAIN_EXPLORER_ENABLED = true;

export const TERRAIN_EXPLORATION_SITES: Record<string, TerrainExplorationSite> = {
  'jezero-crater': {
    id: 'jezero-crater',
    name: 'Jezero Crater & Delta',
    subtitle: 'Mars 2020 Perseverance Site / Ancient Paleolake',
    badge: 'PERSEVERANCE / DELTA',
    latitude: 18.38,
    longitude: 77.58,
    elevationMeters: -2560,
    orbitCamera: {
      altitudeMeters: 38000,
      pitchDegrees: -38,
      headingDegrees: 55,
      rollDegrees: 0,
    },
    surfaceCamera: {
      latitude: 18.444,
      longitude: 77.451,
      eyeHeightMeters: 2.5,
      pitchDegrees: -4,
      headingDegrees: 45,
    },
    geologicalDescription: 'Ancient Noachian crater rim and river-fed fan delta deposit. Ground surface sits at -2,560 m relative to the MOLA Areoid datum.',
    demSource: 'NASA JPL / USGS Mars 2020 HiRISE/HRSC High-Resolution DTM (<1 m/px local) + MOLA MEGDR 4PPD',
    scientificSignificance: 'Active exploration by Mars 2020 Perseverance Rover investigating biosignatures and deltaic sedimentation.',
  },
  'olympus-mons': {
    id: 'olympus-mons',
    name: 'Olympus Mons Caldera & Scarp',
    subtitle: 'Solar System’s Largest Shield Volcano (+21.3 km)',
    badge: 'SHIELD VOLCANO / CALDERA',
    latitude: 18.65,
    longitude: -133.80,
    elevationMeters: 18688,
    orbitCamera: {
      altitudeMeters: 85000,
      pitchDegrees: -28,
      headingDegrees: 115,
      rollDegrees: 0,
    },
    surfaceCamera: {
      latitude: 18.65,
      longitude: -133.80,
      eyeHeightMeters: 10,
      pitchDegrees: 14,
      headingDegrees: 90,
    },
    geologicalDescription: 'Summit caldera complex 80 km across with vertical collapse scarps up to 3 km deep and outer basaltic basal cliff up to 8 km high.',
    demSource: 'ESA Mars Express HRSC + NASA MGS MOLA Multi-orbit DTM (50 m/px) + MOLA MEGDR',
    scientificSignificance: 'Immense shield volcano built by effusive basalt eruptions over a stationary mantle hotspot over billions of years.',
  },
  'valles-marineris': {
    id: 'valles-marineris',
    name: 'Valles Marineris (Melas Chasma)',
    subtitle: 'Colossal Extensional Canyon System (7 km Depth)',
    badge: 'TECTONIC RIFT / 7 KM DEPTH',
    latitude: -9.80,
    longitude: -76.54,
    elevationMeters: -1751,
    orbitCamera: {
      altitudeMeters: 70000,
      pitchDegrees: -32,
      headingDegrees: 285,
      rollDegrees: 0,
    },
    surfaceCamera: {
      latitude: -9.80,
      longitude: -76.54,
      eyeHeightMeters: 5,
      pitchDegrees: 20,
      headingDegrees: 280,
    },
    geologicalDescription: 'Vast tectonic rift trough flanked by 7,000 m towering layered wall scarps, ancient landslide lobes, and layered sulfate deposits.',
    demSource: 'ESA HRSC Team Melas Chasma DTM Solution + MOLA MEGDR',
    scientificSignificance: 'Extensional rift formed by Tharsis volcanic flexure, revealing kilometers of stratified Martian crustal history.',
  },
  'gale-crater': {
    id: 'gale-crater',
    name: 'Gale Crater & Mount Sharp',
    subtitle: 'MSL Curiosity Rover Site / Aeolis Mons',
    badge: 'MSL CURIOSITY / MT SHARP',
    latitude: -4.59,
    longitude: 137.44,
    elevationMeters: -4450,
    orbitCamera: {
      altitudeMeters: 42000,
      pitchDegrees: -34,
      headingDegrees: 180,
      rollDegrees: 0,
    },
    surfaceCamera: {
      latitude: -4.59,
      longitude: 137.44,
      eyeHeightMeters: 3,
      pitchDegrees: 10,
      headingDegrees: 180,
    },
    geologicalDescription: '5.5 km high central sedimentary mound (Aeolis Mons) preserving stratified clay, sulfate, and sandstone layers from early wet Mars.',
    demSource: 'NASA MSL Science Team HiRISE DTM (1 m/px) + MOLA MEGDR',
    scientificSignificance: 'Explored by MSL Curiosity rover; confirmed ancient habitable lacustrine environments and organic molecular preservation.',
  },
  'victoria-crater': {
    id: 'victoria-crater',
    name: 'Victoria Crater (Meridiani)',
    subtitle: 'Opportunity Exploration Site / Promontories',
    badge: 'OPPORTUNITY / MERIDIANI',
    latitude: -2.05,
    longitude: -5.50,
    elevationMeters: -1400,
    orbitCamera: {
      altitudeMeters: 14000,
      pitchDegrees: -45,
      headingDegrees: 20,
      rollDegrees: 0,
    },
    surfaceCamera: {
      latitude: -2.05,
      longitude: -5.50,
      eyeHeightMeters: 2,
      pitchDegrees: -5,
      headingDegrees: 0,
    },
    geologicalDescription: '800 m diameter impact crater showing scalloped cliff edges (Cape Verde, Cabo Anonimo) and exposed sulfate-rich sedimentary rocks.',
    demSource: 'NASA MRO HiRISE Stereo Pair DTM (<1 m/px) + MOLA MEGDR',
    scientificSignificance: 'Explored by MER Opportunity rover; verified ancient groundwater evaporation and hematite concretion ("blueberry") beds.',
  },
};

export const TERRAIN_ALTITUDE_PRESETS = [
  { label: 'Rover Eye', altitudeMeters: 2.5, description: 'Perseverance / Curiosity Mastcam view (2.5 m AGL)' },
  { label: 'Drone Scout', altitudeMeters: 50, description: 'Ingenuity helicopter aerial vantage (50 m AGL)' },
  { label: 'Sub-Orbital', altitudeMeters: 5000, description: 'Low-altitude atmospheric transit (5 km AGL)' },
  { label: 'Regional', altitudeMeters: 35000, description: 'Regional oblique canyon/crater overview (35 km AGL)' },
  { label: 'Orbital', altitudeMeters: 120000, description: 'Synoptic high-orbit planetary view (120 km AGL)' },
];

