import React from 'react';
import { CarTelemetry } from '../game/vehicleDynamics';
import { TrafficBlip } from '../game/trafficManager';
import { RaceEvent } from '../types/career';
import { Wrench, Flag, Navigation } from 'lucide-react';

interface GPSRadarProps {
  telemetry: CarTelemetry;
  trafficBlips: TrafficBlip[];
  nearRaceEvent: RaceEvent | null;
  onOpenModShop: () => void;
}

// World road segments for the GPS radar vector overlay
const RADAR_ROADS = [
  // Central Boulevard (North-South)
  { x1: 0, z1: -400, x2: 0, z2: 400, width: 14, color: '#64748b' },
  // Main Avenue (East-West)
  { x1: -400, z1: 0, x2: 400, z2: 0, width: 14, color: '#64748b' },
  // North Highway
  { x1: -350, z1: 250, x2: 350, z2: 250, width: 10, color: '#475569' },
  // South Highway
  { x1: -350, z1: -250, x2: 350, z2: -250, width: 10, color: '#475569' },
  // East Bypass
  { x1: 250, z1: -350, x2: 250, z2: 350, width: 10, color: '#475569' },
  // West Loop
  { x1: -250, z1: -350, x2: -250, z2: 350, width: 10, color: '#475569' },
  // Diagonal Drift Track
  { x1: 0, z1: 0, x2: 250, z2: 250, width: 8, color: '#3b82f6' },
];

const MOD_SHOP_LOCATION = { x: 18, z: 18 };
const SPEED_CAMERAS = [
  { id: 'sc1', x: 0, z: 120, name: 'Downtown Radar' },
  { id: 'sc2', x: 160, z: 0, name: 'Autobahn Speed Trap' },
  { id: 'sc3', x: -80, z: 250, name: 'Highway Cam' },
];

