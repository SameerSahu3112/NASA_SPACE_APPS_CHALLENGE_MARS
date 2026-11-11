import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { CameraTelemetry } from '../../types';

interface SpaceBackgroundProps {
  viewer?: Cesium.Viewer | null;
  telemetry: CameraTelemetry;
  lightingMode?: 'solar' | 'ambient';
}

interface SpiralGalaxyNode {
  v: [number, number, number];
  baseRadius: number;
  tiltAngle: number;
  rollAngle: number;
  coreColor: string;
  armColor: string;
  dustColor: string;
}

interface HDNebulaCloud {
  v: [number, number, number];
  baseRadius: number;
  src: string;
  name: string;
  opacity: number;
}

// Initial reference camera orientation when looking at Mars center from Lat 8°, Lon 0°
const D0: [number, number, number] = [-0.990268, 0, -0.139173]; // Camera Look Direction
const R0: [number, number, number] = [0, 1, 0];                  // Camera Right (East)
const U0: [number, number, number] = [-0.139173, 0, 0.990268];  // Camera Up (North)
const REF_FOVY = Math.PI / 3;                                   // 60 degrees vertical FOV
const REF_ASPECT = 16 / 9;

// Convert normalized 2D reference screen coordinates (sx, sy in [0, 1]) to a 3D unit vector on the celestial sphere
function screenToCelestialVector(sx: number, sy: number): [number, number, number] {
  const tanHalf = Math.tan(REF_FOVY / 2);
  const dx = (sx - 0.5) * 2 * tanHalf * REF_ASPECT;
  const dy = (0.5 - sy) * 2 * tanHalf;
  const dz = 1.0;

  const vx = dz * D0[0] + dx * R0[0] + dy * U0[0];
  const vy = dz * D0[1] + dx * R0[1] + dy * U0[1];
  const vz = dz * D0[2] + dx * R0[2] + dy * U0[2];
  const len = Math.hypot(vx, vy, vz) || 1.0;

  return [vx / len, vy / len, vz / len];
}

