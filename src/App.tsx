import { useState, useRef, useCallback, useEffect } from 'react';
import * as Cesium from 'cesium';
import { MarsGlobe, MarsGlobeHandle } from './components/MarsGlobe/MarsGlobe';
import { Header } from './components/UI/Header';
import { CoordinateHUD } from './components/UI/CoordinateHUD';
import { DatasetModal } from './components/UI/DatasetModal';
import { ErrorBanner } from './components/UI/ErrorBanner';
import { CoordinateSearchPanel } from './components/UI/CoordinateSearchPanel';
import { SpaceBackground } from './components/SpaceEnvironment/SpaceBackground';
import { SolarSystemView } from './components/SpaceEnvironment/SolarSystemView';
import { MarsMoons } from './components/SpaceEnvironment/MarsMoons';
import { MoonControlPanel } from './components/UI/MoonControlPanel';
import { FullscreenHUD } from './components/UI/FullscreenHUD';
import { FooterDock } from './components/UI/FooterDock';
import { MarsCoordinates, CameraTelemetry, MarsLandmark, MarsSurfaceMode, SurfaceCompositingOptions } from './types';
import { formatMarsCoordinates } from './config/marsEllipsoid';
import { DEFAULT_COMPOSITING_OPTIONS } from './config/nasaImagery';
import { MiraAICopilot } from './components/AI/MiraAICopilot';
import { MoonStateVector } from './services/moons/moonEphemerisService';
import { CopilotAction } from './services/miraAiService';
import { TerrainExplorer } from './components/TerrainExplorer';
import { TERRAIN_EXPLORER_ENABLED } from './config/terrainConfig';
import { MarsRoutePlanner } from './components/RoutePlanner/MarsRoutePlanner';

type DockTab = 'mars' | 'solar' | 'terrain' | 'dashboard' | 'analysis' | 'compare';

