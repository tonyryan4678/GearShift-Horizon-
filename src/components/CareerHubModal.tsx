import React, { useState } from 'react';
import {
  Trophy,
  ShoppingBag,
  Flag,
  Award,
  Lock,
  CheckCircle,
  ArrowRight,
  Zap,
  Car as CarIcon,
  X,
  Clock,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { PlayerCareer, RaceEvent } from '../types/career';
import { CarConfig } from '../types/car';
import { CAREER_RACES } from '../data/races';
import { calculateCarStats } from '../data/cars';
import { getRepRank, getNextRepRank } from '../data/pricing';

interface CareerHubModalProps {
  career: PlayerCareer;
  currentCar: CarConfig;
  allCars: CarConfig[];
  onSelectCar: (carId: string) => void;
  onBuyCar: (car: CarConfig) => void;
  onStartRace: (race: RaceEvent) => void;
  onClose: () => void;
}

type TabType = 'races' | 'dealership' | 'stats';

export const CareerHubModal: React.FC<CareerHubModalProps> = ({
  career,
  currentCar,
  allCars,
  onSelectCar,
  onBuyCar,
  onStartRace,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('races');
  const [selectedTier, setSelectedTier] = useState<number>(1);

  const currentRank = getRepRank(career.reputation);
  const nextRank = getNextRepRank(currentRank.level);

  // Filter races by tier
  const filteredRaces = CAREER_RACES.filter((r) => r.tier === selectedTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* --- HEADER: CAREER STATUS & WALLET --- */}
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-speedo text-xl font-bold tracking-wider text-white uppercase">
                  HORIZON CAREER HUB
                </span>
                <span className="text-[10px] font-mono-nums font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  FESTIVAL STAGE
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Compete in championship events, earn credits and reputation, and expand your exotic car collection.
              </div>
            </div>
          </div>

          {/* WALLET & REP SUMMARY */}
          <div className="flex items-center gap-4">
            {/* Credits */}
            <div className="flex items-center gap-2 bg-black/70 border border-emerald-500/40 px-3.5 py-1.5 rounded-2xl">
              <Coins className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[9px] font-mono-nums font-bold text-zinc-400 uppercase">WALLET</div>
                <div className="font-speedo text-base font-black text-emerald-400">
                  ${career.credits.toLocaleString()}{' '}
                  <span className="text-[10px] text-zinc-400">CR</span>
                </div>
              </div>
            </div>

            {/* Rep Level */}
            <div className="flex items-center gap-2 bg-black/70 border border-sky-500/40 px-3.5 py-1.5 rounded-2xl">
              <Award className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-[9px] font-mono-nums font-bold text-zinc-400 uppercase">
                  RANK {currentRank.level}
                </div>
                <div className="font-speedo text-sm font-bold text-sky-400 truncate max-w-[120px]">
                  {currentRank.title}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-2 bg-zinc-900/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('races')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'races'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Championship Races</span>
            </button>

            <button
              onClick={() => setActiveTab('dealership')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dealership'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Autoshow Car Dealership</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Career Records</span>
            </button>
          </div>

          {/* Current Car Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
            <span>Current Ride:</span>
            <span className="font-bold text-white">{currentCar.name}</span>
          </div>
        </div>

        {/* --- MAIN TAB CONTENT --- */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* ================= TAB 1: RACE EVENTS ================= */}
          {activeTab === 'races' && (
            <div className="flex flex-col gap-6">
              {/* TIER SELECTOR */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                    Festival Race Series
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Enter street sprints and technical circuits to claim first place purses and reputation XP.
                  </p>
                </div>

                <div className="flex gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                  {[
                    { tier: 1, label: 'Tier 1: Street Rookie' },
                    { tier: 2, label: 'Tier 2: Pro Division' },
                    { tier: 3, label: 'Tier 3: Supercars' },
                    { tier: 4, label: 'Tier 4: Goliath' },
                  ].map((t) => (
                    <button
                      key={t.tier}
                      onClick={() => setSelectedTier(t.tier)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTier === t.tier
                          ? 'bg-white text-black shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* RACES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRaces.map((race) => {
                  const isLocked = currentRank.level < race.requiredRepLevel;
                  const canAffordEntry = career.credits >= race.entryFee;
                  const record = career.completedRaces[race.id];

                  return (
                    <div
                      key={race.id}
                      className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                        isLocked
                          ? 'bg-zinc-950/60 border-zinc-850 opacity-65'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 shadow-xl'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                {race.type === 'circuit' ? `${race.laps} LAPS CIRCUIT` : 'POINT SPRINT'}
                              </span>
                              {record && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  BEST: {record.bestPosition === 1 ? '1ST' : `${record.bestPosition}TH`}
                                </span>
                              )}
                            </div>
                            <h4 className="font-speedo text-xl font-bold text-white uppercase mt-1">
                              {race.title}
                            </h4>
                          </div>

                          {isLocked && (
                            <div className="flex items-center gap-1 bg-red-950/60 text-red-400 border border-red-800/40 text-[11px] font-bold px-2.5 py-1 rounded-xl">
                              <Lock className="w-3.5 h-3.5" />
                              <span>REQUIRES LVL {race.requiredRepLevel}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400">{race.subtitle}</p>

                        {/* Rewards & Specs */}
                        <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850 text-xs">
                          <div>
                            <div className="text-[10px] text-zinc-400 uppercase">1st Place Purse</div>
                            <div className="font-speedo font-bold text-emerald-400 text-sm">
                              ${race.rewards.first.cr.toLocaleString()} <span className="text-[10px]">CR</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-zinc-400 uppercase">Reputation</div>
                            <div className="font-speedo font-bold text-sky-400 text-sm">
                              +{race.rewards.first.rep} <span className="text-[10px]">XP</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-zinc-400 uppercase">Entry Fee</div>
                            <div className="font-speedo font-bold text-zinc-300 text-sm">
                              {race.entryFee === 0 ? 'FREE' : `$${race.entryFee.toLocaleString()}`}
                            </div>
                          </div>
                        </div>

                        {/* Competitors Preview */}
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <span className="text-zinc-450 font-bold">Rivals:</span>
                          <span>
                            {race.aiCompetitors.map((c) => c.name).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Launch Button */}
                      <button
                        onClick={() => !isLocked && canAffordEntry && onStartRace(race)}
                        disabled={isLocked || !canAffordEntry}
                        className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-extrabold font-speedo tracking-wider uppercase text-sm transition-all cursor-pointer ${
                          isLocked
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : !canAffordEntry
                            ? 'bg-red-950/50 text-red-400 border border-red-800/40 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>LOCKED (REACH RANK {race.requiredRepLevel})</span>
                          </>
                        ) : !canAffordEntry ? (
                          <span>INSUFFICIENT CREDITS (NEED ${race.entryFee})</span>
                        ) : (
                          <>
                            <span>ENTER CHAMPIONSHIP EVENT</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 2: AUTOSHOW DEALERSHIP ================= */}
          {activeTab === 'dealership' && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                  Horizon Autoshow Dealership
                </h3>
                <p className="text-xs text-zinc-400">
                  Spend your race earnings on new chassis, from street drift platforms to track hypercars.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allCars.map((car) => {
                  const isOwned = career.ownedCarIds.includes(car.id);
                  const isSelected = currentCar.id === car.id;
                  const isLevelLocked = currentRank.level < car.requiredRepLevel;
                  const canAfford = career.credits >= car.priceCredits;
                  const stats = calculateCarStats(car);

                  return (
                    <div
                      key={car.id}
                      className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-zinc-900 border-white shadow-2xl'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-nums font-bold text-sky-400 uppercase">
                                {car.brand} • {car.year}
                              </span>
                              <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                {car.category}
                              </span>
                            </div>
                            <h4 className="font-speedo text-2xl font-black text-white uppercase mt-0.5">
                              {car.name}
                            </h4>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="font-speedo text-xl font-bold text-amber-400">
                              {stats.classRating} {stats.performanceIndex}
                            </span>
                            <span className="text-[10px] text-zinc-400">{car.driveType} DRIVETRAIN</span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400">{car.tagline}</p>

                        {/* Specs */}
                        <div className="grid grid-cols-4 gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-850 text-xs">
                          <div>
                            <div className="text-[9px] text-zinc-400 uppercase">Power</div>
                            <div className="font-speedo font-bold text-white">{stats.horsepower} BHP</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-zinc-400 uppercase">Top Speed</div>
                            <div className="font-speedo font-bold text-sky-400">{stats.topSpeedMph} MPH</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-zinc-400 uppercase">0-60 MPH</div>
                            <div className="font-speedo font-bold text-emerald-400">{stats.zeroToSixtySec}s</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-zinc-400 uppercase">Weight</div>
                            <div className="font-speedo font-bold text-zinc-300">{stats.weightKg} kg</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions: Buy / Drive */}
                      <div className="mt-4">
                        {isOwned ? (
                          <button
                            onClick={() => onSelectCar(car.id)}
                            className={`w-full py-3 px-4 rounded-2xl font-extrabold font-speedo tracking-wider uppercase text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'bg-white text-black shadow-lg'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                            }`}
                          >
                            <CarIcon className="w-4 h-4" />
                            <span>{isSelected ? 'CURRENTLY DRIVING' : 'SELECT & DRIVE THIS CAR'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => !isLevelLocked && canAfford && onBuyCar(car)}
                            disabled={isLevelLocked || !canAfford}
                            className={`w-full py-3 px-4 rounded-2xl font-extrabold font-speedo tracking-wider uppercase text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              isLevelLocked
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : !canAfford
                                ? 'bg-red-950/60 text-red-400 border border-red-800/40 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                            }`}
                          >
                            {isLevelLocked ? (
                              <>
                                <Lock className="w-4 h-4" />
                                <span>LOCKED (REACH RANK {car.requiredRepLevel})</span>
                              </>
                            ) : !canAfford ? (
                              <span>NEED ${car.priceCredits.toLocaleString()} CR (SHORT BY ${(car.priceCredits - career.credits).toLocaleString()})</span>
                            ) : (
                              <>
                                <ShoppingBag className="w-4 h-4" />
                                <span>BUY CAR FOR ${car.priceCredits.toLocaleString()} CR</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 3: CAREER STATS ================= */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="font-speedo text-2xl font-bold text-white uppercase tracking-wider">
                  Driver Career Records & Stats
                </h3>
                <p className="text-xs text-zinc-400">
                  Track your race victories, earnings, garage valuation, and festival achievements.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono-nums">Races Won</div>
                  <div className="font-speedo text-3xl font-black text-amber-400 mt-1">
                    {career.totalRacesWon}
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono-nums">Total Prize Purse</div>
                  <div className="font-speedo text-3xl font-black text-emerald-400 mt-1">
                    ${career.totalCreditsEarned.toLocaleString()}
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono-nums">Cars in Garage</div>
                  <div className="font-speedo text-3xl font-black text-sky-400 mt-1">
                    {career.ownedCarIds.length} / {allCars.length}
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-mono-nums">Reputation XP</div>
                  <div className="font-speedo text-3xl font-black text-purple-400 mt-1">
                    {career.reputation.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
