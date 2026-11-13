/**
 * MIRA SCIENTIFIC KNOWLEDGE BASE & NASA-FIRST RETRIEVAL SYSTEM
 * 
 * Strict Source Hierarchy:
 *   - Priority 1: Official NASA Sources (NASA.gov, NASA Science, NASA PDS, NASA JPL)
 *   - Priority 2: Authoritative Scientific Institutions (ESA, USGS Astrogeology, IAU)
 *   - Priority 3: Peer-Reviewed Scientific Research & Mission Publications
 *   - Priority 4: Broad Frontier Aerospace & Astrodynamics Intelligence
 * 
 * Verified clickable citations are supplied for all scientific claims.
 * Unwanted symbols, LaTeX dollar delimiters, and robotic greetings are omitted.
 */

import { ParsedCoordinate, CopilotSourceTier, CopilotAction } from './miraAiService';

export interface CopilotCitation {
  title: string;
  url: string;
  organization: 'NASA' | 'NASA JPL' | 'NASA PDS' | 'ESA' | 'USGS' | 'IAU';
  tier: CopilotSourceTier;
}

export interface KnowledgeRecord {
  id: string;
  name: string;
  category: 'planet' | 'mars_landmark' | 'mission' | 'physics' | 'dataset' | 'moon';
  keywords: string[];
  tier: CopilotSourceTier;
  sourceLabel: string;
  citations: CopilotCitation[];
  summary: string;
  details: string[];
  navigationTarget?: ParsedCoordinate;
  defaultAction?: CopilotAction;
}

export const NASA_CITATIONS: Record<string, CopilotCitation> = {
  nasaJezero: {
    title: 'NASA Mars 2020: Jezero Crater Landing Site Overview',
    url: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-goals/',
    organization: 'NASA JPL',
    tier: 'TIER_1_MIRA_DATASET',
  },
  nasaPlanetaryFactSheets: {
    title: 'NASA NSSDC Planetary Fact Sheet Metric Constants',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    organization: 'NASA',
    tier: 'TIER_1_MIRA_DATASET',
  },
  nasaJplHorizons: {
    title: 'NASA JPL Horizons Ephemeris & Orbital Dynamics Computation System',
    url: 'https://ssd.jpl.nasa.gov/horizons/',
    organization: 'NASA JPL',
    tier: 'TIER_1_MIRA_DATASET',
  },
  nasaMarsTreks: {
    title: 'NASA JPL Solar System Treks WMTS Cartographic Tiles (MOLA/HRSC)',
    url: 'https://trek.nasa.gov/tiles/Mars/EQ/',
    organization: 'NASA JPL',
    tier: 'TIER_1_MIRA_DATASET',
  },
  nasaInsightPds: {
    title: 'NASA InSight Mission SEIS Data Archive at NASA Planetary Data System',
    url: 'https://pds-geosciences.wustl.edu/missions/insight/',
    organization: 'NASA PDS',
    tier: 'TIER_2_NASA_PDS_ARCHIVE',
  },
  nasaMavenPds: {
    title: 'NASA MAVEN Atmospheric Loss Science Archive',
    url: 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MAVEN/',
    organization: 'NASA PDS',
    tier: 'TIER_2_NASA_PDS_ARCHIVE',
  },
  nasaMroSharad: {
    title: 'NASA MRO Shallow Radar (SHARAD) Subsurface Ice Sounding Team',
    url: 'https://sharad.psi.edu/',
    organization: 'NASA PDS',
    tier: 'TIER_2_NASA_PDS_ARCHIVE',
  },
  nasaMslCuriosity: {
    title: 'NASA Mars Science Laboratory: Curiosity Rover Science Findings',
    url: 'https://science.nasa.gov/mission/msl-curiosity/',
    organization: 'NASA JPL',
    tier: 'TIER_1_MIRA_DATASET',
  },
  nasaCassini: {
    title: 'NASA Cassini-Huygens Mission to Saturn and Titan',
    url: 'https://science.nasa.gov/mission/cassini/',
    organization: 'NASA JPL',
    tier: 'TIER_2_NASA_PDS_ARCHIVE',
  },
  nasaVoyager: {
    title: 'NASA Voyager Interstellar Mission & Planetary Ephemerides',
    url: 'https://voyager.jpl.nasa.gov/',
    organization: 'NASA JPL',
    tier: 'TIER_2_NASA_PDS_ARCHIVE',
  },
  usgsMarsNomenclature: {
    title: 'USGS Astrogeology Gazetteer of Planetary Nomenclature: Mars',
    url: 'https://planetarynames.wr.usgs.gov/Page/MARS/target',
    organization: 'USGS',
    tier: 'TIER_1_MIRA_DATASET',
  },
};

