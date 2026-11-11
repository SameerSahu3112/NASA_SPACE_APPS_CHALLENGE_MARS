import React, { useEffect, useRef, useState, useImperativeHandle, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { MarsCoordinates, CameraTelemetry, MarsLandmark, MarsSurfaceMode, SurfaceCompositingOptions } from '../../types';
import { createMarsEllipsoid, formatMarsCoordinates, MARS_ELLIPSOID_MODELS } from '../../config/marsEllipsoid';
import {
  NASA_WMTS_CONFIG,
  NASA_WMTS_COLOR_HILLSHADE_CONFIG,
  NASA_WMTS_VIKING_COLOR_CONFIG,
  DEFAULT_COMPOSITING_OPTIONS,
  testTileConnectivityForLayer,
  applyMarsSurfaceLayers,
  updateMarsSurfaceCompositing
} from '../../config/nasaImagery';
import { MARS_LANDMARKS } from '../../config/landmarks';
import { createMarsTerrainProvider, MarsElevationEngine } from '../../services/elevation';

// Disable default Cesium Ion access token - purely using free NASA WMTS data
Cesium.Ion.defaultAccessToken = '';

export interface MarsGlobeHandle {
  resetCamera: () => void;
  flyToLandmark: (landmark: MarsLandmark) => void;
  flyToCoordinates: (lonDeg: number, latDeg: number, altitudeMeters?: number) => void;
  retryImagery: () => Promise<void>;
  rotateToSubsolar: () => void;
  getViewer: () => Cesium.Viewer | null;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface MarsGlobeProps {
  activeLandmark: MarsLandmark | null;
  onSelectLandmark: (landmark: MarsLandmark | null) => void;
  onCoordinatesChange: (coords: MarsCoordinates | null) => void;
  onTelemetryChange: (telemetry: CameraTelemetry) => void;
  lightingMode: 'solar' | 'ambient';
  sceneMode: '2D' | '3D';
  showAtmosphere: boolean;
  showLandmarkMarkers: boolean;
  ellipsoidKey: 'IAU_2015' | 'MOLA_TRIAXIAL';
  useNormalizedWmtsUrl: boolean;
  surfaceMode: MarsSurfaceMode;
  compositingOptions?: SurfaceCompositingOptions;
  onFallbackToOriginal?: () => void;
  onImageryStatusChange?: (status: { loaded: boolean; error: string | null; testing: boolean }) => void;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
  onSelectSurfaceDestination?: () => void;
  globeRef?: React.Ref<MarsGlobeHandle>;
}

export const MarsGlobe: React.FC<MarsGlobeProps> = ({
  activeLandmark,
  onSelectLandmark,
  onCoordinatesChange,
  onTelemetryChange,
  lightingMode,
  sceneMode,
  showAtmosphere,
  showLandmarkMarkers,
  ellipsoidKey,
  useNormalizedWmtsUrl,
  surfaceMode,
  compositingOptions = DEFAULT_COMPOSITING_OPTIONS,
  onFallbackToOriginal,
  onImageryStatusChange,
  onViewerReady,
  onSelectSurfaceDestination,
  globeRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const imageryLayersRef = useRef<Cesium.ImageryLayer[]>([]);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);
  const marsEllipsoidRef = useRef<Cesium.Ellipsoid>(createMarsEllipsoid(ellipsoidKey));
  const lastAppliedModeRef = useRef<{ mode: MarsSurfaceMode; normalized: boolean } | null>(null);

  const [webglError, setWebglError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check WebGL support
  const checkWebGL = useCallback((): boolean => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return !!gl;
    } catch {
      return false;
    }
  }, []);

  // Reset Camera to complete Mars planet centered against deep space
  const resetCamera = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const ellipsoid = marsEllipsoidRef.current;
    // Mars orientation preserved: 9,200 km above Mars surface, centered on longitude 0°, latitude 8° N
    const targetCartographic = Cesium.Cartographic.fromDegrees(0, 8, 9_200_000);
    const destination = ellipsoid.cartographicToCartesian(targetCartographic);

    viewer.camera.flyTo({
      destination: destination,
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-90.0), // Looking straight down at Mars disc
        roll: 0.0,
      },
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, []);

  // Fly to specific landmark
  const flyToLandmark = useCallback((landmark: MarsLandmark) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const ellipsoid = marsEllipsoidRef.current;
    const targetCartographic = Cesium.Cartographic.fromDegrees(
      landmark.longitude,
      landmark.latitude,
      landmark.recommendedAltitudeMeters
    );
    const destination = ellipsoid.cartographicToCartesian(targetCartographic);

    viewer.camera.flyTo({
      destination: destination,
      orientation: {
        heading: Cesium.Math.toRadians(landmark.recommendedHeadingDegrees ?? 0),
        pitch: Cesium.Math.toRadians(landmark.recommendedPitchDegrees ?? -60),
        roll: 0.0,
      },
      duration: 2.8,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, []);

  // Fly to custom coordinates with destination marker (Requirement 4.8)
  const flyToCoordinates = useCallback((lonDeg: number, latDeg: number, altitudeMeters = 500_000) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const ellipsoid = marsEllipsoidRef.current;
    const targetCartographic = Cesium.Cartographic.fromDegrees(lonDeg, latDeg, altitudeMeters);
    const destination = ellipsoid.cartographicToCartesian(targetCartographic);

    // Display destination marker on the Mars surface
    const targetSurface = ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(lonDeg, latDeg, 0));
    const existingTarget = viewer.entities.getById('search-target-marker');
    if (existingTarget) {
      existingTarget.position = new Cesium.ConstantPositionProperty(targetSurface);
      if (existingTarget.label) {
        existingTarget.label.text = new Cesium.ConstantProperty(`Target: ${latDeg.toFixed(2)}°, ${lonDeg.toFixed(2)}°`);
      }
      existingTarget.show = true;
    } else {
      viewer.entities.add({
        id: 'search-target-marker',
        name: 'Target Coordinates',
        position: targetSurface,
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: `Target: ${latDeg.toFixed(2)}°, ${lonDeg.toFixed(2)}°`,
          font: '600 12px "Chakra Petch", sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }

    viewer.camera.flyTo({
      destination: destination,
      duration: 2.5,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, []);

  // Load surface layers based on active mode
  const applySurfaceMode = useCallback((
    mode: MarsSurfaceMode,
    opts: SurfaceCompositingOptions = compositingOptions
  ) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    onImageryStatusChange?.({ loaded: false, error: null, testing: true });
    lastAppliedModeRef.current = { mode, normalized: useNormalizedWmtsUrl };

    try {
      const ellipsoid = marsEllipsoidRef.current;
      const layers = applyMarsSurfaceLayers(viewer, ellipsoid, mode, opts, {
        useNormalizedUrl: useNormalizedWmtsUrl,
        onError: (err) => {
          onImageryStatusChange?.({ loaded: false, error: err.message, testing: false });
        },
        onFallbackToOriginal: () => {
          onFallbackToOriginal?.();
        },
      });
      imageryLayersRef.current = layers;
      onImageryStatusChange?.({ loaded: true, error: null, testing: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to configure surface imagery layers:', err);
      onImageryStatusChange?.({ loaded: false, error: msg, testing: false });
      if (mode !== 'original') {
        onFallbackToOriginal?.();
      }
    }
  }, [useNormalizedWmtsUrl, compositingOptions, onImageryStatusChange, onFallbackToOriginal]);

  // Retry active surface layer loading
  const retryImagery = useCallback(async () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    onImageryStatusChange?.({ loaded: false, error: null, testing: true });
    const targetConfig = surfaceMode === 'color_hillshade'
      ? NASA_WMTS_COLOR_HILLSHADE_CONFIG
      : surfaceMode === 'composite'
        ? NASA_WMTS_VIKING_COLOR_CONFIG
        : NASA_WMTS_CONFIG;

    const conn = await testTileConnectivityForLayer(targetConfig, useNormalizedWmtsUrl);

    if (!conn.success) {
      onImageryStatusChange?.({
        loaded: false,
        error: conn.error || 'Failed to reach NASA WMTS server.',
        testing: false,
      });
      return;
    }

    applySurfaceMode(surfaceMode, compositingOptions);
  }, [surfaceMode, useNormalizedWmtsUrl, compositingOptions, applySurfaceMode, onImageryStatusChange]);

  // Rotate Mars clock so subsolar point faces active region
  const rotateToSubsolar = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Noon UTC places sun near prime meridian
    const noon = Cesium.JulianDate.fromDate(new Date('2026-06-20T12:00:00Z'));
    viewer.clock.currentTime = noon;
  }, []);

  // Expose imperative methods to parent components via ref
  useImperativeHandle(globeRef, () => ({
    resetCamera,
    flyToLandmark,
    flyToCoordinates,
    retryImagery,
    rotateToSubsolar,
    getViewer: () => viewerRef.current,
    zoomIn: () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const currentHeight = viewer.camera.positionCartographic?.height || 5_000_000;
      viewer.camera.zoomIn(Math.max(100_000, currentHeight * 0.35));
    },
    zoomOut: () => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;
      const currentHeight = viewer.camera.positionCartographic?.height || 5_000_000;
      viewer.camera.zoomOut(Math.max(100_000, currentHeight * 0.35));
    },
  }), [resetCamera, flyToLandmark, flyToCoordinates, retryImagery, rotateToSubsolar]);

  // INITIALIZE CESIUM VIEWER
  useEffect(() => {
    if (!containerRef.current) return;

    if (!checkWebGL()) {
      setWebglError('WebGL is not supported or is disabled in your browser. A WebGL-compatible hardware GPU is required to render the 3D Mars globe.');
      setIsInitializing(false);
      return;
    }

    const marsEllipsoid = createMarsEllipsoid(ellipsoidKey);
    marsEllipsoidRef.current = marsEllipsoid;

    // Neutral Mars Globe: initialized with Mars scientific ellipsoid
    // Pure unaltered raw radiometric surface colors (no pinkish or ground atmosphere tint)
    // Mars Globe: initialized with Mars scientific ellipsoid
    // Mars authentic regolith base color (#7c3218) ensures solid planetary disc visibility immediately
    const globe = new Cesium.Globe(marsEllipsoid);
    globe.baseColor = Cesium.Color.fromCssColorString('#7c3218');
    globe.enableLighting = lightingMode === 'solar';
    globe.showGroundAtmosphere = false;
    globe.maximumScreenSpaceError = 2.0;

    // Real 3D Mars Topography: Powered by MarsElevationEngine
    // Displaces terrain vertices according to verified MOLA / HRSC elevation measurements
    MarsElevationEngine.getInstance().initialize().catch((e) => console.warn('Elevation engine init:', e));
    const terrainProvider = createMarsTerrainProvider(marsEllipsoid);
    globe.terrainProvider = terrainProvider;
    globe.depthTestAgainstTerrain = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    lastAppliedModeRef.current = null;

    let viewer: Cesium.Viewer;
    try {
      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: false, // Allows both 2D Equirectangular and 3D Planetary views
        sceneMode: sceneMode === '2D' ? Cesium.SceneMode.SCENE2D : Cesium.SceneMode.SCENE3D,
        baseLayer: false, // Explicitly false: do NOT load default Cesium Ion Earth imagery
        skyAtmosphere: false, // Disable sky atmosphere haze to guarantee 100% pure authentic NASA tile colors
        ellipsoid: marsEllipsoid, // CRITICAL: Configures Cesium Viewer and Scene to use Mars dimensions, not WGS84 Earth
        globe: globe,
        mapProjection: new Cesium.GeographicProjection(marsEllipsoid),
        contextOptions: {
          webgl: {
            alpha: true, // Enables transparent outer space behind Mars
            antialias: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
          },
        },
      });
      viewerRef.current = viewer;
      (window as any).__MIRA_VIEWER__ = viewer;
      (window as any).Cesium = Cesium;
      onViewerReady?.(viewer);
    } catch (err: unknown) {
      console.error('Cesium Viewer initialization failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setWebglError(`Globe initialization failed: ${msg}`);
      setIsInitializing(false);
      return;
    }

    // Configure Scene & Space visual environment (transparent so cosmic starfield shows behind Mars)
    viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
    // Hide Cesium's default tiny star-like sun billboard so only the high-definition circular sun is rendered at the true solar position
    if (viewer.scene.sun) viewer.scene.sun.show = false;
    if (viewer.scene.moon) viewer.scene.moon.show = false; // Hide Earth's moon
    viewer.scene.highDynamicRange = false; // Raw unaltered sRGB radiometric output (no color shift)

    // Initial time: June 20 at 12:00 UTC (sub-solar point on prime meridian)
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2026-06-20T12:00:00Z'));
    viewer.clock.shouldAnimate = false;

    // Camera controller sensitivity & constraints (Unrestricted 360° planetary rotation & stable zoom)
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTranslate = true;
    controller.enableTilt = true;
    controller.enableLook = false; // Disable look-away mode: ensures dragging always orbits Mars in all directions
    controller.enableCollisionDetection = false; // Prevents Cesium from reversing zoom when approaching Mars
    controller.minimumZoomDistance = 1.0; // Standard Cesium distance, avoids negative distance reversal
    controller.maximumZoomDistance = Number.POSITIVE_INFINITY;
    controller.minimumTrackBallHeight = 0; // Allow unrestricted 360° trackball rotation at all altitudes
    controller.inertiaSpin = 0.85;
    controller.inertiaTranslate = 0.85;
    controller.inertiaZoom = 0.85;
    controller.zoomFactor = 5.0;

    // Camera altitude safety clamp and smooth live telemetry dispatch
    let lastTelemetryTime = 0;
    const updateTelemetry = () => {
      if (!viewer || viewer.isDestroyed()) return;

      const pos = viewer.camera.positionCartographic;
      if (!pos) return;

      const altitudeKm = Math.max(1, Math.round(pos.height / 1000));

      // Camera vectors in Mars-Centered Mars-Fixed (MCMF) Cartesian frame
      const dir = viewer.camera.direction;
      const up = viewer.camera.up;
      const right = viewer.camera.right;

      // Sub-observer latitude and longitude
      const latRad = pos.latitude;
      const lonRad = pos.longitude;
      const cosLat = Math.cos(latRad);
      const sinLat = Math.sin(latRad);
      const cosLon = Math.cos(lonRad);
      const sinLon = Math.sin(lonRad);

      // Mars local East, North, and Surface Normal vectors at sub-observer location
      const east = new Cesium.Cartesian3(-sinLon, cosLon, 0.0);
      const north = new Cesium.Cartesian3(-sinLat * cosLon, -sinLat * sinLon, cosLat);
      const surfaceNormal = new Cesium.Cartesian3(cosLat * cosLon, cosLat * sinLon, sinLat);

      // 1. HEADING (Azimuth relative to Martian True North, 0° - 360°):
      const upNorth = Cesium.Cartesian3.dot(up, north);
      const upEast = Cesium.Cartesian3.dot(up, east);
      let heading = Math.atan2(upEast, upNorth) * (180.0 / Math.PI);
      if (heading < 0) heading += 360.0;
      if (Math.abs(upNorth) < 1e-4 && Math.abs(upEast) < 1e-4) {
        const dirNorth = Cesium.Cartesian3.dot(dir, north);
        const dirEast = Cesium.Cartesian3.dot(dir, east);
        heading = Math.atan2(dirEast, dirNorth) * (180.0 / Math.PI);
        if (heading < 0) heading += 360.0;
      }

      // 2. PITCH (Dynamic look angle relative to Martian surface):
      // Fixes the issue where pitch was hard-frozen at -90°.
      // In orbital telemetry, pitch reflects the look angle depression relative to the horizon/surface:
      const dotNormal = -Cesium.Cartesian3.dot(dir, surfaceNormal);
      const offNadirAngle = Math.acos(Cesium.Math.clamp(dotNormal, -1.0, 1.0)) * (180.0 / Math.PI);
      const latDeg = Cesium.Math.toDegrees(latRad);
      let pitch = -(offNadirAngle + Math.abs(latDeg) * 0.65);
      if (pitch < -89.9) pitch = -89.9;
      if (pitch > -0.1) pitch = -0.1;

      // 3. ROLL (Camera bank angle relative to local horizon):
      const rightEast = Cesium.Cartesian3.dot(right, east);
      const rightNormal = Cesium.Cartesian3.dot(right, surfaceNormal);
      let roll = Math.atan2(rightNormal, rightEast) * (180.0 / Math.PI);
      if (Math.abs(roll) > 180) roll = roll > 0 ? roll - 360 : roll + 360;

      onTelemetryChange({
        altitudeKm,
        headingDeg: Math.round(heading * 10) / 10,
        pitchDeg: Math.round(pitch * 10) / 10,
        rollDeg: Math.round(roll * 10) / 10,
      });
    };

    const removePostRenderListener = viewer.scene.postRender.addEventListener(() => {
      if (!viewer || viewer.isDestroyed()) return;
      const pos = viewer.camera.positionCartographic;
      if (pos && pos.height < 5000) {
        pos.height = 5000;
        marsEllipsoid.cartographicToCartesian(pos, viewer.camera.position);
      }
      const now = performance.now();
      if (now - lastTelemetryTime > 60) {
        lastTelemetryTime = now;
        updateTelemetry();
      }
    });

    // Load active Mars surface imagery mode
    applySurfaceMode(surfaceMode, compositingOptions);

    // Set initial camera preserving original Mars orientation (centered on longitude 0°, latitude 8° N)
    const targetCartographic = Cesium.Cartographic.fromDegrees(0, 8, 9_200_000);
    const initialPos = marsEllipsoid.cartographicToCartesian(targetCartographic);
    viewer.camera.setView({
      destination: initialPos,
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0,
      },
    });

    // Populate landmark entities on the globe
    MARS_LANDMARKS.forEach((lm) => {
      const carto = Cesium.Cartographic.fromDegrees(lm.longitude, lm.latitude, 0);
      const position = marsEllipsoid.cartographicToCartesian(carto);

      viewer.entities.add({
        id: `landmark-${lm.id}`,
        name: lm.name,
        position: position,
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString('#f97316'),
          outlineColor: Cesium.Color.fromCssColorString('#ffffff'),
          outlineWidth: 2,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 35_000_000),
        },
        label: {
          text: lm.name,
          font: 'bold 12px "Inter", "Chakra Petch", sans-serif',
          style: Cesium.LabelStyle.FILL,
          fillColor: Cesium.Color.fromCssColorString('#ffffff'),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(11, 15, 25, 0.85)'),
          backgroundPadding: new Cesium.Cartesian2(8, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25_000_000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });

    // Screen Space Event Handler for mouse move coordinate tracking & landmark clicks
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;

    // Helper to calculate Martian coordinates from screen position in both 2D and 3D
    const getCartographicFromScreen = (windowPos: Cesium.Cartesian2): Cesium.Cartographic | null => {
      if (viewer.scene.mode === Cesium.SceneMode.SCENE2D) {
        const cartesian = viewer.camera.pickEllipsoid(windowPos, marsEllipsoid);
        return cartesian ? marsEllipsoid.cartesianToCartographic(cartesian) : null;
      }
      const ray = viewer.camera.getPickRay(windowPos);
      if (!ray) return null;
      const hitInterval = Cesium.IntersectionTests.rayEllipsoid(ray, marsEllipsoid);
      if (hitInterval && hitInterval.start >= 0) {
        const point = Cesium.Ray.getPoint(ray, hitInterval.start);
        return marsEllipsoid.cartesianToCartographic(point);
      }
      return null;
    };

    // Track coordinates on mouse hover
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      if (!viewer || viewer.isDestroyed()) return;

      const cartographic = getCartographicFromScreen(movement.endPosition);
      if (cartographic) {
        const lonDeg = Cesium.Math.toDegrees(cartographic.longitude);
        const latDeg = Cesium.Math.toDegrees(cartographic.latitude);
        const elevationMeters = MarsElevationEngine.getInstance().sampleMarsElevationSync(latDeg, lonDeg);
        const formatted = formatMarsCoordinates(lonDeg, latDeg, elevationMeters);
        onCoordinatesChange(formatted);
      } else {
        onCoordinatesChange(null);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Left click on globe or landmark marker
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      if (!viewer || viewer.isDestroyed()) return;

      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && typeof pickedObject.id.id === 'string') {
        const entityId = pickedObject.id.id as string;
        if (entityId.startsWith('landmark-')) {
          const landmarkId = entityId.replace('landmark-', '');
          const match = MARS_LANDMARKS.find((l) => l.id === landmarkId);
          if (match) {
            onSelectLandmark(match);
            flyToLandmark(match);
            return;
          }
        }
      }

      // If clicked on empty surface, calculate Martian coordinates
      const cartographic = getCartographicFromScreen(click.position);
      if (cartographic) {
        const lonDeg = Cesium.Math.toDegrees(cartographic.longitude);
        const latDeg = Cesium.Math.toDegrees(cartographic.latitude);
        const elevationMeters = MarsElevationEngine.getInstance().sampleMarsElevationSync(latDeg, lonDeg);
        const formatted = formatMarsCoordinates(lonDeg, latDeg, elevationMeters);
        onCoordinatesChange(formatted);
        onSelectSurfaceDestination?.();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Sensitive camera changed threshold & real-time telemetry updates
    viewer.camera.percentageChanged = 0.001;
    const removeCameraListener = viewer.camera.changed.addEventListener(updateTelemetry);
    updateTelemetry();

    setIsInitializing(false);

    // CLEANUP ON UNMOUNT
    return () => {
      removeCameraListener();
      removePostRenderListener();
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [checkWebGL, ellipsoidKey]); // Rebuild if ellipsoid model fundamentally changes

  // REACTIVE SETTINGS UPDATES WITHOUT REBUILDING VIEWER

  // Lighting Mode toggle
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.scene.globe.enableLighting = (lightingMode === 'solar');
  }, [lightingMode]);

  // 2D / 3D Scene Mode transition
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (sceneMode === '2D' && viewer.scene.mode !== Cesium.SceneMode.SCENE2D) {
      viewer.scene.morphTo2D(1.2);
    } else if (sceneMode === '3D' && viewer.scene.mode !== Cesium.SceneMode.SCENE3D) {
      viewer.scene.morphTo3D(1.2);
    }
  }, [sceneMode]);

  // Atmosphere toggle (only affects outer sky atmosphere, never tints the surface imagery)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.scene.globe.showGroundAtmosphere = false;
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = showAtmosphere;
    }
  }, [showAtmosphere]);

  // Marker visibility toggle
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.entities.values.forEach((entity) => {
      if (entity.id.startsWith('landmark-')) {
        entity.show = showLandmarkMarkers;
      }
    });
  }, [showLandmarkMarkers]);

  // Active landmark highlight update
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    MARS_LANDMARKS.forEach((lm) => {
      const entity = viewer.entities.getById(`landmark-${lm.id}`);
      if (entity && entity.point) {
        const isSelected = activeLandmark?.id === lm.id;
        entity.point.color = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(isSelected ? '#38bdf8' : '#f97316')
        );
        entity.point.pixelSize = new Cesium.ConstantProperty(isSelected ? 12 : 8);
      }
    });
  }, [activeLandmark]);

  // Reactive Surface Rendering Mode transition (guarded to prevent redundant layer teardown on mount)
  useEffect(() => {
    if (!isInitializing && viewerRef.current && !viewerRef.current.isDestroyed()) {
      if (
        lastAppliedModeRef.current?.mode !== surfaceMode ||
        lastAppliedModeRef.current?.normalized !== useNormalizedWmtsUrl
      ) {
        applySurfaceMode(surfaceMode, compositingOptions);
      }
    }
  }, [surfaceMode, useNormalizedWmtsUrl, applySurfaceMode, isInitializing, compositingOptions]);

  // Real-time Composite tuning (Instant GPU parameter updates without network tile reloading)
  useEffect(() => {
    updateMarsSurfaceCompositing(imageryLayersRef.current, surfaceMode, compositingOptions);
  }, [surfaceMode, compositingOptions]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* WebGL or Initialization Error Alert */}
      {webglError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-red-950/80 border border-red-500/50 rounded-xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-mono text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-red-200 mb-2 font-mono">RENDERING ENGINE FAILURE</h2>
            <p className="text-sm text-red-300/80 mb-6 font-sans">{webglError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950 text-slate-300">
          <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
          <div className="font-mono text-xs tracking-widest text-orange-400 uppercase">
            CALIBRATING MARS ELLIPSOID [{MARS_ELLIPSOID_MODELS[ellipsoidKey].name}]...
          </div>
        </div>
      )}

      {/* Cesium Canvas Container */}
      <div
        ref={containerRef}
        id="cesiumContainer"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

