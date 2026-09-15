import React, { useState } from 'react';
import {
  CameraMode,
  TimeOfDay,
  WeatherType,
  TrafficDensity,
  GraphicsQuality,
  ShaderSettings,
} from '../types/car';
import { euroRadio } from '../audio/euroRadio';
import { soundEngine } from '../audio/engineAudio';
import {
  X,
  Sparkles,
  CloudRain,
  Car,
  Gauge,
  Volume2,
  Keyboard,
  Sun,
  Sunset,
  Moon,
  CloudFog,
  Cloud,
  Eye,
  Sliders,
  Radio,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Graphics & Shaders
  graphicsQuality: GraphicsQuality;
  onSelectQuality: (q: GraphicsQuality) => void;
  shaderSettings: ShaderSettings;
  onUpdateShaderSettings: (settings: Partial<ShaderSettings>) => void;
  // Camera & View
  cameraMode: CameraMode;
  onSelectCamera: (mode: CameraMode) => void;
  // Weather & Atmosphere
  weather: WeatherType;
  onSelectWeather: (w: WeatherType) => void;
  timeOfDay: TimeOfDay;
  onSelectTimeOfDay: (t: TimeOfDay) => void;
  // Traffic
  trafficDensity: TrafficDensity;
  onSelectTrafficDensity: (d: TrafficDensity) => void;
  // Driving Aids & Unit
  speedUnit: 'kmh' | 'mph';
  onToggleSpeedUnit: () => void;
  steeringSensitivity: number;
  onChangeSteeringSensitivity: (val: number) => void;
  // Audio
  isMuted: boolean;
  onToggleMute: () => void;
  onResetCar: () => void;
}

