import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { createMarsEllipsoid } from '../../config/marsEllipsoid';
import { 
  createMarsTerrainProvider 
} from '../../services/elevation/marsTerrainProvider';
import { 
  DEFAULT_COMPOSITING_OPTIONS,
  applyMarsSurfaceLayers,
  updateMarsSurfaceCompositing
} from '../../config/nasaImagery';
import { MarsElevationEngine } from '../../services/elevation/marsElevationEngine';
import { 
  TERRAIN_EXPLORATION_SITES, 
  TerrainExplorationSite 
} from '../../config/terrainConfig';
import { TerrainControls } from './TerrainControls';
import { TerrainTelemetryHUD } from './TerrainTelemetryHUD';
import { TerrainProvenanceModal } from './TerrainProvenanceModal';
import { MarsSurfaceMode, SurfaceCompositingOptions } from '../../types';

// Disable default Cesium Ion access token - purely using free NASA WMTS data
Cesium.Ion.defaultAccessToken = '';

export interface TerrainTargetDestination {
  siteId?: string;
  name?: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  headingDegrees?: number;
  pitchDegrees?: number;
  timestamp?: number;
}

interface TerrainExplorerProps {
  onExitToGlobe: () => void;
  initialSiteId?: string;
  surfaceMode?: MarsSurfaceMode;
  compositingOptions?: SurfaceCompositingOptions;
  useNormalizedWmtsUrl?: boolean;
  onUpdateSurfaceMode?: (mode: MarsSurfaceMode) => void;
  onUpdateCompositingOptions?: (options: SurfaceCompositingOptions) => void;
  onOpenDatasetModal?: () => void;
  targetDestination?: TerrainTargetDestination | null;
}

