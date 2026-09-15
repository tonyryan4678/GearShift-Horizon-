import { CarConfig, CarStats } from '../types/car';

export const INITIAL_CARS: CarConfig[] = [
  {
    id: 'apex_gt',
    name: 'Apex GT4',
    brand: 'VALKYRIE',
    year: 2024,
    tagline: 'Precision engineered mid-engine track weapon with scalpel-sharp handling.',
    category: 'Modern Sports',
    driveType: 'RWD',
    baseColor: '#2563eb', // Guards Blue
    engineSoundProfile: 'flat6_gt',
    baseStats: {
      horsepower: 420,
      torque: 450,
      weightKg: 1390,
      topSpeedMph: 188,
      zeroToSixtySec: 3.7,
      lateralG: 1.15,
      performanceIndex: 785,
      classRating: 'A',
    },
    performance: {
      engineStage: 'stock',
      induction: 'na',
      tires: 'semislick',
      suspension: 'sport',
      brakes: 'street_sport',
      transmission: 'stock_6spd',
      weightReduction: 'stock',
      nitrous: false,
    },
    visuals: {
      paintColor: '#0284c7', // Sky blue
      paintFinish: 'metallic',
      caliperColor: '#eab308', // Yellow
      rimStyle: 'mesh',
      rimColor: '#1e293b', // Gunmetal
      rimSizeInch: 19,
      stanceOffset: 0.05,
      spoiler: 'ducktail',
      frontSplitter: 'stock',
      hood: 'stock',
      exhaust: 'titanium_dual',
      windowTint: 'smoke35',
      underglowColor: null,
    },
    tuning: {
      tirePressurePsi: 30,
      camberDeg: -1.8,
      rideHeightMm: -15,
      finalDriveRatio: 3.44,
      downforceKg: 180,
      tractionControl: true,
      absBrakes: true,
      manualTransmission: false,
    },
    priceCredits: 65000,
    requiredRepLevel: 3,
  },
  {
    id: 'silvia_drift',
    name: 'Silvia S-Spec',
    brand: 'MIDNIGHT RACING',
    year: 2002,
    tagline: 'Legendary turbo-charged drift icon engineered for sustained high-angle slides.',
    category: 'Retro Drift',
    driveType: 'RWD',
    baseColor: '#f97316', // Sunset Orange
    engineSoundProfile: 'inline6_turbo',
    baseStats: {
      horsepower: 310,
      torque: 380,
      weightKg: 1240,
      topSpeedMph: 165,
      zeroToSixtySec: 4.4,
      lateralG: 1.05,
      performanceIndex: 690,
      classRating: 'B',
    },
    performance: {
      engineStage: 'street_cam',
      induction: 'single_turbo',
      tires: 'drift_compound',
      suspension: 'drift_stance',
      brakes: 'street_sport',
      transmission: 'stock_6spd',
      weightReduction: 'stage1_street',
      nitrous: true,
    },
    visuals: {
      paintColor: '#ea580c',
      paintFinish: 'gloss',
      caliperColor: '#ef4444',
      rimStyle: 'deepdish',
      rimColor: '#f8fafc', // White deep dish
      rimSizeInch: 18,
      stanceOffset: 0.12,
      spoiler: 'gt_wing',
      frontSplitter: 'carbon_lip',
      hood: 'carbon_vented',
      exhaust: 'cannon',
      windowTint: 'limo5',
      underglowColor: '#f97316',
    },
    tuning: {
      tirePressurePsi: 36,
      camberDeg: -3.8,
      rideHeightMm: -30,
      finalDriveRatio: 3.90,
      downforceKg: 90,
      tractionControl: false,
      absBrakes: false,
      manualTransmission: true,
    },
    priceCredits: 0, // Starter car
    requiredRepLevel: 1,
  },
  {
    id: 'venom_v8',
    name: 'Venom GTS 650',
    brand: 'APEX MOTORS',
    year: 2023,
    tagline: 'Monstrous naturally aspirated V8 muscle with earth-shattering launch acceleration.',
    category: 'Modern Sports',
    driveType: 'RWD',
    baseColor: '#dc2626', // Crimson
    engineSoundProfile: 'v8_muscle',
    baseStats: {
      horsepower: 650,
      torque: 820,
      weightKg: 1530,
      topSpeedMph: 202,
      zeroToSixtySec: 3.1,
      lateralG: 1.18,
      performanceIndex: 860,
      classRating: 'S1',
    },
    performance: {
      engineStage: 'stock',
      induction: 'supercharger',
      tires: 'semislick',
      suspension: 'sport',
      brakes: 'carbon_ceramic',
      transmission: 'stock_6spd',
      weightReduction: 'stage1_street',
      nitrous: false,
    },
    visuals: {
      paintColor: '#991b1b', // Deep Candy Red
      paintFinish: 'metallic',
      caliperColor: '#f59e0b', // Gold
      rimStyle: 'spoke5',
      rimColor: '#0f172a', // Obsidian
      rimSizeInch: 20,
      stanceOffset: 0.08,
      spoiler: 'ducktail',
      frontSplitter: 'race_canards',
      hood: 'cowl_induction',
      exhaust: 'quad_burn',
      windowTint: 'smoke35',
      underglowColor: '#ef4444',
    },
    tuning: {
      tirePressurePsi: 28,
      camberDeg: -1.5,
      rideHeightMm: -20,
      finalDriveRatio: 3.20,
      downforceKg: 240,
      tractionControl: true,
      absBrakes: true,
      manualTransmission: false,
    },
    priceCredits: 125000,
    requiredRepLevel: 5,
  },
  {
    id: 'hyperion_evo',
    name: 'Hyperion Evo X',
    brand: 'NEXUS AUTOMOTIVE',
    year: 2025,
    tagline: 'Ultimate all-wheel-drive hybrid hypercar pushing the boundaries of physics and aerodynamics.',
    category: 'Hypercar',
    driveType: 'AWD',
    baseColor: '#6366f1', // Electric Purple
    engineSoundProfile: 'v12_screamer',
    baseStats: {
      horsepower: 980,
      torque: 1100,
      weightKg: 1350,
      topSpeedMph: 242,
      zeroToSixtySec: 2.3,
      lateralG: 1.45,
      performanceIndex: 975,
      classRating: 'S2',
    },
    performance: {
      engineStage: 'race_internals',
      induction: 'twin_turbo',
      tires: 'race_slick',
      suspension: 'race_coilovers',
      brakes: 'carbon_ceramic',
      transmission: 'race_quickshift_7spd',
      weightReduction: 'stage2_carbon',
      nitrous: true,
    },
    visuals: {
      paintColor: '#4f46e5',
      paintFinish: 'pearlescent',
      caliperColor: '#06b6d4',
      rimStyle: 'carbon_aero',
      rimColor: '#18181b',
      rimSizeInch: 20,
      stanceOffset: 0.06,
      spoiler: 'time_attack',
      frontSplitter: 'race_canards',
      hood: 'carbon_vented',
      exhaust: 'quad_burn',
      windowTint: 'chameleon',
      underglowColor: '#06b6d4',
    },
    tuning: {
      tirePressurePsi: 29,
      camberDeg: -2.4,
      rideHeightMm: -25,
      finalDriveRatio: 3.05,
      downforceKg: 420,
      tractionControl: true,
      absBrakes: true,
      manualTransmission: false,
    },
    priceCredits: 450000,
    requiredRepLevel: 8,
  },
];

