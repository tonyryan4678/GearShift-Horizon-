import React from 'react';
import { Trophy, Award, Zap, ArrowRight, RotateCcw, Wrench, CheckCircle2 } from 'lucide-react';
import { RaceEvent } from '../types/career';
import { getRepRank, getNextRepRank } from '../data/pricing';

interface RaceResultsModalProps {
  race: RaceEvent;
  position: number;
  finishTimeMs: number;
  creditsEarned: number;
  repEarned: number;
  newRepTotal: number;
  previousRepTotal: number;
  onContinue: () => void;
  onOpenModShop: () => void;
  onRestartRace: () => void;
}

export const RaceResultsModal: React.FC<RaceResultsModalProps> = ({
  race,
  position,
  finishTimeMs,
  creditsEarned,
  repEarned,
  newRepTotal,
  previousRepTotal,
  onContinue,
  onOpenModShop,
  onRestartRace,
}) => {
  const isWinner = position === 1;
  const isPodium = position <= 3;

  const currentRank = getRepRank(newRepTotal);
  const prevRank = getRepRank(previousRepTotal);
  const leveledUp = currentRank.level > prevRank.level;
  const nextRank = getNextRepRank(currentRank.level);

  // Format race timer
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  // Calculate XP progress bar percentage
  const currentLevelBase = currentRank.xpRequired;
  const nextLevelBase = nextRank ? nextRank.xpRequired : currentLevelBase + 10000;
  const xpIntoCurrentLevel = Math.max(0, newRepTotal - currentLevelBase);
  const xpNeededForLevel = nextLevelBase - currentLevelBase;
  const progressPct = Math.min(100, Math.max(5, (xpIntoCurrentLevel / xpNeededForLevel) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* TOP GLOW BANNER */}
        <div
          className={`px-6 py-6 text-center border-b ${
            isWinner
              ? 'bg-gradient-to-b from-amber-500/25 to-zinc-950 border-amber-500/30'
              : isPodium
              ? 'bg-gradient-to-b from-sky-500/25 to-zinc-950 border-sky-500/30'
              : 'bg-gradient-to-b from-zinc-800/40 to-zinc-950 border-zinc-800'
          }`}
        >
          {/* Trophy Icon */}
          <div className="flex justify-center mb-2">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl ${
                isWinner
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-amber-500/40 animate-bounce'
                  : isPodium
                  ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sky-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Trophy className="w-8 h-8" />
            </div>
          </div>

          <div className="text-[11px] font-mono-nums font-bold tracking-widest text-zinc-400 uppercase">
            {race.title} - RACE RESULTS
          </div>

          <div className="font-speedo text-4xl sm:text-5xl font-black text-white uppercase tracking-wider mt-1">
            {position === 1
              ? '1ST PLACE VICTORY!'
              : position === 2
              ? '2ND PLACE PODIUM'
              : position === 3
              ? '3RD PLACE PODIUM'
              : `${position}TH PLACE FINISH`}
          </div>

          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-zinc-400 font-mono-nums">
            <span>OFFICIAL TIME:</span>
            <span className="font-bold text-white text-base">{formatTime(finishTimeMs)}</span>
          </div>
        </div>

        {/* REWARDS BREAKDOWN */}
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* CREDITS EARNED */}
            <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-mono-nums font-bold text-emerald-400 uppercase tracking-wider">
                PRIZE CREDITS (CR)
              </span>
              <div className="font-speedo text-2xl sm:text-3xl font-black text-emerald-400">
                +${creditsEarned.toLocaleString()}{' '}
                <span className="text-xs font-bold text-zinc-400">CR</span>
              </div>
              <span className="text-[11px] text-zinc-400">Awarded to your Horizon garage bank</span>
            </div>

            {/* REPUTATION EARNED */}
            <div className="bg-zinc-900/90 border border-sky-500/30 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-mono-nums font-bold text-sky-400 uppercase tracking-wider">
                REPUTATION XP
              </span>
              <div className="font-speedo text-2xl sm:text-3xl font-black text-sky-400">
                +{repEarned.toLocaleString()}{' '}
                <span className="text-xs font-bold text-zinc-400">REP</span>
              </div>
              <span className="text-[11px] text-zinc-400">Unlocks new cars & high-tier parts</span>
            </div>
          </div>

          {/* LEVEL UP NOTIFICATION IF TRIGGERED */}
          {leveledUp && (
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/50 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-speedo text-sm font-bold text-amber-300 uppercase tracking-wider">
                  LEVEL UP! NEW REPUTATION RANK: {currentRank.title} (LVL {currentRank.level})
                </div>
                <div className="text-[11px] text-zinc-300">
                  New high-performance engine parts and high-tier race events are now unlocked!
                </div>
              </div>
            </div>
          )}

          {/* REP LEVEL PROGRESS BAR */}
          <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white">
                  Rank {currentRank.level}: {currentRank.title}
                </span>
              </div>
              {nextRank && (
                <span className="text-zinc-400 font-mono-nums text-[11px]">
                  Next: {nextRank.title} ({newRepTotal}/{nextRank.xpRequired} XP)
                </span>
              )}
            </div>

            {/* Bar */}
            <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <button
              onClick={onOpenModShop}
              className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-2xl border border-zinc-700 transition-all cursor-pointer text-sm"
            >
              <Wrench className="w-4 h-4 text-sky-400" />
              <span>UPGRADE IN MOD SHOP</span>
            </button>

            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer font-speedo tracking-wider uppercase text-sm"
            >
              <span>CONTINUE TO FREE ROAM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