export const GPSRadar: React.FC<GPSRadarProps> = ({
  telemetry,
  trafficBlips,
  nearRaceEvent,
  onOpenModShop,
}) => {
  const playerPos = telemetry.position || { x: 0, y: 0, z: 0 };
  const heading = telemetry.heading || 0;

  // Radar scale: world units to radar pixels (radar is 176x176, radius 88px, represents ~140m world radius)
  const radarRadius = 88;
  const worldRange = 140;
  const scale = radarRadius / worldRange;

  // Transform world coords (wx, wz) to radar local coords relative to player
  // Radar is oriented UP = Player Heading (Forza Horizon mini-map style)
  const transformToRadar = (wx: number, wz: number) => {
    const dx = wx - playerPos.x;
    const dz = wz - playerPos.z;

    // Rotate by -heading so player forward (+Z) points UP on the radar (-Y in screen space)
    const cosH = Math.cos(-heading);
    const sinH = Math.sin(-heading);

    const rx = dx * cosH - dz * sinH;
    const rz = dx * sinH + dz * cosH;

    // In SVG: center is (88, 88), +X is right, +Z world forward is UP (-Y SVG)
    return {
      x: 88 + rx * scale,
      y: 88 - rz * scale,
      dist: Math.hypot(dx, dz),
    };
  };

  // Calculate distance to Mod Shop
  const distToModShop = Math.round(
    Math.hypot(MOD_SHOP_LOCATION.x - playerPos.x, MOD_SHOP_LOCATION.z - playerPos.z)
  );

  const modShopRadar = transformToRadar(MOD_SHOP_LOCATION.x, MOD_SHOP_LOCATION.z);

  // Clamp radar pins to radar edge if outside
  const clampToRadarEdge = (x: number, y: number) => {
    const dx = x - 88;
    const dy = y - 88;
    const dist = Math.hypot(dx, dy);
    const maxR = 76;
    if (dist <= maxR) return { x, y, isClamped: false };
    const factor = maxR / dist;
    return { x: 88 + dx * factor, y: 88 + dy * factor, isClamped: true };
  };

  const clampedModShop = clampToRadarEdge(modShopRadar.x, modShopRadar.y);

  // Cardinal compass headings relative to car
  const northAngle = -heading * (180 / Math.PI);

  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-3xl bg-zinc-950/90 backdrop-blur-xl border border-white/15 overflow-hidden shadow-2xl flex items-center justify-center pointer-events-auto shrink-0 select-none">
      {/* Mini-map SVG Canvas */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Radar concentric rings */}
        <circle cx="88" cy="88" r="30" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.08" />
        <circle cx="88" cy="88" r="60" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.06" />
        <circle cx="88" cy="88" r="82" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.1" />

        {/* Crosshair guidelines */}
        <line x1="88" y1="6" x2="88" y2="170" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.08" />
        <line x1="6" y1="88" x2="170" y2="88" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.08" />

        {/* Dynamic Road Network lines following player */}
        {RADAR_ROADS.map((road, idx) => {
          const p1 = transformToRadar(road.x1, road.z1);
          const p2 = transformToRadar(road.x2, road.z2);
          return (
            <line
              key={idx}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={road.color}
              strokeWidth={road.width * scale * 1.5}
              strokeLinecap="round"
              opacity="0.8"
            />
          );
        })}

        {/* AI Civilian Traffic Blips (Moving White/Yellow Dots) */}
        {trafficBlips.map((blip, idx) => {
          const pt = transformToRadar(blip.x, blip.z);
          if (pt.dist > worldRange) return null; // Outside radar range
          return (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="2.8"
              fill={blip.type === 'taxi' ? '#facc15' : '#ffffff'}
              opacity="0.9"
            />
          );
        })}

        {/* Speed Camera Radar Traps */}
        {SPEED_CAMERAS.map((cam) => {
          const pt = transformToRadar(cam.x, cam.z);
          if (pt.dist > worldRange) return null;
          return (
            <g key={cam.id} transform={`translate(${pt.x}, ${pt.y})`}>
              <circle r="4" fill="#eab308" opacity="0.3" className="animate-ping" />
              <circle r="2.5" fill="#facc15" />
            </g>
          );
        })}
      </svg>

      {/* Apex Customs Garage Pin */}
      <button
        onClick={onOpenModShop}
        className="absolute z-20 flex items-center justify-center w-5 h-5 bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-lg shadow-sky-500/50 cursor-pointer transition-transform hover:scale-110"
        style={{
          left: `${clampedModShop.x}px`,
          top: `${clampedModShop.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
        title={`Apex Customs Garage (${distToModShop}m)`}
      >
        <Wrench className="w-2.5 h-2.5" />
      </button>

      {/* Player Car Arrow (Center of Radar) */}
      <div className="relative z-30 flex items-center justify-center w-6 h-6">
        <div className="absolute w-8 h-8 rounded-full bg-cyan-500/20 animate-pulse" />
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,1)]" />
      </div>

      {/* Rotating Cardinal Compass (North Badge) */}
      <div
        className="absolute top-2 right-2 text-[9px] font-black font-speedo text-sky-400 bg-black/60 px-1.5 py-0.5 rounded-md border border-white/10"
        style={{ transform: `rotate(${northAngle}deg)` }}
      >
        N
      </div>

      {/* Distance to Mod Shop Badge */}
      <div className="absolute bottom-1.5 left-2 z-20 text-[9px] font-mono-nums font-bold text-zinc-400 bg-black/70 px-1.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
        <Wrench className="w-2.5 h-2.5 text-sky-400" />
        <span>{distToModShop}m</span>
      </div>

      {/* Live Civilian Traffic Count indicator */}
      {trafficBlips.length > 0 && (
        <div className="absolute bottom-1.5 right-2 z-20 text-[9px] font-mono-nums font-bold text-zinc-400 bg-black/70 px-1.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{trafficBlips.length} AI</span>
        </div>
      )}
    </div>
  );
};
