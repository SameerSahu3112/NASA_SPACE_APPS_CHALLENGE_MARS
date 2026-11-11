import { MarsLandmark } from '../types';

/**
 * AUTHORITATIVE MARS LANDMARKS
 * 
 * Sources:
 * - USGS Astrogeology Science Center / IAU Gazetteer of Planetary Nomenclature
 * - NASA Mars Orbiter Laser Altimeter (MOLA) Science Team
 * - NASA JPL Mars Exploration Program (Perseverance & Curiosity landing coordinates)
 */

export const MARS_LANDMARKS: MarsLandmark[] = [
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    type: 'Shield Volcano (Caldera)',
    latitude: 18.65, // 18° 39' N
    longitude: -133.80, // 133° 48' W
    positiveEastLongitude: 226.20, // 226° 12' E
    diameterKm: 624,
    elevationKm: 21.9, // Peak elevation above MOLA Mars datum (approx. 2.5x Mount Everest)
    description: 'The largest planetary volcano in the Solar System, towering ~22 km above the surrounding plains with a vast 80 km summit caldera complex and an outer basal scarp up to 8 km high.',
    scientificSignificance: 'Formed by effusive basaltic eruptions over billions of years without plate tectonic movement, allowing the volcano to grow directly over a stationary mantle hotspot.',
    recommendedAltitudeMeters: 550_000, // 550 km
    recommendedPitchDegrees: -48,
    recommendedHeadingDegrees: 15,
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    type: 'Canyon System (Chasmata)',
    latitude: -13.90, // Central Melas / Coprates Chasma: 13° 54' S
    longitude: -59.20, // 59° 12' W
    positiveEastLongitude: 300.80, // 300° 48' E
    diameterKm: 4000, // Length
    elevationKm: -7.0, // Depths up to 7-11 km below surrounding plateau
    description: 'A colossal tectonic canyon system stretching over 4,000 km across the Martian equatorial belt—nearly a fifth of Mars circumference and over 4 times deeper than the Grand Canyon.',
    scientificSignificance: 'A major extensional tectonic rift formed in response to crustal loading and flexing during the uplift of the adjacent Tharsis volcanic bulge, subsequently widened by massive landslides and water-carved sapping channels.',
    recommendedAltitudeMeters: 900_000, // 900 km
    recommendedPitchDegrees: -60,
    recommendedHeadingDegrees: 0,
  },
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    type: 'Impact Crater & Paleolake',
    latitude: 18.38, // 18° 23' N
    longitude: 77.58, // 77° 35' E
    positiveEastLongitude: 77.58,
    diameterKm: 49,
    elevationKm: -2.5,
    description: 'Ancient Noachian impact basin located on the western edge of Isidis Planitia. Hosts a prominent river-fed fan delta deposit formed when the crater contained an open-basin lake ~3.7 billion years ago.',
    scientificSignificance: 'Landing site of the NASA Mars 2020 Perseverance Rover and Ingenuity Helicopter. Prime target for astrobiology, delta sedimentology, and Mars Sample Return cache collection.',
    recommendedAltitudeMeters: 140_000, // 140 km
    recommendedPitchDegrees: -70,
    recommendedHeadingDegrees: 0,
  },
  {
    id: 'gale-crater',
    name: 'Gale Crater',
    type: 'Impact Crater & Sedimentary Mound',
    latitude: -5.37, // 5° 22' S
    longitude: 137.44, // 137° 26' E
    positiveEastLongitude: 137.44,
    diameterKm: 154,
    elevationKm: -4.5,
    description: 'Late Noachian impact crater featuring a 5.5 km high central sedimentary mound, Aeolis Mons (Mount Sharp), preserving billions of years of layered Martian climate and aqueous deposition history.',
    scientificSignificance: 'Landing site of the NASA Mars Science Laboratory (Curiosity Rover). Discovered extensive ancient freshwater lacustrine environments with essential elements for microbial habitability and organic molecules.',
    recommendedAltitudeMeters: 180_000, // 180 km
    recommendedPitchDegrees: -65,
    recommendedHeadingDegrees: 0,
  },
  {
    id: 'north-polar-cap',
    name: 'North Polar Cap',
    type: 'Polar Ice Cap (Planum Boreum)',
    latitude: 84.99,
    longitude: 0.0,
    positiveEastLongitude: 0.0,
    diameterKm: 1000,
    elevationKm: 2.0,
    description: 'Permanent water ice and seasonal solid CO2 ice cap covering the north polar region of Mars, surrounded by vast polar erg sand dunes.',
    scientificSignificance: 'Contains millions of cubic kilometers of water ice stratified in fine layers that preserve the climatic history of Mars over the last several million years.',
    recommendedAltitudeMeters: 1_200_000,
    recommendedPitchDegrees: -75,
    recommendedHeadingDegrees: 0,
  },
  {
    id: 'south-polar-cap',
    name: 'South Polar Cap',
    type: 'Polar Ice Cap (Planum Australe)',
    latitude: -85.00,
    longitude: 0.0,
    positiveEastLongitude: 0.0,
    diameterKm: 1400,
    elevationKm: 3.0,
    description: 'Persistent polar ice sheet composed of water ice capped by a perennial 8-meter-thick slab of solid carbon dioxide ice.',
    scientificSignificance: 'Displays unique seasonal geyser eruptions powered by sub-surface CO2 gas venting through translucent ice slabs during southern springtime.',
    recommendedAltitudeMeters: 1_200_000,
    recommendedPitchDegrees: -75,
    recommendedHeadingDegrees: 0,
  },
];