type TabKey = 'shaders' | 'weather' | 'traffic' | 'driving' | 'audio' | 'controls';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  graphicsQuality,
  onSelectQuality,
  shaderSettings,
  onUpdateShaderSettings,
  cameraMode,
  onSelectCamera,
  weather,
  onSelectWeather,
  timeOfDay,
  onSelectTimeOfDay,
  trafficDensity,
  onSelectTrafficDensity,
  speedUnit,
  onToggleSpeedUnit,
  steeringSensitivity,
  onChangeSteeringSensitivity,
  isMuted,
  onToggleMute,
  onResetCar,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('shaders');
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [engineVolume, setEngineVolume] = useState<number>(0.8);
  const [radioVolume, setRadioVolume] = useState<number>(0.75);

  if (!isOpen) return null;

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'shaders', label: 'Shaders & Graphics', icon: Sparkles },
    { key: 'weather', label: 'Weather & Sky', icon: CloudRain },
    { key: 'traffic', label: 'City Traffic AI', icon: Car },
    { key: 'driving', label: 'Driving & Assists', icon: Gauge },
    { key: 'audio', label: 'Euro Radio & Audio', icon: Volume2 },
    { key: 'controls', label: 'Controls Cheatsheet', icon: Keyboard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xl animate-fade-in">
      {/* Settings Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-speedo text-lg font-black tracking-wider text-white uppercase">
                EUROPEAN RACING SETTINGS
              </h2>
              <p className="text-xs text-zinc-400 font-mono-nums">
                Tweak shaders, open-world traffic, weather systems & driving mechanics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Close Settings (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/10 bg-black/40 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-speedo text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-black shadow-md shadow-sky-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-145px)] space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: SHADERS & GRAPHICS                                                */}
          {/* ========================================================================= */}
          {activeTab === 'shaders' && (
            <div className="space-y-6">
              {/* Quality Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Performance & Graphics Pipeline Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      onSelectQuality('performance');
                      onUpdateShaderSettings({
                        bloomEnabled: false,
                        motionBlurEnabled: false,
                        chromaticAberration: false,
                        vignetteDarkness: 0.2,
                      });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      graphicsQuality === 'performance'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="font-speedo text-sm font-bold uppercase text-emerald-400">
                      Performance 60+ FPS
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Smooth high framerate. Bloom & heavy post-processing disabled.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      onSelectQuality('high');
                      onUpdateShaderSettings({
                        bloomEnabled: true,
                        bloomIntensity: 0.55,
                        motionBlurEnabled: true,
                        motionBlurIntensity: 0.6,
                        chromaticAberration: true,
                        vignetteDarkness: 0.35,
                      });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      graphicsQuality === 'high'
                        ? 'bg-sky-950/60 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="font-speedo text-sm font-bold uppercase text-sky-400">
                      High HDR (Balanced)
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Unreal bloom, speed blur, PCF soft shadows, rich European atmosphere.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      onSelectQuality('ultra');
                      onUpdateShaderSettings({
                        bloomEnabled: true,
                        bloomIntensity: 0.9,
                        motionBlurEnabled: true,
                        motionBlurIntensity: 1.0,
                        chromaticAberration: true,
                        vignetteDarkness: 0.45,
                      });
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      graphicsQuality === 'ultra'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="font-speedo text-sm font-bold uppercase text-purple-400">
                      Ultra Cinematic FX
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Max HDR radiance, intense radial warp, 2x pixel supersampling.
                    </p>
                  </button>
                </div>
              </div>

              {/* Working Shader Fine-Tuning */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 space-y-4">
                <h3 className="font-speedo text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Custom Post-Processing Shader Controls
                </h3>

                {/* Bloom Shader */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">HDR Unreal Bloom</div>
                    <div className="text-xs text-zinc-400">
                      Glow effect on headlights, neon signs, and backfire exhaust flames
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={shaderSettings.bloomIntensity}
                      onChange={(e) =>
                        onUpdateShaderSettings({ bloomIntensity: parseFloat(e.target.value) })
                      }
                      className="accent-sky-400 w-24 sm:w-32 cursor-pointer"
                    />
                    <button
                      onClick={() =>
                        onUpdateShaderSettings({ bloomEnabled: !shaderSettings.bloomEnabled })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        shaderSettings.bloomEnabled
                          ? 'bg-sky-500 text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {shaderSettings.bloomEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Speed Radial Motion Blur */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">Speed Radial Motion Blur</div>
                    <div className="text-xs text-zinc-400">
                      High-velocity warp streaks when accelerating past 160 km/h or spraying nitrous
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.2"
                      max="1.5"
                      step="0.1"
                      value={shaderSettings.motionBlurIntensity}
                      onChange={(e) =>
                        onUpdateShaderSettings({ motionBlurIntensity: parseFloat(e.target.value) })
                      }
                      className="accent-sky-400 w-24 sm:w-32 cursor-pointer"
                    />
                    <button
                      onClick={() =>
                        onUpdateShaderSettings({
                          motionBlurEnabled: !shaderSettings.motionBlurEnabled,
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        shaderSettings.motionBlurEnabled
                          ? 'bg-sky-500 text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {shaderSettings.motionBlurEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Chromatic Aberration */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">Chromatic Aberration Prism</div>
                    <div className="text-xs text-zinc-400">
                      Optical lens color fringe distortion during high-speed drifts
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateShaderSettings({
                        chromaticAberration: !shaderSettings.chromaticAberration,
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      shaderSettings.chromaticAberration
                        ? 'bg-sky-500 text-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {shaderSettings.chromaticAberration ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Vignette Darkness */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div>
                    <div className="text-sm font-bold text-white">Cinematic Vignette Darkness</div>
                    <div className="text-xs text-zinc-400">
                      Edges darkening for movie-style camera focus
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-400">
                      {Math.round(shaderSettings.vignetteDarkness * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={shaderSettings.vignetteDarkness}
                      onChange={(e) =>
                        onUpdateShaderSettings({ vignetteDarkness: parseFloat(e.target.value) })
                      }
                      className="accent-sky-400 w-24 sm:w-32 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Camera Perspectives */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Camera Perspective (Hot-switch with [C])
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'chase_far', label: 'Chase Far' },
                    { id: 'chase_close', label: 'Chase Close' },
                    { id: 'hood', label: 'Bonnet / Hood' },
                    { id: 'cockpit', label: 'Driver Cockpit' },
                    { id: 'free', label: 'Drone Orbit' },
                  ].map((cam) => (
                    <button
                      key={cam.id}
                      onClick={() => onSelectCamera(cam.id as CameraMode)}
                      className={`py-2 px-3 rounded-xl border text-xs font-speedo font-bold uppercase transition-all cursor-pointer ${
                        cameraMode === cam.id
                          ? 'bg-sky-500 text-black border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-zinc-900/80 border-white/10 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: WEATHER & SKY ATMOSPHERE                                          */}
          {/* ========================================================================= */}
          {activeTab === 'weather' && (
            <div className="space-y-6">
              {/* Weather System Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  European Weather System
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'clear',
                      title: 'Sunny & Clear',
                      desc: 'Sharp shadows, vibrant tarmac, dry asphalt tire grip.',
                      icon: Sun,
                      color: 'text-amber-400',
                    },
                    {
                      id: 'overcast',
                      title: 'European Overcast',
                      desc: 'Moody overcast cloud ceiling, diffused soft skylight.',
                      icon: Cloud,
                      color: 'text-slate-300',
                    },
                    {
                      id: 'rain',
                      title: 'Heavy European Rain',
                      desc: 'Falling rain streaks, wet reflective road sheen, reduced friction.',
                      icon: CloudRain,
                      color: 'text-sky-400',
                    },
                    {
                      id: 'fog',
                      title: 'Alpine Valley Mist',
                      desc: 'Dense volumetric mountain fog, radiant glowing headlamps.',
                      icon: CloudFog,
                      color: 'text-indigo-300',
                    },
                  ].map((w) => {
                    const Icon = w.icon;
                    const isSelected = weather === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => onSelectWeather(w.id as WeatherType)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-950/70 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-5 h-5 ${w.color}`} />
                          <span className="font-speedo text-sm font-bold uppercase">
                            {w.title}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{w.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Time of Day & Sun Position
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'day',
                      title: 'Midday Noon',
                      desc: 'Crisp bright lighting, optimal racing visibility',
                      icon: Sun,
                    },
                    {
                      id: 'sunset',
                      title: 'Golden Sunset',
                      desc: 'Warm orange glow, dramatic long shadows across avenues',
                      icon: Sunset,
                    },
                    {
                      id: 'night',
                      title: 'European Night',
                      desc: 'Streetlamp illumination, glowing car underglow and neon signs',
                      icon: Moon,
                    },
                  ].map((tod) => {
                    const Icon = tod.icon;
                    const isSelected = timeOfDay === tod.id;
                    return (
                      <button
                        key={tod.id}
                        onClick={() => onSelectTimeOfDay(tod.id as TimeOfDay)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-4 h-4 text-amber-400" />
                          <span className="font-speedo text-sm font-bold uppercase">
                            {tod.title}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{tod.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CITY AI TRAFFIC MANAGER                                           */}
          {/* ========================================================================= */}
          {activeTab === 'traffic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Civilian AI Traffic Density
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'off',
                      title: 'Empty Streets',
                      cars: '0 cars',
                      desc: 'Clear open roads for pure high-speed time attack.',
                    },
                    {
                      id: 'low',
                      title: 'Light Cruising',
                      cars: '8 civilian cars',
                      desc: 'Occasional sedans and hatchbacks across avenues.',
                    },
                    {
                      id: 'medium',
                      title: 'City Flow (Standard)',
                      cars: '16 civilian cars',
                      desc: 'Balanced European traffic with taxis, vans and sedans.',
                    },
                    {
                      id: 'high',
                      title: 'Rush Hour Autobahn',
                      cars: '24 civilian cars',
                      desc: 'Dense European avenues requiring precision overtaking.',
                    },
                  ].map((td) => {
                    const isSelected = trafficDensity === td.id;
                    return (
                      <button
                        key={td.id}
                        onClick={() => onSelectTrafficDensity(td.id as TrafficDensity)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-950/70 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-speedo text-sm font-bold uppercase text-sky-400 mb-1">
                          {td.title}
                        </div>
                        <div className="text-[11px] font-mono-nums font-bold text-zinc-300 mb-1">
                          {td.cars}
                        </div>
                        <p className="text-xs text-zinc-400">{td.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Traffic Features Description */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="font-speedo text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-sky-400" />
                  Traffic AI Physics & Features
                </div>
                <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                  <li>
                    <span className="font-semibold text-white">Smart Braking:</span> Civilian cars
                    scan ahead, illuminate red brake lights, and halt if you or another vehicle stops
                    in front of them.
                  </li>
                  <li>
                    <span className="font-semibold text-white">European Vehicle Fleet:</span> Features
                    compact hatchbacks, executive German sedans, yellow city taxis with roof signs,
                    and express delivery vans.
                  </li>
                  <li>
                    <span className="font-semibold text-white">Dual-Tone European Horns:</span> If you
                    nudge or scrape a civilian vehicle, they honk their horn!
                  </li>
                  <li>
                    <span className="font-semibold text-white">GPS Radar Blips:</span> Civilian cars are
                    visible as real-time moving markers on the HUD mini-map.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DRIVING AIDS & MECHANICS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'driving' && (
            <div className="space-y-6">
              {/* Speed Unit */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Speedometer Units</div>
                  <div className="text-xs text-zinc-400">
                    Switch between European Standard (KM/H) and Imperial (MPH)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speedUnit !== 'kmh' && onToggleSpeedUnit()}
                    className={`px-4 py-2 rounded-xl text-xs font-speedo font-bold uppercase transition-all cursor-pointer ${
                      speedUnit === 'kmh'
                        ? 'bg-sky-500 text-black shadow-md shadow-sky-500/30'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    KM/H (EURO)
                  </button>
                  <button
                    onClick={() => speedUnit !== 'mph' && onToggleSpeedUnit()}
                    className={`px-4 py-2 rounded-xl text-xs font-speedo font-bold uppercase transition-all cursor-pointer ${
                      speedUnit === 'mph'
                        ? 'bg-sky-500 text-black shadow-md shadow-sky-500/30'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    MPH (US/UK)
                  </button>
                </div>
              </div>

              {/* Steering Sensitivity Slider */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Steering Sensitivity</div>
                  <div className="text-xs text-zinc-400">
                    Fine-tune steering lock response rate for keyboard and gamepads
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {steeringSensitivity.toFixed(1)}x
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={steeringSensitivity}
                    onChange={(e) => onChangeSteeringSensitivity(parseFloat(e.target.value))}
                    className="accent-sky-400 w-32 cursor-pointer"
                  />
                </div>
              </div>

              {/* Roadside Recovery Button */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Roadside Recovery & Reset</div>
                  <div className="text-xs text-zinc-400">
                    Immediately teleport the vehicle back to the asphalt and straighten out
                  </div>
                </div>
                <button
                  onClick={() => {
                    onResetCar();
                    onClose();
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-speedo font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-lg cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESET CAR [R]</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: EURO RADIO & AUDIO                                                */}
          {/* ========================================================================= */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Mute Master */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Master Audio Output</div>
                  <div className="text-xs text-zinc-400">
                    Toggles procedural engine roaring, turbo blow-off, backfires, and radio
                  </div>
                </div>
                <button
                  onClick={onToggleMute}
                  className={`px-4 py-2 rounded-xl text-xs font-speedo font-bold uppercase transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                  }`}
                >
                  {isMuted ? 'MUTED' : 'ENABLED'}
                </button>
              </div>

              {/* Volume Sliders */}
              <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">Engine Roar Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={engineVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEngineVolume(val);
                      soundEngine.setEngineVolume(val);
                    }}
                    className="accent-sky-400 w-36 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">European Radio Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={radioVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setRadioVolume(val);
                      euroRadio.setVolume(val);
                    }}
                    className="accent-amber-400 w-36 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CONTROLS CHEATSHEET                                               */}
          {/* ========================================================================= */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Accelerate / Throttle</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white font-mono font-bold">
                    W / Up Arrow
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Foot Brake / Reverse</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white font-mono font-bold">
                    S / Down Arrow
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Steer Left & Right</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white font-mono font-bold">
                    A / D / Left / Right
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Handbrake (Drift Initiation)</span>
                  <span className="px-2 py-1 rounded bg-sky-500/20 text-sky-400 font-mono font-bold border border-sky-500/40">
                    SPACEBAR
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Nitrous Boost (NOS)</span>
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono font-bold border border-blue-500/40">
                    LEFT SHIFT / N
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Autobahn Cruise Control</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white font-mono font-bold">
                    X
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Cycle Camera Angles</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white font-mono font-bold">
                    C
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Cycle Shaders Quality</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white font-mono font-bold">
                    G
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Reset Car on Road</span>
                  <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 font-mono font-bold border border-rose-500/40">
                    R
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Open Apex Customs Garage</span>
                  <span className="px-2 py-1 rounded bg-sky-500/20 text-sky-400 font-mono font-bold border border-sky-500/40">
                    M
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Open Career Hub & Autoshow</span>
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/40">
                    H / T
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-300">Enter Nearby Grand Prix</span>
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/40">
                    E
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-mono-nums">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">ESC</kbd> to return to driving
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-speedo font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-sky-500/20"
          >
            RESUME DRIVING
          </button>
        </div>
      </div>
    </div>
  );
};
