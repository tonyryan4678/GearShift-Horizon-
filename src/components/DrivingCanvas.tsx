import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  CarConfig,
  CameraMode,
  TimeOfDay,
  SpeedTrapRecord,
  GraphicsQuality,
  WeatherType,
  TrafficDensity,
  ShaderSettings,
} from '../types/car';
import { RaceEvent, RaceState } from '../types/career';
import { CAREER_RACES } from '../data/races';
import { createCarModel, CarMeshComponents } from '../game/carModel';
import { createCityWorld, WorldEnvironment } from '../game/cityWorld';
import { VehicleDynamics, CarTelemetry } from '../game/vehicleDynamics';
import { ParticleManager } from '../game/particles';
import { soundEngine } from '../audio/engineAudio';
import { euroRadio } from '../audio/euroRadio';
import { RaceSceneManager } from '../game/raceSceneManager';
import { GraphicsPipeline } from '../game/postProcessing';
import { TrafficManager, TrafficBlip } from '../game/trafficManager';
import { WeatherManager } from '../game/weatherManager';

export type DirectInputKey = 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitrous';

interface DrivingCanvasProps {
  currentCar: CarConfig;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  weather?: WeatherType;
  trafficDensity?: TrafficDensity;
  graphicsQuality?: GraphicsQuality;
  shaderSettings?: ShaderSettings;
  steeringSensitivity?: number;
  activeRace: RaceEvent | null;
  raceState: RaceState | null;
  onTelemetryUpdate: (telemetry: CarTelemetry) => void;
  onTrafficBlipsUpdate?: (blips: TrafficBlip[]) => void;
  onOpenModShop: () => void;
  onOpenSettings?: () => void;
  onSpeedTrapTriggered: (record: SpeedTrapRecord) => void;
  onRaceStateChange: (updated: RaceState) => void;
  onRaceFinished: (race: RaceEvent, position: number, timeMs: number) => void;
  onNearRaceEvent?: (race: RaceEvent | null) => void;
  onCycleCamera?: () => void;
  onCycleGraphicsQuality?: () => void;
  onOpenCareerHub?: () => void;
  onStartNearbyRace?: () => void;
  onResetCar?: () => void;
  inputDirectRef?: React.MutableRefObject<((key: DirectInputKey, active: boolean) => void) | null>;
}

