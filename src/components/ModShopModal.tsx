import React, { useState } from 'react';
import {
  Wrench,
  Gauge,
  Palette,
  Sliders,
  Sparkles,
  Zap,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Car as CarIcon,
  Coins,
  Lock,
  ShoppingBag,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  CarConfig,
  PaintFinish,
  PerformanceParts,
  VisualParts,
  TuningSettings,
} from '../types/car';
import { PlayerCareer } from '../types/career';
import { calculateCarStats } from '../data/cars';
import {
  PERFORMANCE_PART_PRICES,
  VISUAL_PART_PRICES,
  getRepRank,
} from '../data/pricing';
import { isPartOwned } from '../game/careerManager';

interface ModShopModalProps {
  currentCar: CarConfig;
  allCars: CarConfig[];
  career: PlayerCareer;
  onSelectCar: (carId: string) => void;
  onUpdateCarConfig: (updated: CarConfig) => void;
  onPurchasePart: (
    carId: string,
    category: string,
    value: string,
    price: number,
    requiredRep: number
  ) => boolean;
  onOpenAutoshow: () => void;
  onClose: () => void;
}

type TabType = 'performance' | 'aero' | 'paint' | 'tuning';

export const ModShopModal: React.FC<ModShopModalProps> = ({
  currentCar,
  allCars,
  career,
  onSelectCar,
  onUpdateCarConfig,
  onPurchasePart,
  onOpenAutoshow,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const stats = calculateCarStats(currentCar);
  const currentRank = getRepRank(career.reputation);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage(null);
    }, 3500);
  };

  // Helper to handle part selection with career economy
  const handleSelectPart = (
    category: string,
    value: string,
    priceTable: Record<string, Record<string, { price: number; requiredRep: number }>>,
    applyFn: () => void
  ) => {
    // Check if part is already owned
    const owned = isPartOwned(career, currentCar.id, category, value);
    if (owned) {
      applyFn();
      return;
    }

    // Get pricing and requirement
    const priceInfo = priceTable[category]?.[value] || { price: 0, requiredRep: 1 };

    // Check rep level
    if (currentRank.level < priceInfo.requiredRep) {
      showAlert(
        `LOCKED! Requires Reputation Rank ${priceInfo.requiredRep} (Current: Rank ${currentRank.level}). Win races to increase your rank!`
      );
      return;
    }

    // Check credits
    if (career.credits < priceInfo.price) {
      showAlert(
        `INSUFFICIENT CREDITS! This part costs $${priceInfo.price.toLocaleString()} CR (You have $${career.credits.toLocaleString()} CR).`
      );
      return;
    }

    // Process purchase
    const success = onPurchasePart(
      currentCar.id,
      category,
      value,
      priceInfo.price,
      priceInfo.requiredRep
    );

    if (success) {
      applyFn();
    }
  };

  // Helper to update performance parts
  const updatePerformance = (key: keyof PerformanceParts, value: any) => {
    handleSelectPart(key, String(value), PERFORMANCE_PART_PRICES, () => {
      onUpdateCarConfig({
        ...currentCar,
        performance: {
          ...currentCar.performance,
          [key]: value,
        },
      });
    });
  };

  // Helper to update visual aero parts
  const updateVisuals = (key: keyof VisualParts, value: any) => {
    handleSelectPart(key, String(value), VISUAL_PART_PRICES, () => {
      onUpdateCarConfig({
        ...currentCar,
        visuals: {
          ...currentCar.visuals,
          [key]: value,
        },
      });
    });
  };

  // Direct cosmetic updates (free color selection once finish/rim is owned)
  const directUpdateVisuals = (partial: Partial<VisualParts>) => {
    onUpdateCarConfig({
      ...currentCar,
      visuals: {
        ...currentCar.visuals,
        ...partial,
      },
    });
  };

  // Helper to update tuning settings (Free dyno adjustment)
  const updateTuning = (partial: Partial<TuningSettings>) => {
    onUpdateCarConfig({
      ...currentCar,
      tuning: {
        ...currentCar.tuning,
        ...partial,
      },
    });
  };

  // Preset Colors
  const PAINT_PRESETS = [
    { name: 'Guards Blue', hex: '#2563eb' },
    { name: 'Rosso Corsa', hex: '#dc2626' },
    { name: 'Acid Green', hex: '#84cc16' },
    { name: 'Sunset Pearl', hex: '#f97316' },
    { name: 'Cyber Purple', hex: '#7c3aed' },
    { name: 'Stealth Black', hex: '#18181b' },
    { name: 'Nardo Grey', hex: '#64748b' },
    { name: 'Pure Chalk', hex: '#f8fafc' },
    { name: 'Miami Cyan', hex: '#06b6d4' },
    { name: 'Gold Rush', hex: '#eab308' },
  ];

  const CALIPER_PRESETS = [
    { name: 'Brembo Red', hex: '#ef4444' },
    { name: 'Speed Yellow', hex: '#eab308' },
    { name: 'Electric Cyan', hex: '#06b6d4' },
    { name: 'Acid Green', hex: '#84cc16' },
    { name: 'Champagne Gold', hex: '#f59e0b' },
  ];

  const RIM_COLORS = [
    { name: 'Hyper Silver', hex: '#e2e8f0' },
    { name: 'Matte Bronze', hex: '#78350f' },
    { name: 'Gloss Black', hex: '#09090b' },
    { name: 'Gunmetal', hex: '#334155' },
    { name: 'Pure White', hex: '#ffffff' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* ALERT NOTIFICATION TOAST */}
        {alertMessage && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 border-2 border-red-500/80 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in max-w-md text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{alertMessage}</span>
          </div>
        )}

        {/* --- HEADER: MOD SHOP LOGO, CAR SELECTOR, AND WALLET --- */}
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-speedo text-xl font-bold tracking-wider text-white uppercase">
                  APEX HORIZON CUSTOMS
                </span>
                <span className="text-[10px] font-mono-nums font-bold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  GARAGE BAY 1
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Install performance parts, aero body kits, custom paints, and fine-tune your setup.
              </div>
            </div>
          </div>

          {/* PLAYER WALLET & REP */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-speedo text-sm font-bold text-emerald-400">
                ${career.credits.toLocaleString()} CR
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/60 border border-sky-500/40 px-3 py-1.5 rounded-xl">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-speedo text-xs font-bold text-sky-400">
                RANK {currentRank.level}
              </span>
            </div>

            {/* Test Drive Button */}
            <button
              id="modshop-exit-button"
              onClick={onClose}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer font-speedo tracking-wider uppercase text-xs"
            >
              <span>DRIVE ON ROAD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* --- CAR SELECTOR / GARAGE ROSTER --- */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-2 bg-zinc-950/60 overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-nums font-bold text-zinc-400 uppercase mr-2">
              YOUR GARAGE:
            </span>
            {allCars.map((car) => {
              const isOwned = career.ownedCarIds.includes(car.id);
              const isSelected = car.id === currentCar.id;
              const carStat = calculateCarStats(car);
              return (
                <button
                  key={car.id}
                  onClick={() => {
                    if (isOwned) {
                      onSelectCar(car.id);
                    } else {
                      onOpenAutoshow();
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-lg'
                      : isOwned
                      ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      : 'bg-zinc-950/80 text-zinc-500 border-zinc-850 opacity-60'
                  }`}
                >
                  {!isOwned ? <Lock className="w-3 h-3 text-zinc-500" /> : <CarIcon className="w-3.5 h-3.5" />}
                  <span>{car.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isSelected ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {carStat.classRating} {carStat.performanceIndex}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onOpenAutoshow}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>BUY CARS AT AUTOSHOW</span>
          </button>
        </div>

        {/* --- MAIN BODY: TABS & CONTENT --- */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR: TAB SWITCHER & LIVE STATS SUMMARY */}
          <div className="w-64 md:w-72 bg-zinc-900/40 border-r border-zinc-800/80 p-4 flex flex-col justify-between overflow-y-auto">
            {/* Category Tabs */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono-nums font-bold tracking-widest text-zinc-500 uppercase px-2">
                CUSTOMIZATION SUITE
              </span>
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Performance Parts</span>
              </button>

              <button
                onClick={() => setActiveTab('aero')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'aero'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Aero & Body Kit</span>
              </button>

              <button
                onClick={() => setActiveTab('paint')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'paint'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Paint & Wheels</span>
              </button>

              <button
                onClick={() => setActiveTab('tuning')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'tuning'
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Dyno & Fine Tuning</span>
              </button>
            </div>

            {/* LIVE DYNAMIC STATS PANEL (FORZA PI SYSTEM) */}
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono-nums font-bold text-zinc-400">
                  Performance Index
                </span>
                <span className="font-speedo text-lg font-black text-amber-400">
                  {stats.classRating} {stats.performanceIndex}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Horsepower</div>
                  <div className="font-speedo text-base font-bold text-white">
                    {stats.horsepower} <span className="text-[10px] text-zinc-400">BHP</span>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Torque</div>
                  <div className="font-speedo text-base font-bold text-white">
                    {stats.torque} <span className="text-[10px] text-zinc-400">Nm</span>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">0-60 MPH</div>
                  <div className="font-speedo text-base font-bold text-emerald-400">
                    {stats.zeroToSixtySec}s
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Top Speed</div>
                  <div className="font-speedo text-base font-bold text-sky-400">
                    {stats.topSpeedMph} <span className="text-[10px] text-zinc-400">MPH</span>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Weight</div>
                  <div className="font-speedo text-base font-bold text-zinc-200">
                    {stats.weightKg} <span className="text-[10px] text-zinc-400">KG</span>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Lateral Grip</div>
                  <div className="font-speedo text-base font-bold text-purple-400">
                    {stats.lateralG} <span className="text-[10px] text-zinc-400">G</span>
                  </div>
                </div>
              </div>

              {/* Drivetrain */}
              <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/80 pt-2">
                <span>Drivetrain:</span>
                <span className="font-bold text-white">{currentCar.driveType}</span>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: CUSTOMIZATION PANELS */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto">
            {/* ================= TAB 1: PERFORMANCE UPGRADES ================= */}
            {activeTab === 'performance' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                    Performance Upgrades
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Purchase and install race-spec engine components, turbo systems, sport tires, and suspension.
                  </p>
                </div>

                {/* Engine Stage */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Engine Stage & Internals
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'stock', name: 'Stock Block', desc: 'Standard factory displacement', hp: '+0' },
                      { id: 'street_cam', name: 'Street Camshaft', desc: 'High-lift aggressive cams', hp: '+45 HP' },
                      { id: 'race_internals', name: 'Forged Race Internals', desc: 'Titanium valves, forged pistons', hp: '+120 HP' },
                      { id: 'v10_swap', name: 'V10 Beast Swap', desc: '8.4L high-revving racing engine', hp: '+280 HP' },
                    ].map((item) => {
                      const owned = isPartOwned(career, currentCar.id, 'engineStage', item.id);
                      const isEquipped = currentCar.performance.engineStage === item.id;
                      const priceInfo = PERFORMANCE_PART_PRICES.engineStage[item.id];
                      const isLocked = currentRank.level < priceInfo.requiredRep;

                      return (
                        <button
                          key={item.id}
                          onClick={() => updatePerformance('engineStage', item.id)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between font-bold text-sm text-white">
                              <span>{item.name}</span>
                              <span className="text-xs text-emerald-400 font-mono-nums">{item.hp}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">{item.desc}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                            {isEquipped ? (
                              <span className="text-sky-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> INSTALLED
                              </span>
                            ) : owned ? (
                              <span className="text-emerald-400 font-bold">OWNED (EQUIP)</span>
                            ) : isLocked ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LVL {priceInfo.requiredRep}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                ${priceInfo.price.toLocaleString()} CR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Forced Induction */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Forced Induction (Turbos & Superchargers)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'na', name: 'Naturally Aspirated', desc: 'Linear throttle response, pure exhaust note', boost: '0 PSI' },
                      { id: 'supercharger', name: 'Roots Supercharger', desc: 'Instant low-end torque whine', boost: '+110 HP' },
                      { id: 'single_turbo', name: 'Ball Bearing Single Turbo', desc: 'Mid-range kick with blow-off flutter', boost: '+135 HP' },
                      { id: 'twin_turbo', name: 'Sequential Twin Turbo', desc: 'Extreme top-end boost & whistling roar', boost: '+220 HP' },
                    ].map((item) => {
                      const owned = isPartOwned(career, currentCar.id, 'induction', item.id);
                      const isEquipped = currentCar.performance.induction === item.id;
                      const priceInfo = PERFORMANCE_PART_PRICES.induction[item.id];
                      const isLocked = currentRank.level < priceInfo.requiredRep;

                      return (
                        <button
                          key={item.id}
                          onClick={() => updatePerformance('induction', item.id)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between font-bold text-sm text-white">
                              <span>{item.name}</span>
                              <span className="text-xs text-sky-400 font-mono-nums">{item.boost}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">{item.desc}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                            {isEquipped ? (
                              <span className="text-sky-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> INSTALLED
                              </span>
                            ) : owned ? (
                              <span className="text-emerald-400 font-bold">OWNED (EQUIP)</span>
                            ) : isLocked ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LVL {priceInfo.requiredRep}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                ${priceInfo.price.toLocaleString()} CR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tires & Compound */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Tire Compound & Grip
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'street', name: 'Street Tires', desc: 'Balanced everyday road grip', grip: '1.0x' },
                      { id: 'semislick', name: 'Semi-Slick Sport', desc: 'High cornering grip & responsive turn-in', grip: '+0.12 G' },
                      { id: 'race_slick', name: 'Full Race Slick', desc: 'Maximum track traction & braking force', grip: '+0.28 G' },
                      { id: 'drift_compound', name: 'Drift Spec Compound', desc: 'Smooth slip angle breakaway & sustained slide', grip: 'Drift Spec' },
                    ].map((item) => {
                      const owned = isPartOwned(career, currentCar.id, 'tires', item.id);
                      const isEquipped = currentCar.performance.tires === item.id;
                      const priceInfo = PERFORMANCE_PART_PRICES.tires[item.id];
                      const isLocked = currentRank.level < priceInfo.requiredRep;

                      return (
                        <button
                          key={item.id}
                          onClick={() => updatePerformance('tires', item.id)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between font-bold text-sm text-white">
                              <span>{item.name}</span>
                              <span className="text-xs text-purple-400 font-mono-nums">{item.grip}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">{item.desc}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                            {isEquipped ? (
                              <span className="text-sky-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> INSTALLED
                              </span>
                            ) : owned ? (
                              <span className="text-emerald-400 font-bold">OWNED (EQUIP)</span>
                            ) : isLocked ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LVL {priceInfo.requiredRep}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                ${priceInfo.price.toLocaleString()} CR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nitrous Injection System Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/40">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-sky-400 animate-pulse" />
                    <div>
                      <div className="font-bold text-sm text-white">Nitrous Oxide Injection (NOS)</div>
                      <div className="text-xs text-zinc-400">
                        Provides rapid boost of +75 HP and acceleration when pressing [SHIFT] or [N].
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextState = !currentCar.performance.nitrous;
                      if (nextState) {
                        handleSelectPart('nitrous', 'installed', PERFORMANCE_PART_PRICES, () => {
                          onUpdateCarConfig({
                            ...currentCar,
                            performance: { ...currentCar.performance, nitrous: true },
                          });
                        });
                      } else {
                        onUpdateCarConfig({
                          ...currentCar,
                          performance: { ...currentCar.performance, nitrous: false },
                        });
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold font-speedo tracking-wider uppercase transition-all cursor-pointer ${
                      currentCar.performance.nitrous
                        ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/30'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {currentCar.performance.nitrous
                      ? 'INSTALLED [ON]'
                      : `BUY & INSTALL ($${PERFORMANCE_PART_PRICES.nitrous.installed.price.toLocaleString()} CR)`}
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 2: AERO & BODY KITS ================= */}
            {activeTab === 'aero' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                    Aerodynamics & Body Kits
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Transform your car's exterior profile with customizable spoilers, splitters, hoods, exhausts, and underglow.
                  </p>
                </div>

                {/* Spoilers & Wings */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Rear Spoilers & Downforce Wings
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'none', name: 'No Wing (Clean Deck)', downforce: 'Low Drag' },
                      { id: 'ducktail', name: 'Ducktail Lip Spoiler', downforce: '+0.03 G' },
                      { id: 'gt_wing', name: 'Carbon GT Wing', downforce: '+0.08 G' },
                      { id: 'time_attack', name: 'Chassis Mount Time Attack', downforce: '+0.14 G' },
                    ].map((item) => {
                      const owned = isPartOwned(career, currentCar.id, 'spoiler', item.id);
                      const isEquipped = currentCar.visuals.spoiler === item.id;
                      const priceInfo = VISUAL_PART_PRICES.spoiler[item.id];
                      const isLocked = currentRank.level < priceInfo.requiredRep;

                      return (
                        <button
                          key={item.id}
                          onClick={() => updateVisuals('spoiler', item.id)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-sky-600/20 border-sky-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-white">{item.name}</div>
                            <div className="text-xs text-sky-400 mt-1">{item.downforce}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                            {isEquipped ? (
                              <span className="text-sky-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> INSTALLED
                              </span>
                            ) : owned ? (
                              <span className="text-emerald-400 font-bold">OWNED</span>
                            ) : isLocked ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LVL {priceInfo.requiredRep}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                ${priceInfo.price.toLocaleString()} CR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exhaust Systems */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Exhaust Tips & Mufflers
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'stock', name: 'Stock Exhaust' },
                      { id: 'titanium_dual', name: 'Dual Titanium Tips' },
                      { id: 'quad_burn', name: 'Quad Flame Burnt Tips' },
                      { id: 'cannon', name: '4" Angled Cannon Muffler' },
                    ].map((item) => {
                      const owned = isPartOwned(career, currentCar.id, 'exhaust', item.id);
                      const isEquipped = currentCar.visuals.exhaust === item.id;
                      const priceInfo = VISUAL_PART_PRICES.exhaust[item.id];
                      const isLocked = currentRank.level < priceInfo.requiredRep;

                      return (
                        <button
                          key={item.id}
                          onClick={() => updateVisuals('exhaust', item.id)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-sky-600/20 border-sky-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="font-bold text-sm text-white">{item.name}</div>
                          <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                            {isEquipped ? (
                              <span className="text-sky-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> INSTALLED
                              </span>
                            ) : owned ? (
                              <span className="text-emerald-400 font-bold">OWNED</span>
                            ) : isLocked ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LVL {priceInfo.requiredRep}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                ${priceInfo.price.toLocaleString()} CR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Neon Underglow Kit */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Neon Underglow Kit
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Off (None)', color: null },
                      { name: 'Electric Cyan', color: '#06b6d4' },
                      { name: 'Neon Pink', color: '#f43f5e' },
                      { name: 'Acid Green', color: '#84cc16' },
                      { name: 'Sunset Orange', color: '#f97316' },
                      { name: 'Deep Purple', color: '#a855f7' },
                      { name: 'Pure White', color: '#ffffff' },
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => directUpdateVisuals({ underglowColor: item.color })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currentCar.visuals.underglowColor === item.color
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {item.color && (
                          <div
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 3: PAINT & WHEELS ================= */}
            {activeTab === 'paint' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                    Paint & Wheels Customization
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Apply bespoke finishes, color palettes, rims styles, rim sizing, and wheel offset stance.
                  </p>
                </div>

                {/* Body Paint Finish & Presets */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Body Paint Finish
                    </span>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                      {(['gloss', 'metallic', 'matte', 'pearlescent'] as PaintFinish[]).map((fin) => (
                        <button
                          key={fin}
                          onClick={() => updateVisuals('paintFinish', fin)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                            currentCar.visuals.paintFinish === fin
                              ? 'bg-white text-black shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {fin}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {PAINT_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => directUpdateVisuals({ paintColor: p.hex })}
                        className={`h-12 rounded-xl flex items-center justify-center border-2 transition-transform cursor-pointer ${
                          currentCar.visuals.paintColor.toLowerCase() === p.hex.toLowerCase()
                            ? 'border-white scale-105 shadow-lg'
                            : 'border-transparent hover:scale-102'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.name}
                      >
                        {currentCar.visuals.paintColor.toLowerCase() === p.hex.toLowerCase() && (
                          <Check className="w-5 h-5 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-400">Custom Color:</span>
                    <input
                      type="color"
                      value={currentCar.visuals.paintColor}
                      onChange={(e) => directUpdateVisuals({ paintColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono-nums text-zinc-300 uppercase">
                      {currentCar.visuals.paintColor}
                    </span>
                  </div>
                </div>

                {/* Rim Styles */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Wheel Rim Style
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'mesh', name: 'BBS Track Mesh' },
                      { id: 'spoke5', name: '5-Spoke Lightweight' },
                      { id: 'deepdish', name: 'Deep Dish Stepped' },
                      { id: 'carbon_aero', name: 'Carbon Aerodisc' },
                    ].map((r) => {
                      const owned = isPartOwned(career, currentCar.id, 'rimStyle', r.id);
                      const isEquipped = currentCar.visuals.rimStyle === r.id;
                      const priceInfo = VISUAL_PART_PRICES.rimStyle[r.id];
                      const isLocked = currentRank.level < priceInfo.requiredRep;

                      return (
                        <button
                          key={r.id}
                          onClick={() => updateVisuals('rimStyle', r.id)}
                          className={`p-3 rounded-2xl border text-left font-bold text-sm transition-all cursor-pointer flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-sky-600/20 border-sky-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div>{r.name}</div>
                          <div className="mt-2 text-xs">
                            {isEquipped ? (
                              <span className="text-sky-400 font-bold">INSTALLED</span>
                            ) : owned ? (
                              <span className="text-emerald-400 font-bold">OWNED</span>
                            ) : isLocked ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> LVL {priceInfo.requiredRep}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold">
                                ${priceInfo.price.toLocaleString()} CR
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Rim Color */}
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider mt-2">
                    Wheel Finish & Color
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {RIM_COLORS.map((rc) => (
                      <button
                        key={rc.hex}
                        onClick={() => directUpdateVisuals({ rimColor: rc.hex })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currentCar.visuals.rimColor.toLowerCase() === rc.hex.toLowerCase()
                            ? 'bg-zinc-800 text-white border-white shadow'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-black/30" style={{ backgroundColor: rc.hex }} />
                        <span>{rc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: DYNO & FINE TUNING ================= */}
            {activeTab === 'tuning' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                    Dyno & Fine Tuning
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Fine-tune camber angle, tire pressure, suspension height, and final drive gear ratios for optimal grip or drift.
                  </p>
                </div>

                {/* Simulated Dyno Chart Header */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono-nums font-bold">
                    <span className="text-zinc-400 uppercase">Power & Torque Dyno Run</span>
                    <span className="text-emerald-400">PEAK: {stats.horsepower} BHP @ 7,800 RPM</span>
                  </div>

                  {/* Dyno SVG Graph */}
                  <div className="relative w-full h-32 bg-black/60 rounded-xl p-2 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                      <line x1="0" y1="25" x2="400" y2="25" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="0" y1="50" x2="400" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />

                      <path d="M 10 90 Q 80 20 220 35 T 390 65" fill="none" stroke="#f59e0b" strokeWidth="3" />
                      <path d="M 10 95 Q 140 70 280 25 T 390 15" fill="none" stroke="#38bdf8" strokeWidth="3" />
                    </svg>

                    <div className="absolute top-2 left-4 flex gap-4 text-[10px] font-mono-nums">
                      <span className="flex items-center gap-1 text-sky-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> HP Curve
                      </span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Torque (Nm)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tuning Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tire Pressure */}
                  <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">Tire Pressure</span>
                      <span className="text-sky-400 font-mono-nums">{currentCar.tuning.tirePressurePsi} PSI</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="40"
                      step="1"
                      value={currentCar.tuning.tirePressurePsi}
                      onChange={(e) => updateTuning({ tirePressurePsi: Number(e.target.value) })}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>

                  {/* Camber Angle */}
                  <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">Front Camber Angle</span>
                      <span className="text-sky-400 font-mono-nums">{currentCar.tuning.camberDeg.toFixed(1)}°</span>
                    </div>
                    <input
                      type="range"
                      min="-5.0"
                      max="-0.5"
                      step="0.1"
                      value={currentCar.tuning.camberDeg}
                      onChange={(e) => updateTuning({ camberDeg: Number(e.target.value) })}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
