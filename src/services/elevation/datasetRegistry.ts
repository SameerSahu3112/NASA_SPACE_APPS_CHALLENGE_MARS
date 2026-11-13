/**
 * PROJECT MIRA — MARS ELEVATION DATASET REGISTRY
 * 
 * Authoritative registry of planetary elevation datasets for Mars.
 * Documents provenance, instruments, resolution, coordinate frames, and datums.
 */

import { ElevationSourceMetadata } from './types';

export const DATASET_USGS_BLEND_200M: ElevationSourceMetadata = {
  id: 'USGS_HRSC_MOLA_BLEND_200M_V2',
  name: 'USGS Mars MGS MOLA – MEX HRSC Blended DEM Global 200m v2',
  publisher: 'USGS Astrogeology Science Center / NASA / ESA',
  instrument: 'MOLA (NASA MGS) + HRSC (ESA Mars Express)',
  version: 'Version 2.0 (2022 release)',
  officialUrl: 'https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif',
  license: 'Public Domain / NASA Open Data / ESA Open Access',
  attribution: 'USGS Astrogeology / NASA GSFC MOLA Team / ESA DLR HRSC Team',
  nativeResolution: '200 m/pixel nominal (~463 m MOLA baseline + ~50 m HRSC over ~44% coverage)',
  outputGridSpacing: '0.003374120830641° (~200 m/pixel)',
  coverage: 'Global (0° to 360° E, -90° to +90° N)',
  dataType: 'Int16LE (16-bit signed integer)',
  units: 'meters',
  verticalDatum: 'MOLA_AREOID',
  nodataValue: -32768,
  bounds: {
    west: -180.0,
    south: -90.0,
    east: 180.0,
    north: 90.0,
  },
};

export const DATASET_NASA_MOLA_MEGDR: ElevationSourceMetadata = {
  id: 'NASA_MGS_MOLA_MEGDR_4PPD',
  name: 'NASA MGS MOLA Mission Experiment Gridded Data Record (MEGDR) 4 PPD',
  publisher: 'NASA Goddard Space Flight Center / PDS Geosciences Node',
  instrument: 'Mars Orbiter Laser Altimeter (MOLA), Mars Global Surveyor',
  version: 'PDS Version 2.0 (MEGT90N000CB.IMG)',
  officialUrl: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megt90n000cb.img',
  license: 'Public Domain / NASA Planetary Data System',
  attribution: 'NASA GSFC / David E. Smith et al. / MGS MOLA Science Team',
  nativeResolution: '0.25° by 0.25° (~15 km/pixel)',
  outputGridSpacing: '0.25° (4 pixels per degree)',
  coverage: 'Global (0° to 360° E, -90° to +90° N, 1440 x 720 samples)',
  dataType: 'Int16BE (16-bit signed integer, MSB)',
  units: 'meters',
  verticalDatum: 'MOLA_AREOID',
  nodataValue: -32768,
  bounds: {
    west: -180.0,
    south: -90.0,
    east: 180.0,
    north: 90.0,
  },
};

/**
 * Preserved localized ground-truth reference measurements for key Mars landmarks.
 * Derived from NASA landing site characterization (MOLA PEDR & HiRISE DTMs).
 */
export const PRESERVED_REGIONAL_GROUND_TRUTH: Record<string, {
  name: string;
  west: number;
  south: number;
  east: number;
  north: number;
  measuredElevationMeters: number;
  source: string;
  uncertaintyMeters: number;
}> = {
  'jezero-crater-delta': {
    name: 'Jezero Crater Delta (Mars 2020 Perseverance Site)',
    west: 77.3,
    south: 18.2,
    east: 77.8,
    north: 18.6,
    measuredElevationMeters: -2560,
    source: 'NASA JPL Mars 2020 Landing Site HiRISE/HRSC DTM (Ferguson et al., 2020)',
    uncertaintyMeters: 5,
  },
  'gale-crater-floor': {
    name: 'Gale Crater Landing Ellipse (Curiosity Rover Site)',
    west: 137.2,
    south: -4.8,
    east: 137.6,
    north: -4.4,
    measuredElevationMeters: -4450,
    source: 'NASA MSL Science Team HiRISE DTM (Grotzinger et al., 2012)',
    uncertaintyMeters: 5,
  },
  'olympus-mons-caldera': {
    name: 'Olympus Mons Central Caldera Floor',
    west: -133.7,
    south: 18.4,
    east: -133.1,
    north: 18.9,
    measuredElevationMeters: 18688,
    source: 'USGS / HRSC MOLA Multi-orbit DTM Solution',
    uncertaintyMeters: 15,
  },
  'valles-marineris-melas': {
    name: 'Melas Chasma Canyon Trough',
    west: -77.0,
    south: -10.2,
    east: -76.2,
    north: -9.4,
    measuredElevationMeters: -1751,
    source: 'HRSC Team High-Resolution Stereo Topography',
    uncertaintyMeters: 20,
  },
};

export const ELEVATION_DATASETS = [
  DATASET_USGS_BLEND_200M,
  DATASET_NASA_MOLA_MEGDR,
];