export const DrivingCanvas: React.FC<DrivingCanvasProps> = ({
  currentCar,
  cameraMode,
  timeOfDay,
  weather = 'clear',
  trafficDensity = 'medium',
  graphicsQuality = 'high',
  shaderSettings,
  steeringSensitivity = 1.0,
  activeRace,
  raceState,
  onTelemetryUpdate,
  onTrafficBlipsUpdate,
  onOpenModShop,
  onOpenSettings,
  onSpeedTrapTriggered,
  onRaceStateChange,
  onRaceFinished,
  onNearRaceEvent,
  onCycleCamera,
  onCycleGraphicsQuality,
  onOpenCareerHub,
  onStartNearbyRace,
  onResetCar,
  inputDirectRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // References for mutable game loop state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const worldRef = useRef<WorldEnvironment | null>(null);
  const carMeshRef = useRef<CarMeshComponents | null>(null);
  const dynamicsRef = useRef<VehicleDynamics | null>(null);
  const particlesRef = useRef<ParticleManager | null>(null);
  const raceManagerRef = useRef<RaceSceneManager | null>(null);
  const graphicsPipelineRef = useRef<GraphicsPipeline | null>(null);
  const trafficManagerRef = useRef<TrafficManager | null>(null);
  const weatherManagerRef = useRef<WeatherManager | null>(null);

  const activeRaceRef = useRef<RaceEvent | null>(activeRace);
  activeRaceRef.current = activeRace;

  const raceStateRef = useRef<RaceState | null>(raceState);
  raceStateRef.current = raceState;

  const speedTrapCooldownRef = useRef<{ [key: string]: number }>({});
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  cameraModeRef.current = cameraMode;

  // Countdown and race clock tracking
  const countdownTimerRef = useRef<{
    startTime: number;
    lastBeepSec: number;
  }>({ startTime: 0, lastBeepSec: 4 });

  // Initialize Three.js scene & game loop
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x1e293b, 0.0015);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.2,
      1000
    );
    camera.position.set(0, 5, -12);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2.5 Post-Processing & Shaders Pipeline (HDR Bloom, Speed Motion Blur, Vignette)
    const graphicsPipeline = new GraphicsPipeline(
      renderer,
      scene,
      camera,
      container.clientWidth,
      container.clientHeight,
      (graphicsQuality || 'high') as GraphicsQuality
    );
    graphicsPipelineRef.current = graphicsPipeline;

    // 3. World Environment
    const world = createCityWorld(scene);
    world.setTimeOfDay(timeOfDay);
    worldRef.current = world;

    // 3.5 Weather System & Traffic Manager
    const weatherManager = new WeatherManager(scene, weather);
    weatherManagerRef.current = weatherManager;

    const trafficManager = new TrafficManager(scene, trafficDensity);
    trafficManagerRef.current = trafficManager;

    // 4. Vehicle Dynamics & 3D Car Model
    const dynamics = new VehicleDynamics(currentCar);
    dynamics.maxSteerAngle = 0.58 * (steeringSensitivity || 1.0);
    dynamicsRef.current = dynamics;

    if (inputDirectRef) {
      inputDirectRef.current = (key: DirectInputKey, active: boolean) => {
        soundEngine.init();
        euroRadio.init();
        dynamics.setInput(key, active);
      };
    }

    const carMesh = createCarModel(currentCar);
    scene.add(carMesh.rootGroup);
    carMeshRef.current = carMesh;

    // 5. Particles & Effects
    const particles = new ParticleManager(scene);
    particlesRef.current = particles;

    // 6. Race Scene Manager
    const raceManager = new RaceSceneManager(scene);
    raceManagerRef.current = raceManager;

    // Responsive Canvas Resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          graphicsPipelineRef.current?.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Animation Game Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const currentActiveRace = activeRaceRef.current;
      const currentRaceState = raceStateRef.current;

      // Handle race countdown
      let isCountingDown = false;
      if (currentActiveRace && currentRaceState && currentRaceState.status === 'countdown') {
        isCountingDown = true;
        const elapsedSinceCountdown = (performance.now() - countdownTimerRef.current.startTime) / 1000;
        const remaining = Math.max(0, 3 - Math.floor(elapsedSinceCountdown));

        if (remaining !== countdownTimerRef.current.lastBeepSec) {
          countdownTimerRef.current.lastBeepSec = remaining;
          soundEngine.triggerCountdownBeep(remaining === 0);
        }

        if (elapsedSinceCountdown >= 3.4) {
          // Launch race!
          onRaceStateChange({
            ...currentRaceState,
            status: 'racing',
            countdown: 0,
            raceStartTime: performance.now(),
          });
        } else {
          onRaceStateChange({
            ...currentRaceState,
            countdown: remaining,
          });
        }
      }

      // Update vehicle physics
      const telemetry = dynamics.update(dt);
      onTelemetryUpdate(telemetry);

      // Lock car in place during countdown but allow engine revving
      if (isCountingDown) {
        dynamics.velocity.set(0, 0, 0);
      }

      // Update world pulse & particles
      world.update(dt);
      particles.update(dt);

      // Update Weather System
      if (weatherManagerRef.current) {
        weatherManagerRef.current.update(dt, camera.position);
      }

      // Update AI Civilian Traffic
      if (trafficManagerRef.current) {
        trafficManagerRef.current.update(dt, dynamics.position, timeOfDay, weather);
        if (onTrafficBlipsUpdate) {
          onTrafficBlipsUpdate(trafficManagerRef.current.getTrafficBlips());
        }
      }

      // Synchronize 3D Car Model with physics position & orientation
      const activeCarMesh = carMeshRef.current;
      if (activeCarMesh) {
        const carGroup = activeCarMesh.rootGroup;
        carGroup.position.set(dynamics.position.x, 0, dynamics.position.z);
        carGroup.rotation.y = dynamics.heading;

        // Apply body pitch (squat/dive) and roll (corner lean)
        const chassis = carGroup.getObjectByName('ChassisBody');
        if (chassis) {
          chassis.rotation.x = dynamics.bodyPitch;
          chassis.rotation.z = dynamics.bodyRoll;
        }

        // Wheel steering and rotation
        activeCarMesh.wheels.fl.rotation.y = dynamics.currentSteer;
        activeCarMesh.wheels.fr.rotation.y = dynamics.currentSteer;

        const wheelSpinDelta = (dynamics.velocity.length() / 0.35) * dt;
        activeCarMesh.wheels.flTire.rotation.x += wheelSpinDelta;
        activeCarMesh.wheels.frTire.rotation.x += wheelSpinDelta;
        activeCarMesh.wheels.rlTire.rotation.x += wheelSpinDelta;
        activeCarMesh.wheels.rrTire.rotation.x += wheelSpinDelta;

        // Taillight / Brake light brightness
        if (dynamics.inputs.backward && dynamics.currentGear !== -1) {
          activeCarMesh.taillightMaterial.emissiveIntensity = 3.8;
        } else {
          activeCarMesh.taillightMaterial.emissiveIntensity = 0.9;
        }

        // Backfire flame animation
        if (dynamics.nitrousActive || (telemetry.throttle < 0.2 && telemetry.rpm > 6500)) {
          activeCarMesh.backfireFlames.forEach((flame) => {
            (flame.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.random() * 0.3;
          });
          activeCarMesh.backfireLight.intensity = 3.5;
        } else {
          activeCarMesh.backfireFlames.forEach((flame) => {
            (flame.material as THREE.MeshBasicMaterial).opacity = 0.0;
          });
          activeCarMesh.backfireLight.intensity = 0.0;
        }

        // Drift Smoke & Skidmarks & Rain Spray
        const wheelBaseX = 0.95;
        const wheelBaseZ_Rear = -1.35;
        const rearLeftWorld = carGroup.localToWorld(new THREE.Vector3(wheelBaseX, 0.05, wheelBaseZ_Rear));
        const rearRightWorld = carGroup.localToWorld(new THREE.Vector3(-wheelBaseX, 0.05, wheelBaseZ_Rear));

        if (telemetry.isDrifting || (telemetry.throttle > 0.8 && telemetry.speedMph < 20)) {
          particles.emitDriftSmoke(rearLeftWorld, rearRightWorld, telemetry.isDrifting ? 1.5 : 0.8);
          particles.addSkidmarks(rearLeftWorld, rearRightWorld, dynamics.heading);
        } else if (weather === 'rain' && telemetry.speedMph > 20) {
          particles.emitDriftSmoke(rearLeftWorld, rearRightWorld, 0.35);
        }
      }

      // --- RACE EVENT UPDATE ---
      if (currentActiveRace && currentRaceState && raceManagerRef.current) {
        const elapsedRaceMs =
          currentRaceState.status === 'racing'
            ? performance.now() - currentRaceState.raceStartTime
            : 0;

        const raceRes = raceManagerRef.current.update(
          dt,
          dynamics,
          isCountingDown,
          elapsedRaceMs
        );

        if (raceRes.checkpointPassed) {
          soundEngine.triggerCheckpointSound();
        }

        if (raceRes.isRaceFinished && currentRaceState.status === 'racing') {
          // Race complete!
          soundEngine.triggerVictoryFanfare();
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });

          onRaceFinished(currentActiveRace, raceRes.playerPosition, elapsedRaceMs);
        } else if (currentRaceState.status === 'racing') {
          onRaceStateChange({
            ...currentRaceState,
            elapsedTimeMs: elapsedRaceMs,
            currentLap: raceRes.currentLap,
            currentCheckpointIndex: raceRes.nextCheckpointIndex,
            playerPosition: raceRes.playerPosition,
            aiRacers: raceRes.aiOpponents,
          });
        }
      } else if (!currentActiveRace && onNearRaceEvent) {
        // Free roam: check proximity to race world hubs
        let nearRace: RaceEvent | null = null;
        for (const race of CAREER_RACES) {
          const markerDist = dynamics.position.distanceTo(
            new THREE.Vector3(race.worldMarkerPos.x, 0, race.worldMarkerPos.z)
          );
          if (markerDist < 25) {
            nearRace = race;
            break;
          }
        }
        onNearRaceEvent(nearRace);
      }

      // Camera Follow System (Cinematic Forza Chase Cam)
      updateCamera(camera, dynamics, cameraModeRef.current, dt);

      // Speed Trap checks
      checkSpeedTraps(dynamics, world, onSpeedTrapTriggered, speedTrapCooldownRef.current);

      // Shaders & Post-Processing Update (Radial Speed Blur, HDR Bloom, Vignette)
      const currentSpeedMph = dynamics.velocity.length() * 2.23694;
      graphicsPipelineRef.current?.update(
        currentSpeedMph,
        dynamics.nitrousActive,
        dynamics.isDrifting,
        timeOfDay,
        dt
      );

      // Render through Graphics Pipeline (or fallback renderer)
      if (graphicsPipelineRef.current) {
        graphicsPipelineRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Direct input hook for touch / on-screen pedals
    if (inputDirectRef) {
      inputDirectRef.current = (key: DirectInputKey, active: boolean) => {
        soundEngine.init();
        euroRadio.init();
        dynamics.setInput(key, active);
      };
    }

    // Keyboard controls for driving, camera, graphics, career hub and mod shop
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      soundEngine.init();
      euroRadio.init();

      const key = e.key.toLowerCase();
      const code = e.code;

      if (key === 'w' || key === 'arrowup' || code === 'KeyW' || code === 'ArrowUp') {
        dynamics.setInput('forward', true);
        e.preventDefault();
      } else if (key === 's' || key === 'arrowdown' || code === 'KeyS' || code === 'ArrowDown') {
        dynamics.setInput('backward', true);
        e.preventDefault();
      } else if (key === 'a' || key === 'arrowleft' || code === 'KeyA' || code === 'ArrowLeft') {
        dynamics.setInput('left', true);
        e.preventDefault();
      } else if (key === 'd' || key === 'arrowright' || code === 'KeyD' || code === 'ArrowRight') {
        dynamics.setInput('right', true);
        e.preventDefault();
      } else if (key === ' ' || code === 'Space') {
        dynamics.setInput('handbrake', true);
        e.preventDefault();
      } else if (e.shiftKey || key === 'n' || key === 'b' || code === 'ShiftLeft' || code === 'ShiftRight') {
        dynamics.setInput('nitrous', true);
      } else if (key === 'r') {
        dynamics.reset(0, -30, 0);
        onResetCar?.();
      } else if (key === 'x') {
        dynamics.toggleCruiseControl();
      } else if (key === 'k') {
        dynamics.toggleAbs();
      } else if (key === 'j') {
        dynamics.toggleTcs();
      } else if (key === 'c') {
        onCycleCamera?.();
      } else if (key === 'g') {
        onCycleGraphicsQuality?.();
      } else if (key === 'm') {
        dynamics.clearInputs();
        onOpenModShop();
      } else if (key === 'h' || key === 't') {
        dynamics.clearInputs();
        onOpenCareerHub?.();
      } else if (key === 'e') {
        onStartNearbyRace?.();
      } else if (key === 'escape' || key === 'o' || key === 'p') {
        dynamics.clearInputs();
        onOpenSettings?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code;

      if (key === 'w' || key === 'arrowup' || code === 'KeyW' || code === 'ArrowUp') {
        dynamics.setInput('forward', false);
      } else if (key === 's' || key === 'arrowdown' || code === 'KeyS' || code === 'ArrowDown') {
        dynamics.setInput('backward', false);
      } else if (key === 'a' || key === 'arrowleft' || code === 'KeyA' || code === 'ArrowLeft') {
        dynamics.setInput('left', false);
      } else if (key === 'd' || key === 'arrowright' || code === 'KeyD' || code === 'ArrowRight') {
        dynamics.setInput('right', false);
      } else if (key === ' ' || code === 'Space') {
        dynamics.setInput('handbrake', false);
      } else if (!e.shiftKey && (key === 'n' || key === 'b' || code === 'ShiftLeft' || code === 'ShiftRight')) {
        dynamics.setInput('nitrous', false);
      }
    };

    const handleBlur = () => {
      dynamics.clearInputs();
    };

    const handlePointerDown = () => {
      soundEngine.init();
      euroRadio.init();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pointerup', handleBlur);
    window.addEventListener('pointercancel', handleBlur);
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      if (inputDirectRef) {
        inputDirectRef.current = null;
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pointerup', handleBlur);
      window.removeEventListener('pointercancel', handleBlur);
      container.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      raceManager.cleanup();
      trafficManagerRef.current?.dispose();
      weatherManagerRef.current?.dispose();
      graphicsPipelineRef.current?.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Graphics Preset when changed
  useEffect(() => {
    if (graphicsPipelineRef.current && graphicsQuality) {
      graphicsPipelineRef.current.applyQuality(graphicsQuality);
    }
  }, [graphicsQuality]);

  // Update Custom Shader parameters
  useEffect(() => {
    if (graphicsPipelineRef.current && shaderSettings) {
      graphicsPipelineRef.current.applyCustomShaders(shaderSettings);
    }
  }, [shaderSettings]);

  // Update Traffic Density
  useEffect(() => {
    if (trafficManagerRef.current && trafficDensity) {
      trafficManagerRef.current.applyDensity(trafficDensity);
    }
  }, [trafficDensity]);

  // Update Weather System
  useEffect(() => {
    if (weatherManagerRef.current && weather) {
      weatherManagerRef.current.applyWeather(weather, timeOfDay);
    }
  }, [weather, timeOfDay]);

  // Update Steering Sensitivity
  useEffect(() => {
    if (dynamicsRef.current) {
      dynamicsRef.current.maxSteerAngle = 0.58 * (steeringSensitivity || 1.0);
    }
  }, [steeringSensitivity]);

  // Handle Active Race Changes (Start / End)
  useEffect(() => {
    if (!raceManagerRef.current || !dynamicsRef.current) return;

    if (activeRace) {
      soundEngine.init();
      countdownTimerRef.current = {
        startTime: performance.now(),
        lastBeepSec: 4,
      };
      const opponents = raceManagerRef.current.startRace(activeRace, dynamicsRef.current);
      onRaceStateChange({
        race: activeRace,
        status: 'countdown',
        countdown: 3,
        currentLap: 1,
        currentCheckpointIndex: 0,
        totalCheckpoints: activeRace.checkpoints.length,
        raceStartTime: performance.now(),
        elapsedTimeMs: 0,
        playerPosition: 1,
        totalRacers: opponents.length + 1,
        aiRacers: opponents,
        playerFinished: false,
        playerFinishTimeMs: null,
      });
    } else {
      raceManagerRef.current.cleanup();
    }
  }, [activeRace]);

  // Update Time of Day
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setTimeOfDay(timeOfDay);
    }
  }, [timeOfDay]);

  // Update Car Visuals & Physics when currentCar changes
  useEffect(() => {
    if (sceneRef.current && carMeshRef.current && dynamicsRef.current) {
      // Remove old model
      sceneRef.current.remove(carMeshRef.current.rootGroup);

      // Build new model
      const newCarMesh = createCarModel(currentCar);
      sceneRef.current.add(newCarMesh.rootGroup);
      carMeshRef.current = newCarMesh;

      // Update vehicle dynamics specs
      dynamicsRef.current.updateConfig(currentCar);
    }
  }, [currentCar]);

  return (
    <div
      ref={containerRef}
      id="driving-canvas-container"
      className="relative w-full h-full cursor-crosshair overflow-hidden"
    />
  );
};