export const TerrainExplorer: React.FC<TerrainExplorerProps> = ({
  onExitToGlobe,
  initialSiteId = 'jezero-crater',
  surfaceMode = 'composite',
  compositingOptions = DEFAULT_COMPOSITING_OPTIONS,
  useNormalizedWmtsUrl = false,
  onUpdateSurfaceMode,
  onUpdateCompositingOptions,
  onOpenDatasetModal,
  targetDestination,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const imageryLayersRef = useRef<Cesium.ImageryLayer[]>([]);
  const lastAppliedSurfaceRef = useRef<{ mode: MarsSurfaceMode; normalized: boolean } | null>(null);

  // Synchronized state with global Mars state
  const [localSurfaceMode, setLocalSurfaceMode] = useState<MarsSurfaceMode>(surfaceMode);
  const [localCompositing, setLocalCompositing] = useState<SurfaceCompositingOptions>(compositingOptions);

  useEffect(() => {
    setLocalSurfaceMode(surfaceMode);
  }, [surfaceMode]);

  useEffect(() => {
    setLocalCompositing(compositingOptions);
  }, [compositingOptions]);

  const handleSelectSurfaceMode = useCallback((mode: MarsSurfaceMode) => {
    setLocalSurfaceMode(mode);
    onUpdateSurfaceMode?.(mode);
  }, [onUpdateSurfaceMode]);

  const handleUpdateCompositing = useCallback((opts: SurfaceCompositingOptions) => {
    setLocalCompositing(opts);
    onUpdateCompositingOptions?.(opts);
  }, [onUpdateCompositingOptions]);

  const handleResetCompositing = useCallback(() => {
    setLocalCompositing(DEFAULT_COMPOSITING_OPTIONS);
    onUpdateCompositingOptions?.(DEFAULT_COMPOSITING_OPTIONS);
  }, [onUpdateCompositingOptions]);

  // Active Exploration State
  const [activeSite, setActiveSite] = useState<TerrainExplorationSite>(() => {
    return TERRAIN_EXPLORATION_SITES[initialSiteId] || TERRAIN_EXPLORATION_SITES['jezero-crater'];
  });
  const [cameraMode, setCameraMode] = useState<'orbit' | 'surface'>('orbit');
  const [altitudeMeters, setAltitudeMeters] = useState<number>(38000);
  const [pitchDegrees, setPitchDegrees] = useState<number>(-38);
  const [headingDegrees, setHeadingDegrees] = useState<number>(55);
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(2.0);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);

  // Live Telemetry from Cesium Camera
  const [telemetry, setTelemetry] = useState<{
    latitude: number;
    longitude: number;
    surfaceElevationMeters: number | null;
    cameraAltitudeMeters: number;
    cameraPitchDegrees: number;
    cameraHeadingDegrees: number;
  }>({
    latitude: 18.38,
    longitude: 77.58,
    surfaceElevationMeters: -2560,
    cameraAltitudeMeters: 38000,
    cameraPitchDegrees: -38,
    cameraHeadingDegrees: 55,
  });

  // Rover position state for surface walking
  const roverPosRef = useRef<{ lat: number; lon: number; height: number }>({
    lat: 18.444,
    lon: 77.451,
    height: 2.5,
  });

  // 1. Initialize Cesium Viewer with Mars Ellipsoid and Mars Terrain Provider
  useEffect(() => {
    if (!containerRef.current) return;

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');
    const terrainProvider = createMarsTerrainProvider(marsEllipsoid, {
      gridWidth: 65,
      gridHeight: 65,
      verticalExaggeration: verticalExaggeration,
    });

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrainProvider: terrainProvider,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      timeline: false,
      animation: false,
      fullscreenButton: false,
      selectionIndicator: false,
      skyBox: false,
      skyAtmosphere: false,
      baseLayer: false, // Explicitly false: do NOT load default Cesium Ion Earth imagery
      ellipsoid: marsEllipsoid,
      useBrowserRecommendedResolution: true,
      requestRenderMode: false,
    });

    // Configure Martian 3D Globe Properties
    const globe = viewer.scene.globe;
    globe.showGroundAtmosphere = false;
    globe.baseColor = Cesium.Color.fromCssColorString('#7c3218');
    globe.depthTestAgainstTerrain = true;
    globe.enableLighting = false;
    viewer.scene.highDynamicRange = false;

    // Enable Collision Detection and Rover Proximity
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableCollisionDetection = true;
    controller.minimumZoomDistance = 1.0; // allows descending down to 2m rover mastcam

    // Setup Initial Imagery Layer using single shared source of truth
    const layers = applyMarsSurfaceLayers(
      viewer,
      marsEllipsoid,
      localSurfaceMode,
      localCompositing,
      { useNormalizedUrl: useNormalizedWmtsUrl }
    );
    imageryLayersRef.current = layers;
    lastAppliedSurfaceRef.current = { mode: localSurfaceMode, normalized: !!useNormalizedWmtsUrl };

    // Initial FlyTo active site or targetDestination
    const initialTargetCoord = targetDestination ? {
      longitude: targetDestination.longitude,
      latitude: targetDestination.latitude,
      altitudeMeters: targetDestination.altitudeMeters ?? 38000,
      headingDegrees: targetDestination.headingDegrees ?? 55,
      pitchDegrees: targetDestination.pitchDegrees ?? -38,
    } : {
      longitude: activeSite.longitude,
      latitude: activeSite.latitude,
      altitudeMeters: activeSite.orbitCamera.altitudeMeters,
      headingDegrees: activeSite.orbitCamera.headingDegrees,
      pitchDegrees: activeSite.orbitCamera.pitchDegrees,
    };

    const initialTarget = Cesium.Cartesian3.fromDegrees(
      initialTargetCoord.longitude,
      initialTargetCoord.latitude,
      initialTargetCoord.altitudeMeters,
      marsEllipsoid
    );

    if (targetDestination) {
      lastTargetTimestampRef.current = targetDestination.timestamp;
      const surfaceTarget = Cesium.Cartesian3.fromDegrees(targetDestination.longitude, targetDestination.latitude, 0, marsEllipsoid);
      viewer.entities.add({
        id: 'terrain-target-marker',
        name: targetDestination.name || 'Destination Coordinates',
        position: surfaceTarget,
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: targetDestination.name || `Target: ${targetDestination.latitude.toFixed(2)}°, ${targetDestination.longitude.toFixed(2)}°`,
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
      destination: initialTarget,
      orientation: {
        heading: Cesium.Math.toRadians(initialTargetCoord.headingDegrees),
        pitch: Cesium.Math.toRadians(initialTargetCoord.pitchDegrees),
        roll: 0,
      },
      duration: 1.5,
    });

    viewerRef.current = viewer;

    // PostRender telemetry listener
    let lastUpdate = 0;
    const removePostRender = viewer.scene.postRender.addEventListener(() => {
      const now = performance.now();
      if (now - lastUpdate < 150) return; // Throttle to ~6.6 Hz for UI smoothness
      lastUpdate = now;

      if (!viewer.camera || viewer.isDestroyed()) return;

      const carto = viewer.camera.positionCartographic;
      if (!carto) return;

      const latDeg = Cesium.Math.toDegrees(carto.latitude);
      const lonDeg = Cesium.Math.toDegrees(carto.longitude);
      const altMeters = carto.height;
      const headingDeg = Cesium.Math.toDegrees(viewer.camera.heading);
      const pitchDeg = Cesium.Math.toDegrees(viewer.camera.pitch);

      // Sample ground elevation at camera nadir point
      const groundElev = MarsElevationEngine.getInstance().sampleMarsElevationSync(latDeg, lonDeg);

      setTelemetry({
        latitude: latDeg,
        longitude: lonDeg,
        surfaceElevationMeters: groundElev ?? activeSite.elevationMeters,
        cameraAltitudeMeters: altMeters,
        cameraPitchDegrees: pitchDeg,
        cameraHeadingDegrees: headingDeg,
      });
    });

    return () => {
      removePostRender();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []); // Run once on mount

  // 2. Handle Surface Mode and Tile URL Changes (Synchronized with Mars Globe)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (
      lastAppliedSurfaceRef.current?.mode !== localSurfaceMode ||
      lastAppliedSurfaceRef.current?.normalized !== useNormalizedWmtsUrl
    ) {
      lastAppliedSurfaceRef.current = { mode: localSurfaceMode, normalized: !!useNormalizedWmtsUrl };
      const marsEllipsoid = createMarsEllipsoid('IAU_2015');
      const layers = applyMarsSurfaceLayers(
        viewer,
        marsEllipsoid,
        localSurfaceMode,
        localCompositing,
        { useNormalizedUrl: useNormalizedWmtsUrl }
      );
      imageryLayersRef.current = layers;
    }
  }, [localSurfaceMode, useNormalizedWmtsUrl, localCompositing]);

  // 3. Real-time Composite tuning (Instant GPU parameter updates for alpha, saturation, contrast)
  useEffect(() => {
    updateMarsSurfaceCompositing(imageryLayersRef.current, localSurfaceMode, localCompositing);
  }, [localSurfaceMode, localCompositing]);

  // 4. Copilot & Programmatic Terrain Navigation
  const flyToTargetDestination = useCallback((target: TerrainTargetDestination) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');

    // Check if coordinates match or are near a known terrain site
    let matchingSite: TerrainExplorationSite | undefined;
    if (target.siteId && TERRAIN_EXPLORATION_SITES[target.siteId]) {
      matchingSite = TERRAIN_EXPLORATION_SITES[target.siteId];
    } else {
      for (const site of Object.values(TERRAIN_EXPLORATION_SITES)) {
        const dLat = ((target.latitude - site.latitude) * Math.PI) / 180;
        const dLon = ((target.longitude - site.longitude) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((site.latitude * Math.PI) / 180) * Math.cos((target.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        const distKm = 3396.19 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distKm < 150) {
          matchingSite = site;
          break;
        }
      }
    }

    if (matchingSite) {
      setActiveSite(matchingSite);
    }

    const alt = target.altitudeMeters ?? matchingSite?.orbitCamera.altitudeMeters ?? 38000;
    const pitch = target.pitchDegrees ?? matchingSite?.orbitCamera.pitchDegrees ?? -38;
    const heading = target.headingDegrees ?? matchingSite?.orbitCamera.headingDegrees ?? 55;

    setAltitudeMeters(alt);
    setPitchDegrees(pitch);
    setHeadingDegrees(heading);

    const destination = Cesium.Cartesian3.fromDegrees(
      target.longitude,
      target.latitude,
      alt,
      marsEllipsoid
    );

    // Place or update destination marker on Martian terrain surface
    const surfaceTarget = Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, 0, marsEllipsoid);
    const existing = viewer.entities.getById('terrain-target-marker');
    const labelText = target.name || `Target: ${target.latitude.toFixed(2)}°, ${target.longitude.toFixed(2)}°`;
    if (existing) {
      existing.position = new Cesium.ConstantPositionProperty(surfaceTarget);
      if (existing.label) {
        existing.label.text = new Cesium.ConstantProperty(labelText);
      }
      existing.show = true;
    } else {
      viewer.entities.add({
        id: 'terrain-target-marker',
        name: 'Target Destination',
        position: surfaceTarget,
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString('#38bdf8'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: labelText,
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
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    });
  }, []);

  const lastTargetTimestampRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (targetDestination && targetDestination.timestamp !== lastTargetTimestampRef.current) {
      lastTargetTimestampRef.current = targetDestination.timestamp;
      flyToTargetDestination(targetDestination);
    }
  }, [targetDestination, flyToTargetDestination]);

  // 3. Handle Vertical Exaggeration Changes
  const handleToggleExaggeration = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const newExaggeration = verticalExaggeration === 2.0 ? 1.0 : 2.0;
    setVerticalExaggeration(newExaggeration);

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');
    const newTerrainProvider = createMarsTerrainProvider(marsEllipsoid, {
      gridWidth: 65,
      gridHeight: 65,
      verticalExaggeration: newExaggeration,
    });

    viewer.scene.globe.terrainProvider = newTerrainProvider;
  }, [verticalExaggeration]);

  // 4. Handle Site Selection (Smooth Flight to Site)
  const handleSelectSite = useCallback((site: TerrainExplorationSite) => {
    setActiveSite(site);
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');

    if (cameraMode === 'surface') {
      // In rover surface mode: fly to surface landing coordinates with 2.5m clearance
      roverPosRef.current = {
        lat: site.surfaceCamera.latitude,
        lon: site.surfaceCamera.longitude,
        height: site.surfaceCamera.eyeHeightMeters,
      };

      const groundElev = MarsElevationEngine.getInstance().sampleMarsElevationSync(
        site.surfaceCamera.latitude,
        site.surfaceCamera.longitude
      ) ?? site.elevationMeters;

      const surfaceAltitude = (groundElev * verticalExaggeration) + site.surfaceCamera.eyeHeightMeters;

      const destination = Cesium.Cartesian3.fromDegrees(
        site.surfaceCamera.longitude,
        site.surfaceCamera.latitude,
        surfaceAltitude,
        marsEllipsoid
      );

      setAltitudeMeters(site.surfaceCamera.eyeHeightMeters);
      setPitchDegrees(site.surfaceCamera.pitchDegrees);
      setHeadingDegrees(site.surfaceCamera.headingDegrees);

      viewer.camera.flyTo({
        destination: destination,
        orientation: {
          heading: Cesium.Math.toRadians(site.surfaceCamera.headingDegrees),
          pitch: Cesium.Math.toRadians(site.surfaceCamera.pitchDegrees),
          roll: 0,
        },
        duration: 2.2,
      });
    } else {
      // In 3D orbit mode: fly to oblique camera preset
      const destination = Cesium.Cartesian3.fromDegrees(
        site.longitude,
        site.latitude,
        site.orbitCamera.altitudeMeters,
        marsEllipsoid
      );

      setAltitudeMeters(site.orbitCamera.altitudeMeters);
      setPitchDegrees(site.orbitCamera.pitchDegrees);
      setHeadingDegrees(site.orbitCamera.headingDegrees);

      viewer.camera.flyTo({
        destination: destination,
        orientation: {
          heading: Cesium.Math.toRadians(site.orbitCamera.headingDegrees),
          pitch: Cesium.Math.toRadians(site.orbitCamera.pitchDegrees),
          roll: 0,
        },
        duration: 2.2,
      });
    }
  }, [cameraMode, verticalExaggeration]);

  // 5. Handle Mode Switch (Orbit vs Rover-Eye Surface)
  const handleSelectMode = useCallback((mode: 'orbit' | 'surface') => {
    setCameraMode(mode);
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');

    if (mode === 'surface') {
      // Transition from Orbit to Surface Rover Eye
      roverPosRef.current = {
        lat: activeSite.surfaceCamera.latitude,
        lon: activeSite.surfaceCamera.longitude,
        height: activeSite.surfaceCamera.eyeHeightMeters,
      };

      const groundElev = MarsElevationEngine.getInstance().sampleMarsElevationSync(
        activeSite.surfaceCamera.latitude,
        activeSite.surfaceCamera.longitude
      ) ?? activeSite.elevationMeters;

      const surfaceAltitude = (groundElev * verticalExaggeration) + activeSite.surfaceCamera.eyeHeightMeters;

      const destination = Cesium.Cartesian3.fromDegrees(
        activeSite.surfaceCamera.longitude,
        activeSite.surfaceCamera.latitude,
        surfaceAltitude,
        marsEllipsoid
      );

      setAltitudeMeters(activeSite.surfaceCamera.eyeHeightMeters);
      setPitchDegrees(activeSite.surfaceCamera.pitchDegrees);
      setHeadingDegrees(activeSite.surfaceCamera.headingDegrees);

      viewer.camera.flyTo({
        destination: destination,
        orientation: {
          heading: Cesium.Math.toRadians(activeSite.surfaceCamera.headingDegrees),
          pitch: Cesium.Math.toRadians(activeSite.surfaceCamera.pitchDegrees),
          roll: 0,
        },
        duration: 2.0,
      });
    } else {
      // Transition from Surface to 3D Orbit Oblique
      const destination = Cesium.Cartesian3.fromDegrees(
        activeSite.longitude,
        activeSite.latitude,
        activeSite.orbitCamera.altitudeMeters,
        marsEllipsoid
      );

      setAltitudeMeters(activeSite.orbitCamera.altitudeMeters);
      setPitchDegrees(activeSite.orbitCamera.pitchDegrees);
      setHeadingDegrees(activeSite.orbitCamera.headingDegrees);

      viewer.camera.flyTo({
        destination: destination,
        orientation: {
          heading: Cesium.Math.toRadians(activeSite.orbitCamera.headingDegrees),
          pitch: Cesium.Math.toRadians(activeSite.orbitCamera.pitchDegrees),
          roll: 0,
        },
        duration: 2.0,
      });
    }
  }, [activeSite, verticalExaggeration]);

  // 6. Camera Adjustments: Altitude, Pitch, Heading
  const handleChangeAltitude = useCallback((altMeters: number) => {
    setAltitudeMeters(altMeters);
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');
    const carto = viewer.camera.positionCartographic;
    if (!carto) return;

    const latDeg = Cesium.Math.toDegrees(carto.latitude);
    const lonDeg = Cesium.Math.toDegrees(carto.longitude);

    const groundElev = MarsElevationEngine.getInstance().sampleMarsElevationSync(latDeg, lonDeg) ?? activeSite.elevationMeters;
    const finalAlt = cameraMode === 'surface'
      ? (groundElev * verticalExaggeration) + altMeters
      : altMeters;

    const destination = Cesium.Cartesian3.fromDegrees(lonDeg, latDeg, finalAlt, marsEllipsoid);

    viewer.camera.setView({
      destination: destination,
      orientation: {
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: 0,
      },
    });
  }, [activeSite.elevationMeters, cameraMode, verticalExaggeration]);

  const handleChangePitch = useCallback((pitchDeg: number) => {
    setPitchDegrees(pitchDeg);
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.camera.setView({
      orientation: {
        heading: viewer.camera.heading,
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0,
      },
    });
  }, []);

  const handleChangeHeading = useCallback((headingDeg: number) => {
    setHeadingDegrees(headingDeg);
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.camera.setView({
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: viewer.camera.pitch,
        roll: 0,
      },
    });
  }, []);

  // 7. Reset Camera to current active site defaults
  const handleResetView = useCallback(() => {
    handleSelectSite(activeSite);
  }, [handleSelectSite, activeSite]);

  // 8. Rover Navigation Step (Walking across terrain with collision safety clamp)
  const handleRoverWalk = useCallback((direction: 'forward' | 'backward' | 'left' | 'right') => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const marsEllipsoid = createMarsEllipsoid('IAU_2015');
    const currentHeading = viewer.camera.heading; // in radians

    // Step distance: 20 meters per step
    const stepMeters = 20;
    const marsRadius = 3396190.0;

    let angle = currentHeading;
    if (direction === 'backward') angle += Math.PI;
    if (direction === 'left') angle -= Math.PI / 2;
    if (direction === 'right') angle += Math.PI / 2;

    const dLatDeg = (stepMeters * Math.cos(angle) / marsRadius) * (180 / Math.PI);
    const dLonDeg = (stepMeters * Math.sin(angle) / (marsRadius * Math.cos(roverPosRef.current.lat * (Math.PI / 180)))) * (180 / Math.PI);

    const newLat = Math.max(-89.9, Math.min(89.9, roverPosRef.current.lat + dLatDeg));
    const newLon = ((roverPosRef.current.lon + dLonDeg + 180) % 360) - 180;

    // Sample terrain elevation at the new location
    const groundElev = MarsElevationEngine.getInstance().sampleMarsElevationSync(newLat, newLon) ?? activeSite.elevationMeters;
    const eyeHeight = 2.5; // Curiosity/Perseverance mastcam height
    const finalAltitude = (groundElev * verticalExaggeration) + eyeHeight;

    roverPosRef.current = {
      lat: newLat,
      lon: newLon,
      height: eyeHeight,
    };

    const newPos = Cesium.Cartesian3.fromDegrees(newLon, newLat, finalAltitude, marsEllipsoid);

    viewer.camera.flyTo({
      destination: newPos,
      orientation: {
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: 0,
      },
      duration: 0.35,
    });
  }, [activeSite.elevationMeters, verticalExaggeration]);

  const handleRoverTurn = useCallback((deltaHeadingDeg: number) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const currentHeadingDeg = Cesium.Math.toDegrees(viewer.camera.heading);
    const newHeadingDeg = (currentHeadingDeg + deltaHeadingDeg + 360) % 360;
    setHeadingDegrees(newHeadingDeg);

    viewer.camera.setView({
      orientation: {
        heading: Cesium.Math.toRadians(newHeadingDeg),
        pitch: viewer.camera.pitch,
        roll: 0,
      },
    });
  }, []);

  const handleRoverLook = useCallback((deltaPitchDeg: number) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const currentPitchDeg = Cesium.Math.toDegrees(viewer.camera.pitch);
    const newPitchDeg = Math.max(-85, Math.min(25, currentPitchDeg + deltaPitchDeg));
    setPitchDegrees(newPitchDeg);

    viewer.camera.setView({
      orientation: {
        heading: viewer.camera.heading,
        pitch: Cesium.Math.toRadians(newPitchDeg),
        roll: 0,
      },
    });
  }, []);

  // 9. Keyboard controls for walking in Rover-Eye mode (WASD + Arrow keys)
  useEffect(() => {
    if (cameraMode !== 'surface') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') {
        e.preventDefault();
        handleRoverWalk('forward');
      } else if (key === 's' || key === 'arrowdown') {
        e.preventDefault();
        handleRoverWalk('backward');
      } else if (key === 'a' || key === 'arrowleft') {
        e.preventDefault();
        handleRoverWalk('left');
      } else if (key === 'd' || key === 'arrowright') {
        e.preventDefault();
        handleRoverWalk('right');
      } else if (key === 'q') {
        e.preventDefault();
        handleRoverTurn(-10);
      } else if (key === 'e') {
        e.preventDefault();
        handleRoverTurn(10);
      } else if (key === 'r') {
        e.preventDefault();
        handleRoverLook(5);
      } else if (key === 'f') {
        e.preventDefault();
        handleRoverLook(-5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraMode, handleRoverWalk, handleRoverTurn, handleRoverLook]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* Cesium WebGL Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Floating Exploration Controls */}
      <TerrainControls
        activeSite={activeSite}
        cameraMode={cameraMode}
        altitudeMeters={altitudeMeters}
        pitchDegrees={pitchDegrees}
        headingDegrees={headingDegrees}
        verticalExaggeration={verticalExaggeration}
        surfaceMode={localSurfaceMode}
        compositingOptions={localCompositing}
        onSelectSite={handleSelectSite}
        onSelectMode={handleSelectMode}
        onChangeAltitude={handleChangeAltitude}
        onChangePitch={handleChangePitch}
        onChangeHeading={handleChangeHeading}
        onToggleExaggeration={handleToggleExaggeration}
        onSelectSurfaceMode={handleSelectSurfaceMode}
        onUpdateCompositingOptions={handleUpdateCompositing}
        onResetCompositingOptions={handleResetCompositing}
        onOpenDatasetModal={onOpenDatasetModal}
        onResetView={handleResetView}
        onRoverWalk={handleRoverWalk}
        onRoverTurn={handleRoverTurn}
        onRoverLook={handleRoverLook}
        onExitToGlobe={onExitToGlobe}
      />

      {/* Bottom Telemetry HUD */}
      <TerrainTelemetryHUD
        latitude={telemetry.latitude}
        longitude={telemetry.longitude}
        surfaceElevationMeters={telemetry.surfaceElevationMeters}
        cameraAltitudeMeters={telemetry.cameraAltitudeMeters}
        cameraPitchDegrees={telemetry.cameraPitchDegrees}
        cameraHeadingDegrees={telemetry.cameraHeadingDegrees}
        cameraMode={cameraMode}
        activeSiteName={activeSite.name}
        activeSiteBadge={activeSite.badge}
        onOpenProvenance={() => setIsProvenanceOpen(true)}
      />

      {/* Provenance & Scientific Documentation Modal */}
      <TerrainProvenanceModal
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
        activeSiteId={activeSite.id}
      />
    </div>
  );
};