export const CELESTIAL_BODIES_CATALOG: Record<string, KnowledgeRecord> = {
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    category: 'planet',
    keywords: ['mercury', 'innermost planet', 'messenger'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    summary: 'Mercury is the innermost and smallest planet in the Solar System, orbiting in a 3:2 spin-orbit resonance.',
    details: [
      'Semi-major axis: 0.387 AU (57.9 million km).',
      'Orbital period: 87.97 Earth days | Orbital speed: 47.36 km/s.',
      'Equatorial diameter: 4,879 km (~0.383 of Earth).',
      'Surface temperature range: -180°C at night to 430°C at local noon.',
      'Atmosphere: Extremely tenuous exosphere composed of oxygen, sodium, hydrogen, and helium.',
      'Scientific missions: NASA Mariner 10, NASA MESSENGER, and ESA/JAXA BepiColombo.',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'mercury', focus: true, play: true },
    },
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    category: 'planet',
    keywords: ['venus', 'morning star', 'evening star', 'greenhouse', 'magellan'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    summary: 'Venus is the second planet from the Sun, exhibiting a runaway greenhouse atmosphere with supercritical CO2 and sulfuric acid clouds.',
    details: [
      'Semi-major axis: 0.723 AU (108.2 million km).',
      'Orbital period: 224.70 Earth days | Orbital speed: 35.02 km/s.',
      'Equatorial diameter: 12,104 km (~0.949 of Earth).',
      'Atmospheric surface pressure: 92 bar (~92 times Earth sea level).',
      'Mean surface temperature: 464°C, hot enough to melt lead, caused by runaway carbon dioxide greenhouse forcing.',
      'Retrograde rotation: Rotates clockwise on its axis once every 243 Earth days, longer than its orbital year.',
      'Scientific missions: NASA Magellan (radar mapping), ESA Venus Express, NASA DAVINCI and VERITAS (upcoming).',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'venus', focus: true, play: true },
    },
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    category: 'planet',
    keywords: ['earth', 'home planet', 'blue marble', 'terrestrial'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    summary: 'Earth is the third planet from the Sun and the only known planetary body supporting life and liquid surface oceans.',
    details: [
      'Semi-major axis: 1.000 AU (149.6 million km).',
      'Orbital period: 365.256 days | Mean orbital velocity: 29.78 km/s.',
      'Equatorial diameter: 12,742 km | Mean density: 5.514 g/cm³.',
      'Atmospheric composition: 78.08% Nitrogen, 20.95% Oxygen, 0.93% Argon, 0.04% Carbon Dioxide.',
      'Active geodynamo: Generates a strong dipole magnetic field shielding surface biology from cosmic and solar radiation.',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'earth', focus: true, play: true },
    },
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    category: 'planet',
    keywords: ['mars', 'red planet', 'fourth planet'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Mars Exploration Program & IAU 2015 Standards',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaMarsTreks, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Mars is the fourth planet from the Sun, a cold, desert world with half Earth’s diameter, towering volcanoes, and dried river valleys.',
    details: [
      'Semi-major axis: 1.524 AU (227.9 million km).',
      'Orbital period: 686.98 Earth days (668.6 Mars sols) | Mean velocity: 24.07 km/s.',
      'Equatorial radius: 3,396.19 km | Flattening: 1/169.779 (IAU 2015 ellipsoid standard).',
      'Surface atmospheric pressure: 6.1 millibars (0.6% of Earth), composed of 95.3% CO2.',
      'Natural satellites: Two captured irregularly shaped asteroids, Phobos and Deimos.',
      'Core & interior: Proved by NASA InSight to have a liquid metallic core of radius 1,830 km.',
    ],
    defaultAction: {
      type: 'RETURN_TO_MARS',
    },
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    category: 'planet',
    keywords: ['jupiter', 'gas giant', 'great red spot', 'jovian', 'galilean'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaJplHorizons],
    summary: 'Jupiter is the largest planet in our Solar System, possessing more than twice the combined mass of all other planets.',
    details: [
      'Semi-major axis: 5.204 AU (778.5 million km).',
      'Orbital period: 11.86 Earth years (4,332.6 days) | Orbital speed: 13.07 km/s.',
      'Equatorial diameter: 142,984 km (11.21 Earth diameters) | Mass: 1.898 × 10²⁷ kg (317.8 Earth masses).',
      'Atmospheric composition: ~90% Hydrogen, ~10% Helium with traces of methane, ammonia, and water ice.',
      'The Great Red Spot: A persistent anticyclonic storm larger than Earth that has raged for over 350 years.',
      'Galilean Moons: Io (most volcanically active body in solar system), Europa (subsurface ocean), Ganymede (largest moon), Callisto.',
      'Scientific missions: Pioneer 10/11, Voyager 1/2, Galileo, Cassini, New Horizons, NASA Juno, ESA Juice.',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'jupiter', focus: true, play: true },
    },
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    category: 'planet',
    keywords: ['saturn', 'ringed planet', 'titan', 'enceladus', 'cassini'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaCassini],
    summary: 'Saturn is the second-largest planet in the Solar System, distinguished by its magnificent, extensive planetary ring system.',
    details: [
      'Semi-major axis: 9.537 AU (1.427 billion km).',
      'Orbital period: 29.45 Earth years (10,759 days) | Orbital speed: 9.69 km/s.',
      'Equatorial diameter: 120,536 km | Mean density: 0.687 g/cm³ (less dense than liquid water).',
      'Ring system: Extends up to 282,000 km from the planet but is exceptionally thin (typically 10 to 30 meters thick), consisting of 99% pure water ice particles.',
      'Major Moons: Titan (dense nitrogen atmosphere, liquid methane lakes) and Enceladus (subsurface ocean with active cryogenic geysers).',
      'Key missions: Pioneer 11, Voyager 1/2, NASA/ESA Cassini-Huygens (2004–2017).',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'saturn', focus: true, play: true },
    },
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    category: 'planet',
    keywords: ['uranus', 'ice giant', 'sideways planet', 'voyager 2'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaVoyager],
    summary: 'Uranus is an ice giant with an extreme axial tilt of 97.77 degrees, rotating virtually on its side.',
    details: [
      'Semi-major axis: 19.191 AU (2.871 billion km).',
      'Orbital period: 84.02 Earth years | Orbital speed: 6.81 km/s.',
      'Equatorial diameter: 51,118 km (4.01 Earth diameters).',
      'Atmospheric color: Cyan-blue caused by methane absorption of red wavelengths in the upper troposphere.',
      'Extreme tilt: Causes 42-year periods of continuous sunlight followed by 42 years of continuous darkness at the poles.',
      'Key exploration: Visited by NASA Voyager 2 during its January 1986 flyby.',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'uranus', focus: true, play: true },
    },
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    category: 'planet',
    keywords: ['neptune', 'outermost planet', 'triton', 'great dark spot'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Planetary Fact Sheet & JPL Horizons',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.nasaVoyager],
    summary: 'Neptune is the eighth and outermost recognized major planet in the Solar System, known for the most violent supersonic winds.',
    details: [
      'Semi-major axis: 30.069 AU (4.498 billion km).',
      'Orbital period: 164.79 Earth years | Orbital speed: 5.43 km/s.',
      'Equatorial diameter: 49,528 km (3.88 Earth diameters).',
      'Atmospheric dynamics: Fastest sustained winds in the Solar System, clocked up to 2,100 km/h (over Mach 1.5).',
      'Moon Triton: Retrograde orbit suggesting it was captured from the Kuiper Belt; features active liquid nitrogen cryovolcanoes.',
      'Key exploration: Visited by NASA Voyager 2 in August 1989.',
    ],
    defaultAction: {
      type: 'OPEN_SOLAR_SYSTEM',
      payload: { planetId: 'neptune', focus: true, play: true },
    },
  },
};