/**
 * Camera positioning and smoothing logic for multiple view angles
 */
function updateCamera(
  camera: THREE.PerspectiveCamera,
  dynamics: VehicleDynamics,
  mode: CameraMode,
  dt: number
) {
  const carPos = dynamics.position;
  const heading = dynamics.heading;
  const speedMph = dynamics.velocity.length() * 2.23694;

  const targetFov = 72 + Math.min(22, (speedMph / 220) * 22);
  camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4, dt);
  camera.updateProjectionMatrix();

  if (mode === 'chase_far') {
    const distBehind = 8.8 + Math.min(2.5, speedMph * 0.012);
    const heightAbove = 3.6;

    const targetPos = new THREE.Vector3(
      carPos.x - Math.sin(heading) * distBehind,
      Math.max(1.4, carPos.y + heightAbove),
      carPos.z - Math.cos(heading) * distBehind
    );

    camera.position.lerp(targetPos, Math.min(1.0, 10 * dt));
    camera.position.y = Math.max(1.35, camera.position.y);

    const lookTarget = new THREE.Vector3(
      carPos.x + Math.sin(heading) * 4,
      Math.max(0.5, carPos.y + 1.2),
      carPos.z + Math.cos(heading) * 4
    );
    camera.lookAt(lookTarget);
  } else if (mode === 'chase_close') {
    const distBehind = 5.8;
    const heightAbove = 2.4;

    const targetPos = new THREE.Vector3(
      carPos.x - Math.sin(heading) * distBehind,
      Math.max(1.35, carPos.y + heightAbove),
      carPos.z - Math.cos(heading) * distBehind
    );

    camera.position.lerp(targetPos, Math.min(1.0, 14 * dt));
    camera.position.y = Math.max(1.25, camera.position.y);

    const lookTarget = new THREE.Vector3(
      carPos.x + Math.sin(heading) * 6,
      Math.max(0.4, carPos.y + 0.9),
      carPos.z + Math.cos(heading) * 6
    );
    camera.lookAt(lookTarget);
  } else if (mode === 'hood') {
    const hoodPos = new THREE.Vector3(
      carPos.x + Math.sin(heading) * 1.5,
      carPos.y + 1.0,
      carPos.z + Math.cos(heading) * 1.5
    );
    camera.position.copy(hoodPos);

    const lookTarget = new THREE.Vector3(
      carPos.x + Math.sin(heading) * 25,
      carPos.y + 0.9,
      carPos.z + Math.cos(heading) * 25
    );
    camera.lookAt(lookTarget);
  } else if (mode === 'cockpit') {
    const cockpitPos = new THREE.Vector3(
      carPos.x + Math.sin(heading) * -0.2 - Math.cos(heading) * 0.35,
      carPos.y + 1.15,
      carPos.z + Math.cos(heading) * -0.2 + Math.sin(heading) * 0.35
    );
    camera.position.copy(cockpitPos);

    const lookTarget = new THREE.Vector3(
      carPos.x + Math.sin(heading) * 20,
      carPos.y + 1.0,
      carPos.z + Math.cos(heading) * 20
    );
    camera.lookAt(lookTarget);
  } else if (mode === 'free') {
    const time = performance.now() * 0.0005;
    camera.position.set(
      carPos.x + Math.sin(time) * 12,
      Math.max(3, carPos.y + 6),
      carPos.z + Math.cos(time) * 12
    );
    camera.lookAt(carPos.x, carPos.y + 1, carPos.z);
  }
}

/**
 * Check if player triggered any Speed Trap radar
 */
function checkSpeedTraps(
  dynamics: VehicleDynamics,
  world: WorldEnvironment,
  onSpeedTrapTriggered: (record: SpeedTrapRecord) => void,
  cooldowns: { [key: string]: number }
) {
  const now = Date.now();
  const speedMph = Math.round(dynamics.velocity.length() * 2.23694);

  for (const trap of world.speedTraps) {
    const dist = dynamics.position.distanceTo(trap.position);
    const lastTrigger = cooldowns[trap.id] || 0;

    if (dist < trap.radius && now - lastTrigger > 8000 && speedMph > 45) {
      cooldowns[trap.id] = now;

      let stars = 1;
      if (speedMph >= trap.targetSpeeds[2]) stars = 3;
      else if (speedMph >= trap.targetSpeeds[1]) stars = 2;

      if (stars >= 3) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.4 },
        });
      }

      const speedKmh = Math.round(speedMph * 1.60934);

      onSpeedTrapTriggered({
        id: trap.id,
        name: trap.name,
        speedMph,
        speedKmh,
        stars,
        timestamp: now,
      });
      break;
    }
  }
}
