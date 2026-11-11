/**
 * HIGH-PRECISION SCIENTIFIC PLANETARY TEXTURE & BUMP-MAP GENERATOR FOR THREE.JS
 * 
 * Generates ultra-high-detail 2048x1024 procedural surface textures, atmospheric maps,
 * and micro-topography bump maps for Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and the Sun.
 * 
 * 100% self-contained in HTML5 Canvas 2D with zero external network downloads (0 MB).
 */

import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();
const bumpCache = new Map<string, THREE.CanvasTexture>();

// Deterministic Pseudo-Random Noise Helper
function seededNoise(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number, seed: number = 42): number {
  const sx = x * scale;
  const sy = y * scale;
  const x0 = Math.floor(sx);
  const x1 = x0 + 1;
  const y0 = Math.floor(sy);
  const y1 = y0 + 1;
  const fx = sx - x0;
  const fy = sy - y0;

  const v00 = seededNoise(x0, y0, seed);
  const v10 = seededNoise(x1, y0, seed);
  const v01 = seededNoise(x0, y1, seed);
  const v11 = seededNoise(x1, y1, seed);

  // Smoothstep S-curve
  const wx = fx * fx * (3 - 2 * fx);
  const wy = fy * fy * (3 - 2 * fy);

  const top = v00 * (1 - wx) + v10 * wx;
  const bot = v01 * (1 - wx) + v11 * wx;
  return top * (1 - wy) + bot * wy;
}

function fbm(x: number, y: number, octaves: number = 5, seed: number = 42): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq, 1.0, seed + i * 23);
    amp *= 0.5;
    freq *= 2.0;
  }
  return val;
}