export const MARS_LANDMARKS_CATALOG: Record<string, KnowledgeRecord> = {
  jezero: {
    id: 'jezero',
    name: 'Jezero Crater',
    category: 'mars_landmark',
    keywords: ['jezero', 'perseverance', 'river delta', 'fan delta', 'neretva vallis', 'ingenuity'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Mars 2020 Mission & Jezero Reference Datum',
    citations: [NASA_CITATIONS.nasaJezero, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Jezero Crater is a 45-km-wide ancient impact basin hosting an exceptionally well-preserved river delta system, selected as the landing site for NASA’s Perseverance rover.',
    details: [
      'Coordinates: 18.38° N, 77.58° E (Western Isidis Planitia). In Project MIRA, it serves as the primary origin datum (0.00° N, 0.00° E).',
      'Elevation: -2.5 km relative to the MOLA Martian datum.',
      'Why NASA selected Jezero: Approximately 3.7 billion years ago during the late Noachian to early Hesperian era, Neretva Vallis breached the crater wall, flooding it into an open-basin lake. The slowing waters deposited fine-grained clay minerals and carbonate rocks that are ideal for preserving microscopic biosignatures.',
      'Perseverance Mission Findings: Successfully extracted core samples of igneous rocks and sedimentary delta mudstones, now cached on the Martian surface for the upcoming Mars Sample Return mission.',
    ],
    navigationTarget: {
      name: 'Jezero Crater (Perseverance Landing Site)',
      latitude: 18.38,
      longitude: 77.58,
      altitudeMeters: 140000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Jezero Crater',
        latitude: 18.38,
        longitude: 77.58,
        altitudeMeters: 140000,
      },
    },
  },
  olympusMons: {
    id: 'olympusMons',
    name: 'Olympus Mons',
    category: 'mars_landmark',
    keywords: ['olympus mons', 'olympus', 'largest volcano', 'shield volcano', 'tharsis'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA MOLA Topography & USGS Nomenclature',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Olympus Mons is the largest shield volcano and the highest planetary peak in the Solar System, rising ~22 km above the surrounding Martian plains.',
    details: [
      'Coordinates: 18.65° N, 226.20° E (133.80° W) in the Tharsis volcanic province.',
      'Elevation: 21.9 km above the MOLA datum (approx. 2.5 times the height of Mount Everest).',
      'Basal footprint: Over 624 km in diameter, approximately the size of the state of Arizona.',
      'Summit caldera: A complex of 6 overlapping collapse calderas spanning 80 km across and up to 3.2 km deep.',
      'Geological origin: Stationary mantle hotspot plume volcanism beneath a stagnant, single-plate lithosphere allowed millions of basaltic lava flows to stack vertically over 100+ million years without being carried away by plate tectonics.',
    ],
    navigationTarget: {
      name: 'Olympus Mons',
      latitude: 18.65,
      longitude: 226.20,
      altitudeMeters: 550000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Olympus Mons',
        latitude: 18.65,
        longitude: 226.20,
        altitudeMeters: 550000,
      },
    },
  },
  vallesMarineris: {
    id: 'vallesMarineris',
    name: 'Valles Marineris',
    category: 'mars_landmark',
    keywords: ['valles marineris', 'valles', 'marineris', 'canyon', 'chasmata', 'grand canyon of mars'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA MOLA Elevation & USGS Astrogeology',
    citations: [NASA_CITATIONS.nasaMarsTreks, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Valles Marineris is an immense tectonic rift canyon system stretching over 4,000 km across the Martian equatorial belt.',
    details: [
      'Coordinates: 13.90° S, 300.80° E (59.20° W) in central Melas and Coprates Chasma.',
      'Scale: Over 4,000 km long (nearly 20% of Mars’s circumference), up to 200 km wide, and plunging to depths of 7 to 11 km.',
      'Geological origin: Extensional tectonic rifting formed as the colossal Tharsis volcanic bulge swelled, fracturing the Martian crust. The canyons were subsequently widened by massive wall collapse landslides and catastrophic outflow flooding.',
    ],
    navigationTarget: {
      name: 'Valles Marineris',
      latitude: -13.90,
      longitude: 300.80,
      altitudeMeters: 900000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Valles Marineris',
        latitude: -13.90,
        longitude: 300.80,
        altitudeMeters: 900000,
      },
    },
  },
  galeCrater: {
    id: 'galeCrater',
    name: 'Gale Crater',
    category: 'mars_landmark',
    keywords: ['gale crater', 'gale', 'curiosity', 'mount sharp', 'aeolis mons', 'msl'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA MSL Curiosity Science Archive',
    citations: [NASA_CITATIONS.nasaMslCuriosity, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Gale Crater is a 154-km-wide impact basin featuring a 5.5-km-high central sedimentary mound, Aeolis Mons (Mount Sharp), explored by NASA’s Curiosity rover since 2012.',
    details: [
      'Coordinates: 5.37° S, 137.44° E near the Elysium Planitia boundary.',
      'Elevation: -4.5 km relative to the datum.',
      'Scientific significance: Preserves over 1 billion years of early Martian stratigraphy. Curiosity discovered ancient freshwater lake environments containing neutral pH water, essential biogenic elements (C, H, N, O, P, S), and indigenous organic carbon molecules.',
    ],
    navigationTarget: {
      name: 'Gale Crater (Mount Sharp)',
      latitude: -5.37,
      longitude: 137.44,
      altitudeMeters: 180000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Gale Crater',
        latitude: -5.37,
        longitude: 137.44,
        altitudeMeters: 180000,
      },
    },
  },
  victoriaCrater: {
    id: 'victoriaCrater',
    name: 'Victoria Crater',
    category: 'mars_landmark',
    keywords: ['victoria crater', 'victoria', 'opportunity', 'meridiani planum'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA Mars Exploration Rover Opportunity Archive',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Victoria Crater is an 800-meter-wide impact crater in Meridiani Planum explored extensively by NASA’s Opportunity rover from Sol 951 to 1630.',
    details: [
      'Coordinates: 2.05° S, 354.50° E (5.50° W).',
      'Diameter: ~800 meters | Depth: ~75 meters.',
      'Scientific significance: Revealed pristine exposed sedimentary cliff promontories (such as Cape Verde and Duck Bay) showing ancient sulfate-rich eolian sandstones and groundwater percolation.',
    ],
    navigationTarget: {
      name: 'Victoria Crater (Opportunity)',
      latitude: -2.05,
      longitude: 354.50,
      altitudeMeters: 75000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Victoria Crater',
        latitude: -2.05,
        longitude: 354.50,
        altitudeMeters: 75000,
      },
    },
  },
  gusevCrater: {
    id: 'gusevCrater',
    name: 'Gusev Crater',
    category: 'mars_landmark',
    keywords: ['gusev crater', 'gusev', 'spirit', 'columbia hills', 'home plate'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA MER Spirit Science Archive',
    citations: [NASA_CITATIONS.nasaPlanetaryFactSheets, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Gusev Crater is a 166-km-wide crater explored by NASA’s Spirit rover, which discovered past hydrothermal hot springs at Columbia Hills.',
    details: [
      'Coordinates: 14.57° S, 175.47° E.',
      'Scientific significance: While basaltic lava covered the floor, the Columbia Hills revealed rich deposits of pure opaline silica at Home Plate, proving ancient explosive volcanic fumaroles and hydrothermal hot-spring activity.',
    ],
    navigationTarget: {
      name: 'Gusev Crater (Spirit)',
      latitude: -14.57,
      longitude: 175.47,
      altitudeMeters: 120000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Gusev Crater',
        latitude: -14.57,
        longitude: 175.47,
        altitudeMeters: 120000,
      },
    },
  },
  elysiumMons: {
    id: 'elysiumMons',
    name: 'Elysium Mons',
    category: 'mars_landmark',
    keywords: ['elysium mons', 'elysium planitia', 'insight site', 'elysium volcano'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA InSight & MOLA Altimetry',
    citations: [NASA_CITATIONS.nasaInsightPds, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Elysium Mons is a prominent volcanic peak towering 14 km above the surrounding Elysium Planitia, the volcanic province where NASA’s InSight lander operated.',
    details: [
      'Coordinates: 25.02° N, 147.21° E.',
      'Elevation: 14.1 km above the MOLA datum.',
      'Scientific context: The second major volcanic province on Mars after Tharsis. NASA’s InSight lander touched down southwest of Elysium Mons on the smooth plains of Elysium Planitia (4.5° N, 135.6° E), recording over 1,300 marsquakes originating from nearby Cerberus Fossae fissures.',
    ],
    navigationTarget: {
      name: 'Elysium Mons',
      latitude: 25.02,
      longitude: 147.21,
      altitudeMeters: 400000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Elysium Mons',
        latitude: 25.02,
        longitude: 147.21,
        altitudeMeters: 400000,
      },
    },
  },
  hellasPlanitia: {
    id: 'hellasPlanitia',
    name: 'Hellas Planitia',
    category: 'mars_landmark',
    keywords: ['hellas planitia', 'hellas basin', 'deepest basin', 'hellas'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA MOLA Elevation & USGS Astrogeology',
    citations: [NASA_CITATIONS.nasaMarsTreks, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'Hellas Planitia is the deepest impact crater on Mars and one of the largest recognized impact basins in the Solar System.',
    details: [
      'Coordinates: 42.4° S, 70.5° E.',
      'Scale: Approximately 2,300 km in diameter and plunging 7,152 meters below the Martian datum.',
      'Atmospheric physics: Because of its immense depth, the atmospheric pressure at the basin floor reaches ~11.5 millibars (nearly double the global average), allowing water ice to sublime at higher temperatures.',
    ],
    navigationTarget: {
      name: 'Hellas Planitia',
      latitude: -42.4,
      longitude: 70.5,
      altitudeMeters: 950000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'Hellas Planitia',
        latitude: -42.4,
        longitude: 70.5,
        altitudeMeters: 950000,
      },
    },
  },
  polarCaps: {
    id: 'polarCaps',
    name: 'Martian Polar Ice Caps',
    category: 'mars_landmark',
    keywords: ['polar cap', 'north pole', 'south pole', 'planum boreum', 'planum australe', 'ice cap'],
    tier: 'TIER_1_MIRA_DATASET',
    sourceLabel: 'TIER 1: NASA MRO SHARAD & MGS Cryosphere Archives',
    citations: [NASA_CITATIONS.nasaMroSharad, NASA_CITATIONS.usgsMarsNomenclature],
    summary: 'The Martian polar regions host permanent layered ice caps composed of water ice capped with seasonal and perennial carbon dioxide ice.',
    details: [
      'North Polar Cap (Planum Boreum — 85.0° N, 0.0° E): Spans ~1,000 km across; composed almost entirely of water ice with a thin 1-meter seasonal winter frost of solid CO2.',
      'South Polar Cap (Planum Australe — 85.0° S, 0.0° E): Retains a permanent 8-meter-thick slab of solid carbon dioxide ice atop a 3-km-deep water ice reservoir.',
      'Climate records: The fine stratigraphy of polar layered deposits records orbital Milankovitch cycles in Martian obliquity over the past 5 million years.',
    ],
    navigationTarget: {
      name: 'Planum Boreum (North Polar Cap)',
      latitude: 85.0,
      longitude: 0.0,
      altitudeMeters: 800000,
    },
    defaultAction: {
      type: 'NAVIGATE_MARS',
      payload: {
        name: 'North Polar Cap',
        latitude: 85.0,
        longitude: 0.0,
        altitudeMeters: 800000,
      },
    },
  },
};

/**
 * Handle ambiguous or underspecified locations honestly
 */
export function checkAmbiguousLocation(query: string): string | null {
  const q = query.toLowerCase().trim();

  // If query says "fly to the crater" or "take me to crater" without specifying
  if (/^(take me to|fly to|show me|go to)\s+(the\s+)?crater\??$/i.test(q)) {
    return 'Target destination is ambiguous. Which Martian crater would you like to explore?\n\n' +
      '• **Jezero Crater** (18.38° N, 77.58° E) — Perseverance rover landing site and river delta.\n' +
      '• **Gale Crater** (5.37° S, 137.44° E) — Curiosity rover field site at Mount Sharp.\n' +
      '• **Victoria Crater** (2.05° S, 354.50° E) — Opportunity rover exploration site.\n' +
      '• **Gusev Crater** (14.57° S, 175.47° E) — Spirit rover exploration site.\n\n' +
      'Please specify the name or provide numerical coordinates.';
  }

  // If query says "fly to the base" or "take me to base"
  if (/^(take me to|fly to|show me|go to)\s+(the\s+)?base\??$/i.test(q)) {
    return 'Target destination is ambiguous. There are currently no human permanent bases on Mars. Would you like to navigate to an active robotic mission landing site such as **Jezero Crater** (Perseverance), **Gale Crater** (Curiosity), or **Elysium Planitia** (InSight)?';
  }

  // If query says "take me to site" or "fly there" without context
  if (/^(take me to|fly to)\s+(the\s+)?(site|place|location)\??$/i.test(q)) {
    return 'Please provide the landmark name (e.g. Jezero Crater, Olympus Mons, Valles Marineris) or numerical coordinates (e.g. 18.38 N, 77.58 E) to navigate.';
  }

  return null;
}

/**
 * Handle queries requesting unmeasured, unobserved, or unavailable scientific parameters
 */
export function checkMissingOrUnobservedData(query: string): string | null {
  const q = query.toLowerCase();

  // 1. Core/Magma chamber temperature of Olympus Mons today
  if ((q.includes('temperature') || q.includes('magma') || q.includes('chamber')) && q.includes('olympus')) {
    return 'Direct observational measurements of the magma chamber or internal core temperature beneath Olympus Mons do not exist.\n\n' +
      '• **NASA InSight & Orbital Thermal Data:** InSight seismology and Mars Global Surveyor thermal emission spectrometers confirm Olympus Mons is a dormant volcanic edifice with no active surface hydrothermal vents or detected seismic tremors today.\n' +
      '• **Scientific Models:** Geothermal models estimate deep lithospheric temperatures around 1,000°C to 1,300°C at the crust-mantle boundary (~100 to 150 km deep), but in-situ borehole or subsurface temperature probe data does not exist for Olympus Mons.\n\n' +
      '[NASA InSight Planetary Data System Archive](https://pds-geosciences.wustl.edu/missions/insight/)';
  }

  // 2. Population of Mars
  if (q.includes('population') && q.includes('mars')) {
    return 'The permanent human population of Mars is zero. The planet is exclusively inhabited by robotic orbiters, landers, and rovers deployed by space agencies including NASA, ESA, CNSA, and ISRO.\n\n' +
      '[NASA Mars Exploration Program Overview](https://science.nasa.gov/mars/)';
  }

  // 3. Definitive life discovery confirmation
  if ((q.includes('is there life') || q.includes('did we find life') || q.includes('aliens on mars')) && q.includes('mars')) {
    return 'To date, no definitive evidence of extant (living) or past biological organisms has been confirmed on Mars.\n\n' +
      '• **Current Observations:** NASA’s Curiosity and Perseverance rovers have confirmed that ancient Mars had habitable environmental conditions—liquid freshwater lakes, organic carbon molecules, sulfur, nitrogen, oxygen, and phosphorus.\n' +
      '• **Limitation & Ongoing Search:** Biotic versus abiotic origins of detected organic molecules cannot be conclusively distinguished with rover instruments alone. Final confirmation awaits the return and laboratory examination of samples via the Mars Sample Return campaign.\n\n' +
      '[NASA Mars 2020 Astrobiology Goals](https://science.nasa.gov/mission/mars-2020-perseverance/science-goals/)';
  }

  return null;
}
