import React from 'react';
import { Flag, Trophy, Clock, Target, AlertTriangle, ArrowRight } from 'lucide-react';
import { RaceState } from '../types/career';

interface RaceHUDProps {
  raceState: RaceState;
  onAbandonRace: () => void;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({ raceState, onAbandonRace }) => {
  const { race, status, countdown, currentLap, currentCheckpointIndex, elapsedTimeMs, playerPosition, totalRacers, aiRacers } = raceState;

  // Format race timer
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* --- TOP BAR: RACE INFO, POSITION, LAPS, AND TIMER --- */}
      <div className="flex items-start justify-between w-full">
        {/* TOP LEFT: RACE TITLE & POSITION */}
        <div className="flex items-center gap-4 animate-slide-in">
          {/* Position Badge */}
          <div className="flex flex-col items-center justify-center bg-black/80 backdrop-blur-md border-2 border-amber-400/80 px-4 py-2 rounded-2xl shadow-xl shadow-amber-500/10">
            <span className="text-[10px] font-mono-nums font-bold tracking-widest text-amber-400 uppercase">
              POSITION
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-speedo text-3xl sm:text-4xl font-black text-white">
                {playerPosition}
              </span>
              <span className="text-xs font-bold text-zinc-400">/ {totalRacers}</span>
            </div>
          </div>

          {/* Race Title & Lap Counter */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500 text-black font-speedo font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {race.type === 'circuit' ? `${race.laps} LAPS CIRCUIT` : 'POINT TO POINT SPRINT'}
              </span>
              <span className="text-white font-speedo text-lg font-bold drop-shadow-md hidden sm:inline">
                {race.title}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono-nums font-bold text-zinc-300">
              <span className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                <Flag className="w-3.5 h-3.5 text-sky-400" />
                LAP {currentLap} / {race.laps}
              </span>

              <span className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                GATE {currentCheckpointIndex + 1} / {race.checkpoints.length}
              </span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT: RACE TIMER & ABANDON BUTTON */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-white shadow-lg">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-mono-nums font-black text-lg sm:text-xl tracking-wider">
              {formatTime(elapsedTimeMs)}
            </span>
          </div>

          <button
            onClick={onAbandonRace}
            className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
            title="Abandon Race"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QUIT</span>
          </button>
        </div>
      </div>

      {/* --- COUNTDOWN OVERLAY (3, 2, 1, GO!) --- */}
      {status === 'countdown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 animate-fade-in">
          <div className="text-center">
            <div className="text-xs font-mono-nums font-bold uppercase tracking-widest text-sky-400 mb-2">
              APEX HORIZON RACING
            </div>
            {countdown > 0 ? (
              <div
                key={countdown}
                className="font-speedo text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-300 to-amber-500 drop-shadow-[0_10px_25px_rgba(245,158,11,0.5)] scale-110 animate-bounce"
              >
                {countdown}
              </div>
            ) : (
              <div className="font-speedo text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 via-emerald-400 to-teal-500 drop-shadow-[0_10px_30px_rgba(16,185,129,0.7)] animate-pulse tracking-widest">
                GO!
              </div>
            )}
            <div className="text-sm font-bold text-zinc-300 mt-2">
              {race.title}
            </div>
          </div>
        </div>
      )}

      {/* --- RIGHT SIDE: COMPETITOR INTERVAL LEADERBOARD --- */}
      {status === 'racing' && (
        <div className="absolute top-24 right-4 sm:right-6 hidden sm:flex flex-col gap-1.5 bg-black/65 backdrop-blur-md p-3 rounded-2xl border border-white/10 w-56 animate-fade-in">
          <div className="text-[10px] font-mono-nums font-bold tracking-widest text-zinc-400 uppercase pb-1 border-b border-white/10 flex justify-between">
            <span>LEADERBOARD</span>
            <span>STANDINGS</span>
          </div>

          {/* Sorted racers */}
          <div className="flex flex-col gap-1 text-xs">
            {/* Player entry */}
            <div
              className={`flex items-center justify-between p-1.5 rounded-lg border font-bold ${
                playerPosition === 1
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-white/15 border-white/30 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono-nums text-[11px] w-4 text-center">{playerPosition}</span>
                <span className="truncate max-w-[100px]">YOU</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono-nums">P{playerPosition}</span>
            </div>

            {/* AI Opponents */}
            {aiRacers.map((ai, index) => {
              const aiPosition = index + (index + 1 >= playerPosition ? 2 : 1);
              return (
                <div
                  key={ai.id}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/60 text-zinc-300 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ai.carColor }}
                    />
                    <span className="truncate max-w-[110px]">{ai.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono-nums">
                    {ai.speedMph.toFixed(0)} MPH
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