export function App() {
  const globeRef = useRef<MarsGlobeHandle>(null);
  const [cesiumViewer, setCesiumViewer] = useState<Cesium.Viewer | null>(null);

  // Application States - Coordinates measured from Jezero Crater as reference origin (0°, 0°)
  const [activeLandmark, setActiveLandmark] = useState<MarsLandmark | null>(null);
  const [coordinates, setCoordinates] = useState<MarsCoordinates | null>(() => {
    return formatMarsCoordinates(77.58, 18.38); // Origin at Jezero: 0.0000° N, 0.0000° E
  });
  const [telemetry, setTelemetry] = useState<CameraTelemetry>({
    altitudeKm: 2347,
    headingDeg: 120.5,
    pitchDeg: -12.3,
    rollDeg: 0.8,
  });

  // Visualization settings
  const [surfaceMode, setSurfaceMode] = useState<MarsSurfaceMode>('composite');
  const [compositingOptions, setCompositingOptions] = useState<SurfaceCompositingOptions>(DEFAULT_COMPOSITING_OPTIONS);
  const [lightingMode, setLightingMode] = useState<'solar' | 'ambient'>('ambient');
  const [sceneMode, setSceneMode] = useState<'2D' | '3D'>('3D');
  const showAtmosphere = false;
  const showLandmarkMarkers = true;
  const [ellipsoidKey, setEllipsoidKey] = useState<'IAU_2015' | 'MOLA_TRIAXIAL'>('IAU_2015');
  const [useNormalizedWmtsUrl, setUseNormalizedWmtsUrl] = useState(false);

  // UI Panels - All open by default to form the exact dashboard layout in reference image
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(true);
  const [isMoonPanelOpen, setIsMoonPanelOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'nav' | 'moons'>('nav');
  const [isSolarSystemOpen, setIsSolarSystemOpen] = useState(false);
  const [solarInitialTab, setSolarInitialTab] = useState<'3d' | 'dashboard' | 'database' | 'compare'>('3d');
  const [solarInitialPlanet, setSolarInitialPlanet] = useState<string | null>(null);
  const [solarTimelapse, setSolarTimelapse] = useState<number | undefined>(undefined);
  const [solarZoomTrigger, setSolarZoomTrigger] = useState<number>(0);
  const [dockTab, setDockTab] = useState<DockTab>('mars');
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // FEATURE 1: Phobos & Deimos Moons State
  const [showPhobos, setShowPhobos] = useState(true);
  const [showDeimos, setShowDeimos] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showMoonLabels, setShowMoonLabels] = useState(true);
  const [isMoonPaused, setIsMoonPaused] = useState(false);
  const [resetClockTrigger, setResetClockTrigger] = useState(0);
  const [selectedMoon, setSelectedMoon] = useState<'phobos' | 'deimos' | null>(null);
  const [moonFlyTrigger, setMoonFlyTrigger] = useState(0);
  const [moonTelemetry, setMoonTelemetry] = useState<{ phobos: MoonStateVector; deimos: MoonStateVector } | null>(null);

  // Target destination for 3D Terrain Explorer from Copilot or coordinate searches
  const [terrainTarget, setTerrainTarget] = useState<{
    siteId?: string;
    name?: string;
    latitude: number;
    longitude: number;
    altitudeMeters?: number;
    headingDegrees?: number;
    pitchDegrees?: number;
    timestamp: number;
  } | null>(null);

  const handleResetToCurrentTime = useCallback(() => {
    setResetClockTrigger((prev) => prev + 1);
  }, []);

  // FEATURE 2: Fullscreen Cinematic Exploration State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Imagery status & error management
  const [wmtsStatus, setWmtsStatus] = useState<{ loaded: boolean; error: string | null; testing: boolean }>({
    loaded: true,
    error: null,
    testing: false,
  });
  const [isRetrying, setIsRetrying] = useState(false);

  // Native Fullscreen API sync & ESC key handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        setIsAutoRotating(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleExitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    setIsAutoRotating(false);
  }, []);

  // Reset Camera View to Prime Meridian (Jezero Crater)
  const handleResetCamera = useCallback(() => {
    setActiveLandmark(null);
    setSelectedMoon(null);
    globeRef.current?.resetCamera();
  }, []);

  // Handle Dock Tabs Navigation
  const handleSelectDockTab = useCallback((tab: DockTab) => {
    setDockTab(tab);
    if (tab === 'mars') {
      setIsSolarSystemOpen(false);
      handleResetCamera();
    } else if (tab === 'solar') {
      setSolarInitialTab('3d');
      setIsSolarSystemOpen(true);
    } else if (tab === 'terrain') {
      setIsSolarSystemOpen(false);
    } else if (tab === 'dashboard') {
      setSolarInitialTab('dashboard');
      setIsSolarSystemOpen(true);
    } else if (tab === 'analysis') {
      setSolarInitialTab('3d');
      setIsSolarSystemOpen(true);
    } else if (tab === 'compare') {
      setSolarInitialTab('compare');
      setIsSolarSystemOpen(true);
    }
  }, [handleResetCamera]);

  // Mission Control Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        setIsAiCopilotOpen((prev) => !prev);
      } else if (key === 's') {
        setIsSolarSystemOpen((prev) => !prev);
      } else if (key === 'l') {
        setLightingMode((prev) => (prev === 'ambient' ? 'solar' : 'ambient'));
      } else if (key === 'm') {
        setIsMoonPanelOpen((prev) => !prev);
      } else if (key === 'r') {
        handleResetCamera();
      } else if (key === 'escape') {
        setIsDatasetModalOpen(false);
        setIsSolarSystemOpen(false);
        setDockTab('mars');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetCamera]);

  // Cinematic Turntable Auto-Rotation
  useEffect(() => {
    if (!isAutoRotating || !cesiumViewer || cesiumViewer.isDestroyed()) return;

    let animId: number;
    const rotateStep = () => {
      if (cesiumViewer && !cesiumViewer.isDestroyed()) {
        cesiumViewer.camera.rotateRight(0.0008);
      }
      animId = requestAnimationFrame(rotateStep);
    };

    animId = requestAnimationFrame(rotateStep);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, cesiumViewer]);

  const handleNavigateToCoordinates = useCallback((lat: number, lon: number) => {
    setActiveLandmark(null);
    setIsMoonPaused(true);
    globeRef.current?.flyToCoordinates(lon, lat, 450_000);
  }, []);

  const handleSelectLandmark = useCallback((landmark: MarsLandmark | null) => {
    setActiveLandmark(landmark);
    if (landmark) {
      setIsMoonPaused(true);
    }
  }, []);

  const handleRetryImagery = useCallback(async () => {
    setIsRetrying(true);
    await globeRef.current?.retryImagery();
    setIsRetrying(false);
  }, []);

  const handleToggleNormalizedUrl = useCallback(() => {
    setUseNormalizedWmtsUrl((prev) => !prev);
    setTimeout(() => {
      globeRef.current?.retryImagery();
    }, 100);
  }, []);

  // Fly Camera to Phobos or Deimos facing Mars (Auto-pauses Mars system)
  const handleFlyToMoon = useCallback((moonId: 'phobos' | 'deimos') => {
    setSelectedMoon(moonId);
    setIsMoonPaused(true);
    setMoonFlyTrigger((prev) => prev + 1);
  }, []);

  const handleSelectMoon = useCallback((moonId: 'phobos' | 'deimos' | null) => {
    setSelectedMoon(moonId);
    if (moonId) {
      setIsMoonPaused(true);
      setMoonFlyTrigger((prev) => prev + 1);
    }
  }, []);

  const handleReturnFromMoon = useCallback(() => {
    setSelectedMoon(null);
    // Keep paused as required by spec: "Keep Mars, Phobos and Deimos paused. Allow the user to manually press Resume."
  }, []);

  // Action Dispatch from MIRA AI Copilot (Solar System, Earth perspective, Moons, Navigation, Lighting)
  const handleExecuteCopilotAction = useCallback((action: CopilotAction) => {
    switch (action.type) {
      case 'OPEN_SOLAR_SYSTEM':
      case 'FOCUS_PLANET': {
        const planet = action.payload?.planetId || 'earth';
        setSolarInitialPlanet(planet);
        setSolarInitialTab('3d');
        setIsSolarSystemOpen(true);
        setDockTab('solar');
        if (action.payload?.focus) {
          setSolarZoomTrigger(Date.now());
        }
        break;
      }
      case 'SET_TIMELAPSE': {
        if (action.payload?.daysPerSecond) {
          setSolarTimelapse(action.payload.daysPerSecond);
        }
        break;
      }
      case 'ZOOM_CAMERA': {
        if (isSolarSystemOpen || dockTab === 'solar') {
          setSolarZoomTrigger(Date.now());
        } else {
          if (action.payload?.direction === 'out') {
            globeRef.current?.zoomOut();
          } else {
            globeRef.current?.zoomIn();
          }
        }
        break;
      }
      case 'COMBINED_ACTION_SEQUENCE': {
        if (Array.isArray(action.payload?.actions)) {
          action.payload.actions.forEach((subAction: CopilotAction) => {
            handleExecuteCopilotAction(subAction);
          });
        }
        break;
      }
      case 'FOCUS_MOON': {
        setIsMoonPanelOpen(true);
        setMobileTab('moons');
        setIsMoonPaused(true);
        handleFlyToMoon(action.payload?.moonId || 'phobos');
        break;
      }
      case 'OPEN_MOONS': {
        setIsMoonPanelOpen(true);
        setMobileTab('moons');
        break;
      }
      case 'RETURN_TO_MARS': {
        setIsSolarSystemOpen(false);
        setSolarInitialPlanet(null);
        setDockTab('mars');
        setSelectedMoon(null);
        setMobileTab('nav');
        handleResetCamera();
        break;
      }
      case 'NAVIGATE_MARS': {
        setActiveLandmark(null);
        setIsMoonPaused(true);
        setMobileTab('nav');
        setIsSolarSystemOpen(false);
        setDockTab('mars');
        if (action.payload) {
          globeRef.current?.flyToCoordinates(
            action.payload.longitude,
            action.payload.latitude,
            action.payload.altitudeMeters || 450_000
          );
        }
        break;
      }
      case 'SET_LIGHTING': {
        setLightingMode(action.payload);
        break;
      }
      case 'SET_SCENE_MODE': {
        setSceneMode(action.payload);
        break;
      }
      case 'OPEN_DATASET_MODAL': {
        setIsDatasetModalOpen(true);
        break;
      }
      case 'NAVIGATE_TERRAIN': {
        setIsSolarSystemOpen(false);
        setDockTab('terrain');
        if (action.payload) {
          setTerrainTarget({
            ...action.payload,
            timestamp: Date.now(),
          });
          const coordObj = formatMarsCoordinates(action.payload.longitude, action.payload.latitude);
          setCoordinates(coordObj);
        }
        break;
      }
      case 'OPEN_TERRAIN_EXPLORER': {
        setIsSolarSystemOpen(false);
        setDockTab('terrain');
        if (action.payload) {
          setTerrainTarget({
            ...action.payload,
            timestamp: Date.now(),
          });
          const coordObj = formatMarsCoordinates(action.payload.longitude, action.payload.latitude);
          setCoordinates(coordObj);
        }
        break;
      }
    }
  }, [handleFlyToMoon, handleResetCamera, isSolarSystemOpen, dockTab]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Outer Space Background */}
      <SpaceBackground viewer={cesiumViewer} telemetry={telemetry} lightingMode={lightingMode} />

      {/* 2. 3D / 2D Mars Globe Cesium Canvas & Space Moons (Preserved, suspended when in Terrain Explorer) */}
      <div className={dockTab === 'terrain' ? 'hidden' : 'contents'}>
        <MarsGlobe
          globeRef={globeRef}
          activeLandmark={activeLandmark}
          onSelectLandmark={handleSelectLandmark}
          onCoordinatesChange={setCoordinates}
          onTelemetryChange={setTelemetry}
          onSelectSurfaceDestination={() => setIsMoonPaused(true)}
          lightingMode={lightingMode}
          sceneMode={sceneMode}
          showAtmosphere={showAtmosphere}
          showLandmarkMarkers={showLandmarkMarkers}
          ellipsoidKey={ellipsoidKey}
          useNormalizedWmtsUrl={useNormalizedWmtsUrl}
          surfaceMode={surfaceMode}
          compositingOptions={compositingOptions}
          onFallbackToOriginal={() => setSurfaceMode('original')}
          onImageryStatusChange={setWmtsStatus}
          onViewerReady={setCesiumViewer}
        />

        {/* FEATURE 1: Independent Phobos & Deimos Moons in Space */}
        <MarsMoons
          viewer={cesiumViewer}
          showPhobos={showPhobos}
          showDeimos={showDeimos}
          showOrbits={showOrbits}
          showLabels={showMoonLabels}
          isPaused={isMoonPaused}
          resetClockTrigger={resetClockTrigger}
          selectedMoon={selectedMoon}
          onSelectMoon={handleSelectMoon}
          flyToTrigger={moonFlyTrigger}
          onReturnToMars={handleReturnFromMoon}
          onTelemetryUpdate={setMoonTelemetry}
        />
      </div>

      {/* MIRA rover route planner: uses the same Mars globe and numerical MOLA elevation engine */}
      {!isFullscreen && dockTab === 'mars' && (
        <MarsRoutePlanner viewer={cesiumViewer} />
      )}

      {/* NEW FEATURE: 3D Martian Terrain Explorer (Tab 3: Google Earth for Mars) */}
      {TERRAIN_EXPLORER_ENABLED && dockTab === 'terrain' && (
        <div className="absolute inset-0 z-10 w-full h-full">
          <TerrainExplorer
            onExitToGlobe={() => handleSelectDockTab('mars')}
            surfaceMode={surfaceMode}
            compositingOptions={compositingOptions}
            useNormalizedWmtsUrl={useNormalizedWmtsUrl}
            onUpdateSurfaceMode={setSurfaceMode}
            onUpdateCompositingOptions={setCompositingOptions}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
            targetDestination={terrainTarget}
          />
        </div>
      )}

      {/* AI Copilot in Terrain Mode (Floating on the right or top-left) */}
      {!isFullscreen && dockTab === 'terrain' && isAiCopilotOpen && (
        <div className="absolute top-20 right-3 sm:right-6 z-25 pointer-events-none">
          <MiraAICopilot
            isOpen={isAiCopilotOpen}
            onClose={() => setIsAiCopilotOpen(false)}
            coordinates={coordinates}
            telemetry={telemetry}
            onNavigateToCoordinates={(lat, lon, alt) => {
              setTerrainTarget({
                name: `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
                latitude: lat,
                longitude: lon,
                altitudeMeters: alt || 38000,
                timestamp: Date.now(),
              });
            }}
            onExecuteCopilotAction={handleExecuteCopilotAction}
          />
        </div>
      )}

      {/* NORMAL MODE UI (Hidden in Fullscreen or when in Terrain Explorer) */}
      {!isFullscreen && (
        <>
          {dockTab !== 'terrain' && (
            <>
              {/* Top Header: Exact Match to Reference Image with Spaced Controls & Direct Main Screen Tools */}
              <Header
                lightingMode={lightingMode}
                onSelectLightingMode={setLightingMode}
                sceneMode={sceneMode}
                onSelectSceneMode={setSceneMode}
                onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
                wmtsStatus={wmtsStatus}
                surfaceMode={surfaceMode}
              />

              {/* MOBILE PANEL SELECTOR PILL (Hidden on md+ desktop, only visible on < md mobile) */}
              <div className="absolute top-[56px] left-1/2 -translate-x-1/2 z-25 md:hidden pointer-events-auto">
                <div className="bg-[#0b101b]/95 backdrop-blur-md border border-white/20 rounded-full p-1 flex items-center gap-1.5 shadow-2xl text-[10.5px] font-sans font-bold">
                  <button
                    onClick={() => setMobileTab('nav')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                      mobileTab === 'nav'
                        ? 'bg-[#ea580c] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Coordinates &amp; AI
                  </button>
                  <button
                    onClick={() => setMobileTab('moons')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                      mobileTab === 'moons'
                        ? 'bg-[#0284c7] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mars Moons
                  </button>
                </div>
              </div>

              {/* LEFT COLUMN: COORDINATE ENTRY & MIRA AI COPILOT */}
              <div className={`absolute top-[96px] md:top-[72px] left-4 sm:left-6 z-20 flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-165px)] md:max-h-[calc(100vh-145px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1 ${
                mobileTab === 'nav' ? 'flex' : 'hidden md:flex'
              }`}>
                <CoordinateSearchPanel
                  isOpen={isSearchPanelOpen}
                  onClose={() => setIsSearchPanelOpen(false)}
                  onNavigateToCoordinates={handleNavigateToCoordinates}
                />

                <MiraAICopilot
                  isOpen={isAiCopilotOpen}
                  onClose={() => setIsAiCopilotOpen(false)}
                  coordinates={coordinates}
                  telemetry={telemetry}
                  onNavigateToCoordinates={(lat, lon, alt) => {
                    setActiveLandmark(null);
                    globeRef.current?.flyToCoordinates(lon, lat, alt || 450_000);
                  }}
                  onExecuteCopilotAction={handleExecuteCopilotAction}
                />
              </div>

              {/* RIGHT COLUMN: MARS MOONS */}
              <div className={`absolute top-[96px] md:top-[72px] right-4 sm:right-6 z-20 flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-165px)] md:max-h-[calc(100vh-145px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-1 ${
                mobileTab === 'moons' ? 'flex' : 'hidden md:flex'
              }`}>
                {isMoonPanelOpen && (
                  <MoonControlPanel
                    showPhobos={showPhobos}
                    onTogglePhobos={() => setShowPhobos((p) => !p)}
                    showDeimos={showDeimos}
                    onToggleDeimos={() => setShowDeimos((d) => !d)}
                    showOrbits={showOrbits}
                    onToggleOrbits={() => setShowOrbits((o) => !o)}
                    showLabels={showMoonLabels}
                    onToggleLabels={() => setShowMoonLabels((l) => !l)}
                    isPaused={isMoonPaused}
                    onTogglePause={() => setIsMoonPaused((p) => !p)}
                    onResetToCurrentTime={handleResetToCurrentTime}
                    selectedMoon={selectedMoon}
                    onSelectMoon={handleSelectMoon}
                    onFlyToMoon={handleFlyToMoon}
                    onReturnToMars={handleReturnFromMoon}
                    phobosState={moonTelemetry?.phobos}
                    deimosState={moonTelemetry?.deimos}
                  />
                )}
              </div>

              {/* BOTTOM HORIZONTAL TELEMETRY STRIP (Discreet & Centered above Dock) */}
              <CoordinateHUD
                coordinates={coordinates}
                telemetry={telemetry}
                ellipsoidKey={ellipsoidKey}
                onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
              />
            </>
          )}

          {/* BOTTOM AEROSPACE NAVIGATION DOCK (Mars Globe | Solar System | Terrain Explorer) */}
          <FooterDock
            activeTab={dockTab}
            onSelectTab={handleSelectDockTab}
            onResetCamera={handleResetCamera}
            onToggleTools={() => setShowTools((s) => !s)}
            showTools={showTools}
            onToggleAiCopilot={() => setIsAiCopilotOpen((a) => !a)}
            isAiCopilotOpen={isAiCopilotOpen}
          />

          {/* Solar System 3D View Modal Overlay */}
          <SolarSystemView
            isOpen={isSolarSystemOpen}
            onClose={() => {
              setIsSolarSystemOpen(false);
              setSolarInitialPlanet(null);
              setDockTab('mars');
            }}
            onFocusMars={() => {
              setIsSolarSystemOpen(false);
              setSolarInitialPlanet(null);
              setDockTab('mars');
              handleResetCamera();
            }}
            initialTab={solarInitialTab}
            initialPlanetId={solarInitialPlanet}
            initialDaysPerSecond={solarTimelapse}
            zoomTrigger={solarZoomTrigger}
          />

          {/* NASA WMTS Error Banner */}
          <ErrorBanner
            error={wmtsStatus.error}
            isRetrying={isRetrying}
            onRetry={handleRetryImagery}
            useNormalizedUrl={useNormalizedWmtsUrl}
            onToggleNormalizedUrl={handleToggleNormalizedUrl}
          />

          {/* Scientific Specifications & Dataset Settings Modal */}
          <DatasetModal
            isOpen={isDatasetModalOpen}
            onClose={() => setIsDatasetModalOpen(false)}
            ellipsoidKey={ellipsoidKey}
            onSelectEllipsoid={setEllipsoidKey}
            useNormalizedWmtsUrl={useNormalizedWmtsUrl}
            onToggleNormalizedWmtsUrl={(useNorm) => {
              setUseNormalizedWmtsUrl(useNorm);
              setTimeout(() => globeRef.current?.retryImagery(), 100);
            }}
            surfaceMode={surfaceMode}
            onSelectSurfaceMode={setSurfaceMode}
            compositingOptions={compositingOptions}
            onUpdateCompositingOptions={setCompositingOptions}
            onResetCompositingOptions={() => setCompositingOptions(DEFAULT_COMPOSITING_OPTIONS)}
          />
        </>
      )}

      {/* FULLSCREEN CINEMATIC MODE OVERLAY */}
      {isFullscreen && (
        <FullscreenHUD
          onExitFullscreen={handleExitFullscreen}
          showPhobos={showPhobos}
          onTogglePhobos={() => setShowPhobos((p) => !p)}
          showDeimos={showDeimos}
          onToggleDeimos={() => setShowDeimos((d) => !d)}
          showOrbits={showOrbits}
          onToggleOrbits={() => setShowOrbits((o) => !o)}
          isPaused={isMoonPaused}
          onTogglePause={() => setIsMoonPaused((p) => !p)}
          isAutoRotating={isAutoRotating}
          onToggleAutoRotate={() => setIsAutoRotating((r) => !r)}
          onZoomIn={() => globeRef.current?.zoomIn()}
          onZoomOut={() => globeRef.current?.zoomOut()}
          coordinates={coordinates}
        />
      )}
    </main>
  );
}

export default App;
