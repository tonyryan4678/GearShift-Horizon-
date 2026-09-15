import * as THREE from 'three';
import { CarConfig, WeatherType } from '../types/car';
import { calculateCarStats } from '../data/cars';
import { soundEngine } from '../audio/engineAudio';
import { ColliderBox } from './cityWorld';

export interface CarTelemetry {
  speedMph: number;
  speedKmh: number;
  rpm: number;
  gear: number; // -1 = R, 0 = N, 1..7
  gearDisplay: string;
  throttle: number; // 0..1
  brake: number; // 0..1
  handbrake: boolean;
  steerAngle: number; // radians
  slipAngleDeg: number;
  isDrifting: boolean;
  driftPoints: number;
  driftMultiplier: number;
  driftRank: string;
  boostPsi: number;
  boostBar: number; // European boost in BAR
  lateralG: number;
  nitrousActive: boolean;
  nitrousFuel: number; // 0..100
  nearModShop: boolean;
  cruiseControl: boolean;
  absActive: boolean;
  tcsActive: boolean;
  espActive: boolean;
  position: { x: number; y: number; z: number };
  heading: number;
}

export class VehicleDynamics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public heading: number = 0; // Yaw in radians (0 = forward +Z)
  public angularVelocity: number = 0;
  public bodyRoll: number = 0;
  public bodyPitch: number = 0;

  // Steering
  public currentSteer: number = 0;
  public maxSteerAngle: number = 0.58; // ~33 degrees

  // Engine & Drivetrain
  public currentRpm: number = 900;
  public currentGear: number = 1;
  public redlineRpm: number = 8500;
  public idleRpm: number = 850;
  public boostPsi: number = 0;
  public nitrousFuel: number = 100;
  public nitrousActive: boolean = false;

  // European Electronic Aids & Autobahn Cruise
  public cruiseControlActive: boolean = false;
  public targetCruiseSpeedMs: number = 0;
  public absActive: boolean = false;
  public tcsActive: boolean = false;
  public espActive: boolean = false;

  // Drift Scoring
  public isDrifting: boolean = false;
  public currentDriftScore: number = 0;
  public driftMultiplier: number = 1.0;
  public driftComboTimer: number = 0;
  public totalDriftScore: number = 0;
  public lastDriftRank: string = '';

  // Collision
  public colliders: ColliderBox[] = [];

  // Config & Specs
  private config: CarConfig;
  private stats: ReturnType<typeof calculateCarStats>;

  // Input states
  public inputs = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitrous: false,
  };

  constructor(config: CarConfig) {
    this.config = config;
    this.stats = calculateCarStats(config);
    this.reset();
  }

  public updateConfig(newConfig: CarConfig) {
    this.config = newConfig;
    this.stats = calculateCarStats(newConfig);
    if (newConfig.performance.induction === 'twin_turbo') {
      this.redlineRpm = 8800;
    } else if (newConfig.performance.engineStage === 'v10_swap') {
      this.redlineRpm = 9200;
    } else {
      this.redlineRpm = 8400;
    }
  }

  public reset(x = 0, z = -30, heading = 0) {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.heading = heading;
    this.angularVelocity = 0;
    this.currentSteer = 0;
    this.currentRpm = this.idleRpm;
    this.currentGear = 1;
    this.boostPsi = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.isDrifting = false;
    this.currentDriftScore = 0;
    this.driftMultiplier = 1.0;
    this.cruiseControlActive = false;
    this.clearInputs();
  }

  public setInput(
    key: 'forward' | 'backward' | 'left' | 'right' | 'handbrake' | 'nitrous',
    active: boolean
  ) {
    this.inputs[key] = active;
    if (active && (key === 'forward' || key === 'backward') && this.cruiseControlActive) {
      if (key === 'backward') {
        this.cruiseControlActive = false;
      }
    }
  }

  public clearInputs() {
    this.inputs.forward = false;
    this.inputs.backward = false;
    this.inputs.left = false;
    this.inputs.right = false;
    this.inputs.handbrake = false;
    this.inputs.nitrous = false;
    this.cruiseControlActive = false;
  }

  public toggleCruiseControl() {
    if (this.cruiseControlActive) {
      this.cruiseControlActive = false;
    } else {
      const currentSpeed = this.velocity.length();
      if (currentSpeed > 5) {
        this.cruiseControlActive = true;
        this.targetCruiseSpeedMs = currentSpeed;
      }
    }
    return this.cruiseControlActive;
  }

  public toggleAbs() {
    this.config.tuning.absBrakes = !this.config.tuning.absBrakes;
    return this.config.tuning.absBrakes;
  }

  public toggleTcs() {
    this.config.tuning.tractionControl = !this.config.tuning.tractionControl;
    return this.config.tuning.tractionControl;
  }

  public update(dt: number): CarTelemetry {
    // Clamp delta time to avoid large physics steps
    const delta = Math.min(0.05, Math.max(0.001, dt));

    // Calculate speed in m/s and mph
    const speedMs = this.velocity.length();
    const speedMph = speedMs * 2.23694;

    // Determine forward vs reverse motion relative to heading
    const forwardVector = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const rightVector = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    const forwardSpeed = this.velocity.dot(forwardVector);
    const lateralSpeed = this.velocity.dot(rightVector);

    // --- Steering Mechanics with Speed Sensitivity & Drift Stabilization ---
    const steerSpeed = 6.5; // Response speed
    let targetSteer = 0;
    if (this.inputs.left) targetSteer += this.maxSteerAngle;
    if (this.inputs.right) targetSteer -= this.maxSteerAngle;

    // Speed-sensitive steering (less twitchy at high speed)
    const speedDamping = 1.0 / (1.0 + speedMph * 0.015);
    targetSteer *= Math.max(0.45, speedDamping);

    // If drift stance is equipped, allow wider steering lock (drift angle kit!)
    if (this.config.performance.suspension === 'drift_stance') {
      targetSteer *= 1.25;
    }

    this.currentSteer = THREE.MathUtils.damp(this.currentSteer, targetSteer, steerSpeed, delta);

    // --- Throttle, Cruise Control & Nitrous ---
    let throttle = this.inputs.forward ? 1.0 : 0.0;
    const brake = this.inputs.backward ? 1.0 : 0.0;
    const handbrake = this.inputs.handbrake;

    // Autobahn Cruise Control logic
    if (this.cruiseControlActive) {
      if (brake > 0.05 || handbrake) {
        this.cruiseControlActive = false;
      } else if (!this.inputs.forward) {
        if (speedMs < this.targetCruiseSpeedMs - 0.4) {
          throttle = 0.8;
        } else if (speedMs < this.targetCruiseSpeedMs + 0.5) {
          throttle = 0.4;
        } else {
          throttle = 0.05;
        }
      }
    }

    // Traction Control System (TCS) intervention on rear wheel spin
    this.tcsActive = false;
    if (this.config.tuning.tractionControl && throttle > 0.3 && Math.abs(lateralSpeed) > 3.0) {
      throttle *= 0.65;
      this.tcsActive = true;
    }

    this.nitrousActive = this.inputs.nitrous && this.config.performance.nitrous && this.nitrousFuel > 0 && throttle > 0.5;
    if (this.nitrousActive) {
      this.nitrousFuel = Math.max(0, this.nitrousFuel - delta * 15);
      throttle *= 1.35;
    } else if (this.nitrousFuel < 100) {
      this.nitrousFuel = Math.min(100, this.nitrousFuel + delta * 3); // Slow regen
    }

    // --- Transmission & Gear Ratios ---
    const gearRatios = [3.82, 2.36, 1.68, 1.31, 1.08, 0.88, 0.72];
    const finalDrive = this.config.tuning.finalDriveRatio;
    const wheelRadius = 0.35;

    // Automatic Gear Shifting
    if (!this.config.tuning.manualTransmission) {
      if (this.currentGear > 0) {
        if (this.currentRpm > this.redlineRpm * 0.94 && this.currentGear < gearRatios.length) {
          this.currentGear++;
          this.currentRpm *= 0.72;
          soundEngine.triggerGearShift();
        } else if (this.currentRpm < 3200 && this.currentGear > 1) {
          this.currentGear--;
          this.currentRpm *= 1.35;
        }
      }
      // Reverse detection
      if (forwardSpeed < 1.0 && brake > 0.2) {
        this.currentGear = -1;
      } else if (this.currentGear === -1 && throttle > 0.2 && forwardSpeed > -1.0) {
        this.currentGear = 1;
      }
    }

    // Calculate RPM based on wheel speed and current gear
    const currentRatio = this.currentGear === -1 ? 3.5 : (gearRatios[this.currentGear - 1] || 1.0);
    const driveRpm = Math.abs(forwardSpeed) / (wheelRadius * 0.10472) * currentRatio * finalDrive;

    if (throttle > 0.1) {
      this.currentRpm = THREE.MathUtils.damp(this.currentRpm, Math.max(driveRpm, this.idleRpm + throttle * 4000), 8, delta);
    } else {
      this.currentRpm = THREE.MathUtils.damp(this.currentRpm, Math.max(driveRpm, this.idleRpm), 6, delta);
    }
    this.currentRpm = Math.min(this.redlineRpm * 1.05, Math.max(this.idleRpm, this.currentRpm));

    // Boost PSI Calculation
    const hasForcedInduction = this.config.performance.induction !== 'na';
    if (hasForcedInduction) {
      const maxBoost = this.config.performance.induction === 'twin_turbo' ? 24 : this.config.performance.induction === 'single_turbo' ? 18 : 14;
      const targetBoost = throttle * (this.currentRpm / this.redlineRpm) * maxBoost;
      this.boostPsi = THREE.MathUtils.damp(this.boostPsi, targetBoost, 5, delta);
    } else {
      this.boostPsi = 0;
    }

    // --- Driving Forces ---
    // Engine Driving Force (Newtons)
    const basePowerFactor = (this.stats.horsepower * 745.7) / Math.max(3.0, speedMs);
    let driveForce = throttle * Math.min(18000, basePowerFactor * 0.85);

    // Reverse drive force
    if (this.currentGear === -1 && brake > 0.1) {
      driveForce = -brake * 8000;
    }

    // Braking Force
    const brakeForceStrength = this.config.performance.brakes === 'carbon_ceramic' ? 24000 : 18000;
    let brakingForce = 0;
    if (this.currentGear !== -1 && brake > 0.05 && forwardSpeed > 0.5) {
      brakingForce = brake * brakeForceStrength;
    }

    // Aerodynamic Drag Force & Rolling Resistance
    const airDensity = 1.225;
    const cd = 0.32;
    const frontalArea = 2.1;
    const aeroDrag = 0.5 * airDensity * cd * frontalArea * (speedMs * speedMs);
    const rollingResistance = this.stats.weightKg * 9.81 * 0.015;

    // Longitudinal net acceleration
    const netLongitudinalForce = driveForce - Math.sign(forwardSpeed) * (brakingForce + aeroDrag + rollingResistance);
    const longAccel = netLongitudinalForce / this.stats.weightKg;

    // --- Lateral Tire Friction & Drift Slip Physics ---
    // Calculate Slip Angle
    let slipAngleRad = 0;
    if (speedMs > 2.0) {
      slipAngleRad = Math.atan2(lateralSpeed, Math.abs(forwardSpeed));
    }
    const slipAngleDeg = Math.abs(slipAngleRad * (180 / Math.PI));

    // Max cornering grip in Gs
    let corneringGrip = this.stats.lateralG;
    if (handbrake) {
      corneringGrip *= 0.28; // Break rear traction instantly!
    } else if (this.config.performance.tires === 'drift_compound') {
      corneringGrip *= 0.85; // Easy breakaway, smooth slides
    }

    // Lateral Force
    const maxLateralForce = this.stats.weightKg * 9.81 * corneringGrip;
    let lateralForce = -Math.sign(lateralSpeed) * Math.min(maxLateralForce, Math.abs(lateralSpeed) * 12000);

    // Handbrake initiates drift rotation
    if (handbrake && speedMph > 10) {
      this.angularVelocity += (this.currentSteer !== 0 ? Math.sign(this.currentSteer) : 1) * 2.5 * delta;
    }

    // --- Steering & Yaw Dynamics ---
    const wheelbase = 2.65;
    // Bicycle model yaw rate
    const targetYawRate = (forwardSpeed / wheelbase) * Math.tan(this.currentSteer);

    // Oversteer / Drift Dynamics:
    // If slip angle is high or handbrake is on, car oversteers into a drift!
    const isSlipping = slipAngleDeg > 11.0 && speedMph > 14;
    this.isDrifting = isSlipping || (handbrake && speedMph > 12);

    if (this.isDrifting) {
      // Oversteer torque based on throttle and drift angle
      const oversteerTorque = (lateralSpeed / Math.max(1, speedMs)) * (throttle * 1.5 + 0.8);
      // Counter-steering allows stabilization
      const counterSteerEffect = this.currentSteer * 4.5;
      this.angularVelocity = THREE.MathUtils.damp(
        this.angularVelocity,
        targetYawRate + oversteerTorque + counterSteerEffect,
        4.0,
        delta
      );
    } else {
      this.angularVelocity = THREE.MathUtils.damp(this.angularVelocity, targetYawRate, 9.0, delta);
    }

    // Update Heading
    this.heading += this.angularVelocity * delta;

    // Update Velocity Vector
    const newForwardSpeed = forwardSpeed + longAccel * delta;
    const newLateralSpeed = lateralSpeed + (lateralForce / this.stats.weightKg) * delta;

    this.velocity.copy(forwardVector.clone().multiplyScalar(newForwardSpeed))
      .add(rightVector.clone().multiplyScalar(newLateralSpeed));

    // Damping / Friction when stopped
    if (this.inputs.forward === false && this.inputs.backward === false && speedMs < 0.3) {
      this.velocity.set(0, 0, 0);
    }

    // Update Position
    this.position.add(this.velocity.clone().multiplyScalar(delta));

    // --- Body Pitch & Roll Animation Dynamics ---
    const targetPitch = (longAccel / 15.0) * -0.06; // Nose dive on brake, squat on accel
    const targetRoll = ((lateralSpeed * this.angularVelocity) / 18.0) * 0.12; // Lean into corners
    this.bodyPitch = THREE.MathUtils.damp(this.bodyPitch, targetPitch, 8, delta);
    this.bodyRoll = THREE.MathUtils.damp(this.bodyRoll, targetRoll, 8, delta);

    // --- Collision Detection & Resolution against Buildings ---
    this.checkCollisions();

    // --- Drift Scoring Engine (Forza Horizon Style) ---
    if (this.isDrifting && speedMph > 16) {
      const angleScore = Math.min(60, slipAngleDeg);
      const speedScore = Math.min(120, speedMph);
      const pointsThisFrame = Math.round(angleScore * speedScore * 0.12 * delta * 60);

      this.currentDriftScore += pointsThisFrame;
      this.driftComboTimer = 2.0; // 2 seconds before combo ends

      // Dynamic multipliers
      if (this.currentDriftScore > 15000) this.driftMultiplier = 4.0;
      else if (this.currentDriftScore > 8000) this.driftMultiplier = 3.0;
      else if (this.currentDriftScore > 3000) this.driftMultiplier = 2.0;
      else if (this.currentDriftScore > 1000) this.driftMultiplier = 1.5;
      else this.driftMultiplier = 1.0;

      if (this.currentDriftScore > 18000) this.lastDriftRank = 'ULTIMATE DRIFT';
      else if (this.currentDriftScore > 8000) this.lastDriftRank = 'AWESOME DRIFT';
      else if (this.currentDriftScore > 3000) this.lastDriftRank = 'GREAT DRIFT';
      else this.lastDriftRank = 'GOOD DRIFT';
    } else {
      if (this.driftComboTimer > 0) {
        this.driftComboTimer -= delta;
        if (this.driftComboTimer <= 0 && this.currentDriftScore > 0) {
          // Bank the combo!
          this.totalDriftScore += Math.round(this.currentDriftScore * this.driftMultiplier);
          this.currentDriftScore = 0;
          this.driftMultiplier = 1.0;
        }
      }
    }

    // --- Audio Update ---
    soundEngine.update({
      rpm: this.currentRpm,
      maxRpm: this.redlineRpm,
      throttle: Math.max(throttle, this.nitrousActive ? 1.0 : 0.0),
      speedMph,
      isDrifting: this.isDrifting,
      slipRatio: slipAngleDeg / 45,
      hasTurbo: hasForcedInduction,
      soundProfile: this.config.engineSoundProfile,
    });

    // Check proximity to mod shop (X: 75, Z: -50)
    const distToModShop = Math.hypot(this.position.x - 75, this.position.z - (-50));
    const nearModShop = distToModShop < 22;

    const gearDisplay = this.currentGear === -1 ? 'R' : this.currentGear === 0 ? 'N' : `${this.currentGear}`;

    const speedKmh = Math.round(speedMph * 1.60934);
    const boostBar = +(this.boostPsi / 14.5038).toFixed(2);
    this.absActive = this.config.tuning.absBrakes && brake > 0.6 && speedMs > 5.0;
    this.espActive = Math.abs(slipAngleDeg) > 20 && Math.abs(lateralSpeed) > 4.0;

    return {
      speedMph: Math.round(speedMph),
      speedKmh,
      rpm: Math.round(this.currentRpm),
      gear: this.currentGear,
      gearDisplay,
      throttle,
      brake,
      handbrake,
      steerAngle: this.currentSteer,
      slipAngleDeg: Math.round(slipAngleDeg),
      isDrifting: this.isDrifting,
      driftPoints: this.currentDriftScore,
      driftMultiplier: this.driftMultiplier,
      driftRank: this.lastDriftRank,
      boostPsi: +this.boostPsi.toFixed(1),
      boostBar,
      lateralG: +(Math.abs(lateralSpeed * this.angularVelocity) / 9.81).toFixed(2),
      nitrousActive: this.nitrousActive,
      nitrousFuel: Math.round(this.nitrousFuel),
      nearModShop,
      cruiseControl: this.cruiseControlActive,
      absActive: this.absActive,
      tcsActive: this.tcsActive,
      espActive: this.espActive,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      heading: this.heading,
    };
  }

  /**
   * Collision checking against world buildings and boundaries
   */
  private checkCollisions() {
    const carRadius = 1.5;
    for (const box of this.colliders) {
      if (
        this.position.x + carRadius > box.minX &&
        this.position.x - carRadius < box.maxX &&
        this.position.z + carRadius > box.minZ &&
        this.position.z - carRadius < box.maxZ
      ) {
        // Calculate collision penetration depths
        const leftPen = Math.abs((this.position.x + carRadius) - box.minX);
        const rightPen = Math.abs((this.position.x - carRadius) - box.maxX);
        const topPen = Math.abs((this.position.z + carRadius) - box.minZ);
        const bottomPen = Math.abs((this.position.z - carRadius) - box.maxZ);

        const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

        // Push car back out of collider
        if (minPen === leftPen) {
          this.position.x = box.minX - carRadius;
          this.velocity.x *= -0.3;
        } else if (minPen === rightPen) {
          this.position.x = box.maxX + carRadius;
          this.velocity.x *= -0.3;
        } else if (minPen === topPen) {
          this.position.z = box.minZ - carRadius;
          this.velocity.z *= -0.3;
        } else if (minPen === bottomPen) {
          this.position.z = box.maxZ + carRadius;
          this.velocity.z *= -0.3;
        }

        // Drop speed and sound thud / backfire
        this.velocity.multiplyScalar(0.75);
        soundEngine.triggerBackfire();
        break;
      }
    }
  }
}
