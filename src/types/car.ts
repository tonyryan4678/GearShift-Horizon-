export type DriveType = 'RWD' | 'AWD' | 'FWD';
export type PaintFinish = 'gloss' | 'metallic' | 'matte' | 'pearlescent';
export type TimeOfDay = 'day' | 'sunset' | 'night';
export type WeatherType = 'clear' | 'overcast' | 'rain' | 'fog';
export type TrafficDensity = 'off' | 'low' | 'medium' | 'high';
export type CameraMode = 'chase_far' | 'chase_close' | 'hood' | 'cockpit' | 'free';
export type GraphicsQuality = 'performance' | 'high' | 'ultra';

export interface ShaderSettings {
  bloomEnabled: boolean;
  bloomIntensity: number;
  motionBlurEnabled: boolean;
  motionBlurIntensity: number;
  chromaticAberration: boolean;
  vignetteDarkness: number;
  showFps: boolean;
}

export interface CarStats {
  horsepower: number; // BHP
  torque: number; // Nm
  weightKg: number;
  topSpeedMph: number;
  zeroToSixtySec: number;
  lateralG: number;
  performanceIndex: number; // 100 - 999 (Forza PI: D, C, B, A, S1, S2, X)
  classRating: 'D' | 'C' | 'B' | 'A' | 'S1' | 'S2' | 'X';
}

export interface TuningSettings {
  tirePressurePsi: number; // 24 to 40
  camberDeg: number; // -0.5 to -5.0
  rideHeightMm: number; // -40 to +20
  finalDriveRatio: number; // 2.5 to 4.8 (acceleration vs top speed)
  downforceKg: number; // 50 to 450 kg
  tractionControl: boolean;
  absBrakes: boolean;
  manualTransmission: boolean;
}

export interface VisualParts {
  paintColor: string;
  paintFinish: PaintFinish;
  caliperColor: string;
  rimStyle: 'mesh' | 'spoke5' | 'deepdish' | 'carbon_aero';
  rimColor: string;
  rimSizeInch: number; // 18, 19, 20
  stanceOffset: number; // wheel spacer width
  spoiler: 'none' | 'ducktail' | 'gt_wing' | 'time_attack';
  frontSplitter: 'stock' | 'carbon_lip' | 'race_canards';
  hood: 'stock' | 'carbon_vented' | 'cowl_induction';
  exhaust: 'stock' | 'titanium_dual' | 'quad_burn' | 'cannon';
  windowTint: 'clear' | 'smoke35' | 'limo5' | 'chameleon';
  underglowColor: string | null; // null = off
}

export interface PerformanceParts {
  engineStage: 'stock' | 'street_cam' | 'race_internals' | 'v10_swap';
  induction: 'na' | 'supercharger' | 'single_turbo' | 'twin_turbo';
  tires: 'street' | 'semislick' | 'race_slick' | 'drift_compound';
  suspension: 'stock' | 'sport' | 'race_coilovers' | 'drift_stance';
  brakes: 'stock' | 'street_sport' | 'carbon_ceramic';
  transmission: 'stock_6spd' | 'race_quickshift_7spd';
  weightReduction: 'stock' | 'stage1_street' | 'stage2_carbon' | 'stage3_stripped';
  nitrous: boolean;
}

export interface CarConfig {
  id: string;
  name: string;
  brand: string;
  year: number;
  tagline: string;
  category: 'Modern Sports' | 'Track Toy' | 'Retro Drift' | 'Hypercar';
  baseStats: CarStats;
  driveType: DriveType;
  baseColor: string;
  performance: PerformanceParts;
  visuals: VisualParts;
  tuning: TuningSettings;
  engineSoundProfile: 'flat6_gt' | 'v8_muscle' | 'inline6_turbo' | 'v12_screamer';
  priceCredits: number;
  requiredRepLevel: number;
}

export interface SpeedTrapRecord {
  id: string;
  name: string;
  speedMph: number;
  speedKmh: number;
  stars: number; // 1, 2, 3
  timestamp: number;
}

export interface DriftZoneRecord {
  id: string;
  name: string;
  score: number;
  stars: number;
  timestamp: number;
}
