import React, { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import { 
  computeKeplerStateVector, 
  fetchHorizonsStateVector, 
  generateOrbitalPathPoints, 
  MOONS_METADATA, 
  MARS_CONSTANTS,
  MoonStateVector 
} from '../../services/moons/moonEphemerisService';

interface MarsMoonsProps {
  viewer: Cesium.Viewer | null;
  showPhobos: boolean;
  showDeimos: boolean;
  showOrbits: boolean;
  showLabels?: boolean;
  isPaused: boolean;
  speedMultiplier?: number;
  resetClockTrigger?: number;
  selectedMoon: 'phobos' | 'deimos' | null;
  onSelectMoon: (moonId: 'phobos' | 'deimos' | null) => void;
  flyToTrigger?: number;
  onReturnToMars?: () => void;
  onTelemetryUpdate?: (telemetry: { phobos: MoonStateVector; deimos: MoonStateVector }) => void;
}

export const MarsMoons: React.FC<MarsMoonsProps> = ({
  viewer,
  showPhobos,
  showDeimos,
  showOrbits,
  showLabels = true,
  isPaused,
  resetClockTrigger = 0,
  selectedMoon,
  onSelectMoon,
  flyToTrigger = 0,
  onTelemetryUpdate,
}) => {
  const dataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const phobosOrbitEntityRef = useRef<Cesium.Entity | null>(null);
  const deimosOrbitEntityRef = useRef<Cesium.Entity | null>(null);
  const phobosMarkerEntityRef = useRef<Cesium.Entity | null>(null);
  const deimosMarkerEntityRef = useRef<Cesium.Entity | null>(null);

  // Direct Cesium Model Primitives for guaranteed GLB WebGL streaming
  const phobosModelRef = useRef<Cesium.Model | null>(null);
  const deimosModelRef = useRef<Cesium.Model | null>(null);

  // Unified Simulation Clock (Strictly 1.0x real-world seconds)
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Current positions in Cartesian3 (meters) initialized to true Keplerian epoch
  const pInit = computeKeplerStateVector('phobos', 0);
  const dInit = computeKeplerStateVector('deimos', 0);
  const phobosPosRef = useRef<Cesium.Cartesian3>(new Cesium.Cartesian3(pInit.position.x, pInit.position.y, pInit.position.z));
  const deimosPosRef = useRef<Cesium.Cartesian3>(new Cesium.Cartesian3(dInit.position.x, dInit.position.y, dInit.position.z));

  // Current tidal locking rotation matrices
  const phobosRotMatRef = useRef<Cesium.Matrix3>(new Cesium.Matrix3());
  const deimosRotMatRef = useRef<Cesium.Matrix3>(new Cesium.Matrix3());

  // State vectors
  const phobosStateRef = useRef<MoonStateVector>(computeKeplerStateVector('phobos', 0));
  const deimosStateRef = useRef<MoonStateVector>(computeKeplerStateVector('deimos', 0));

  const selectedMoonRef = useRef<'phobos' | 'deimos' | null>(selectedMoon);
  const wasMoonSelectedRef = useRef<boolean>(false);

  // Spherical Orbit Camera State for 3D Moon Exploration
  const savedCameraRef = useRef<{
    position: Cesium.Cartesian3;
    direction: Cesium.Cartesian3;
    up: Cesium.Cartesian3;
  } | null>(null);

  const azimuthRef = useRef<number>(0);
  const elevationRef = useRef<number>(0.22);
  const radiusRef = useRef<number>(55_000);
  const isTrackingRef = useRef(false);
  const isFlyingToMoonRef = useRef(false);

  useEffect(() => {
    selectedMoonRef.current = selectedMoon;
  }, [selectedMoon]);

  // Reset to Current Time Handler
  useEffect(() => {
    if (resetClockTrigger > 0) {
      simTimeRef.current = 0;
      lastTimeRef.current = performance.now();
      const pState = computeKeplerStateVector('phobos', 0);
      const dState = computeKeplerStateVector('deimos', 0);
      phobosPosRef.current = new Cesium.Cartesian3(pState.position.x, pState.position.y, pState.position.z);
      deimosPosRef.current = new Cesium.Cartesian3(dState.position.x, dState.position.y, dState.position.z);
      phobosStateRef.current = pState;
      deimosStateRef.current = dState;
      onTelemetryUpdate?.({ phobos: pState, deimos: dState });
    }
  }, [resetClockTrigger, onTelemetryUpdate]);

  // Periodic Horizons ephemeris query with fallback
  useEffect(() => {
    let isCancelled = false;
    const fetchEphemerides = async () => {
      try {
        const [pVec, dVec] = await Promise.all([
          fetchHorizonsStateVector('phobos', simTimeRef.current),
          fetchHorizonsStateVector('deimos', simTimeRef.current),
        ]);
        if (!isCancelled) {
          phobosStateRef.current = pVec;
          deimosStateRef.current = dVec;
          onTelemetryUpdate?.({ phobos: pVec, deimos: dVec });
        }
      } catch (e) {
        // Fallback remains operational
      }
    };

    fetchEphemerides();
    const interval = setInterval(fetchEphemerides, 60000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [onTelemetryUpdate]);

  // Compute tidal locking rotation matrix
  const computeTidalLockingMatrix = useCallback((
    moonId: 'phobos' | 'deimos',
    pos: Cesium.Cartesian3,
    vel: Cesium.Cartesian3
  ): Cesium.Matrix3 => {
    // Vector towards Mars center (0, 0, 0)
    const marsFacing = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.negate(pos, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    // Orbital angular momentum vector (pole)
    const pole = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.cross(pos, vel, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    // In-track velocity unit vector
    const track = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.cross(pole, marsFacing, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    if (moonId === 'phobos') {
      // Phobos GLB: Long axis +Z (27.04 km), intermediate +X (24.37 km), short +Y (20.52 km)
      return new Cesium.Matrix3(
        track.x, pole.x, marsFacing.x,
        track.y, pole.y, marsFacing.y,
        track.z, pole.z, marsFacing.z
      );
    } else {
      // Deimos GLB: Long axis +X (15.01 km), intermediate +Y (11.87 km), short +Z (10.51 km)
      return new Cesium.Matrix3(
        marsFacing.x, track.x, pole.x,
        marsFacing.y, track.y, pole.y,
        marsFacing.z, track.z, pole.z
      );
    }
  }, []);

  // Initialize Cesium Scene Primitives for genuine NASA GLB Models
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    let isDisposed = false;

    // Load Phobos GLB (3.85 MB official NASA/JPL 3D model)
    Cesium.Model.fromGltfAsync({
      url: MOONS_METADATA.phobos.modelUri,
      scale: MOONS_METADATA.phobos.modelScale, // 1000.0 converts km mesh units to meters
      shadows: Cesium.ShadowMode.ENABLED,
    }).then((model) => {
      if (isDisposed || viewer.isDestroyed()) {
        model.destroy();
        return;
      }
      phobosModelRef.current = model;
      viewer.scene.primitives.add(model);
    }).catch((err) => {
      console.warn('[MIRA Moons] Could not load Phobos GLB:', err);
    });

    // Load Deimos GLB (1.60 MB official NASA/JPL 3D model)
    Cesium.Model.fromGltfAsync({
      url: MOONS_METADATA.deimos.modelUri,
      scale: MOONS_METADATA.deimos.modelScale, // 1000.0 converts km mesh units to meters
      shadows: Cesium.ShadowMode.ENABLED,
    }).then((model) => {
      if (isDisposed || viewer.isDestroyed()) {
        model.destroy();
        return;
      }
      deimosModelRef.current = model;
      viewer.scene.primitives.add(model);
    }).catch((err) => {
      console.warn('[MIRA Moons] Could not load Deimos GLB:', err);
    });

    // Initialize CustomDataSource for orbital polylines and HUD labels
    const ds = new Cesium.CustomDataSource('mira-martian-moons');
    dataSourceRef.current = ds;
    viewer.dataSources.add(ds);

    // 1. Phobos Orbital Path
    const phobosPathPoints = generateOrbitalPathPoints('phobos', 1).map(
      (p) => new Cesium.Cartesian3(p.x, p.y, p.z)
    );
    phobosOrbitEntityRef.current = ds.entities.add({
      id: 'orbit-phobos',
      name: 'Phobos Orbit Path',
      show: showOrbits && showPhobos,
      polyline: {
        positions: phobosPathPoints,
        width: 1.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.18,
          color: Cesium.Color.fromCssColorString('rgba(56, 189, 248, 0.45)'),
        }),
      },
    });

    // 2. Deimos Orbital Path
    const deimosPathPoints = generateOrbitalPathPoints('deimos', 1).map(
      (p) => new Cesium.Cartesian3(p.x, p.y, p.z)
    );
    deimosOrbitEntityRef.current = ds.entities.add({
      id: 'orbit-deimos',
      name: 'Deimos Orbit Path',
      show: showOrbits && showDeimos,
      polyline: {
        positions: deimosPathPoints,
        width: 1.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.18,
          color: Cesium.Color.fromCssColorString('rgba(251, 146, 60, 0.45)'),
        }),
      },
    });

    // 3. Phobos HUD Marker & Label
    phobosMarkerEntityRef.current = ds.entities.add({
      id: 'moon-phobos',
      name: 'Phobos',
      show: showPhobos,
      position: new Cesium.CallbackPositionProperty(() => phobosPosRef.current, false),
      point: {
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'Phobos (9,376 km)',
        font: '600 11px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#f8fafc'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        show: showLabels,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // 4. Deimos HUD Marker & Label
    deimosMarkerEntityRef.current = ds.entities.add({
      id: 'moon-deimos',
      name: 'Deimos',
      show: showDeimos,
      position: new Cesium.CallbackPositionProperty(() => deimosPosRef.current, false),
      point: {
        pixelSize: 5,
        color: Cesium.Color.fromCssColorString('#fb923c'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'Deimos (23,463 km)',
        font: '600 11px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#f8fafc'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        show: showLabels,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // Screen-space interaction handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id) {
        const id = picked.id.id || picked.id.name;
        if (id === 'moon-phobos' || id === 'Phobos') {
          onSelectMoon('phobos');
          return;
        }
        if (id === 'moon-deimos' || id === 'Deimos') {
          onSelectMoon('deimos');
          return;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      isDisposed = true;
      handler.destroy();
      if (!viewer.isDestroyed()) {
        if (phobosModelRef.current) viewer.scene.primitives.remove(phobosModelRef.current);
        if (deimosModelRef.current) viewer.scene.primitives.remove(deimosModelRef.current);
        if (dataSourceRef.current) viewer.dataSources.remove(dataSourceRef.current, true);
      }
    };
  }, [viewer]);

  // Sync visibility props to primitives & entities
  useEffect(() => {
    if (phobosModelRef.current) phobosModelRef.current.show = showPhobos;
    if (deimosModelRef.current) deimosModelRef.current.show = showDeimos;

    if (phobosMarkerEntityRef.current) {
      phobosMarkerEntityRef.current.show = showPhobos;
      if (phobosMarkerEntityRef.current.label) {
        phobosMarkerEntityRef.current.label.show = new Cesium.ConstantProperty(showLabels);
      }
    }
    if (deimosMarkerEntityRef.current) {
      deimosMarkerEntityRef.current.show = showDeimos;
      if (deimosMarkerEntityRef.current.label) {
        deimosMarkerEntityRef.current.label.show = new Cesium.ConstantProperty(showLabels);
      }
    }
    if (phobosOrbitEntityRef.current) {
      phobosOrbitEntityRef.current.show = showOrbits && showPhobos;
    }
    if (deimosOrbitEntityRef.current) {
      deimosOrbitEntityRef.current.show = showOrbits && showDeimos;
    }
  }, [showPhobos, showDeimos, showOrbits, showLabels]);

  // Camera Focus / Return Handler
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    if (selectedMoon) {
      wasMoonSelectedRef.current = true;
      const initialRange = selectedMoon === 'phobos' ? 55_000 : 35_000;
      radiusRef.current = initialRange;

      const targetPos = selectedMoon === 'phobos' ? phobosPosRef.current : deimosPosRef.current;

      // Initial camera positioning:
      // In Mars world frame, moon is at targetPos.
      // Mars is at (0,0,0).
      // Vector from moon pointing outward into space away from Mars:
      const vOut = Cesium.Cartesian3.normalize(targetPos, new Cesium.Cartesian3());
      azimuthRef.current = Math.atan2(vOut.y, vOut.x);
      elevationRef.current = 0.22; // gentle elevation for framed view with Mars in background

      // Save previous camera state before transitioning to moon
      if (!savedCameraRef.current) {
        savedCameraRef.current = {
          position: viewer.camera.position.clone(),
          direction: viewer.camera.direction.clone(),
          up: viewer.camera.up.clone(),
        };
      }

      // Initial camera position on sphere
      const cosEl = Math.cos(elevationRef.current);
      const sinEl = Math.sin(elevationRef.current);
      const cosAz = Math.cos(azimuthRef.current);
      const sinAz = Math.sin(azimuthRef.current);

      const camPos = new Cesium.Cartesian3(
        targetPos.x + initialRange * cosEl * cosAz,
        targetPos.y + initialRange * cosEl * sinAz,
        targetPos.z + initialRange * sinEl
      );

      const dir = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.subtract(targetPos, camPos, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      );
      const up = new Cesium.Cartesian3(0, 0, 1);

      // Disable default globe inputs so custom 3D orbit controls have exclusive focus
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      viewer.scene.screenSpaceCameraController.enableInputs = false;

      isFlyingToMoonRef.current = true;
      isTrackingRef.current = true;

      viewer.camera.flyTo({
        destination: camPos,
        orientation: { direction: dir, up: up },
        duration: 1.2,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        complete: () => {
          isFlyingToMoonRef.current = false;
        },
      });
    } else {
      if (wasMoonSelectedRef.current) {
        wasMoonSelectedRef.current = false;
        isTrackingRef.current = false;
        isFlyingToMoonRef.current = false;

        // Restore saved camera state smoothly back to Mars view
        if (savedCameraRef.current) {
          const saved = savedCameraRef.current;
          savedCameraRef.current = null;
          viewer.camera.flyTo({
            destination: saved.position,
            orientation: { direction: saved.direction, up: saved.up },
            duration: 1.2,
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
            complete: () => {
              viewer.scene.screenSpaceCameraController.enableInputs = true;
              viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            },
          });
        } else {
          viewer.scene.screenSpaceCameraController.enableInputs = true;
          viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
      }
    }
  }, [viewer, selectedMoon, flyToTrigger]);

  // Full 3D Camera Rotation (Orbit) & Practical Zoom-In / Zoom-Out (Desktop & Mobile)
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const canvas = viewer.scene.canvas;

    const activePointers = new Map<number, { x: number; y: number }>();
    let prevPinchDist = 0;

    const getMinMaxDist = () => {
      const isPhobos = selectedMoonRef.current === 'phobos';
      return {
        // Safe limits: close inspection above mesh radius without surface clipping
        minDist: isPhobos ? 16_000 : 10_000,
        maxDist: isPhobos ? 220_000 : 160_000,
      };
    };

    // Desktop Mouse Wheel & Trackpad Zoom
    const handleWheel = (e: WheelEvent) => {
      if (!selectedMoonRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const { minDist, maxDist } = getMinMaxDist();
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      radiusRef.current = Math.max(minDist, Math.min(maxDist, radiusRef.current * factor));
    };

    // Pointer Down (Desktop mouse & Mobile touch)
    const handlePointerDown = (e: PointerEvent) => {
      if (!selectedMoonRef.current) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    // Pointer Move: 3D Orbit (1 pointer) & Pinch Zoom (2 pointers)
    const handlePointerMove = (e: PointerEvent) => {
      if (!selectedMoonRef.current || !activePointers.has(e.pointerId)) return;

      const prev = activePointers.get(e.pointerId)!;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        // Desktop left drag or Mobile 1-finger orbit
        // Horizontal rotation (Azimuth)
        azimuthRef.current -= dx * 0.005;
        // Vertical rotation (Elevation) clamped between -85° and +85°
        elevationRef.current = Math.max(-1.48, Math.min(1.48, elevationRef.current + dy * 0.005));
      } else if (activePointers.size === 2) {
        // Mobile 2-finger pinch zoom
        const pts = Array.from(activePointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (prevPinchDist > 0 && currentDist > 0) {
          const pinchFactor = prevPinchDist / currentDist;
          const { minDist, maxDist } = getMinMaxDist();
          radiusRef.current = Math.max(minDist, Math.min(maxDist, radiusRef.current * pinchFactor));
        }
        prevPinchDist = currentDist;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        prevPinchDist = 0;
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [viewer]);

  // Unified Real-Time Physics & Rendering Update Loop (1x real-time speed)
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    let telemetryThrottle = 0;

    const onTick = () => {
      const now = performance.now();
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // 1. Shared Simulation Clock (Strictly 1.0x real-world speed, NO acceleration/deceleration)
      if (!isPaused && deltaSec > 0 && deltaSec < 1.0) {
        simTimeRef.current += deltaSec;
      }

      // 2. Mars Axial Real-Time Sidereal Rotation (24h 37m 22.663s, freezes when paused or exploring moon)
      if (!isPaused && !selectedMoonRef.current && deltaSec > 0 && deltaSec < 1.0) {
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -deltaSec * MARS_CONSTANTS.angularVelocityRadPerSec);
      }

      const tSec = simTimeRef.current;

      // 3. Phobos Ephemeris & Rotation Matrix
      const pState = computeKeplerStateVector('phobos', tSec);
      phobosPosRef.current = new Cesium.Cartesian3(pState.position.x, pState.position.y, pState.position.z);
      const pVel = new Cesium.Cartesian3(pState.velocity.x, pState.velocity.y, pState.velocity.z);
      phobosRotMatRef.current = computeTidalLockingMatrix('phobos', phobosPosRef.current, pVel);
      phobosStateRef.current = pState;

      // Update Phobos 3D Model Primitive
      if (phobosModelRef.current) {
        phobosModelRef.current.modelMatrix = Cesium.Matrix4.fromRotationTranslation(
          phobosRotMatRef.current,
          phobosPosRef.current,
          phobosModelRef.current.modelMatrix
        );
      }

      // 4. Deimos Ephemeris & Rotation Matrix
      const dState = computeKeplerStateVector('deimos', tSec);
      deimosPosRef.current = new Cesium.Cartesian3(dState.position.x, dState.position.y, dState.position.z);
      const dVel = new Cesium.Cartesian3(dState.velocity.x, dState.velocity.y, dState.velocity.z);
      deimosRotMatRef.current = computeTidalLockingMatrix('deimos', deimosPosRef.current, dVel);
      deimosStateRef.current = dState;

      // Update Deimos 3D Model Primitive
      if (deimosModelRef.current) {
        deimosModelRef.current.modelMatrix = Cesium.Matrix4.fromRotationTranslation(
          deimosRotMatRef.current,
          deimosPosRef.current,
          deimosModelRef.current.modelMatrix
        );
      }

      // 5. 3D Moon Exploration Spherical Orbit Camera Controller
      const activeMoon = selectedMoonRef.current;
      if (activeMoon && isTrackingRef.current && !isFlyingToMoonRef.current && viewer && !viewer.isDestroyed()) {
        const currentTargetPos = activeMoon === 'phobos' ? phobosPosRef.current : deimosPosRef.current;
        const r = radiusRef.current;
        const az = azimuthRef.current;
        const el = elevationRef.current;

        const cosEl = Math.cos(el);
        const sinEl = Math.sin(el);
        const cosAz = Math.cos(az);
        const sinAz = Math.sin(az);

        // Spherical position orbiting around moon's center
        const camPos = new Cesium.Cartesian3(
          currentTargetPos.x + r * cosEl * cosAz,
          currentTargetPos.y + r * cosEl * sinAz,
          currentTargetPos.z + r * sinEl
        );

        // Direction: looking directly at moon center
        const lookDir = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(currentTargetPos, camPos, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        );

        // Stable camera up vector with polar gimbal safety
        let up = new Cesium.Cartesian3(0, 0, 1);
        if (Math.abs(sinEl) > 0.96) {
          up = Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.cross(
              lookDir,
              new Cesium.Cartesian3(-sinAz, cosAz, 0),
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          );
        }

        viewer.camera.setView({
          destination: camPos,
          orientation: { direction: lookDir, up: up },
        });
      }

      // 6. Emit Telemetry (~10 Hz)
      telemetryThrottle++;
      if (telemetryThrottle % 6 === 0) {
        onTelemetryUpdate?.({ phobos: pState, deimos: dState });
      }
    };

    const removeListener = viewer.scene.preUpdate.addEventListener(onTick);

    return () => {
      removeListener();
    };
  }, [viewer, isPaused, computeTidalLockingMatrix, onTelemetryUpdate]);

  return null;
};
