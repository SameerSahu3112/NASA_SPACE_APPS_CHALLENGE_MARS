import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CalculatedOrbitalParameters } from '../../services/keplerSolver';
import { PLANETS_SCIENTIFIC_REGISTRY } from '../../services/planetaryData';
import { getPlanetTexture, getPlanetBumpMap } from '../../services/planetTextureGenerator';

interface SolarSystem3DProps {
  planetsData: Record<string, CalculatedOrbitalParameters>;
  selectedPlanetId: string | null;
  onSelectPlanet: (id: string) => void;
  scaleMode: 'scientific' | 'exploration';
  showOrbits: boolean;
  showLabels: boolean;
  showEclipticGrid: boolean;
  showOrbitalPlanes: boolean;
  showVectors: boolean;
  showApsides: boolean;
  showNodes: boolean;
  inclinationMultiplier?: number;
  focusTrigger?: number;
}

export const SolarSystem3D: React.FC<SolarSystem3DProps> = ({
  planetsData,
  selectedPlanetId,
  onSelectPlanet,
  scaleMode,
  showOrbits,
  showLabels,
  showEclipticGrid,
  showOrbitalPlanes,
  showVectors,
  showApsides,
  showNodes,
  inclinationMultiplier = 1.0,
  focusTrigger = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Synchronized prop state refs for animation loop
  const planetsDataRef = useRef(planetsData);
  planetsDataRef.current = planetsData;
  const scaleModeRef = useRef(scaleMode);
  scaleModeRef.current = scaleMode;
  const inclinationMultiplierRef = useRef(inclinationMultiplier);
  inclinationMultiplierRef.current = inclinationMultiplier;

  // Camera animation & smooth continuous tracking refs
  const cameraAnimRef = useRef<{
    isAnimating: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    planetId: string | null;
  } | null>(null);

  const lastTrackedPlanetPosRef = useRef<THREE.Vector3 | null>(null);
  const activeFocusPlanetIdRef = useRef<string | null>(null);

  // Mesh and object tracking refs
  const planetMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const orbitLinesRef = useRef<Map<string, THREE.LineLoop>>(new Map());
  const dynamicMarkersRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);

  /**
   * Astronomical Unit (AU) to 3D Viewport Linear Scale
   * In 1:1 Scientific Mode: 1 AU = 65.0 3D units.
   * 
   * Strict Keplerian Linear Mapping:
   * Scaling (X, Y, Z) uniformly by a constant scalar preserves 100%:
   * - Eccentricity e = sqrt(1 - b^2 / a^2) identical to NASA data
   * - Semi-minor axis ratio b / a = sqrt(1 - e^2)
   * - Sun focus position at (0, 0, 0)
   * - Linear focal offset c = a * e
   * - Perihelion distance q = a(1 - e) and Aphelion distance Q = a(1 + e)
   * - True orbital inclination angle I from the J2000 ecliptic plane (Y = 0)
   */
  const AU_TO_3D = 65.0;

  const getPlanetScaleFactor = (semiMajorAxisAU: number): number => {
    if (scaleMode === 'scientific') {
      return AU_TO_3D;
    }
    // Adaptive mode: uniform scalar per planet so the ellipse is never warped
    const targetDistance = 25.0 * Math.pow(semiMajorAxisAU, 0.62);
    return targetDistance / semiMajorAxisAU;
  };

  /**
   * Transforms J2000 Ecliptic Cartesian coordinates [Xe, Ye, Ze] (in AU)
   * to Three.js 3D coordinates [X3D, Y3D, Z3D].
   * 
   * Mapping:
   * - Ecliptic X = Three.js +X
   * - Ecliptic Z (Normal to Ecliptic Plane) = Three.js +Y
   * - Ecliptic Y = Three.js -Z
   */
  const eclipticToThreeVector = (
    posAU: { x: number; y: number; z: number },
    semiMajorAxisAU: number
  ): THREE.Vector3 => {
    const scale = getPlanetScaleFactor(semiMajorAxisAU);
    return new THREE.Vector3(
      posAU.x * scale,
      posAU.z * scale * inclinationMultiplier,
      -posAU.y * scale
    );
  };

  /**
   * Strictly Proportional Planetary & Solar Radii from NASA Fact Sheets
   * Base Earth radius = 0.14 units (Earth diameter = 12,742 km)
   * 
   * Proportions strictly matching NASA data:
   * - Sun:     1,392,700 km -> 15.30 units (109.30x Earth diameter)
   * - Jupiter:   139,820 km ->  1.536 units ( 10.97x Earth diameter, ~10x smaller than Sun)
   * - Saturn:    116,460 km ->  1.280 units (  9.14x Earth diameter, rings 1.60 to 2.94 units)
   * - Uranus:     50,724 km ->  0.557 units (  3.98x Earth diameter)
   * - Neptune:    49,244 km ->  0.541 units (  3.86x Earth diameter)
   * - Earth:      12,742 km ->  0.140 units (  1.00x Earth baseline)
   * - Venus:      12,104 km ->  0.133 units (  0.95x Earth diameter)
   * - Mars:        6,779 km ->  0.074 units (  0.53x Earth diameter)
   * - Mercury:     4,879 km ->  0.054 units (  0.38x Earth diameter)
   */
  const BASE_EARTH_RADIUS = 0.14;
  const SUN_PHYSICAL_RADIUS = BASE_EARTH_RADIUS * 109.30; // 15.30 units

  const getPlanetRadius = (relativeToEarth: number): number => {
    return BASE_EARTH_RADIUS * (relativeToEarth || 1.0);
  };

  // INITIALIZE THREE.JS SCENE ONCE ON MOUNT
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Slate-950 dark cosmic space

    // 2. Camera (Near plane 0.01 to allow close inspection without clipping)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 10000);
    cameraRef.current = camera;
    // Perspective showing inner and middle planetary orbits
    camera.position.set(0, 110, 180);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    containerRef.current.replaceChildren(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 5000;
    controls.target.set(0, 0, 0);

    // 5. Lighting
    // Central Radiant Point Light at the Sun focus (0, 0, 0)
    const sunLight = new THREE.PointLight(0xfffbeb, 4.5, 6000, 0.15);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Ambient light so planetary night sides and physical colors remain clear
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // 6. Ecliptic Reference Plane Grid (Y=0 horizontal plane in Three.js)
    const grid = new THREE.GridHelper(800, 40, 0x38bdf8, 0x1e293b);
    grid.position.set(0, 0, 0);
    gridHelperRef.current = grid;
    grid.visible = showEclipticGrid;
    scene.add(grid);

    // 7. Central Sun Mesh with Physically Proportional Radius & Radiant Corona
    const sunGroup = new THREE.Group();
    // Sun sphere: 15.30 units (strictly 109.3x Earth diameter)
    const sunGeometry = new THREE.SphereGeometry(SUN_PHYSICAL_RADIUS, 96, 96);
    const sunTexture = getPlanetTexture('sun');
    const sunMaterial = new THREE.MeshBasicMaterial({
      map: sunTexture,
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMeshRef.current = sunMesh;
    sunGroup.add(sunMesh);

    // Radiant Corona Glow Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, SUN_PHYSICAL_RADIUS * 3.5, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255, 240, 138, 1.0)');
      grad.addColorStop(0.25, 'rgba(245, 158, 11, 0.70)');
      grad.addColorStop(0.60, 'rgba(217, 119, 6, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const coronaSprite = new THREE.Sprite(spriteMaterial);
    coronaSprite.scale.set(SUN_PHYSICAL_RADIUS * 3.6, SUN_PHYSICAL_RADIUS * 3.6, 1);
    sunGroup.add(coronaSprite);
    scene.add(sunGroup);

    // Dynamic Markers Group (Vectors, Apsides, Nodes, Orbital Planes)
    const markersGroup = new THREE.Group();
    dynamicMarkersRef.current = markersGroup;
    scene.add(markersGroup);

    // 8. Raycasting for Planet Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);

      const interactiveObjects: THREE.Object3D[] = [];
      planetMeshesRef.current.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            interactiveObjects.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(interactiveObjects, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        let planetId = hit.userData?.planetId;
        if (!planetId && hit.parent) {
          planetId = hit.parent.userData?.planetId;
        }
        if (planetId) {
          onSelectPlanet(planetId);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);

    // 9. Resize Handling
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Render Loop (Continuous 60 FPS)
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Camera Glide Animation to Selected Planet
      const anim = cameraAnimRef.current;
      const now = performance.now();

      if (anim && anim.isAnimating) {
        const elapsed = now - anim.startTime;
        const progress = Math.min(1.0, elapsed / anim.duration);
        // Smooth cubic ease-in-out curve
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);

        if (progress >= 1.0) {
          anim.isAnimating = false;
        }
      } else if (activeFocusPlanetIdRef.current && planetsDataRef.current) {
        // Continuous smooth camera tracking of the orbiting planet while simulation runs
        const pId = activeFocusPlanetIdRef.current;
        const pData = planetsDataRef.current[pId];
        if (pData && lastTrackedPlanetPosRef.current) {
          const s = scaleModeRef.current === 'scientific'
            ? AU_TO_3D
            : (25.0 * Math.pow(pData.semiMajorAxisAU, 0.62)) / pData.semiMajorAxisAU;
          const currentPos = new THREE.Vector3(
            pData.positionAU.x * s,
            pData.positionAU.z * s * inclinationMultiplierRef.current,
            -pData.positionAU.y * s
          );
          const delta = currentPos.clone().sub(lastTrackedPlanetPosRef.current);
          if (delta.lengthSq() > 0.00000001) {
            controls.target.add(delta);
            camera.position.add(delta);
            lastTrackedPlanetPosRef.current.copy(currentPos);
          }
        }
      }

      controls.update();

      // Gentle solar corona pulse
      const t = performance.now() * 0.0015;
      const pulse = SUN_PHYSICAL_RADIUS * 3.6 + Math.sin(t) * 1.2;
      coronaSprite.scale.set(pulse, pulse, 1);

      renderer.render(scene, camera);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []); // Mount only once

  // REACTIVE VISIBILITY OF ECLIPTIC GRID
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showEclipticGrid;
    }
  }, [showEclipticGrid]);

  // BUILD PLANETARY BODIES & 3D CLOSED KEPLERIAN ORBITS
  // Only rebuilds when scaleMode, showOrbits, or inclinationMultiplier changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old orbit lines and meshes
    orbitLinesRef.current.forEach((line) => scene.remove(line));
    orbitLinesRef.current.clear();

    planetMeshesRef.current.forEach((group) => scene.remove(group));
    planetMeshesRef.current.clear();

    // Construct each of the 8 planets
    Object.entries(planetsData).forEach(([planetId, data]) => {
      const def = PLANETS_SCIENTIFIC_REGISTRY[planetId];
      if (!def) return;

      const chars = def.characteristics;
      const isSelected = selectedPlanetId === planetId;

      // 1. Mathematically Closed 3D Keplerian Ellipse Orbit Geometry (THREE.LineLoop with 720 points)
      if (showOrbits && data.orbitTrajectoryAU && data.orbitTrajectoryAU.length > 0) {
        const points = data.orbitTrajectoryAU.map((pt) =>
          eclipticToThreeVector(pt, data.semiMajorAxisAU)
        );
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);

        let orbitColor = isSelected ? 0x38bdf8 : chars.isMars ? 0xef4444 : 0x64748b;
        const orbitMat = new THREE.LineBasicMaterial({
          color: orbitColor,
          transparent: true,
          opacity: isSelected ? 0.95 : chars.isMars ? 0.80 : 0.40,
          linewidth: isSelected ? 2 : 1,
        });

        // THREE.LineLoop guarantees a continuous, seamlessly closed elliptical curve
        const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
        scene.add(orbitLine);
        orbitLinesRef.current.set(planetId, orbitLine);
      }

      // 2. 3D Planet Group
      const planetGroup = new THREE.Group();
      planetGroup.userData = { planetId };

      // Strictly proportional physical radius derived directly from NASA diameter data
      const physicalRadius = getPlanetRadius(chars.relativeToEarthDiameter);

      // Planet Sphere Mesh: 128x128 segments for ultra-detailed roundness at close zoom
      const sphereGeo = new THREE.SphereGeometry(physicalRadius, 128, 128);
      const planetTexture = getPlanetTexture(planetId);
      const planetBump = getPlanetBumpMap(planetId);
      const sphereMat = new THREE.MeshStandardMaterial({
        map: planetTexture,
        bumpMap: planetBump,
        bumpScale: planetId === 'mars' ? 0.05 : planetId === 'mercury' ? 0.06 : 0.03,
        roughness: planetId === 'earth' ? 0.40 : planetId === 'venus' ? 0.70 : 0.60,
        metalness: planetId === 'earth' ? 0.10 : 0.02,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = { planetId };

      // Apply physical axial tilt
      sphereMesh.rotation.z = (chars.axialTiltDeg * Math.PI) / 180;
      planetGroup.add(sphereMesh);

      // Saturn Rings: Authentic B-ring, Cassini Division & A-ring
      if (planetId === 'saturn') {
        // Inner B-Ring
        const bRingGeo = new THREE.RingGeometry(physicalRadius * 1.25, physicalRadius * 1.95, 96);
        const bRingMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const bRing = new THREE.Mesh(bRingGeo, bRingMat);
        bRing.rotation.x = Math.PI / 2;
        bRing.rotation.z = (chars.axialTiltDeg * Math.PI) / 180;
        planetGroup.add(bRing);

        // Outer A-Ring (after Cassini gap)
        const aRingGeo = new THREE.RingGeometry(physicalRadius * 2.02, physicalRadius * 2.30, 96);
        const aRingMat = new THREE.MeshStandardMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.70,
        });
        const aRing = new THREE.Mesh(aRingGeo, aRingMat);
        aRing.rotation.x = Math.PI / 2;
        aRing.rotation.z = (chars.axialTiltDeg * Math.PI) / 180;
        planetGroup.add(aRing);
      }

      // Set initial 3D position
      const pos3D = eclipticToThreeVector(data.positionAU, data.semiMajorAxisAU);
      planetGroup.position.copy(pos3D);

      scene.add(planetGroup);
      planetMeshesRef.current.set(planetId, planetGroup);
    });
  }, [scaleMode, showOrbits, inclinationMultiplier]);

  // UPDATE ORBIT LINE COLORS ON SELECTION CHANGE
  useEffect(() => {
    orbitLinesRef.current.forEach((line, planetId) => {
      const isSelected = selectedPlanetId === planetId;
      const isMars = planetId === 'mars';
      if (line.material instanceof THREE.LineBasicMaterial) {
        line.material.color.setHex(isSelected ? 0x38bdf8 : isMars ? 0xef4444 : 0x64748b);
        line.material.opacity = isSelected ? 0.95 : isMars ? 0.80 : 0.40;
      }
    });
  }, [selectedPlanetId]);

  // SMOOTH CAMERA GLIDE TO SELECTED PLANET (MATCHING MARS GLOBE ZOOM LEVEL)
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (selectedPlanetId && planetsData[selectedPlanetId]) {
      const data = planetsData[selectedPlanetId];
      const planetPos = eclipticToThreeVector(data.positionAU, data.semiMajorAxisAU);

      const def = PLANETS_SCIENTIFIC_REGISTRY[selectedPlanetId];
      const physicalRadius = getPlanetRadius(def?.characteristics.relativeToEarthDiameter || 1.0);
      // Saturn rings extend to 2.30x planetary radius
      const framingRadius = selectedPlanetId === 'saturn' ? physicalRadius * 2.30 : physicalRadius;

      // In FOV 42° camera, calculate framing distance so the planet occupies ~60% of viewport height (identical to Mars globe scale)
      const zoomDistance = Math.max(0.24, framingRadius * 4.4);

      // Adjust OrbitControls so the user can orbit around the planet up close
      controls.minDistance = Math.max(0.005, framingRadius * 1.15);
      controls.maxDistance = 5000;

      // Position camera along the outward radial vector from the Sun (0, 0, 0)
      // so looking at the planet directly faces the Sun behind it!
      const fromSunDir = planetPos.clone().normalize();
      if (fromSunDir.lengthSq() < 0.0001) {
        fromSunDir.set(0, 0, 1);
      }

      const camOffsetDir = fromSunDir.clone();
      camOffsetDir.y += 0.20; // gentle elevation so Sun is visible above horizon
      camOffsetDir.normalize();

      const endCamPos = planetPos.clone().add(camOffsetDir.multiplyScalar(zoomDistance));

      cameraAnimRef.current = {
        isAnimating: true,
        startTime: performance.now(),
        duration: 1100, // 1.1s smooth cinematic transition
        startPos: camera.position.clone(),
        endPos: endCamPos,
        startTarget: controls.target.clone(),
        endTarget: planetPos.clone(),
        planetId: selectedPlanetId,
      };

      lastTrackedPlanetPosRef.current = planetPos.clone();
      activeFocusPlanetIdRef.current = selectedPlanetId;
    } else {
      // Zoom back out to global solar system overview
      const overviewTarget = new THREE.Vector3(0, 0, 0);
      const overviewPos = new THREE.Vector3(0, 110, 180);

      controls.minDistance = 2.0;
      controls.maxDistance = 5000;

      cameraAnimRef.current = {
        isAnimating: true,
        startTime: performance.now(),
        duration: 1100,
        startPos: camera.position.clone(),
        endPos: overviewPos,
        startTarget: controls.target.clone(),
        endTarget: overviewTarget,
        planetId: null,
      };

      lastTrackedPlanetPosRef.current = null;
      activeFocusPlanetIdRef.current = null;
    }
  }, [selectedPlanetId, focusTrigger]);

  // SMOOTH 60 FPS SIMULATION TICK: ONLY UPDATES POSITIONS & DYNAMIC MARKERS
  // No meshes or geometries are destroyed or recreated!
  useEffect(() => {
    // 1. Update planet positions and axial rotations
    Object.entries(planetsData).forEach(([planetId, data]) => {
      const group = planetMeshesRef.current.get(planetId);
      if (group) {
        const pos3D = eclipticToThreeVector(data.positionAU, data.semiMajorAxisAU);
        group.position.copy(pos3D);

        // Spin planet mesh according to its physical rotation period
        const def = PLANETS_SCIENTIFIC_REGISTRY[planetId];
        if (def && group.children[0] instanceof THREE.Mesh) {
          const hours = (data.epochJd % 1) * 24;
          const spinRate = (Math.PI * 2) / (def.characteristics.rotationPeriodHours || 24);
          group.children[0].rotation.y = hours * spinRate;
        }
      }
    });

    // 2. Render Selected Planet Dynamic Markers (Vectors, Apsides, Nodes, Orbital Plane)
    const markersGroup = dynamicMarkersRef.current;
    if (!markersGroup) return;

    markersGroup.clear();

    if (!selectedPlanetId || !planetsData[selectedPlanetId]) return;
    const selectedData = planetsData[selectedPlanetId];
    const planetPos3D = eclipticToThreeVector(selectedData.positionAU, selectedData.semiMajorAxisAU);

    // E. Scientifically Accurate 3D Orbital Plane Disc & Ecliptic Inclination
    if (showOrbitalPlanes) {
      const aphelion3D = getPlanetScaleFactor(selectedData.semiMajorAxisAU) * selectedData.aphelionDistanceAU;
      const planeRadius = aphelion3D * 1.08;

      // Double-sided translucent disc
      const planeGeo = new THREE.CircleGeometry(planeRadius, 96);
      const planeMat = new THREE.MeshBasicMaterial({
        color: selectedData.planetId === 'mars' ? 0xef4444 : 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);

      // Unit Normal Vector to the Orbital Plane:
      // In Three.js, derived directly from the true 3D orbit trajectory points,
      // guaranteeing 100% exact coplanar alignment with the drawn orbit ellipse
      let normal3D = new THREE.Vector3(0, 1, 0);
      if (selectedData.orbitTrajectoryAU && selectedData.orbitTrajectoryAU.length > 4) {
        const p0 = eclipticToThreeVector(selectedData.orbitTrajectoryAU[0], selectedData.semiMajorAxisAU);
        const p90 = eclipticToThreeVector(
          selectedData.orbitTrajectoryAU[Math.floor(selectedData.orbitTrajectoryAU.length / 4)],
          selectedData.semiMajorAxisAU
        );
        normal3D = new THREE.Vector3().crossVectors(p0, p90).normalize();
      }

      planeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal3D);
      markersGroup.add(planeMesh);

      // Orbital Plane Perimeter Ring
      const perimeterGeo = new THREE.RingGeometry(planeRadius * 0.995, planeRadius, 96);
      const perimeterMat = new THREE.MeshBasicMaterial({
        color: selectedData.planetId === 'mars' ? 0xef4444 : 0x38bdf8,
        transparent: true,
        opacity: 0.40,
        side: THREE.DoubleSide,
      });
      const perimeterMesh = new THREE.Mesh(perimeterGeo, perimeterMat);
      perimeterMesh.quaternion.copy(planeMesh.quaternion);
      markersGroup.add(perimeterMesh);

      // Line of Nodes on the Ecliptic Plane (Y = 0)
      // Exactly passes through Sun origin (0,0,0) and the Ascending/Descending node points
      const asc3D = eclipticToThreeVector(selectedData.ascendingNodePositionAU, selectedData.semiMajorAxisAU);
      const nodeDir = asc3D.clone().normalize();
      const nodeLineLength = planeRadius * 1.10;
      const nodePoints = [
        nodeDir.clone().multiplyScalar(-nodeLineLength),
        new THREE.Vector3(0, 0, 0),
        nodeDir.clone().multiplyScalar(nodeLineLength),
      ];
      const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodePoints);
      const nodeMat = new THREE.LineDashedMaterial({
        color: 0x22c55e,
        dashSize: 2.5,
        gapSize: 1.2,
        transparent: true,
        opacity: 0.85,
      });
      const nodeLine = new THREE.Line(nodeGeo, nodeMat);
      nodeLine.computeLineDistances();
      markersGroup.add(nodeLine);

      // Elevation Drop Line from Planet to Ecliptic Plane (Y = 0)
      const eclipticProjection = new THREE.Vector3(planetPos3D.x, 0, planetPos3D.z);
      const dropPoints = [planetPos3D, eclipticProjection];
      const dropGeo = new THREE.BufferGeometry().setFromPoints(dropPoints);
      const dropMat = new THREE.LineDashedMaterial({
        color: planetPos3D.y >= 0 ? 0x22c55e : 0xd946ef,
        dashSize: 1.2,
        gapSize: 0.6,
        transparent: true,
        opacity: 0.90,
      });
      const dropLine = new THREE.Line(dropGeo, dropMat);
      dropLine.computeLineDistances();
      markersGroup.add(dropLine);

      // Ecliptic Plane Footprint Marker (Small subtle dot on ecliptic plane)
      const footGeo = new THREE.CircleGeometry(0.3, 16);
      const footMat = new THREE.MeshBasicMaterial({
        color: planetPos3D.y >= 0 ? 0x22c55e : 0xd946ef,
        side: THREE.DoubleSide,
      });
      const footMesh = new THREE.Mesh(footGeo, footMat);
      footMesh.rotation.x = Math.PI / 2;
      footMesh.position.copy(eclipticProjection);
      markersGroup.add(footMesh);
    }
  }, [
    planetsData,
    selectedPlanetId,
    scaleMode,
    showVectors,
    showApsides,
    showNodes,
    showOrbitalPlanes,
    inclinationMultiplier,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Labels Overlay */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Object.entries(planetsData).map(([id, p]) => {
            const isSelected = selectedPlanetId === id;
            const def = PLANETS_SCIENTIFIC_REGISTRY[id];
            if (!def) return null;

            return (
              <div
                key={id}
                className="absolute transition-opacity duration-200"
                style={{
                  display: 'none',
                }}
              >
                <span className={`text-[10px] font-mono-sci px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-sky-500 text-white font-bold' : 'bg-slate-900/80 text-slate-300'
                }`}>
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
