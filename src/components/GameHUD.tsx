import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Wrench,
  Sun,
  Sunset,
  Moon,
  Gauge,
  Sparkles,
  Zap,
  Flag,
  Coins,
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  HelpCircle,
  X,
  Compass,
  SlidersHorizontal,
} from 'lucide-react';
import { CarConfig, CameraMode, TimeOfDay, SpeedTrapRecord, GraphicsQuality } from '../types/car';
import { PlayerCareer, RaceEvent } from '../types/career';
import { CarTelemetry } from '../game/vehicleDynamics';
import { calculateCarStats } from '../data/cars';
import { getRepRank } from '../data/pricing';
import { euroRadio, RadioStation } from '../audio/euroRadio';

interface GameHUDProps {
  currentCar: CarConfig;
  telemetry: CarTelemetry;
  career: PlayerCareer;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  graphicsQuality: GraphicsQuality;
  isMuted: boolean;
  activeSpeedTrap: SpeedTrapRecord | null;
  nearRaceEvent: RaceEvent | null;
  speedUnit: 'kmh' | 'mph';
  showControlsHelp: boolean;
  onCycleCamera: () => void;
  onCycleTimeOfDay: () => void;
  onCycleGraphicsQuality: () => void;
  onToggleMute: () => void;
  onOpenModShop: () => void;
  onOpenCareerHub: () => void;
  onResetCar: () => void;
  onToggleSpeedUnit: () => void;
  onToggleControlsHelp: () => void;
  onStartRace: (race: RaceEvent) => void;
  onSetInput: (key: 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitrous', active: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentCar,
  telemetry,
  career,
  cameraMode,
  timeOfDay,
  graphicsQuality,
  isMuted,
  activeSpeedTrap,
  nearRaceEvent,
  speedUnit,
  showControlsHelp,
  onCycleCamera,
  onCycleTimeOfDay,
  onCycleGraphicsQuality,
  onToggleMute,
  onOpenModShop,
  onOpenCareerHub,
  onResetCar,
  onToggleSpeedUnit,
  onToggleControlsHelp,
  onStartRace,
  onSetInput,
}) => {
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [radioStation, setRadioStation] = useState<RadioStation>(euroRadio.getCurrentStation());
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(euroRadio.isPlaying());

  // Subscribe to Euro Radio updates
  useEffect(() => {
    const unsub = euroRadio.subscribe(() => {
      setRadioStation(euroRadio.getCurrentStation());
      setIsRadioPlaying(euroRadio.isPlaying());
    });
    return unsub;
  }, []);

  const stats = calculateCarStats(currentCar);
  const currentRank = getRepRank(career.reputation);

  // Speed calculation based on European unit setting
  const displaySpeed = speedUnit === 'kmh' ? telemetry.speedKmh : telemetry.speedMph;
  const speedUnitLabel = speedUnit === 'kmh' ? 'KM/H' : 'MPH';

  // RPM calculations for analog dial
  const maxRpm = currentCar.performance.engineStage === 'v10_swap' ? 9200 : 8500;
  const rpmRatio = Math.min(1.0, Math.max(0, telemetry.rpm / maxRpm));
  // Needle sweep angle from -130deg to +130deg (260 deg range)
  const needleAngle = -130 + rpmRatio * 260;
  const isRedline = telemetry.rpm > maxRpm * 0.92;

  // Rating badge color styling
  const getBadgeBg = (rating: string) => {
    switch (rating) {
      case 'X':
        return 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-emerald-500/30';
      case 'S2':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30';
      case 'S1':
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sky-500/30';
      case 'A':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-amber-500/30';
      case 'B':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black';
      case 'C':
        return 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5 overflow-hidden select-none z-20">
      {/* ========================================================================= */}
      {/* 1. TOP UNIFIED NAVIGATION & STATUS BAR                                    */}
      {/* ========================================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 w-full">
        {/* LEFT: EUROPEAN GRAND TOUR BRAND & CAR BADGE */}
        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          {/* European Tour Banner */}
          <div className="flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-xl">
            <span className="text-base" title="European Grand Tour">🇪🇺</span>
            <div className="flex flex-col">
              <span className="font-speedo text-xs font-black tracking-wider text-white uppercase">
                EURO GRAND TOUR
              </span>
              <span className="text-[9px] font-mono-nums font-bold text-sky-400">
                RANK {currentRank.level}: {currentRank.title}
              </span>
            </div>
          </div>

          {/* Active Car & Forza PI Badge */}
          <div className="flex items-center gap-2 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 shadow-xl">
            <span className={`px-2 py-0.5 rounded text-xs font-black shadow-sm ${getBadgeBg(stats.classRating)}`}>
              {stats.classRating} {stats.performanceIndex}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {currentCar.name}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono-nums">
                {currentCar.year} • {currentCar.category}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: EUROPEAN GRAND TOUR RADIO SYNTHESIZER */}
        <div className="hidden lg:flex items-center gap-2.5 bg-zinc-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1 text-sky-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>

          <div className="flex flex-col min-w-[170px]">
            <div className="flex items-center gap-1.5">
              <span className="font-mono-nums text-[10px] font-bold text-amber-400">
                {radioStation.frequency}
              </span>
              <span className="text-xs font-bold text-white truncate">
                {radioStation.name}
              </span>
            </div>
            <span className="text-[9px] text-zinc-400 truncate">
              {radioStation.genre}
            </span>
          </div>

          {/* Animated EQ Bars when playing */}
          <div className="flex items-end gap-0.5 h-3.5 w-6 px-1">
            <span className={`w-1 bg-sky-400 rounded-sm ${isRadioPlaying ? 'animate-bounce h-3' : 'h-1 opacity-40'}`} />
            <span className={`w-1 bg-pink-400 rounded-sm ${isRadioPlaying ? 'animate-bounce delay-75 h-3.5' : 'h-1 opacity-40'}`} />
            <span className={`w-1 bg-amber-400 rounded-sm ${isRadioPlaying ? 'animate-bounce delay-150 h-2' : 'h-1 opacity-40'}`} />
          </div>

          {/* Radio Controls */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={() => euroRadio.prevStation()}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title="Previous Radio Station"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => euroRadio.toggle()}
              className={`p-1.5 rounded-lg font-bold text-black cursor-pointer transition-all ${
                isRadioPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-white hover:bg-zinc-200'
              }`}
              title={isRadioPlaying ? 'Pause Euro Radio' : 'Play Euro Radio'}
            >
              {isRadioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => euroRadio.nextStation()}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title="Next Radio Station"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT: WALLET, HUB, MOD SHOP & SYSTEM TOGGLES */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0 flex-wrap justify-end">
          {/* Euro Wallet */}
          <div className="flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-500/30 text-emerald-400 font-speedo text-xs font-bold shadow-xl">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>€{career.credits.toLocaleString()} EUR</span>
          </div>

          {/* Races & Career Hub Button [H] */}
          <button
            id="hud-races-btn"
            onClick={onOpenCareerHub}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-black font-extrabold px-3 py-1.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer font-speedo text-xs tracking-wider uppercase"
            title="Open Career Hub & Autoshow (Key: H or T)"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>RACES [H]</span>
          </button>

          {/* Mod Shop Button [M] */}
          <button
            id="hud-modshop-btn"
            onClick={onOpenModShop}
            className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-extrabold px-3 py-1.5 rounded-2xl shadow-lg shadow-sky-500/20 border border-sky-300/30 transition-all cursor-pointer font-speedo text-xs tracking-wider uppercase"
            title="Open Mod Shop Garage (Key: M)"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>MOD SHOP [M]</span>
          </button>

          {/* Speed Unit Switcher (KM/H vs MPH) */}
          <button
            id="hud-unit-toggle"
            onClick={onToggleSpeedUnit}
            className="flex items-center gap-1 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10 text-xs font-mono-nums font-bold text-white transition-all cursor-pointer"
            title="Toggle Speedometer Unit (European KM/H or MPH)"
          >
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>{speedUnitLabel}</span>
          </button>

          {/* Graphics Shaders Switcher [G] */}
          <button
            id="hud-graphics-toggle"
            onClick={onCycleGraphicsQuality}
            className={`flex items-center gap-1 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer text-xs font-bold font-mono-nums ${
              graphicsQuality === 'ultra'
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-md shadow-purple-500/20'
                : graphicsQuality === 'high'
                ? 'bg-sky-950/80 border-sky-500/60 text-sky-300 shadow-md shadow-sky-500/20'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            }`}
            title="Toggle Visual Shaders & Post-FX (Performance 60FPS / High HDR / Ultra Motion Blur) [Key: G]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">
              {graphicsQuality === 'ultra' ? 'ULTRA FX' : graphicsQuality === 'high' ? 'HIGH HDR' : 'PERF 60'}
            </span>
          </button>

          {/* Camera View Switcher [C] */}
          <button
            id="hud-camera-toggle"
            onClick={onCycleCamera}
            className="flex items-center justify-center w-8 h-8 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Cycle Camera View (Chase Far / Chase Close / Hood / Cockpit / Drone) [Key: C]"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Time of Day Switcher */}
          <button
            id="hud-time-toggle"
            onClick={onCycleTimeOfDay}
            className="flex items-center justify-center w-8 h-8 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Cycle Atmosphere (Day / Golden Sunset / Night Neon)"
          >
            {timeOfDay === 'day' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : timeOfDay === 'sunset' ? (
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>

          {/* Engine Audio Sound Toggle */}
          <button
            id="hud-audio-toggle"
            onClick={onToggleMute}
            className="flex items-center justify-center w-8 h-8 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Toggle Engine Exhaust Audio"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Reset Car on Road [R] */}
          <button
            id="hud-reset-toggle"
            onClick={onResetCar}
            className="flex items-center justify-center w-8 h-8 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Reset Car on Road & Straighten (Key: R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Help / Controls Guide [?] */}
          <button
            id="hud-help-toggle"
            onClick={onToggleControlsHelp}
            className={`flex items-center justify-center w-8 h-8 backdrop-blur-md rounded-2xl border transition-all cursor-pointer ${
              showControlsHelp
                ? 'bg-sky-500 text-black border-sky-400'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-white/80 hover:text-white border-white/10'
            }`}
            title="Toggle Driving Controls Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MIDDLE NOTIFICATIONS & WAYPOINTS (CLEAN CONTAINER, ZERO OVERLAPPING)   */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center gap-3 my-auto pointer-events-none">
        {/* European Speed Camera Radar Flash Toast */}
        {activeSpeedTrap && (
          <div className="animate-bounce bg-gradient-to-r from-sky-600/95 to-indigo-700/95 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-sky-300 shadow-2xl flex flex-col items-center pointer-events-auto">
            <div className="text-[10px] uppercase tracking-widest text-sky-200 font-bold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
              EUROPEAN RADAR CAMERA • {activeSpeedTrap.name}
            </div>
            <div className="font-speedo text-4xl md:text-5xl font-extrabold text-white tracking-wider my-0.5">
              {speedUnit === 'kmh' ? activeSpeedTrap.speedKmh : activeSpeedTrap.speedMph}{' '}
              <span className="text-xl font-normal text-sky-200">{speedUnitLabel}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-300 text-lg">
              {'★'.repeat(activeSpeedTrap.stars)}
              <span className="text-white/30">{'★'.repeat(3 - activeSpeedTrap.stars)}</span>
            </div>
          </div>
        )}

        {/* Live Drift Score Display (Forza Horizon Style) */}
        {telemetry.driftPoints > 0 && (
          <div className="flex flex-col items-center animate-pulse">
            <div className="text-xs font-black tracking-widest text-amber-400 uppercase font-speedo drop-shadow">
              {telemetry.driftRank || 'DRIFTING'}
            </div>
            <div className="font-speedo text-4xl md:text-5xl font-black text-white tracking-wider flex items-baseline gap-2 drop-shadow-lg">
              <span>+{telemetry.driftPoints.toLocaleString()} PTS</span>
              {telemetry.driftMultiplier > 1 && (
                <span className="text-lg text-sky-400 font-bold bg-sky-950/85 border border-sky-400/40 px-2 py-0.5 rounded-lg">
                  x{telemetry.driftMultiplier.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mod Shop Waypoint Banner when approaching garage bay */}
        {telemetry.nearModShop && (
          <button
            onClick={onOpenModShop}
            className="pointer-events-auto flex items-center gap-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 rounded-full border-2 border-sky-300 shadow-2xl cursor-pointer animate-bounce transition-transform"
          >
            <Wrench className="w-5 h-5 text-sky-200" />
            <span className="font-speedo tracking-wider text-sm uppercase">
              APEX CUSTOMS GARAGE — PRESS [M] TO ENTER
            </span>
          </button>
        )}

        {/* Nearby Race Event Waypoint Card (European Grand Prix entry) */}
        {nearRaceEvent && (
          <div className="pointer-events-auto bg-gradient-to-r from-amber-950/90 to-zinc-950/90 border-2 border-amber-500/80 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in max-w-md">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 shadow-md shadow-amber-500/30 shrink-0">
              <Flag className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-speedo text-sm font-bold text-white uppercase truncate">
                  {nearRaceEvent.title}
                </span>
                <span className="text-[9px] font-mono-nums font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                  TIER {nearRaceEvent.tier}
                </span>
              </div>
              <div className="text-[11px] text-zinc-300 truncate">{nearRaceEvent.subtitle}</div>
              <div className="text-[10px] text-emerald-400 font-mono-nums font-bold">
                1st: +€{nearRaceEvent.rewards.first.cr.toLocaleString()} EUR • +{nearRaceEvent.rewards.first.rep} REP
              </div>
            </div>
            <button
              onClick={() => onStartRace(nearRaceEvent)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-speedo font-extrabold px-3.5 py-2 rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap text-xs uppercase"
            >
              <span>ENTER [E]</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM ROW: GPS RADAR, DRIVING AIDS/PEDALS, EUROPEAN INSTRUMENT CLUSTER*/}
      {/* ========================================================================= */}
      <footer className="flex items-end justify-between w-full gap-4">
        {/* LEFT: GPS NAVIGATION RADAR */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 overflow-hidden shadow-2xl flex items-center justify-center pointer-events-auto shrink-0">
          {/* Radar concentric distance circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-white/10" />
            <div className="w-36 h-36 rounded-full border border-white/5" />
            <div className="absolute w-full h-[1px] bg-white/10" />
            <div className="absolute h-full w-[1px] bg-white/10" />
          </div>

          {/* Road Network Schematic */}
          <svg className="absolute inset-0 w-full h-full opacity-60">
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#475569" strokeWidth="6" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#475569" strokeWidth="6" />
            <rect x="25%" y="25%" width="50%" height="50%" fill="none" stroke="#334155" strokeWidth="3" />
          </svg>

          {/* Mod Shop Pin */}
          <div
            className="absolute flex items-center justify-center w-5 h-5 bg-sky-500 text-white rounded-full text-[10px] font-bold shadow-md shadow-sky-500/50"
            style={{ transform: 'translate(26px, -26px)' }}
            title="Apex Customs Mod Shop Garage"
          >
            <Wrench className="w-3 h-3" />
          </div>

          {/* Speed Trap Radar Camera Pins */}
          <div
            className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"
            style={{ transform: 'translate(0px, 32px)' }}
            title="Autobahn Speed Camera"
          />
          <div
            className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full"
            style={{ transform: 'translate(0px, -32px)' }}
            title="Downtown Radar Camera"
          />

          {/* Player Car Arrow */}
          <div
            className="relative z-10 w-4 h-4 flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `rotate(${telemetry.steerAngle * -45}deg)`,
            }}
          >
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,1)]" />
          </div>

          {/* Compass & Heading */}
          <div className="absolute top-1 left-2 text-[9px] font-mono-nums font-bold text-sky-400 flex items-center gap-1">
            <Compass className="w-2.5 h-2.5" />
            <span>EURO GPS</span>
          </div>

          <div className="absolute bottom-1 text-[8px] font-mono-nums uppercase tracking-widest text-white/50">
            AUTOBAHN RING
          </div>
        </div>

        {/* CENTER: EUROPEAN DRIVING AIDS & TACTILE PEDALS */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          {/* European Electronic Driving Aids Indicators */}
          <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[10px] font-mono-nums font-bold">
            {/* Autobahn Cruise Control */}
            <span
              className={`px-2 py-0.5 rounded transition-all ${
                telemetry.cruiseControl
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
              title="Autobahn Cruise Control [Key: X]"
            >
              CRUISE [X]: {telemetry.cruiseControl ? 'ACTIVE' : 'OFF'}
            </span>

            {/* ABS */}
            <span
              className={`px-1.5 py-0.5 rounded ${
                telemetry.absActive
                  ? 'bg-amber-400 text-black animate-pulse'
                  : currentCar.tuning.absBrakes
                  ? 'bg-zinc-800 text-sky-400'
                  : 'bg-zinc-900 text-zinc-600'
              }`}
              title="Anti-lock Braking System [Key: K]"
            >
              ABS [K]
            </span>

            {/* TCS */}
            <span
              className={`px-1.5 py-0.5 rounded ${
                telemetry.tcsActive
                  ? 'bg-amber-400 text-black animate-pulse'
                  : currentCar.tuning.tractionControl
                  ? 'bg-zinc-800 text-sky-400'
                  : 'bg-zinc-900 text-zinc-600'
              }`}
              title="Traction Control System [Key: J]"
            >
              TCS [J]
            </span>

            {/* ESP */}
            <span
              className={`px-1.5 py-0.5 rounded ${
                telemetry.espActive ? 'bg-orange-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              ESP
            </span>

            {/* Toggle On-Screen Pedals Button */}
            <button
              onClick={() => setShowTouchControls((prev) => !prev)}
              className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              title="Toggle On-Screen Driving Pedals"
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
              <span>{showTouchControls ? 'HIDE CONTROLS' : 'TOUCH CONTROLS'}</span>
            </button>
          </div>

          {/* On-Screen Tactile Driving Pedals (When toggled or on touch devices) */}
          {showTouchControls && (
            <div className="flex items-center gap-3 bg-black/85 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl">
              {/* Steer Left / Right */}
              <div className="flex items-center gap-1.5">
                <button
                  onTouchStart={() => onSetInput('left', true)}
                  onTouchEnd={() => onSetInput('left', false)}
                  onMouseDown={() => onSetInput('left', true)}
                  onMouseUp={() => onSetInput('left', false)}
                  className="w-12 h-12 bg-zinc-800 active:bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white text-xl border border-white/10 select-none cursor-pointer"
                >
                  ◀
                </button>
                <button
                  onTouchStart={() => onSetInput('right', true)}
                  onTouchEnd={() => onSetInput('right', false)}
                  onMouseDown={() => onSetInput('right', true)}
                  onMouseUp={() => onSetInput('right', false)}
                  className="w-12 h-12 bg-zinc-800 active:bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white text-xl border border-white/10 select-none cursor-pointer"
                >
                  ▶
                </button>
              </div>

              {/* Handbrake & Nitrous */}
              <div className="flex flex-col gap-1.5">
                <button
                  onTouchStart={() => onSetInput('handbrake', true)}
                  onTouchEnd={() => onSetInput('handbrake', false)}
                  onMouseDown={() => onSetInput('handbrake', true)}
                  onMouseUp={() => onSetInput('handbrake', false)}
                  className="w-20 h-6 bg-amber-600/80 active:bg-amber-500 rounded-lg flex items-center justify-center font-bold text-white text-[10px] select-none cursor-pointer"
                >
                  HANDBRAKE
                </button>
                <button
                  onTouchStart={() => onSetInput('nitrous', true)}
                  onTouchEnd={() => onSetInput('nitrous', false)}
                  onMouseDown={() => onSetInput('nitrous', true)}
                  onMouseUp={() => onSetInput('nitrous', false)}
                  className="w-20 h-6 bg-cyan-600/80 active:bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-[10px] select-none cursor-pointer"
                >
                  NITROUS [NOS]
                </button>
              </div>

              {/* Gas & Brake Pedals */}
              <div className="flex items-center gap-1.5">
                <button
                  onTouchStart={() => onSetInput('backward', true)}
                  onTouchEnd={() => onSetInput('backward', false)}
                  onMouseDown={() => onSetInput('backward', true)}
                  onMouseUp={() => onSetInput('backward', false)}
                  className="w-12 h-12 bg-rose-700 active:bg-rose-600 rounded-xl flex items-center justify-center font-bold text-white text-xs border border-rose-500/30 select-none cursor-pointer"
                >
                  BRAKE
                </button>
                <button
                  onTouchStart={() => onSetInput('forward', true)}
                  onTouchEnd={() => onSetInput('forward', false)}
                  onMouseDown={() => onSetInput('forward', true)}
                  onMouseUp={() => onSetInput('forward', false)}
                  className="w-12 h-12 bg-emerald-600 active:bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-xs border border-emerald-400/30 select-none cursor-pointer"
                >
                  GAS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: EUROPEAN PRECISION TACHOMETER & INSTRUMENT CLUSTER */}
        <div className="relative flex items-center justify-center w-44 h-44 md:w-52 md:h-52 bg-black/85 backdrop-blur-md rounded-full border-2 border-white/20 shadow-2xl pointer-events-auto shrink-0">
          {/* Circular SVG Gauge Track */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background Arc */}
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="#334155"
              strokeWidth="6"
              strokeDasharray="395 132"
              strokeLinecap="round"
            />
            {/* Redline Section */}
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="#ef4444"
              strokeWidth="8"
              strokeDasharray="60 467"
              strokeDashoffset="-335"
              strokeLinecap="round"
              className="opacity-80"
            />
            {/* Active RPM Fill */}
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke={isRedline ? '#ef4444' : '#38bdf8'}
              strokeWidth="7"
              strokeDasharray={`${rpmRatio * 395} 527`}
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          {/* RPM Analog Needle */}
          <div
            className="absolute w-full h-full flex items-center justify-center transition-transform duration-75 pointer-events-none"
            style={{
              transform: `rotate(${needleAngle}deg)`,
            }}
          >
            <div className="w-1.5 h-18 bg-gradient-to-t from-red-500 to-rose-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)] -translate-y-8" />
          </div>

          {/* Center Cluster: Gear, Speed, European Boost (BAR) & RPM */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* Gear Indicator */}
            <div className="flex items-center gap-1 font-speedo text-2xl font-extrabold text-white">
              <span className="text-[10px] uppercase text-white/50 tracking-wider">GEAR</span>
              <span className={telemetry.gear === -1 ? 'text-rose-400' : 'text-sky-400'}>
                {telemetry.gearDisplay}
              </span>
            </div>

            {/* Digital Speedometer */}
            <div className="font-speedo text-5xl md:text-6xl font-black text-white tracking-tighter leading-none my-0.5 drop-shadow-md">
              {displaySpeed}
            </div>
            <div className="font-speedo text-xs tracking-widest text-sky-400 font-bold uppercase">
              {speedUnitLabel}
            </div>

            {/* European Boost in BAR + RPM */}
            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono-nums text-white/70">
              <span>{telemetry.rpm} RPM</span>
              {telemetry.boostBar > 0 && (
                <span className="text-amber-300 font-bold flex items-center gap-0.5">
                  <Gauge className="w-3 h-3" />
                  {telemetry.boostBar} BAR
                </span>
              )}
            </div>

            {/* Nitrous & E-Brake indicators */}
            <div className="flex items-center gap-1.5 mt-1">
              {currentCar.performance.nitrous && (
                <div
                  className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    telemetry.nitrousActive
                      ? 'bg-cyan-500 text-black animate-pulse'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                  }`}
                >
                  <Zap className="w-2.5 h-2.5" />
                  NOS {telemetry.nitrousFuel}%
                </div>
              )}
              {telemetry.handbrake && (
                <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded animate-bounce">
                  EBRAKE
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. DRIVING CONTROLS GUIDE MODAL (NON-BLOCKING, DISMISSIBLE)              */}
      {/* ========================================================================= */}
      {showControlsHelp && (
        <aside
          aria-label="Driving Controls Guide"
          className="absolute top-16 right-6 z-40 bg-zinc-950/95 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl max-w-sm text-xs pointer-events-auto"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
            <div className="flex items-center gap-2 font-speedo text-sm font-bold text-sky-400 uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Driving & Hotkey Controls</span>
            </div>
            <button
              onClick={onToggleControlsHelp}
              className="text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[11px] text-zinc-300">
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">W / ↑</span> Gas / Accelerate
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">S / ↓</span> Brake / Reverse
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">A / ←</span> Steer Left
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">D / →</span> Steer Right
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">SPACE</span> Handbrake Drift
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">SHIFT / N</span> Nitrous Boost
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">X</span> Autobahn Cruise
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">R</span> Reset on Road
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">C</span> Switch Camera
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">G</span> Graphics Shaders
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">M</span> Mod Shop Garage
            </div>
            <div>
              <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono-nums font-bold text-white">H</span> Career Hub / Races
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
