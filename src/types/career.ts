export interface PlayerCareer {
  credits: number;
  reputation: number;
  repLevel: number;
  repTitle: string;
  ownedCarIds: string[];
  // Mapping of carId -> set of part keys owned e.g. "engineStage:v10_swap"
  ownedParts: Record<string, string[]>;
  completedRaces: Record<
    string,
    {
      bestPosition: number;
      bestTimeMs: number;
      timesCompleted: number;
    }
  >;
  totalRacesWon: number;
  totalCreditsEarned: number;
}

export interface Checkpoint {
  x: number;
  z: number;
  radius: number;
}

export interface AIOpponent {
  id: string;
  name: string;
  carName: string;
  carColor: string;
  driveSkill: number; // 0.85 to 1.15 multiplier
  currentCheckpointIndex: number;
  currentLap: number;
  progressAlongSpline: number; // 0..1 for ordering
  distanceTraveled: number;
  posX: number;
  posZ: number;
  speedMph: number;
  heading: number;
  finishedTimeMs: number | null;
}

export interface RaceReward {
  cr: number;
  rep: number;
}

export interface RaceEvent {
  id: string;
  title: string;
  subtitle: string;
  tier: 1 | 2 | 3 | 4;
  type: 'circuit' | 'sprint' | 'showdown';
  laps: number;
  requiredRepLevel: number;
  entryFee: number;
  rewards: {
    first: RaceReward;
    second: RaceReward;
    third: RaceReward;
    participation: RaceReward;
  };
  checkpoints: Checkpoint[];
  aiCompetitors: {
    name: string;
    carName: string;
    carColor: string;
    skill: number;
  }[];
  worldMarkerPos: { x: number; z: number };
}

export interface RaceState {
  race: RaceEvent;
  status: 'countdown' | 'racing' | 'finished';
  countdown: number; // 3, 2, 1, 0
  currentLap: number;
  currentCheckpointIndex: number;
  totalCheckpoints: number;
  raceStartTime: number;
  elapsedTimeMs: number;
  playerPosition: number; // 1st, 2nd, etc.
  totalRacers: number;
  aiRacers: AIOpponent[];
  playerFinished: boolean;
  playerFinishTimeMs: number | null;
}

export interface PartPriceInfo {
  price: number;
  requiredRep: number;
}
