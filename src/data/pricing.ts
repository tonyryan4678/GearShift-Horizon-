import { PartPriceInfo } from '../types/career';

export const PERFORMANCE_PART_PRICES: Record<string, Record<string, PartPriceInfo>> = {
  engineStage: {
    stock: { price: 0, requiredRep: 1 },
    street_cam: { price: 4200, requiredRep: 1 },
    race_internals: { price: 14500, requiredRep: 3 },
    v10_swap: { price: 48000, requiredRep: 6 },
  },
  induction: {
    na: { price: 0, requiredRep: 1 },
    supercharger: { price: 9500, requiredRep: 2 },
    single_turbo: { price: 12000, requiredRep: 2 },
    twin_turbo: { price: 28000, requiredRep: 5 },
  },
  tires: {
    street: { price: 0, requiredRep: 1 },
    semislick: { price: 3800, requiredRep: 1 },
    race_slick: { price: 11000, requiredRep: 3 },
    drift_compound: { price: 3200, requiredRep: 1 },
  },
  suspension: {
    stock: { price: 0, requiredRep: 1 },
    sport: { price: 2800, requiredRep: 1 },
    race_coilovers: { price: 8500, requiredRep: 2 },
    drift_stance: { price: 6500, requiredRep: 2 },
  },
  brakes: {
    stock: { price: 0, requiredRep: 1 },
    street_sport: { price: 3200, requiredRep: 1 },
    carbon_ceramic: { price: 16000, requiredRep: 4 },
  },
  transmission: {
    stock_6spd: { price: 0, requiredRep: 1 },
    race_quickshift_7spd: { price: 10500, requiredRep: 3 },
  },
  weightReduction: {
    stock: { price: 0, requiredRep: 1 },
    stage1_street: { price: 2500, requiredRep: 1 },
    stage2_carbon: { price: 7800, requiredRep: 2 },
    stage3_stripped: { price: 18500, requiredRep: 4 },
  },
  nitrous: {
    installed: { price: 5500, requiredRep: 1 },
  },
};

export const VISUAL_PART_PRICES: Record<string, Record<string, PartPriceInfo>> = {
  spoiler: {
    none: { price: 0, requiredRep: 1 },
    ducktail: { price: 1800, requiredRep: 1 },
    gt_wing: { price: 4500, requiredRep: 2 },
    time_attack: { price: 9800, requiredRep: 4 },
  },
  frontSplitter: {
    stock: { price: 0, requiredRep: 1 },
    carbon_lip: { price: 2200, requiredRep: 1 },
    race_canards: { price: 5400, requiredRep: 3 },
  },
  hood: {
    stock: { price: 0, requiredRep: 1 },
    carbon_vented: { price: 3600, requiredRep: 2 },
    cowl_induction: { price: 4200, requiredRep: 2 },
  },
  exhaust: {
    stock: { price: 0, requiredRep: 1 },
    titanium_dual: { price: 3100, requiredRep: 1 },
    quad_burn: { price: 6200, requiredRep: 2 },
    cannon: { price: 3900, requiredRep: 1 },
  },
  windowTint: {
    clear: { price: 0, requiredRep: 1 },
    smoke35: { price: 600, requiredRep: 1 },
    limo5: { price: 1100, requiredRep: 1 },
    chameleon: { price: 2400, requiredRep: 2 },
  },
  underglowColor: {
    none: { price: 0, requiredRep: 1 },
    neon: { price: 2800, requiredRep: 2 },
  },
  paintFinish: {
    gloss: { price: 0, requiredRep: 1 },
    metallic: { price: 1500, requiredRep: 1 },
    matte: { price: 2200, requiredRep: 2 },
    pearlescent: { price: 3800, requiredRep: 3 },
  },
  rimStyle: {
    mesh: { price: 1800, requiredRep: 1 },
    spoke5: { price: 2200, requiredRep: 1 },
    deepdish: { price: 3500, requiredRep: 2 },
    carbon_aero: { price: 6200, requiredRep: 3 },
  },
};

/**
 * Reputation Rank Titles & XP Requirements
 */
export const REP_RANKS = [
  { level: 1, title: 'Street Rookie', xpRequired: 0 },
  { level: 2, title: 'Club Racer', xpRequired: 1000 },
  { level: 3, title: 'Amateur Contender', xpRequired: 2500 },
  { level: 4, title: 'Pro Drifter', xpRequired: 5000 },
  { level: 5, title: 'Apex Competitor', xpRequired: 9000 },
  { level: 6, title: 'Track Specialist', xpRequired: 15000 },
  { level: 7, title: 'Horizon Elite', xpRequired: 24000 },
  { level: 8, title: 'Horizon Legend', xpRequired: 38000 },
];

export function getRepRank(xp: number) {
  let rank = REP_RANKS[0];
  for (const r of REP_RANKS) {
    if (xp >= r.xpRequired) {
      rank = r;
    } else {
      break;
    }
  }
  return rank;
}

export function getNextRepRank(currentLevel: number) {
  return REP_RANKS.find((r) => r.level === currentLevel + 1) || null;
}
