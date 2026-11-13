# MIRA — Martian Interactive Rendering Atlas
### Phase 1: Realistic Interactive 3D Mars Globe

MIRA (Martian Interactive Rendering Atlas) is a scientific Mars exploration platform. Phase 1 delivers a highly realistic, interactive, scientifically grounded 3D Mars globe powered by **CesiumJS**, **WebGL**, and **NASA Trek WMTS**.

---

## 🚀 Key Features

### 1. Scientifically Grounded Mars Reference Ellipsoids
- **IAU 2015 Cartographic Reference Spheroid (Default, EPSG:104905)**:
  - $R_x = 3,396,190.0\text{ m}$ (Equatorial)
  - $R_y = 3,396,190.0\text{ m}$ (Equatorial)
  - $R_z = 3,376,200.0\text{ m}$ (Polar)
  - Flattening $f = 1 / 169.81 \approx 0.005886$
  - *Source*: IAU/IAG Working Group on Cartographic Coordinates and Rotational Elements (Archinal et al., 2018; Seidelmann et al., 2007; USGS Astrogeology).
  - Exact match for the NASA Trek WMTS EPSG:104905 projection.
- **Folkner / MOLA Triaxial Reference Ellipsoid (Toggleable)**:
  - $R_x = 3,398,600.0\text{ m}$ ($0^\circ$ Prime Meridian)
  - $R_y = 3,393,780.0\text{ m}$ ($90^\circ\text{ E}$)
  - $R_z = 3,376,200.0\text{ m}$ (Polar)
  - *Source*: Folkner et al. (1997, *Science* 278); Smith et al. (2001, *JGR Planets* MOLA solution).
  - Incorporates the genuine $\approx 4.82\text{ km}$ equatorial ellipticity induced by the Tharsis volcanic rise.

### 2. High-Resolution NASA Trek Surface Imagery (WMTS)
- **Layer**: `Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw`
- **Resolution**: 200 meters/pixel photographic shaded-relief mosaic blending NASA MOLA laser altimetry and ESA Mars Express HRSC.
- **RESTful WMTS Tile Template**:
  `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg`
- **Tile Matrix**: `default028mm` (Zoom Levels 0 to 8, Level 0: 2 horizontal × 1 vertical tiles, 256×256 px).
- **Zero Ion Dependency**: No Cesium Ion account, token, or paid API key is required.

> **Texture vs 3D Terrain Notice**: In strict compliance with planetary science rigor, this dataset is applied as high-fidelity visual surface radiance / shaded relief texture. It does **not** extract fabricated numerical elevation from JPEG pixels. MIRA's architecture is fully decoupled, ready for numerical DEM terrain mesh integration in Phase 2.

### 3. Authoritative USGS / NASA Landmark System
Interactive 3D markers and searchable fly-to drawer for major Martian features:
1. **Olympus Mons**: $18.65^\circ\text{ N}, 133.80^\circ\text{ W}$ ($226.20^\circ\text{ E}$) — Peak elevation $+21.9\text{ km}$ above MOLA datum.
2. **Valles Marineris**: $13.90^\circ\text{ S}, 59.20^\circ\text{ W}$ ($300.80^\circ\text{ E}$) — Depths down to $-7.0\text{ km}$ across $4,000\text{ km}$ rift.
3. **Jezero Crater**: $18.38^\circ\text{ N}, 77.58^\circ\text{ E}$ — Ancient river-lake delta explored by NASA Perseverance rover.
4. **Gale Crater**: $5.37^\circ\text{ S}, 137.44^\circ\text{ E}$ — Layered central mound (Aeolis Mons / Mt. Sharp) explored by NASA Curiosity rover.

### 4. Precision Mars Coordinate Telemetry
- **Ray-Ellipsoid Intersection**: Computes geodetic Martian longitude and latitude directly on the Mars ellipsoid when hovering or clicking the planet.
- **Multi-Convention Readout**:
  - Cardinal degrees: e.g. `18.6500° N, 133.8000° W`
  - Signed degrees: `+18.6500°, -133.8000°`
  - Positive East IAU Standard: `226.2000° E`