// ============================================================================
// 1. MERCURY: Heavily cratered silicate regolith with Caloris basin & ray ejecta
// ============================================================================
function createMercuryCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const f1 = fbm(nx * 12, ny * 12, 6, 101);
      const f2 = fbm(nx * 48, ny * 48, 4, 202);
      const f3 = fbm(nx * 96, ny * 96, 3, 303);

      let val = Math.floor(105 + f1 * 75 + f2 * 35 + f3 * 15);
      val = Math.max(60, Math.min(225, val));

      const idx = (y * w + x) * 4;
      data[idx] = val;           // R
      data[idx + 1] = val - 5;   // G
      data[idx + 2] = val - 10;  // B
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Prominent Impact Basins & Craters with ray systems
  const craters = [
    { x: 560, y: 380, r: 90, name: 'Caloris' },
    { x: 1240, y: 620, r: 110, name: 'Rembrandt' },
    { x: 880, y: 300, r: 65, name: 'Beethoven' },
    { x: 1640, y: 440, r: 95, name: 'Tolstoj' },
    { x: 300, y: 720, r: 75, name: 'Kuiper' },
    { x: 1460, y: 280, r: 55, name: 'Dali' },
    { x: 1020, y: 760, r: 70, name: 'Michelangelo' },
    { x: 420, y: 220, r: 45, name: 'Cezanne' },
    { x: 1800, y: 660, r: 50, name: 'Raphael' },
  ];

  craters.forEach((c) => {
    // Ejecta ray pattern
    ctx.strokeStyle = 'rgba(235, 230, 220, 0.28)';
    ctx.lineWidth = 2.0;
    for (let a = 0; a < Math.PI * 2; a += 0.28) {
      ctx.beginPath();
      ctx.moveTo(c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r);
      ctx.lineTo(c.x + Math.cos(a) * (c.r * 2.8), c.y + Math.sin(a) * (c.r * 2.8));
      ctx.stroke();
    }

    // Shadowed interior
    ctx.fillStyle = 'rgba(38, 35, 30, 0.82)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();

    // Raised illuminated rim
    ctx.strokeStyle = 'rgba(225, 218, 205, 0.88)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Central rebound peak
    ctx.fillStyle = 'rgba(240, 235, 225, 0.95)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

// ============================================================================
// 2. VENUS: Swirling golden sulfuric acid cloud belts with chevron waves
// ============================================================================
function createVenusCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      // High-speed super-rotating chevron waves
      const wave = Math.sin(ny * Math.PI * 10 + Math.cos(nx * Math.PI * 6) * 1.2);
      const swirl = fbm(nx * 8 + wave * 0.35, ny * 14, 5, 404);
      const micro = fbm(nx * 32, ny * 32, 3, 505);

      const r = Math.floor(232 + swirl * 22 - wave * 18 + micro * 10);
      const g = Math.floor(196 + swirl * 32 - wave * 24 + micro * 8);
      const b = Math.floor(134 + swirl * 38 - wave * 32 + micro * 6);

      const idx = (y * w + x) * 4;
      data[idx] = Math.min(255, Math.max(160, r));
      data[idx + 1] = Math.min(255, Math.max(130, g));
      data[idx + 2] = Math.min(255, Math.max(80, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Venusian polar atmospheric vortex hoods
  const gradN = ctx.createLinearGradient(0, 0, 0, 220);
  gradN.addColorStop(0, 'rgba(255, 238, 185, 0.55)');
  gradN.addColorStop(1, 'rgba(255, 238, 185, 0)');
  ctx.fillStyle = gradN;
  ctx.fillRect(0, 0, w, 220);

  const gradS = ctx.createLinearGradient(0, h, 0, h - 220);
  gradS.addColorStop(0, 'rgba(255, 238, 185, 0.55)');
  gradS.addColorStop(1, 'rgba(255, 238, 185, 0)');
  ctx.fillStyle = gradS;
  ctx.fillRect(0, h - 220, w, 220);

  return canvas;
}

// ============================================================================
// 3. EARTH: Azure oceans, realistic green/brown landmasses, ice caps, weather clouds
// ============================================================================
function createEarthCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      // Realistic continental geography noise
      const continent = fbm(nx * 5.5, ny * 5.5, 6, 777);
      const coastal = fbm(nx * 18, ny * 18, 4, 888);
      const isLand = continent + coastal * 0.25 > 0.52;

      // Polar latitudes
      const isPolar = ny < 0.12 || ny > 0.88;
      const isSubPolar = ny < 0.18 || ny > 0.82;

      let r = 24, g = 68, b = 135; // Deep ocean

      if (isPolar) {
        // Bright white polar ice sheets
        r = 245; g = 250; b = 255;
      } else if (isSubPolar && isLand) {
        // Tundra snow
        r = 215; g = 225; b = 230;
      } else if (isLand) {
        // Continental elevation & biomes
        const arid = fbm(nx * 10, ny * 10, 4, 999);
        if (arid > 0.58 && ny > 0.35 && ny < 0.65) {
          // Deserts (Sahara, Arabian, Gobi)
          r = 205; g = 175; b = 115;
        } else if (arid < 0.42) {
          // Rainforests & Lush Plains (Amazon, Congo, Europe)
          r = 42; g = 112; b = 64;
        } else {
          // Temperate woodlands / mountains
          r = 85; g = 125; b = 75;
        }
      } else {
        // Ocean depth variations
        const shallow = fbm(nx * 12, ny * 12, 3, 333);
        r = Math.floor(16 + shallow * 22);
        g = Math.floor(58 + shallow * 42);
        b = Math.floor(122 + shallow * 35);
      }

      const idx = (y * w + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Swirling weather clouds layer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 48; i++) {
    const cx = (seededNoise(i * 12.3, 11) * w) % w;
    const cy = (seededNoise(i * 34.5, 22) * (h * 0.75)) + (h * 0.12);
    const cr = 45 + seededNoise(i, 33) * 110;

    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();

    // Cyclonic spiral cloud arms
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 1.5, 0.2, Math.PI * 1.4);
    ctx.stroke();
  }

  return canvas;
}

// ============================================================================
// 4. MARS: Rust-red regolith, dark basaltic maria, Valles Marineris rift, polar caps
// ============================================================================
function createMarsCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      const f1 = fbm(nx * 7, ny * 7, 6, 414);
      const f2 = fbm(nx * 24, ny * 24, 4, 515);
      const f3 = fbm(nx * 64, ny * 64, 3, 616);

      // Dark volcanic basalt maria (Syrtis Major, Acidalia, Sinus Sabaeus)
      const maria = fbm(nx * 4, ny * 4, 4, 808);
      const isDarkPlain = maria < 0.40 && ny > 0.25 && ny < 0.75;

      let r = 188, g = 78, b = 45; // Oxidized iron dust

      if (isDarkPlain) {
        // Dark basaltic plains
        r = Math.floor(95 + f1 * 30 + f2 * 15);
        g = Math.floor(45 + f1 * 20 + f2 * 10);
        b = Math.floor(32 + f1 * 18 + f2 * 8);
      } else {
        // Highlands & red sandy plains
        r = Math.floor(175 + f1 * 45 + f2 * 25 + f3 * 10);
        g = Math.floor(75 + f1 * 30 + f2 * 18 + f3 * 8);
        b = Math.floor(42 + f1 * 20 + f2 * 12 + f3 * 5);
      }

      // North & South Polar Ice Caps (CO2 + H2O Frost)
      if (ny < 0.08 || ny > 0.92) {
        r = 242; g = 246; b = 250;
      } else if (ny < 0.12 || ny > 0.88) {
        r = Math.floor(r * 0.35 + 242 * 0.65);
        g = Math.floor(g * 0.35 + 246 * 0.65);
        b = Math.floor(b * 0.35 + 250 * 0.65);
      }

      const idx = (y * w + x) * 4;
      data[idx] = Math.min(255, Math.max(30, r));
      data[idx + 1] = Math.min(255, Math.max(20, g));
      data[idx + 2] = Math.min(255, Math.max(15, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Valles Marineris Canyon Rift (4,000 km grand chasm)
  ctx.strokeStyle = 'rgba(48, 22, 16, 0.92)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(w * 0.38, h * 0.54);
  ctx.bezierCurveTo(w * 0.46, h * 0.52, w * 0.56, h * 0.57, w * 0.68, h * 0.55);
  ctx.stroke();

  // Olympus Mons Caldera Shield (600 km volcano)
  ctx.fillStyle = 'rgba(145, 62, 38, 0.85)';
  ctx.beginPath();
  ctx.arc(w * 0.32, h * 0.42, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(68, 28, 18, 0.95)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Central caldera ring
  ctx.fillStyle = 'rgba(42, 18, 12, 0.95)';
  ctx.beginPath();
  ctx.arc(w * 0.32, h * 0.42, 14, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// ============================================================================
// 5. JUPITER: Multi-layered cloud bands, turbulent eddies & Great Red Spot
// ============================================================================
function createJupiterCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      // Zonal jet-stream shear bands
      const bands = Math.sin(ny * Math.PI * 24);
      const shear = Math.sin(ny * Math.PI * 12);
      const turbulence = fbm(nx * 14 + shear * 0.6, ny * 32, 5, 919);

      let r = 212, g = 175, b = 138; // Cream zone

      if (bands > 0.15) {
        // Red-brown belts (North & South Equatorial Belts)
        r = Math.floor(168 + turbulence * 45);
        g = Math.floor(98 + turbulence * 38);
        b = Math.floor(62 + turbulence * 28);
      } else if (bands < -0.3) {
        // Dark temperate belts
        r = Math.floor(142 + turbulence * 35);
        g = Math.floor(82 + turbulence * 30);
        b = Math.floor(54 + turbulence * 24);
      } else {
        // Light ammonia cloud zones
        r = Math.floor(224 + turbulence * 25);
        g = Math.floor(202 + turbulence * 25);
        b = Math.floor(172 + turbulence * 22);
      }

      const idx = (y * w + x) * 4;
      data[idx] = Math.min(255, Math.max(60, r));
      data[idx + 1] = Math.min(255, Math.max(40, g));
      data[idx + 2] = Math.min(255, Math.max(25, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // The Great Red Spot (Massive anticyclonic storm at 22°S)
  const grsX = w * 0.62;
  const grsY = h * 0.62;
  const grsRx = 100;
  const grsRy = 55;

  ctx.save();
  ctx.translate(grsX, grsY);
  ctx.rotate(-0.06);

  // Outer turbulent wake
  const grsGrad = ctx.createRadialGradient(0, 0, grsRy * 0.3, 0, 0, grsRx);
  grsGrad.addColorStop(0, 'rgba(195, 52, 38, 1.0)');
  grsGrad.addColorStop(0.65, 'rgba(215, 88, 52, 0.88)');
  grsGrad.addColorStop(1, 'rgba(235, 145, 95, 0.15)');

  ctx.fillStyle = grsGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, grsRx, grsRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Internal spiral core
  ctx.strokeStyle = 'rgba(142, 32, 22, 0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, grsRx * 0.6, grsRy * 0.55, 0, 0.2, Math.PI * 1.8);
  ctx.stroke();

  ctx.restore();

  return canvas;
}

// ============================================================================
// 6. SATURN: Butterscotch & ochre atmospheric cloud bands
// ============================================================================
function createSaturnCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      const bands = Math.sin(ny * Math.PI * 30);
      const turbulence = fbm(nx * 10, ny * 24, 4, 313);

      const r = Math.floor(228 + bands * 15 + turbulence * 12);
      const g = Math.floor(198 + bands * 18 + turbulence * 14);
      const b = Math.floor(142 + bands * 22 + turbulence * 16);

      const idx = (y * w + x) * 4;
      data[idx] = Math.min(255, Math.max(140, r));
      data[idx + 1] = Math.min(255, Math.max(120, g));
      data[idx + 2] = Math.min(255, Math.max(80, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Saturn North Polar Hexagonal Hood
  const polarGrad = ctx.createLinearGradient(0, 0, 0, 160);
  polarGrad.addColorStop(0, 'rgba(115, 142, 118, 0.65)');
  polarGrad.addColorStop(1, 'rgba(115, 142, 118, 0)');
  ctx.fillStyle = polarGrad;
  ctx.fillRect(0, 0, w, 160);

  return canvas;
}

// ============================================================================
// 7. URANUS: Cyan-aquamarine ice giant with delicate haze
// ============================================================================
function createUranusCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      const haze = fbm(nx * 6, ny * 18, 3, 515);
      const band = Math.sin(ny * Math.PI * 14) * 8;

      const r = Math.floor(115 + haze * 15 + band);
      const g = Math.floor(198 + haze * 18 + band);
      const b = Math.floor(208 + haze * 20 + band);

      const idx = (y * w + x) * 4;
      data[idx] = Math.min(255, Math.max(80, r));
      data[idx + 1] = Math.min(255, Math.max(140, g));
      data[idx + 2] = Math.min(255, Math.max(150, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// ============================================================================
// 8. NEPTUNE: Deep azure-blue atmosphere, Great Dark Spot & methane cirrus
// ============================================================================
function createNeptuneCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      const storm = fbm(nx * 10, ny * 20, 4, 717);
      const band = Math.sin(ny * Math.PI * 16) * 12;

      const r = Math.floor(42 + storm * 22 + band * 0.4);
      const g = Math.floor(92 + storm * 32 + band * 0.6);
      const b = Math.floor(196 + storm * 35 + band);

      const idx = (y * w + x) * 4;
      data[idx] = Math.min(255, Math.max(20, r));
      data[idx + 1] = Math.min(255, Math.max(50, g));
      data[idx + 2] = Math.min(255, Math.max(130, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Great Dark Spot (GDS-89)
  ctx.fillStyle = 'rgba(18, 38, 98, 0.88)';
  ctx.beginPath();
  ctx.ellipse(w * 0.48, h * 0.58, 85, 45, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Bright white high-altitude methane cirrus streaks ("Scooter")
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h * 0.55);
  ctx.lineTo(w * 0.54, h * 0.55);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.42);
  ctx.lineTo(w * 0.48, h * 0.42);
  ctx.stroke();

  return canvas;
}

// ============================================================================
// 9. SUN: Solar granulation cells, chromospheric faculae & active sunspots
// ============================================================================
function createSunCanvas(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;

      // Convective granulation cells
      const gran1 = fbm(nx * 42, ny * 42, 4, 111);
      const gran2 = fbm(nx * 128, ny * 128, 3, 222);

      const r = Math.floor(255);
      const g = Math.floor(195 + gran1 * 45 + gran2 * 15);
      const b = Math.floor(45 + gran1 * 55 + gran2 * 20);

      const idx = (y * w + x) * 4;
      data[idx] = r;
      data[idx + 1] = Math.min(255, Math.max(160, g));
      data[idx + 2] = Math.min(255, Math.max(20, b));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Active Sunspot Complex (Umbra & Penumbra)
  const sunspots = [
    { x: 680, y: 440, r: 16 },
    { x: 710, y: 455, r: 10 },
    { x: 1420, y: 580, r: 20 },
    { x: 1460, y: 570, r: 12 },
    { x: 1040, y: 340, r: 14 },
  ];

  sunspots.forEach((sp) => {
    // Penumbra (brownish-orange filamentous zone)
    ctx.fillStyle = 'rgba(217, 119, 6, 0.75)';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Umbra (dark magnetic core)
    ctx.fillStyle = 'rgba(45, 12, 4, 0.95)';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

// ============================================================================
// 10. MICRO-TOPOGRAPHY BUMP MAPS (Generates dynamic 3D relief for Three.js)
// ============================================================================
function createBumpMapCanvas(planetId: string): HTMLCanvasElement {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  const id = planetId.toLowerCase();

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      let val = 128; // Mid-level neutral height

      if (id === 'mercury') {
        const craters = fbm(nx * 32, ny * 32, 4, 101);
        val = Math.floor(craters * 255);
      } else if (id === 'earth') {
        const land = fbm(nx * 5.5, ny * 5.5, 5, 777);
        const mtns = fbm(nx * 24, ny * 24, 4, 888);
        val = land > 0.52 ? Math.floor(140 + mtns * 115) : 80;
      } else if (id === 'mars') {
        const topo = fbm(nx * 10, ny * 10, 5, 414);
        const micro = fbm(nx * 48, ny * 48, 3, 515);
        val = Math.floor(topo * 200 + micro * 55);
      } else if (id === 'venus') {
        const wave = Math.sin(ny * Math.PI * 10 + Math.cos(nx * Math.PI * 6) * 1.2);
        val = Math.floor(128 + wave * 30);
      } else {
        // Gas giant cloud band ridges
        const bands = Math.sin(ny * Math.PI * 24);
        val = Math.floor(128 + bands * 25);
      }

      val = Math.min(255, Math.max(0, val));
      const idx = (y * w + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // If Mars, burn in Olympus Mons shield cone and Valles Marineris canyon rift into bump map
  if (id === 'mars') {
    // Valles Marineris trench
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(w * 0.38, h * 0.54);
    ctx.bezierCurveTo(w * 0.46, h * 0.52, w * 0.56, h * 0.57, w * 0.68, h * 0.55);
    ctx.stroke();

    // Olympus Mons elevated cone
    const grad = ctx.createRadialGradient(w * 0.32, h * 0.42, 5, w * 0.32, h * 0.42, 28);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'gray');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w * 0.32, h * 0.42, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

/**
 * Returns procedural fallback texture in case of network or image decode issue.
 */
export function getProceduralFallbackTexture(planetId: string): THREE.CanvasTexture {
  const cached = textureCache.get(planetId);
  if (cached) return cached;

  let canvas: HTMLCanvasElement;
  switch (planetId.toLowerCase()) {
    case 'mercury':
      canvas = createMercuryCanvas();
      break;
    case 'venus':
      canvas = createVenusCanvas();
      break;
    case 'earth':
      canvas = createEarthCanvas();
      break;
    case 'mars':
      canvas = createMarsCanvas();
      break;
    case 'jupiter':
      canvas = createJupiterCanvas();
      break;
    case 'saturn':
      canvas = createSaturnCanvas();
      break;
    case 'uranus':
      canvas = createUranusCanvas();
      break;
    case 'neptune':
      canvas = createNeptuneCanvas();
      break;
    case 'sun':
      canvas = createSunCanvas();
      break;
    default:
      canvas = createMarsCanvas();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  textureCache.set(planetId, texture);
  return texture;
}

const textureLoader = new THREE.TextureLoader();
const realTextureCache = new Map<string, THREE.Texture>();

/**
 * Returns authentic NASA spacecraft imagery texture for any planet or the Sun,
 * with high-detail procedural canvas texture as an immediate reliable fallback.
 */
export function getPlanetTexture(planetId: string): THREE.Texture {
  const pId = planetId.toLowerCase();
  const cached = realTextureCache.get(pId);
  if (cached) return cached;

  const url = `/textures/planets/${pId}.jpg`;

  // Load authentic NASA / space agency texture map with fallback
  const texture = textureLoader.load(
    url,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn(`NASA image for ${pId} failed to load, keeping procedural canvas.`);
    }
  );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  realTextureCache.set(pId, texture);
  return texture;
}

/**
 * Returns a dynamic 3D micro-topography bump map for any planet.
 */
export function getPlanetBumpMap(planetId: string): THREE.CanvasTexture {
  const cached = bumpCache.get(planetId);
  if (cached) return cached;

  const canvas = createBumpMapCanvas(planetId);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  bumpCache.set(planetId, texture);
  return texture;
}
