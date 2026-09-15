import React, { useState, useEffect, useRef } from 'react';
import { CarConfig, CameraMode, TimeOfDay, SpeedTrapRecord, GraphicsQuality } from './types/car';
import { PlayerCareer, RaceEvent, RaceState } from './types/career';
import { INITIAL_CARS } from './data/cars';
import { DrivingCanvas, DirectInputKey } from './components/DrivingCanvas';
import { GameHUD } from './components/GameHUD';
import { ModShopModal } from './components/ModShopModal';
import { CareerHubModal } from './components/CareerHubModal';
import { RaceHUD } from './components/RaceHUD';
import { RaceResultsModal } from './components/RaceResultsModal';
import { CarTelemetry } from './game/vehicleDynamics';
import { soundEngine } from './audio/engineAudio';
import {
  loadCareerProfile,
  saveCareerProfile,
  recordRaceFinish,
  buyCarFromDealership,
  buyUpgradePart,
} from './game/careerManager';
import { getRepRank } from './data/pricing';
import {
  Trophy,
  Wrench,
  HelpCircle,
  X,
  Compass,
  Coins,
  Award,
  Flag,
  ShoppingBag,
} from 'lucide-react';

const STORAGE_KEY = 'forza_customs_cars_v1';

export default function App() {
  // 1. Career State & Persistence
  const [career, setCareer] = useState<PlayerCareer>(loadCareerProfile);

  // 2. Cars Customization State
  const [cars, setCars] = useState<CarConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_CARS;
  });

  // Selected car must be one of the player's owned cars
  const [selectedCarId, setSelectedCarId] = useState<string>(() => {
    const savedCareer = loadCareerProfile();
    return savedCareer.ownedCarIds[0] || 'silvia_drift';
  });

  // Camera & Time & Modals
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase_far');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('high');
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>('kmh');
  const [isModShopOpen, setIsModShopOpen] = useState<boolean>(false);
  const [isCareerHubOpen, setIsCareerHubOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControlsHelp, setShowControlsHelp] = useState<boolean>(false);
  const [activeSpeedTrap, setActiveSpeedTrap] = useState<SpeedTrapRecord | null>(null);

  // Direct physics input reference for instantaneous touch / on-screen pedal response
  const inputDirectRef = useRef<((key: DirectInputKey, active: boolean) => void) | null>(null);

  // Race Event Engine State
  const [activeRace, setActiveRace] = useState<RaceEvent | null>(null);
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [nearRaceEvent, setNearRaceEvent] = useState<RaceEvent | null>(null);

  // Post-Race Result Modal
  const [lastRaceResult, setLastRaceResult] = useState<{
    race: RaceEvent;
    position: number;
    finishTimeMs: number;
    creditsEarned: number;
    repEarned: number;
    newRepTotal: number;
    previousRepTotal: number;
  } | null>(null);

  // Live telemetry state for HUD
  const [telemetry, setTelemetry] = useState<CarTelemetry>({
    speedMph: 0,
    rpm: 850,
    gear: 1,
    gearDisplay: '1',
    throttle: 0,
    brake: 0,
    handbrake: false,
    steerAngle: 0,
    slipAngleDeg: 0,
    isDrifting: false,
    driftPoints: 0,
    driftMultiplier: 1.0,
    driftRank: '',
    boostPsi: 0,
    lateralG: 0,
    nitrousActive: false,
    nitrousFuel: 100,
    nearModShop: false,
  });

  // Current active car
  const currentCar = cars.find((c) => c.id === selectedCarId) || cars[0];
  const currentRank = getRepRank(career.reputation);

  // Save cars customizations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    } catch {
      // Storage error
    }
  }, [cars]);

  // Update a car's modifications
  const handleUpdateCarConfig = (updated: CarConfig) => {
    setCars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Speed trap toast timer
  const speedTrapTimeoutRef = useRef<number | null>(null);
  const handleSpeedTrapTriggered = (record: SpeedTrapRecord) => {
    setActiveSpeedTrap(record);
    if (speedTrapTimeoutRef.current) clearTimeout(speedTrapTimeoutRef.current);
    speedTrapTimeoutRef.current = window.setTimeout(() => {
      setActiveSpeedTrap(null);
    }, 4000);
  };

  // Cycle camera views
  const handleCycleCamera = () => {
    const modes: CameraMode[] = ['chase_far', 'chase_close', 'hood', 'cockpit', 'free'];
    const currentIndex = modes.indexOf(cameraMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setCameraMode(modes[nextIndex]);
  };

  // Cycle time of day
  const handleCycleTimeOfDay = () => {
    const times: TimeOfDay[] = ['day', 'sunset', 'night'];
    const currentIndex = times.indexOf(timeOfDay);
    const nextIndex = (currentIndex + 1) % times.length;
    setTimeOfDay(times[nextIndex]);
  };

  // Graphics Quality Preset toggle (Performance 60FPS / High HDR / Ultra Motion Blur)
  const handleCycleGraphicsQuality = () => {
    setGraphicsQuality((prev) => {
      if (prev === 'high') return 'ultra';
      if (prev === 'ultra') return 'performance';
      return 'high';
    });
  };

  // Sound toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  // Reset car position
  const handleResetCar = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
  };

  // Touch & on-screen pedal driving inputs
  const handleSetInput = (
    key: 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitrous',
    active: boolean
  ) => {
    soundEngine.init();
    if (inputDirectRef.current) {
      inputDirectRef.current(key, active);
    } else {
      const keyMap: { [k: string]: string } = {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        handbrake: ' ',
        nitrous: 'n',
      };
      const mapped = keyMap[key];
      if (mapped) {
        const eventType = active ? 'keydown' : 'keyup';
        window.dispatchEvent(
          new KeyboardEvent(eventType, {
            key: mapped,
            code: mapped === ' ' ? 'Space' : undefined,
          })
        );
      }
    }
  };

  // ================= CAREER TRANSACTIONS & RACE FLOW ================= //

  // Buy Car from Dealership
  const handleBuyCar = (carToBuy: CarConfig) => {
    const res = buyCarFromDealership(career, carToBuy);
    if (res.success) {
      setCareer(res.updatedCareer);
      setSelectedCarId(carToBuy.id);
      soundEngine.triggerVictoryFanfare();
    } else if (res.error) {
      alert(res.error);
    }
  };

  // Buy Part from Mod Shop
  const handlePurchasePart = (
    carId: string,
    category: string,
    value: string,
    price: number,
    requiredRep: number
  ): boolean => {
    const res = buyUpgradePart(career, carId, category, value, price, requiredRep);
    if (res.success) {
      setCareer(res.updatedCareer);
      soundEngine.triggerCheckpointSound();
      return true;
    } else if (res.error) {
      alert(res.error);
      return false;
    }
    return false;
  };

  // Start Race Event
  const handleStartRace = (race: RaceEvent) => {
    setIsCareerHubOpen(false);
    setIsModShopOpen(false);
    setLastRaceResult(null);
    setActiveRace(race);
  };

  // Abandon active race back to free roam
  const handleAbandonRace = () => {
    setActiveRace(null);
    setRaceState(null);
  };

  // Finish Race Event
  const handleRaceFinished = (race: RaceEvent, position: number, timeMs: number) => {
    const record = recordRaceFinish(career, race, position, timeMs);
    setCareer(record.updatedCareer);

    setLastRaceResult({
      race,
      position,
      finishTimeMs: timeMs,
      creditsEarned: record.creditsEarned,
      repEarned: record.repEarned,
      newRepTotal: record.newRepTotal,
      previousRepTotal: record.previousRepTotal,
    });

    setActiveRace(null);
    setRaceState(null);
  };

  // Global key bindings: [H] or [T] for Career Hub, [E] for entering nearby race, [M] for Mod Shop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 't') {
        setIsCareerHubOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'g') {
        handleCycleGraphicsQuality();
      } else if (e.key.toLowerCase() === 'e' && nearRaceEvent && !activeRace) {
        handleStartRace(nearRaceEvent);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearRaceEvent, activeRace]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      {/* 3D DRIVING CANVAS */}
      <DrivingCanvas
        currentCar={currentCar}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        graphicsQuality={graphicsQuality}
        activeRace={activeRace}
        raceState={raceState}
        inputDirectRef={inputDirectRef}
        onTelemetryUpdate={setTelemetry}
        onOpenModShop={() => setIsModShopOpen(true)}
        onOpenCareerHub={() => setIsCareerHubOpen(true)}
        onSpeedTrapTriggered={handleSpeedTrapTriggered}
        onRaceStateChange={setRaceState}
        onRaceFinished={handleRaceFinished}
        onNearRaceEvent={setNearRaceEvent}
        onCycleCamera={handleCycleCamera}
        onCycleGraphicsQuality={handleCycleGraphicsQuality}
        onResetCar={handleResetCar}
      />

      {/* RACE TELEMETRY & STANDINGS HUD (DURING ACTIVE RACE) */}
      {activeRace && raceState && (
        <RaceHUD raceState={raceState} onAbandonRace={handleAbandonRace} />
      )}

      {/* UNIFIED EUROPEAN HUD OVERLAY (CLEAN, POLISHED, ZERO OVERLAPPING) */}
      {!activeRace && (
        <GameHUD
          currentCar={currentCar}
          telemetry={telemetry}
          career={career}
          cameraMode={cameraMode}
          timeOfDay={timeOfDay}
          graphicsQuality={graphicsQuality}
          isMuted={isMuted}
          activeSpeedTrap={activeSpeedTrap}
          nearRaceEvent={nearRaceEvent}
          speedUnit={speedUnit}
          showControlsHelp={showControlsHelp}
          onCycleCamera={handleCycleCamera}
          onCycleTimeOfDay={handleCycleTimeOfDay}
          onCycleGraphicsQuality={handleCycleGraphicsQuality}
          onToggleMute={handleToggleMute}
          onOpenModShop={() => setIsModShopOpen(true)}
          onOpenCareerHub={() => setIsCareerHubOpen(true)}
          onResetCar={handleResetCar}
          onToggleSpeedUnit={() => setSpeedUnit((prev) => (prev === 'kmh' ? 'mph' : 'kmh'))}
          onToggleControlsHelp={() => setShowControlsHelp((prev) => !prev)}
          onStartRace={handleStartRace}
          onSetInput={handleSetInput}
        />
      )}

      {/* CAREER HUB MODAL (RACES, DEALERSHIP AUTOSHOW, PROGRESSION) */}
      {isCareerHubOpen && (
        <CareerHubModal
          career={career}
          currentCar={currentCar}
          allCars={cars}
          onSelectCar={(id) => setSelectedCarId(id)}
          onBuyCar={handleBuyCar}
          onStartRace={handleStartRace}
          onClose={() => setIsCareerHubOpen(false)}
        />
      )}

      {/* MOD SHOP / CUSTOMS GARAGE MODAL */}
      {isModShopOpen && (
        <ModShopModal
          currentCar={currentCar}
          allCars={cars}
          career={career}
          onSelectCar={(id) => setSelectedCarId(id)}
          onUpdateCarConfig={handleUpdateCarConfig}
          onPurchasePart={handlePurchasePart}
          onOpenAutoshow={() => {
            setIsModShopOpen(false);
            setIsCareerHubOpen(true);
          }}
          onClose={() => setIsModShopOpen(false)}
        />
      )}

      {/* POST-RACE RESULTS MODAL */}
      {lastRaceResult && (
        <RaceResultsModal
          race={lastRaceResult.race}
          position={lastRaceResult.position}
          finishTimeMs={lastRaceResult.finishTimeMs}
          creditsEarned={lastRaceResult.creditsEarned}
          repEarned={lastRaceResult.repEarned}
          newRepTotal={lastRaceResult.newRepTotal}
          previousRepTotal={lastRaceResult.previousRepTotal}
          onContinue={() => setLastRaceResult(null)}
          onOpenModShop={() => {
            setLastRaceResult(null);
            setIsModShopOpen(true);
          }}
          onRestartRace={() => {
            const r = lastRaceResult.race;
            setLastRaceResult(null);
            handleStartRace(r);
          }}
        />
      )}
    </main>
  );
}
