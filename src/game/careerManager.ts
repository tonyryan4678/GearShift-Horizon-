import { PlayerCareer, RaceEvent } from '../types/career';
import { CarConfig } from '../types/car';
import { getRepRank } from '../data/pricing';

export const INITIAL_CAREER: PlayerCareer = {
  credits: 15000,
  reputation: 0,
  repLevel: 1,
  repTitle: 'Street Rookie',
  ownedCarIds: ['silvia_drift'],
  ownedParts: {
    silvia_drift: [
      'engineStage:street_cam',
      'induction:single_turbo',
      'tires:drift_compound',
      'suspension:drift_stance',
      'brakes:street_sport',
      'nitrous:installed',
      'spoiler:gt_wing',
      'frontSplitter:carbon_lip',
      'hood:carbon_vented',
      'exhaust:cannon',
      'windowTint:limo5',
      'rimStyle:deepdish',
    ],
  },
  completedRaces: {},
  totalRacesWon: 0,
  totalCreditsEarned: 0,
};

export const CAREER_STORAGE_KEY = 'forza_horizon_career_profile_v1';

export function loadCareerProfile(): PlayerCareer {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.credits === 'number') {
        const rank = getRepRank(parsed.reputation || 0);
        return {
          ...INITIAL_CAREER,
          ...parsed,
          repLevel: rank.level,
          repTitle: rank.title,
        };
      }
    }
  } catch {
    // Local storage fallback
  }
  return INITIAL_CAREER;
}

export function saveCareerProfile(career: PlayerCareer) {
  try {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(career));
  } catch {
    // Ignore storage issues
  }
}

export function isPartOwned(
  career: PlayerCareer,
  carId: string,
  category: string,
  value: string
): boolean {
  if (value === 'stock' || value === 'none' || value === 'na' || value === 'clear') {
    return true; // Factory default parts are always free & owned
  }
  const carParts = career.ownedParts[carId] || [];
  const key = `${category}:${value}`;
  return carParts.includes(key);
}

/**
 * Calculate credits & rep rewards based on finishing position
 */
export function calculateRaceRewards(
  race: RaceEvent,
  position: number
): { credits: number; rep: number } {
  if (position === 1) {
    return { credits: race.rewards.first.cr, rep: race.rewards.first.rep };
  } else if (position === 2) {
    return { credits: race.rewards.second.cr, rep: race.rewards.second.rep };
  } else if (position === 3) {
    return { credits: race.rewards.third.cr, rep: race.rewards.third.rep };
  }
  return { credits: race.rewards.participation.cr, rep: race.rewards.participation.rep };
}

/**
 * Record race finish and award career progression
 */
export function recordRaceFinish(
  career: PlayerCareer,
  race: RaceEvent,
  position: number,
  finishTimeMs: number
): {
  updatedCareer: PlayerCareer;
  creditsEarned: number;
  repEarned: number;
  previousRepTotal: number;
  newRepTotal: number;
} {
  const rewards = calculateRaceRewards(race, position);
  const prevRep = career.reputation;
  const newRep = prevRep + rewards.rep;
  const newRank = getRepRank(newRep);

  const existingRecord = career.completedRaces[race.id];
  const updatedRaceRecord = {
    bestPosition: existingRecord ? Math.min(existingRecord.bestPosition, position) : position,
    bestTimeMs: existingRecord
      ? Math.min(existingRecord.bestTimeMs, finishTimeMs)
      : finishTimeMs,
    timesCompleted: (existingRecord?.timesCompleted || 0) + 1,
  };

  const updated: PlayerCareer = {
    ...career,
    credits: career.credits + rewards.credits,
    reputation: newRep,
    repLevel: newRank.level,
    repTitle: newRank.title,
    totalRacesWon: position === 1 ? career.totalRacesWon + 1 : career.totalRacesWon,
    totalCreditsEarned: career.totalCreditsEarned + rewards.credits,
    completedRaces: {
      ...career.completedRaces,
      [race.id]: updatedRaceRecord,
    },
  };

  saveCareerProfile(updated);

  return {
    updatedCareer: updated,
    creditsEarned: rewards.credits,
    repEarned: rewards.rep,
    previousRepTotal: prevRep,
    newRepTotal: newRep,
  };
}

/**
 * Buy a new car from the Autoshow
 */
export function buyCarFromDealership(
  career: PlayerCareer,
  car: CarConfig
): { success: boolean; updatedCareer: PlayerCareer; error?: string } {
  if (career.ownedCarIds.includes(car.id)) {
    return { success: false, updatedCareer: career, error: 'Car already in your garage!' };
  }

  const currentRank = getRepRank(career.reputation);
  if (currentRank.level < car.requiredRepLevel) {
    return {
      success: false,
      updatedCareer: career,
      error: `Requires Reputation Rank ${car.requiredRepLevel} (You are Rank ${currentRank.level})`,
    };
  }

  if (career.credits < car.priceCredits) {
    return {
      success: false,
      updatedCareer: career,
      error: `Insufficient credits! Need $${car.priceCredits.toLocaleString()} CR`,
    };
  }

  const updated: PlayerCareer = {
    ...career,
    credits: career.credits - car.priceCredits,
    ownedCarIds: [...career.ownedCarIds, car.id],
  };

  saveCareerProfile(updated);
  return { success: true, updatedCareer: updated };
}

/**
 * Buy an upgrade part from the Mod Shop
 */
export function buyUpgradePart(
  career: PlayerCareer,
  carId: string,
  category: string,
  value: string,
  price: number,
  requiredRep: number
): { success: boolean; updatedCareer: PlayerCareer; error?: string } {
  if (isPartOwned(career, carId, category, value)) {
    return { success: true, updatedCareer: career };
  }

  const currentRank = getRepRank(career.reputation);
  if (currentRank.level < requiredRep) {
    return {
      success: false,
      updatedCareer: career,
      error: `Locked! Requires Rank ${requiredRep}`,
    };
  }

  if (career.credits < price) {
    return {
      success: false,
      updatedCareer: career,
      error: `Insufficient Credits! Cost: $${price.toLocaleString()} CR`,
    };
  }

  const partKey = `${category}:${value}`;
  const existingParts = career.ownedParts[carId] || [];

  const updated: PlayerCareer = {
    ...career,
    credits: career.credits - price,
    ownedParts: {
      ...career.ownedParts,
      [carId]: [...existingParts, partKey],
    },
  };

  saveCareerProfile(updated);
  return { success: true, updatedCareer: updated };
}