/**
 * Calculates dynamic updated stats based on installed performance parts & tuning
 */
export function calculateCarStats(car: CarConfig): CarStats {
  const base = car.baseStats;
  let hp = base.horsepower;
  let tq = base.torque;
  let weight = base.weightKg;
  let lateralG = base.lateralG;
  let topSpeed = base.topSpeedMph;
  let zeroToSixty = base.zeroToSixtySec;

  // Engine Stage
  if (car.performance.engineStage === 'street_cam') {
    hp += 45;
    tq += 40;
  } else if (car.performance.engineStage === 'race_internals') {
    hp += 120;
    tq += 110;
  } else if (car.performance.engineStage === 'v10_swap') {
    hp += 280;
    tq += 260;
    weight += 40;
  }

  // Forced Induction
  if (car.performance.induction === 'supercharger') {
    hp += 110;
    tq += 140;
  } else if (car.performance.induction === 'single_turbo') {
    hp += 135;
    tq += 120;
  } else if (car.performance.induction === 'twin_turbo') {
    hp += 220;
    tq += 210;
  }

  // Weight reduction
  if (car.performance.weightReduction === 'stage1_street') {
    weight -= 60;
  } else if (car.performance.weightReduction === 'stage2_carbon') {
    weight -= 140;
  } else if (car.performance.weightReduction === 'stage3_stripped') {
    weight -= 230;
  }

  // Tires & Suspension
  if (car.performance.tires === 'semislick') {
    lateralG += 0.12;
  } else if (car.performance.tires === 'race_slick') {
    lateralG += 0.28;
  } else if (car.performance.tires === 'drift_compound') {
    lateralG -= 0.05; // Easier to slip & hold high angles
  }

  if (car.performance.suspension === 'sport') {
    lateralG += 0.05;
  } else if (car.performance.suspension === 'race_coilovers') {
    lateralG += 0.15;
  } else if (car.performance.suspension === 'drift_stance') {
    lateralG += 0.08;
  }

  // Aero downforce
  if (car.visuals.spoiler === 'ducktail') lateralG += 0.03;
  if (car.visuals.spoiler === 'gt_wing') lateralG += 0.08;
  if (car.visuals.spoiler === 'time_attack') lateralG += 0.14;

  // Transmission
  if (car.performance.transmission === 'race_quickshift_7spd') {
    zeroToSixty -= 0.25;
  }

  // Nitrous
  if (car.performance.nitrous) {
    hp += 75;
  }

  // Calculate 0-60 and Top Speed based on power-to-weight ratio
  const powerToWeight = hp / (weight / 1000); // HP per ton
  zeroToSixty = Math.max(1.8, +(base.zeroToSixtySec * (base.horsepower / (base.weightKg / 1000) / powerToWeight) * 0.95).toFixed(2));
  
  // Tuning final drive adjustment
  const speedScale = 3.5 / car.tuning.finalDriveRatio;
  topSpeed = Math.round((base.topSpeedMph + Math.sqrt(hp - base.horsepower) * 2.8) * speedScale);

  // Forza PI Rating calculation (D100 to X999)
  const piRaw = Math.round(
    250 +
    (powerToWeight * 0.9) +
    (lateralG * 180) +
    (topSpeed * 0.6) -
    (zeroToSixty * 35)
  );
  const performanceIndex = Math.min(999, Math.max(200, piRaw));

  let classRating: CarStats['classRating'] = 'C';
  if (performanceIndex < 500) classRating = 'D';
  else if (performanceIndex < 600) classRating = 'C';
  else if (performanceIndex < 700) classRating = 'B';
  else if (performanceIndex < 800) classRating = 'A';
  else if (performanceIndex < 900) classRating = 'S1';
  else if (performanceIndex < 998) classRating = 'S2';
  else classRating = 'X';

  return {
    horsepower: Math.round(hp),
    torque: Math.round(tq),
    weightKg: Math.round(weight),
    topSpeedMph: Math.round(topSpeed),
    zeroToSixtySec: Math.max(1.8, zeroToSixty),
    lateralG: +lateralG.toFixed(2),
    performanceIndex,
    classRating,
  };
}