- **Camera Telemetry**: Real-time altitude (km), heading, pitch, and roll.

### 5. Lighting & Atmosphere
- **Solar Day/Night Terminator**: Realistic directional sunlight with day/night boundary and solar subsolar point tracking.
- **Full Ambient Mode**: Unobstructed global surface visibility for scientific inspection of both hemispheres.
- **Martian Atmospheric Limb Glow**: Calibrated amber/peach Rayleigh & Mie scatter (eliminating Earth's blue atmosphere).

---

## 🛠️ Tech Stack
- **Rendering Engine**: CesiumJS (`cesium` v1.147.0) with WebGL hardware acceleration
- **UI Architecture**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Scientific Typography (`Chakra Petch`, `JetBrains Mono`, `Inter`)
- **Icons**: Lucide React
- **Build Tool**: Vite 8 + `vite-plugin-cesium`

---

## 📦 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in any modern WebGL-capable browser.

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 📜 Attribution
Mars surface imagery: NASA MOLA / HRSC shaded relief, NASA Trek.
Coordinate Reference System: EPSG:104905 (Mars 2000).



---

## 🧭 MIRA Rover Route Planner (Integrated)

The Mars globe now includes a route-planning panel available from the **MIRA ROUTE PLANNER** control.

### Capabilities
- Uses the bundled global MOLA MEGDR binary through the existing `MarsElevationEngine`.
- Accepts start and destination planetocentric latitude/longitude.
- Snaps endpoints to the native 0.25° MOLA grid and reports the snapped coordinates.
- Runs a multi-label Dijkstra search with configurable objective:
  - shortest distance
  - lowest estimated energy
  - fastest estimated travel time
  - balanced distance / energy / time / roughness
- Rejects transitions exceeding the selected maximum slope.
- Supports optional energy and time budgets as hard constraints.
- Computes route distance, approximate energy, approximate time, maximum slope, roughness proxy and explored-node count.
- Draws the resulting route and endpoint markers on the existing Cesium Mars globe.

### Scientific limits — read before presenting results
The bundled global MOLA grid is 0.25° (~14.8 km north-south; east-west spacing decreases toward the poles). This is a global/regional planning dataset, not rover-scale navigation data. It cannot resolve individual rocks, small dunes, wheel-scale hazards, local sand traps or detailed traction conditions. Its roughness metric is only the local standard deviation of sampled elevation.

Energy and speed are simplified estimates using assumed rover mass, rolling resistance, drivetrain efficiency and nominal speed. They are not calibrated to Perseverance, Curiosity, or another rover's telemetry. The planner does not model motor curves, wheel slip, suspension articulation, thermal limits, solar generation, communication windows, radiation, or autonomous hazard-camera observations.

The vertical terrain provider currently applies 2x vertical exaggeration for visualization; route geometry is lifted above the displayed terrain to remain visible. This is a visualization choice, not a change to the elevation values used by the planner.

### How to use
1. Run `npm install` and `npm run dev` as usual.
2. Open the Mars globe tab.
3. Click **MIRA ROUTE PLANNER** at the lower-right.
4. Enter start and target latitude/longitude.
5. Choose the route objective and rover constraints.
6. Click **CALCULATE OPTIMAL ROUTE**.
7. Review the metrics and the orange route drawn on Mars.

### Planner implementation
- `src/services/elevation/marsRoutePlanner.ts`: MOLA sampling, terrain roughness proxy, slope checks, energy/time estimates, multi-label Dijkstra.
- `src/components/RoutePlanner/MarsRoutePlanner.tsx`: planner controls, metrics and Cesium route rendering.
- `src/App.tsx`: mounts the route planner alongside the existing Mars globe.
- No additional runtime dependencies or backend server are required for this integrated version.

### Before claiming operational rover safety
Replace or supplement the global MOLA grid with a regional high-resolution DEM (e.g. a validated HiRISE/HRSC stereo DTM), use a consistent map projection and vertical datum, include mapped obstacles and uncertainty, and calibrate the mobility/energy model against a named rover. Treat this planner as a science-demo prototype until those validations are complete.