// Convert spherical coordinates (azimuth 0-360°, elevation -90° to +90°) to a 3D unit vector on the celestial sphere
function sphericalToVector(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const theta = (azimuthDeg * Math.PI) / 180;
  const phi = (elevationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  return [
    cosPhi * Math.cos(theta),
    cosPhi * Math.sin(theta),
    Math.sin(phi),
  ];
}

const VS_SOURCE = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FS_SOURCE = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec3 u_dir;
uniform vec3 u_right;
uniform vec3 u_up;
uniform float u_tanHalf;
uniform float u_aspect;

#define PI 3.14159265358979323846

void main() {
  vec2 ndc = (v_uv - 0.5) * 2.0;
  float dx = ndc.x * u_aspect * u_tanHalf;
  float dy = ndc.y * u_tanHalf;

  vec3 ray = normalize(u_dir + dx * u_right + dy * u_up);

  // Celestial sphere spherical coordinates (Z is North in Cesium world frame)
  float phi = asin(clamp(ray.z, -1.0, 1.0));
  float theta = atan(ray.y, ray.x);

  float u = theta / (2.0 * PI) + 0.5;
  float v = 0.5 + phi / PI;

  vec4 col = texture2D(u_texture, vec2(u, v));

  // Contrast & brilliance enhancement for cinematic deep space
  vec3 rgb = col.rgb;
  rgb = pow(rgb, vec3(1.10)); // Deep obsidian contrast
  rgb *= 1.35;                // Radiant stars and nebular luminescence

  gl_FragColor = vec4(rgb, 1.0);
}
`;

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ 
  viewer, 
  lightingMode = 'ambient' 
}) => {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Pre-calculate fixed 3D vectors for celestial bodies based on astronomical layout
  const celestialBodiesRef = useRef({
    mercury: screenToCelestialVector(0.052, 0.265),
    venus: screenToCelestialVector(0.165, 0.315),
    cyanBody: screenToCelestialVector(0.110, 0.205), // Uranus
    jupiter: screenToCelestialVector(0.095, 0.752),
    europa: screenToCelestialVector(0.186, 0.712),
    neptune: screenToCelestialVector(0.725, 0.192),
    saturn: screenToCelestialVector(0.868, 0.195),
    earth: screenToCelestialVector(0.925, 0.472),
  });

  // Distant Spiral Galaxies distributed across deep space
  const spiralGalaxiesRef = useRef<SpiralGalaxyNode[]>([
    {
      v: sphericalToVector(195, -20),
      baseRadius: 24,
      tiltAngle: 0.58,
      rollAngle: -0.42,
      coreColor: '#ffedd5',
      armColor: '#93c5fd',
      dustColor: '#1c0a04',
    },
    {
      v: sphericalToVector(145, 25),
      baseRadius: 20,
      tiltAngle: 0.85,
      rollAngle: 0.60,
      coreColor: '#fdf4ff',
      armColor: '#c084fc',
      dustColor: '#1e0b24',
    },
    {
      v: sphericalToVector(170, 48),
      baseRadius: 14,
      tiltAngle: 1.35,
      rollAngle: -0.35,
      coreColor: '#fffbeb',
      armColor: '#cbd5e1',
      dustColor: '#0f172a',
    },
    {
      v: sphericalToVector(355, 12),
      baseRadius: 22,
      tiltAngle: 0.70,
      rollAngle: 0.35,
      coreColor: '#fef08a',
      armColor: '#a5b4fc',
      dustColor: '#1e1b4b',
    },
  ]);

  // High-Definition NASA/JWST Deep Space Nebula Formations
  // Distributed uniformly throughout the entire 3D celestial sphere (360° horizontally & full elevation)
  // Subtle, diffuse opacities (0.24 - 0.32) for authentic deep-space scale and depth
  const hdNebulaeRef = useRef<HDNebulaCloud[]>([
    // --- Sector 1: Front-Right Sky (Visible right of Mars - Soft Rosette Cosmic Cloud) ---
    {
      v: sphericalToVector(155, -14),
      baseRadius: 105,
      src: '/nebulae/rosette.jpg',
      name: 'Rosette Cosmic Emission Cloud',
      opacity: 0.28,
    },
    // --- Sector 2: Front-Upper Sky (Visible above Mars - Ethereal Orion Cloud) ---
    {
      v: sphericalToVector(205, 24),
      baseRadius: 95,
      src: '/nebulae/orion.jpg',
      name: 'Orion Nebula (M42)',
      opacity: 0.28,
    },
    // --- Sector 3: Front-Lower Sky (Visible beneath Mars - Diffuse Supernova Shell) ---
    {
      v: sphericalToVector(175, -34),
      baseRadius: 100,
      src: '/nebulae/crab.jpg',
      name: 'Crab Filamentary Shell',
      opacity: 0.25,
    },
    // --- Sector 4: East Sky (Turn 90° right) ---
    {
      v: sphericalToVector(105, 12),
      baseRadius: 110,
      src: '/nebulae/rosette.jpg',
      name: 'Rosette Nebula (East)',
      opacity: 0.30,
    },
    // --- Sector 5: East-South Sky ---
    {
      v: sphericalToVector(85, -28),
      baseRadius: 95,
      src: '/nebulae/crab.jpg',
      name: 'Crab Nebula (East-South)',
      opacity: 0.25,
    },
    // --- Sector 6: North Polar Sky (High Zenith) ---
    {
      v: sphericalToVector(145, 52),
      baseRadius: 105,
      src: '/nebulae/orion.jpg',
      name: 'Northern Orion Veil',
      opacity: 0.26,
    },
    // --- Sector 7: South Polar Sky (Deep Nadir) ---
    {
      v: sphericalToVector(215, -55),
      baseRadius: 110,
      src: '/nebulae/orion.jpg',
      name: 'Southern Reaches Orion',
      opacity: 0.25,
    },
    // --- Sector 8: West Sky (Turn 90° left) ---
    {
      v: sphericalToVector(265, 18),
      baseRadius: 115,
      src: '/nebulae/rosette.jpg',
      name: 'Rosette Western Spur',
      opacity: 0.28,
    },
    // --- Sector 9: West-South Sky ---
    {
      v: sphericalToVector(285, -22),
      baseRadius: 100,
      src: '/nebulae/crab.jpg',
      name: 'Crab Western Arm',
      opacity: 0.25,
    },
    // --- Sector 10: Rear Sky (Turn 180° directly opposite to Mars) ---
    {
      v: sphericalToVector(5, 15),
      baseRadius: 115,
      src: '/nebulae/orion.jpg',
      name: 'Deep Core Orion Vista',
      opacity: 0.30,
    },
    // --- Sector 11: Rear-Left Sky ---
    {
      v: sphericalToVector(335, -16),
      baseRadius: 90,
      src: '/nebulae/crab.jpg',
      name: 'Crab Nebula Expanding Shell',
      opacity: 0.24,
    },
    // --- Sector 12: Rear-Right Sky ---
    {
      v: sphericalToVector(35, 26),
      baseRadius: 110,
      src: '/nebulae/rosette.jpg',
      name: 'Rosette Cosmic Vista',
      opacity: 0.28,
    },
  ]);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!glCanvas || !overlayCanvas) return;

    // 1. Initialize WebGL Context
    const gl = (glCanvas.getContext('webgl2', { alpha: false, antialias: false }) ||
                glCanvas.getContext('webgl', { alpha: false, antialias: false })) as WebGLRenderingContext | null;

    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;

    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let quadBuffer: WebGLBuffer | null = null;

    let uDirLoc: WebGLUniformLocation | null = null;
    let uRightLoc: WebGLUniformLocation | null = null;
    let uUpLoc: WebGLUniformLocation | null = null;
    let uTanHalfLoc: WebGLUniformLocation | null = null;
    let uAspectLoc: WebGLUniformLocation | null = null;
    let uTexLoc: WebGLUniformLocation | null = null;

    if (gl) {
      // Compile Shaders
      const compileShader = (type: number, src: string): WebGLShader | null => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
      const fs = compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);

      if (vs && fs) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            program = null;
          } else {
            gl.useProgram(program);
            uDirLoc = gl.getUniformLocation(program, 'u_dir');
            uRightLoc = gl.getUniformLocation(program, 'u_right');
            uUpLoc = gl.getUniformLocation(program, 'u_up');
            uTanHalfLoc = gl.getUniformLocation(program, 'u_tanHalf');
            uAspectLoc = gl.getUniformLocation(program, 'u_aspect');
            uTexLoc = gl.getUniformLocation(program, 'u_texture');
          }
        }
      }

      // Full-screen Quad Buffer
      const quadVertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);

      quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

      if (program) {
        const posAttr = gl.getAttribLocation(program, 'a_pos');
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
      }

      // WebGL Texture Setup
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Temporary 1x1 black pixel while loading
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([1, 2, 6, 255])
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Progressive High-Definition Texture Loading:
      const loadTexture = (url: string, onComplete?: () => void) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!gl || !texture) return;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          if (onComplete) onComplete();
        };
        img.src = url;
      };

      loadTexture('/milkyway-4k.jpg', () => {
        const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
        if (maxTexSize >= 8192) {
          loadTexture('/milkyway-8k.jpg');
        }
      });
    }

    // Preload and feather unique high-definition nebula images onto offscreen canvases
    const featheredNebulaeCanvases: Map<string, HTMLCanvasElement> = new Map();
    const uniqueNebulaSrcs = Array.from(new Set(hdNebulaeRef.current.map(n => n.src)));

    uniqueNebulaSrcs.forEach(src => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const off = document.createElement('canvas');
        off.width = img.width;
        off.height = img.height;
        const octx = off.getContext('2d');
        if (octx) {
          octx.drawImage(img, 0, 0);

          // Apply authentic cosmic feathering:
          // Opacity is 0 at outer boundaries and increases linearly as we move inward
          octx.globalCompositeOperation = 'destination-in';
          const cx = img.width / 2;
          const cy = img.height / 2;
          const maxR = Math.min(cx, cy);
          const mask = octx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
          mask.addColorStop(0.00, 'rgba(0, 0, 0, 1.0)'); // Peak opacity at center
          mask.addColorStop(0.15, 'rgba(0, 0, 0, 0.85)');
          mask.addColorStop(0.35, 'rgba(0, 0, 0, 0.65)');
          mask.addColorStop(0.55, 'rgba(0, 0, 0, 0.45)');
          mask.addColorStop(0.75, 'rgba(0, 0, 0, 0.25)');
          mask.addColorStop(0.90, 'rgba(0, 0, 0, 0.10)');
          mask.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');  // Zero opacity at boundary
          octx.fillStyle = mask;
          octx.fillRect(0, 0, img.width, img.height);
        }
        featheredNebulaeCanvases.set(src, off);
      };
      img.src = src;
    });

    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;

    const setupCanvases = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;

      // WebGL Canvas
      glCanvas.width = Math.floor(cssWidth * dpr);
      glCanvas.height = Math.floor(cssHeight * dpr);
      glCanvas.style.width = `${cssWidth}px`;
      glCanvas.style.height = `${cssHeight}px`;

      if (gl) {
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }

      // Overlay 2D Canvas
      overlayCanvas.width = Math.floor(cssWidth * dpr);
      overlayCanvas.height = Math.floor(cssHeight * dpr);
      overlayCanvas.style.width = `${cssWidth}px`;
      overlayCanvas.style.height = `${cssHeight}px`;

      overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
      overlayCtx.scale(dpr, dpr);
    };

    setupCanvases();
    window.addEventListener('resize', setupCanvases);

    // 3D Celestial Projection Function for 2D Overlay
    const project = (
      V: [number, number, number],
      D: [number, number, number],
      R: [number, number, number],
      U: [number, number, number],
      focal: number,
      w: number,
      h: number
    ): { x: number; y: number; visible: boolean; cz: number } => {
      const cz = V[0] * D[0] + V[1] * D[1] + V[2] * D[2];
      if (cz <= 0.05) return { x: 0, y: 0, visible: false, cz };

      const cx = V[0] * R[0] + V[1] * R[1] + V[2] * R[2];
      const cy = V[0] * U[0] + V[1] * U[1] + V[2] * U[2];

      const x = w / 2 + (cx / cz) * focal;
      const y = h / 2 - (cy / cz) * focal;

      return {
        x,
        y,
        visible: x >= -450 && x <= w + 450 && y >= -450 && y <= h + 450,
        cz,
      };
    };

    // Helper: Draw Parametric Spiral Galaxy
    const drawSpiralGalaxy = (
      g: SpiralGalaxyNode,
      p: { x: number; y: number; cz: number },
      focalScale: number
    ) => {
      const r = g.baseRadius * focalScale;
      if (r < 3) return;

      overlayCtx.save();
      overlayCtx.translate(p.x, p.y);
      overlayCtx.rotate(g.rollAngle);
      overlayCtx.scale(1.0, Math.cos(g.tiltAngle));

      const haloGrad = overlayCtx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.15);
      haloGrad.addColorStop(0, g.coreColor);
      haloGrad.addColorStop(0.35, g.armColor);
      haloGrad.addColorStop(0.8, 'rgba(59, 130, 246, 0.06)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      overlayCtx.fillStyle = haloGrad;
      overlayCtx.beginPath();
      overlayCtx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
      overlayCtx.fill();

      const numPoints = 65;
      const armGrowth = 0.22;
      for (let arm = 0; arm < 2; arm++) {
        const armOffset = arm * Math.PI;
        overlayCtx.beginPath();
        for (let j = 0; j < numPoints; j++) {
          const theta = (j / numPoints) * Math.PI * 2.2;
          const dist = (r * 0.12) * Math.exp(armGrowth * theta);
          if (dist > r) break;
          const ax = Math.cos(theta + armOffset) * dist;
          const ay = Math.sin(theta + armOffset) * dist;
          if (j === 0) overlayCtx.moveTo(ax, ay);
          else overlayCtx.lineTo(ax, ay);
        }
        overlayCtx.strokeStyle = g.armColor;
        overlayCtx.lineWidth = Math.max(1.2, r * 0.08);
        overlayCtx.globalAlpha = 0.55;
        overlayCtx.stroke();

        overlayCtx.fillStyle = '#f472b6';
        for (let k = 15; k < numPoints; k += 8) {
          const theta = (k / numPoints) * Math.PI * 2.2;
          const dist = (r * 0.12) * Math.exp(armGrowth * theta);
          if (dist > r * 0.95) break;
          const kx = Math.cos(theta + armOffset) * dist;
          const ky = Math.sin(theta + armOffset) * dist;
          overlayCtx.beginPath();
          overlayCtx.arc(kx, ky, Math.max(0.6, r * 0.03), 0, Math.PI * 2);
          overlayCtx.fill();
        }
      }

      overlayCtx.globalAlpha = 0.95;
      const coreGrad = overlayCtx.createRadialGradient(0, 0, 0, 0, 0, r * 0.28);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, g.coreColor);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      overlayCtx.fillStyle = coreGrad;
      overlayCtx.beginPath();
      overlayCtx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      overlayCtx.fill();

      overlayCtx.globalAlpha = 0.35;
      overlayCtx.fillStyle = g.dustColor;
      overlayCtx.beginPath();
      overlayCtx.ellipse(r * 0.08, r * 0.06, r * 0.45, r * 0.08, 0.2, 0, Math.PI * 2);
      overlayCtx.fill();

      overlayCtx.restore();
      overlayCtx.globalAlpha = 1.0;
    };

    const render = () => {
      // Extract LIVE camera vectors from Cesium viewer
      let D: [number, number, number] = D0;
      let R: [number, number, number] = R0;
      let U: [number, number, number] = U0;
      let fovy = REF_FOVY;

      if (viewer && !viewer.isDestroyed() && viewer.camera) {
        const cam = viewer.camera;
        const dWC = cam.directionWC || cam.direction;
        const rWC = cam.rightWC || cam.right;
        const uWC = cam.upWC || cam.up;

        if (dWC && rWC && uWC) {
          D = [dWC.x, dWC.y, dWC.z];
          R = [rWC.x, rWC.y, rWC.z];
          U = [uWC.x, uWC.y, uWC.z];
        }

        if (cam.frustum && 'fovy' in cam.frustum && typeof cam.frustum.fovy === 'number') {
          fovy = cam.frustum.fovy;
        }
      }

      const tanHalf = Math.tan(fovy / 2);
      const aspect = cssWidth / cssHeight;
      const focal = (cssHeight / 2) / tanHalf;
      const focalScale = focal / ((cssHeight / 2) / Math.tan(REF_FOVY / 2));

      // =========================================================================
      // 1. WEBGL ULTRA-HIGH-DEFINITION 8K MILKY WAY SKY SPHERE RENDER
      // =========================================================================
      if (gl && program && texture && quadBuffer) {
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        if (uDirLoc) gl.uniform3f(uDirLoc, D[0], D[1], D[2]);
        if (uRightLoc) gl.uniform3f(uRightLoc, R[0], R[1], R[2]);
        if (uUpLoc) gl.uniform3f(uUpLoc, U[0], U[1], U[2]);
        if (uTanHalfLoc) gl.uniform1f(uTanHalfLoc, tanHalf);
        if (uAspectLoc) gl.uniform1f(uAspectLoc, aspect);
        if (uTexLoc) gl.uniform1i(uTexLoc, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // =========================================================================
      // 2. OVERLAY 2D CANVAS: HIGH-DEFINITION NEBULAE, GALAXIES & PLANETS
      // =========================================================================
      overlayCtx.clearRect(0, 0, cssWidth, cssHeight);

      // --- A. Render High-Definition NASA/JWST Cosmic Nebula Clouds ---
      const nebulae = hdNebulaeRef.current;
      for (let i = 0; i < nebulae.length; i++) {
        const neb = nebulae[i];
        const offCanvas = featheredNebulaeCanvases.get(neb.src);
        if (!offCanvas) continue;

        const p = project(neb.v, D, R, U, focal, cssWidth, cssHeight);
        if (p.visible) {
          const rad = neb.baseRadius * focalScale;
          overlayCtx.save();
          overlayCtx.globalCompositeOperation = 'screen';
          overlayCtx.globalAlpha = neb.opacity;
          overlayCtx.drawImage(offCanvas, p.x - rad, p.y - rad, rad * 2, rad * 2);
          overlayCtx.restore();
        }
      }

      // --- B. Distant Spiral Galaxies ---
      const galaxies = spiralGalaxiesRef.current;
      for (let i = 0; i < galaxies.length; i++) {
        const g = galaxies[i];
        const p = project(g.v, D, R, U, focal, cssWidth, cssHeight);
        if (p.visible) {
          drawSpiralGalaxy(g, p, focalScale);
        }
      }

      // --- C. Celestial Bodies (Planets & Actual Sun strictly proportional to NASA data) ---
      const cb = celestialBodiesRef.current;

      // Dynamically obtain the ACTUAL astronomical Sun position vector from Cesium
      let actualSunVector: [number, number, number] | null = null;
      if (viewer && !viewer.isDestroyed() && viewer.scene) {
        const uState = (viewer.scene as any).context?.uniformState;
        if (uState?.sunDirectionWC) {
          const s = uState.sunDirectionWC;
          if (s.x !== 0 || s.y !== 0 || s.z !== 0) {
            actualSunVector = [s.x, s.y, s.z];
          }
        }
        if (!actualSunVector && viewer.clock) {
          try {
            const time = viewer.clock.currentTime;
            const posInertial = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(time);
            if (posInertial) {
              const m = Cesium.Transforms.computeIcrfToFixedMatrix(time);
              let pFixed = posInertial;
              if (m) {
                pFixed = Cesium.Matrix3.multiplyByVector(m, posInertial, new Cesium.Cartesian3());
              }
              const mag = Cesium.Cartesian3.magnitude(pFixed);
              if (mag > 0) {
                actualSunVector = [pFixed.x / mag, pFixed.y / mag, pFixed.z / mag];
              }
            }
          } catch {}
        }
      }

      // Fallback if viewer is still establishing initial orientation
      if (!actualSunVector) {
        actualSunVector = [-0.15, 0.98, 0.05];
      }

      const sunP = project(actualSunVector, D, R, U, focal, cssWidth, cssHeight);

      const getLightAngle = (px: number, py: number): number => {
        return Math.atan2(sunP.y - py, sunP.x - px);
      };

      const isSolar = lightingMode === 'solar';
      const shadowDarkness = isSolar ? 'rgba(0, 0, 0, 0.90)' : 'rgba(0, 0, 0, 0.65)';

      // STRICT NASA PROPORTIONAL RADII IN MARS SKY VIEW
      // Base Earth radius in celestial view = 4.2 px (Earth diameter = 12,742 km)
      // Jupiter: 11.0x Earth diameter (21.0 px)
      // Saturn:   9.1x Earth diameter (17.5 px, rings 22 to 40 px)
      // Uranus:   4.0x Earth diameter ( 7.6 px)
      // Neptune:  3.9x Earth diameter ( 7.4 px)
      // Venus:    0.95x Earth diameter ( 4.0 px)
      // Mercury:  0.38x Earth diameter ( 1.6 px)
      // Moon:     0.27x Earth diameter ( 1.15 px)
      // Sun:      Dominant solar disk in sky (46.0 px with radiant corona)

      // 0. Radiant Central Sun in Mars View
      if (sunP.visible) {
        const sunR = 46.0;
        overlayCtx.save();

        // Expansive Solar Corona
        const coronaGrad = overlayCtx.createRadialGradient(sunP.x, sunP.y, sunR * 0.35, sunP.x, sunP.y, sunR * 2.8);
        coronaGrad.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
        coronaGrad.addColorStop(0.20, 'rgba(254, 240, 138, 0.60)');
        coronaGrad.addColorStop(0.50, 'rgba(245, 158, 11, 0.22)');
        coronaGrad.addColorStop(0.85, 'rgba(217, 119, 6, 0.05)');
        coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        overlayCtx.fillStyle = coronaGrad;
        overlayCtx.beginPath();
        overlayCtx.arc(sunP.x, sunP.y, sunR * 2.8, 0, Math.PI * 2);
        overlayCtx.fill();

        // Brilliant Solar Photosphere Disk
        const sunDisk = overlayCtx.createRadialGradient(sunP.x, sunP.y, 0, sunP.x, sunP.y, sunR);
        sunDisk.addColorStop(0, '#ffffff');
        sunDisk.addColorStop(0.65, '#fef08a');
        sunDisk.addColorStop(1, '#f59e0b');
        overlayCtx.fillStyle = sunDisk;
        overlayCtx.beginPath();
        overlayCtx.arc(sunP.x, sunP.y, sunR, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.restore();
      }

      // 1. Jupiter (strictly 11.0x Earth diameter -> 21.0 px)
      const jupP = project(cb.jupiter, D, R, U, focal, cssWidth, cssHeight);
      if (jupP.visible) {
        const jupR = 21.0;
        const lightAngle = getLightAngle(jupP.x, jupP.y);

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(jupP.x, jupP.y, jupR, 0, Math.PI * 2);
        overlayCtx.clip();

        overlayCtx.fillStyle = '#f7f1e7';
        overlayCtx.fillRect(jupP.x - jupR, jupP.y - jupR, jupR * 2, jupR * 2);

        const jupBelts = [
          { y: -17.5, h: 3.2, c: '#9a6b47' },
          { y: -13.0, h: 3.0, c: '#e5d7c3' },
          { y: -8.8, h: 4.8, c: '#b87b4f' },
          { y: -2.5, h: 3.0, c: '#f5ebdc' },
          { y: 1.8, h: 4.6, c: '#8e4925' },
          { y: 7.5, h: 3.2, c: '#eadcc9' },
          { y: 11.5, h: 3.6, c: '#ab7045' },
          { y: 16.0, h: 3.0, c: '#7a4524' },
        ];
        for (const b of jupBelts) {
          overlayCtx.fillStyle = b.c;
          overlayCtx.fillRect(jupP.x - jupR, jupP.y + b.y, jupR * 2, b.h);
        }

        // Great Red Spot
        overlayCtx.fillStyle = '#c2410c';
        overlayCtx.beginPath();
        overlayCtx.ellipse(jupP.x + 4.5, jupP.y + 4.0, 4.4, 2.6, 0, 0, Math.PI * 2);
        overlayCtx.fill();

        const hx = jupP.x + Math.cos(lightAngle) * (jupR * 0.4);
        const hy = jupP.y + Math.sin(lightAngle) * (jupR * 0.4);

        const jupShade = overlayCtx.createRadialGradient(hx, hy, 1, jupP.x, jupP.y, jupR * 1.15);
        jupShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
        jupShade.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
        jupShade.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = jupShade;
        overlayCtx.fillRect(jupP.x - jupR, jupP.y - jupR, jupR * 2, jupR * 2);
        overlayCtx.restore();

        // Galilean Moon Europa
        const eurP = project(cb.europa, D, R, U, focal, cssWidth, cssHeight);
        if (eurP.visible) {
          overlayCtx.fillStyle = '#f8fafc';
          overlayCtx.beginPath();
          overlayCtx.arc(eurP.x, eurP.y, 1.8, 0, Math.PI * 2);
          overlayCtx.fill();
        }
      }

      // 2. Saturn (strictly 9.1x Earth diameter -> 17.5 px, rings to 42 px)
      const satP = project(cb.saturn, D, R, U, focal, cssWidth, cssHeight);
      if (satP.visible) {
        const satR = 17.5;
        const ringInner = 22.0;
        const ringOuter = 42.0;
        const ringTiltAngle = -0.38;
        const ringScaleY = 0.36;
        const lightAngle = getLightAngle(satP.x, satP.y);

        const drawFullRings = () => {
          overlayCtx.save();
          overlayCtx.translate(satP.x, satP.y);
          overlayCtx.rotate(ringTiltAngle);
          overlayCtx.scale(1.0, ringScaleY);

          overlayCtx.beginPath();
          overlayCtx.arc(0, 0, ringOuter, 0, Math.PI * 2);
          overlayCtx.arc(0, 0, ringOuter * 0.85, 0, Math.PI * 2, true);
          overlayCtx.fillStyle = 'rgba(212, 191, 153, 0.82)';
          overlayCtx.fill();

          overlayCtx.beginPath();
          overlayCtx.arc(0, 0, ringOuter * 0.85, 0, Math.PI * 2);
          overlayCtx.arc(0, 0, ringOuter * 0.80, 0, Math.PI * 2, true);
          overlayCtx.fillStyle = 'rgba(1, 2, 6, 0.95)';
          overlayCtx.fill();

          overlayCtx.beginPath();
          overlayCtx.arc(0, 0, ringOuter * 0.80, 0, Math.PI * 2);
          overlayCtx.arc(0, 0, ringInner, 0, Math.PI * 2, true);
          overlayCtx.fillStyle = 'rgba(240, 222, 185, 0.92)';
          overlayCtx.fill();

          overlayCtx.restore();
        };

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.rect(0, 0, cssWidth, satP.y);
        overlayCtx.clip();
        drawFullRings();
        overlayCtx.restore();

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(satP.x, satP.y, satR, 0, Math.PI * 2);
        overlayCtx.clip();

        overlayCtx.fillStyle = '#edd6b1';
        overlayCtx.fillRect(satP.x - satR, satP.y - satR, satR * 2, satR * 2);

        const satBands = [
          { y: -13.5, h: 2.8, c: '#c8a87b' },
          { y: -8.5, h: 3.5, c: '#ebd8ba' },
          { y: -1.5, h: 4.2, c: '#baa077' },
          { y: 4.5, h: 3.6, c: '#e6cfab' },
          { y: 9.5, h: 4.0, c: '#b39568' },
        ];
        for (const b of satBands) {
          overlayCtx.fillStyle = b.c;
          overlayCtx.fillRect(satP.x - satR, satP.y + b.y, satR * 2, b.h);
        }

        const hx = satP.x + Math.cos(lightAngle) * (satR * 0.4);
        const hy = satP.y + Math.sin(lightAngle) * (satR * 0.4);

        const satShade = overlayCtx.createRadialGradient(hx, hy, 1, satP.x, satP.y, satR * 1.15);
        satShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
        satShade.addColorStop(0.5, 'rgba(0, 0, 0, 0.20)');
        satShade.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = satShade;
        overlayCtx.fillRect(satP.x - satR, satP.y - satR, satR * 2, satR * 2);
        overlayCtx.restore();

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.rect(0, satP.y, cssWidth, cssHeight - satP.y);
        overlayCtx.clip();
        drawFullRings();

        overlayCtx.save();
        overlayCtx.translate(satP.x, satP.y);
        overlayCtx.rotate(ringTiltAngle);
        overlayCtx.scale(1.0, ringScaleY);
        overlayCtx.beginPath();
        overlayCtx.ellipse(-1.5, 0, satR * 1.05, satR * 0.95, 0, 0, Math.PI * 2);
        overlayCtx.fillStyle = shadowDarkness;
        overlayCtx.fill();
        overlayCtx.restore();

        overlayCtx.restore();
      }

      // 3. Neptune (strictly 3.9x Earth diameter -> 7.4 px)
      const nepP = project(cb.neptune, D, R, U, focal, cssWidth, cssHeight);
      if (nepP.visible) {
        const nepR = 7.4;
        const lightAngle = getLightAngle(nepP.x, nepP.y);

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(nepP.x, nepP.y, nepR, 0, Math.PI * 2);
        overlayCtx.clip();

        const hx = nepP.x + Math.cos(lightAngle) * (nepR * 0.4);
        const hy = nepP.y + Math.sin(lightAngle) * (nepR * 0.4);

        const nepGrad = overlayCtx.createRadialGradient(hx, hy, 0.5, nepP.x, nepP.y, nepR * 1.15);
        nepGrad.addColorStop(0, '#67e8f9');
        nepGrad.addColorStop(0.4, '#0284c7');
        nepGrad.addColorStop(0.8, '#1e3a8a');
        nepGrad.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = nepGrad;
        overlayCtx.fillRect(nepP.x - nepR, nepP.y - nepR, nepR * 2, nepR * 2);
        overlayCtx.restore();
      }

      // 4. Uranus (cyanBody, strictly 4.0x Earth diameter -> 7.6 px)
      const cyanP = project(cb.cyanBody, D, R, U, focal, cssWidth, cssHeight);
      if (cyanP.visible) {
        const cR = 7.6;
        const lightAngle = getLightAngle(cyanP.x, cyanP.y);

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(cyanP.x, cyanP.y, cR, 0, Math.PI * 2);
        overlayCtx.clip();

        const chx = cyanP.x + Math.cos(lightAngle) * (cR * 0.4);
        const chy = cyanP.y + Math.sin(lightAngle) * (cR * 0.4);
        const cGrad = overlayCtx.createRadialGradient(chx, chy, 0.4, cyanP.x, cyanP.y, cR * 1.15);
        cGrad.addColorStop(0, '#e0f2fe');
        cGrad.addColorStop(0.5, '#2dd4bf');
        cGrad.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = cGrad;
        overlayCtx.fillRect(cyanP.x - cR, cyanP.y - cR, cR * 2, cR * 2);
        overlayCtx.restore();
      }

      // 5. Venus (strictly 0.95x Earth diameter -> 4.0 px)
      const venP = project(cb.venus, D, R, U, focal, cssWidth, cssHeight);
      if (venP.visible) {
        const venR = 4.0;
        const lightAngle = getLightAngle(venP.x, venP.y);

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(venP.x, venP.y, venR, 0, Math.PI * 2);
        overlayCtx.clip();

        const vhx = venP.x + Math.cos(lightAngle) * (venR * 0.4);
        const vhy = venP.y + Math.sin(lightAngle) * (venR * 0.4);
        const venGrad = overlayCtx.createRadialGradient(vhx, vhy, 0.3, venP.x, venP.y, venR * 1.15);
        venGrad.addColorStop(0, '#fef9c3');
        venGrad.addColorStop(0.5, '#facc15');
        venGrad.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = venGrad;
        overlayCtx.fillRect(venP.x - venR, venP.y - venR, venR * 2, venR * 2);
        overlayCtx.restore();
      }

      // 6. Earth & Moon (Earth = 4.2 px, Moon strictly 0.27x Earth -> 1.15 px)
      const earthP = project(cb.earth, D, R, U, focal, cssWidth, cssHeight);
      if (earthP.visible) {
        const eaR = 4.2;
        const lightAngle = getLightAngle(earthP.x, earthP.y);

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(earthP.x, earthP.y, eaR, 0, Math.PI * 2);
        overlayCtx.clip();

        overlayCtx.fillStyle = '#0284c7';
        overlayCtx.fillRect(earthP.x - eaR, earthP.y - eaR, eaR * 2, eaR * 2);

        overlayCtx.fillStyle = '#16a34a';
        overlayCtx.beginPath();
        overlayCtx.arc(earthP.x - 1.0, earthP.y - 0.8, 1.8, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.beginPath();
        overlayCtx.arc(earthP.x + 1.4, earthP.y + 1.0, 1.4, 0, Math.PI * 2);
        overlayCtx.fill();

        const hx = earthP.x + Math.cos(lightAngle) * (eaR * 0.4);
        const hy = earthP.y + Math.sin(lightAngle) * (eaR * 0.4);
        const eaShade = overlayCtx.createRadialGradient(hx, hy, 0.5, earthP.x, earthP.y, eaR * 1.15);
        eaShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
        eaShade.addColorStop(0.5, 'rgba(0, 0, 0, 0.20)');
        eaShade.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = eaShade;
        overlayCtx.fillRect(earthP.x - eaR, earthP.y - eaR, eaR * 2, eaR * 2);
        overlayCtx.restore();

        // Moon (Luna) at physical 0.27x Earth radius
        const moonX = earthP.x + 10.0;
        const moonY = earthP.y - 4.5;
        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(moonX, moonY, 1.15, 0, Math.PI * 2);
        overlayCtx.fillStyle = '#e2e8f0';
        overlayCtx.fill();
        overlayCtx.restore();
      }

      // 7. Mercury (strictly 0.38x Earth diameter -> 1.6 px)
      const merP = project(cb.mercury, D, R, U, focal, cssWidth, cssHeight);
      if (merP.visible) {
        const merR = 1.6;
        const lightAngle = getLightAngle(merP.x, merP.y);

        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(merP.x, merP.y, merR, 0, Math.PI * 2);
        overlayCtx.clip();

        const hx = merP.x + Math.cos(lightAngle) * (merR * 0.4);
        const hy = merP.y + Math.sin(lightAngle) * (merR * 0.4);
        const merGrad = overlayCtx.createRadialGradient(hx, hy, 0.3, merP.x, merP.y, merR * 1.15);
        merGrad.addColorStop(0, '#f1f5f9');
        merGrad.addColorStop(0.5, '#94a3b8');
        merGrad.addColorStop(1, shadowDarkness);
        overlayCtx.fillStyle = merGrad;
        overlayCtx.fillRect(merP.x - merR, merP.y - merR, merR * 2, merR * 2);
        overlayCtx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', setupCanvases);
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [viewer, lightingMode]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={glCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
};
