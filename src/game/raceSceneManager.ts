import * as THREE from 'three';
import { RaceEvent, RaceState, AIOpponent } from '../types/career';
import { VehicleDynamics } from './vehicleDynamics';
import { createCarModel, CarMeshComponents } from './carModel';
import { INITIAL_CARS } from '../data/cars';

export class RaceSceneManager {
  private scene: THREE.Scene;
  private checkpointGroup: THREE.Group;
  private aiCarsGroup: THREE.Group;

  private activeRace: RaceEvent | null = null;
  private aiOpponents: AIOpponent[] = [];
  private aiCarMeshes: Map<string, CarMeshComponents> = new Map();

  private activeCheckpointIndex = 0;
  private currentLap = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.checkpointGroup = new THREE.Group();
    this.checkpointGroup.name = 'RaceCheckpointsRoot';
    this.scene.add(this.checkpointGroup);

    this.aiCarsGroup = new THREE.Group();
    this.aiCarsGroup.name = 'RaceAICarsRoot';
    this.scene.add(this.aiCarsGroup);
  }

  /**
   * Start a race event: Setup grid, spawn checkpoints, spawn AI rivals
   */
  public startRace(race: RaceEvent, playerDynamics: VehicleDynamics): AIOpponent[] {
    this.cleanup();
    this.activeRace = race;
    this.activeCheckpointIndex = 0;
    this.currentLap = 1;

    const startCp = race.checkpoints[0];
    const secondCp = race.checkpoints[1] || race.checkpoints[0];

    // Compute track forward heading
    const forwardX = secondCp.x - startCp.x;
    const forwardZ = secondCp.z - startCp.z;
    const startHeading = Math.atan2(forwardX, forwardZ);

    // Reposition player car at grid pole position
    playerDynamics.position.set(startCp.x - Math.cos(startHeading) * 2.5, 0, startCp.z + Math.sin(startHeading) * 2.5);
    playerDynamics.heading = startHeading;
    playerDynamics.velocity.set(0, 0, 0);
    playerDynamics.currentSteer = 0;
    playerDynamics.currentGear = 1;

    // Spawn 3D Checkpoint Hologram Arches
    this.spawnCheckpointArches(race.checkpoints);

    // Spawn AI Competitors on the starting grid
    this.aiOpponents = [];
    race.aiCompetitors.forEach((comp, idx) => {
      // Stagger AI on the starting grid behind player
      const gridRow = Math.floor((idx + 1) / 2);
      const gridCol = (idx + 1) % 2 === 0 ? 1 : -1;
      const backDist = 6.5 + gridRow * 7.0;
      const sideDist = gridCol * 3.5;

      const spawnX = startCp.x - Math.sin(startHeading) * backDist + Math.cos(startHeading) * sideDist;
      const spawnZ = startCp.z - Math.cos(startHeading) * backDist - Math.sin(startHeading) * sideDist;

      const aiData: AIOpponent = {
        id: `ai_${idx}_${comp.name.replace(/\s+/g, '_')}`,
        name: comp.name,
        carName: comp.carName,
        carColor: comp.carColor,
        driveSkill: comp.skill,
        currentCheckpointIndex: 1,
        currentLap: 1,
        progressAlongSpline: 0,
        distanceTraveled: 0,
        posX: spawnX,
        posZ: spawnZ,
        speedMph: 0,
        heading: startHeading,
        finishedTimeMs: null,
      };
      this.aiOpponents.push(aiData);

      // Create 3D car mesh for AI
      // Pick base template config
      const templateCar = INITIAL_CARS.find((c) => c.name.includes('Silvia')) || INITIAL_CARS[0];
      const aiCarConfig = {
        ...templateCar,
        name: comp.carName,
        visuals: {
          ...templateCar.visuals,
          paintColor: comp.carColor,
          paintFinish: 'metallic' as const,
          spoiler: (idx % 2 === 0 ? 'gt_wing' : 'ducktail') as any,
          rimColor: '#e2e8f0',
        },
      };

      const meshComp = createCarModel(aiCarConfig);
      meshComp.rootGroup.position.set(spawnX, 0, spawnZ);
      meshComp.rootGroup.rotation.y = startHeading;
      this.aiCarsGroup.add(meshComp.rootGroup);
      this.aiCarMeshes.set(aiData.id, meshComp);
    });

    return this.aiOpponents;
  }

  /**
   * Spawn 3D holographic arches and light pillars at checkpoints
   */
  private spawnCheckpointArches(checkpoints: { x: number; z: number; radius: number }[]) {
    checkpoints.forEach((cp, idx) => {
      const archGroup = new THREE.Group();
      archGroup.name = `CheckpointArch_${idx}`;
      archGroup.position.set(cp.x, 0, cp.z);

      // Compute angle pointing towards next checkpoint
      const nextCp = checkpoints[(idx + 1) % checkpoints.length];
      const angle = Math.atan2(nextCp.x - cp.x, nextCp.z - cp.z);
      archGroup.rotation.y = angle;

      const gateWidth = 14;
      const gateHeight = 6.5;

      // Left & Right Pillars (Neon Glowing)
      const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, gateHeight, 12);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xf59e0b : 0x06b6d4,
        transparent: true,
        opacity: 0.85,
      });

      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-gateWidth / 2, gateHeight / 2, 0);
      archGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat.clone());
      rightPillar.position.set(gateWidth / 2, gateHeight / 2, 0);
      archGroup.add(rightPillar);

      // Crossbeam
      const beamGeo = new THREE.BoxGeometry(gateWidth + 0.8, 0.6, 0.6);
      const beamMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xf59e0b : 0x06b6d4,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, gateHeight, 0);
      archGroup.add(beam);

      // Floating Hologram Chevron Arrow
      const arrowGeo = new THREE.ConeGeometry(1.2, 2.2, 4);
      const arrowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(0, gateHeight - 1.2, 0);
      arrow.rotation.x = Math.PI / 2;
      arrow.name = 'ChevronArrow';
      archGroup.add(arrow);

      // Tall Sky Light Beam for Active Waypoint (Visible across city skyline!)
      const skyBeamGeo = new THREE.CylinderGeometry(0.8, 1.8, 120, 16, 1, true);
      const skyBeamMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xf59e0b : 0x38bdf8,
        transparent: true,
        opacity: idx === 0 ? 0.4 : 0.0,
        side: THREE.DoubleSide,
      });
      const skyBeam = new THREE.Mesh(skyBeamGeo, skyBeamMat);
      skyBeam.position.set(0, 60, 0);
      skyBeam.name = 'SkyBeam';
      archGroup.add(skyBeam);

      // Road Glow Strip
      const roadStripGeo = new THREE.PlaneGeometry(gateWidth, 1.5);
      const roadStripMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xf59e0b : 0x06b6d4,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const roadStrip = new THREE.Mesh(roadStripGeo, roadStripMat);
      roadStrip.rotation.x = -Math.PI / 2;
      roadStrip.position.set(0, 0.05, 0);
      archGroup.add(roadStrip);

      this.checkpointGroup.add(archGroup);
    });
  }

  /**
   * Main game loop update: Move AI rivals, animate gates, test checkpoint collisions
   */
  public update(
    dt: number,
    playerDynamics: VehicleDynamics,
    isCountingDown: boolean,
    elapsedMs: number
  ): {
    checkpointPassed: boolean;
    nextCheckpointIndex: number;
    currentLap: number;
    isRaceFinished: boolean;
    playerPosition: number;
    aiOpponents: AIOpponent[];
  } {
    if (!this.activeRace) {
      return {
        checkpointPassed: false,
        nextCheckpointIndex: 0,
        currentLap: 1,
        isRaceFinished: false,
        playerPosition: 1,
        aiOpponents: [],
      };
    }

    const checkpoints = this.activeRace.checkpoints;
    const nowSec = performance.now() * 0.001;

    // 1. Animate Checkpoint Arches
    this.checkpointGroup.children.forEach((arch, idx) => {
      const isCurrent = idx === this.activeCheckpointIndex;
      const isUpcoming = idx === (this.activeCheckpointIndex + 1) % checkpoints.length;

      const skyBeam = arch.getObjectByName('SkyBeam') as THREE.Mesh | null;
      if (skyBeam) {
        (skyBeam.material as THREE.MeshBasicMaterial).opacity = isCurrent
          ? 0.35 + Math.sin(nowSec * 6) * 0.15
          : 0.0;
      }

      const arrow = arch.getObjectByName('ChevronArrow');
      if (arrow) {
        arrow.rotation.z = Math.sin(nowSec * 4) * 0.2;
        arrow.position.y = 5.3 + Math.sin(nowSec * 5) * 0.3;
      }

      // Highlight active arch
      arch.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name !== 'SkyBeam') {
          const mat = child.material as THREE.MeshBasicMaterial;
          if (isCurrent) {
            mat.color.setHex(0xfacc15); // Neon Gold
          } else if (isUpcoming) {
            mat.color.setHex(0x38bdf8); // Cyan
          } else {
            mat.color.setHex(0x334155); // Dim Grey
          }
        }
      });
    });

    // 2. Simulate AI Rival Vehicles
    if (!isCountingDown) {
      this.aiOpponents.forEach((ai) => {
        if (ai.finishedTimeMs !== null) return;

        const targetCp = checkpoints[ai.currentCheckpointIndex];
        const dx = targetCp.x - ai.posX;
        const dz = targetCp.z - ai.posZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Desired heading to checkpoint
        const targetHeading = Math.atan2(dx, dz);

        // Turn smoothly towards target
        let angleDiff = targetHeading - ai.heading;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnSpeed = 3.2 * dt;
        ai.heading += Math.max(-turnSpeed, Math.min(turnSpeed, angleDiff));

        // Speed calculation based on turn angle and skill
        const turnSharpness = Math.abs(angleDiff);
        const maxSpeedMph = (115 + ai.driveSkill * 25) * (turnSharpness > 0.4 ? 0.6 : 1.0);

        if (ai.speedMph < maxSpeedMph) {
          ai.speedMph += (22 + ai.driveSkill * 8) * dt;
        } else {
          ai.speedMph -= 18 * dt;
        }

        const speedMps = ai.speedMph * 0.44704;
        ai.posX += Math.sin(ai.heading) * speedMps * dt;
        ai.posZ += Math.cos(ai.heading) * speedMps * dt;
        ai.distanceTraveled += speedMps * dt;

        // Advance AI checkpoint if reached
        if (dist < 18) {
          ai.currentCheckpointIndex = (ai.currentCheckpointIndex + 1) % checkpoints.length;
          if (ai.currentCheckpointIndex === 0) {
            ai.currentLap++;
            if (ai.currentLap > this.activeRace!.laps) {
              ai.finishedTimeMs = elapsedMs;
            }
          }
        }

        // Update 3D Mesh
        const mesh = this.aiCarMeshes.get(ai.id);
        if (mesh) {
          mesh.rootGroup.position.set(ai.posX, 0, ai.posZ);
          mesh.rootGroup.rotation.y = ai.heading;

          // Rotate wheels
          const wheelSpin = (speedMps / 0.33) * dt;
          mesh.wheels.flTire.rotation.x += wheelSpin;
          mesh.wheels.frTire.rotation.x += wheelSpin;
          mesh.wheels.rlTire.rotation.x += wheelSpin;
          mesh.wheels.rrTire.rotation.x += wheelSpin;

          // Wheel steering angle
          mesh.wheels.fl.rotation.y = Math.max(-0.4, Math.min(0.4, angleDiff));
          mesh.wheels.fr.rotation.y = Math.max(-0.4, Math.min(0.4, angleDiff));
        }
      });
    }

    // 3. Test Player Checkpoint Intersection
    let checkpointPassed = false;
    let isRaceFinished = false;

    if (!isCountingDown) {
      const currentTarget = checkpoints[this.activeCheckpointIndex];
      const playerDist = playerDynamics.position.distanceTo(new THREE.Vector3(currentTarget.x, 0, currentTarget.z));

      if (playerDist < currentTarget.radius) {
        checkpointPassed = true;
        this.activeCheckpointIndex++;

        // Lap or Race Complete check
        if (this.activeCheckpointIndex >= checkpoints.length) {
          this.activeCheckpointIndex = 0;
          this.currentLap++;

          if (this.currentLap > this.activeRace.laps) {
            isRaceFinished = true;
          }
        }
      }
    }

    // 4. Calculate Live Standings / Position (1st, 2nd, 3rd, etc.)
    const playerTarget = checkpoints[this.activeCheckpointIndex];
    const playerDistToNext = playerDynamics.position.distanceTo(new THREE.Vector3(playerTarget.x, 0, playerTarget.z));
    const playerScore =
      (this.currentLap - 1) * checkpoints.length * 1000 +
      this.activeCheckpointIndex * 1000 -
      playerDistToNext;

    let aheadCount = 0;
    this.aiOpponents.forEach((ai) => {
      const aiTarget = checkpoints[ai.currentCheckpointIndex];
      const dx = aiTarget.x - ai.posX;
      const dz = aiTarget.z - ai.posZ;
      const aiDistToNext = Math.sqrt(dx * dx + dz * dz);

      const aiScore =
        (ai.currentLap - 1) * checkpoints.length * 1000 +
        ai.currentCheckpointIndex * 1000 -
        aiDistToNext;

      if (aiScore > playerScore) {
        aheadCount++;
      }
    });

    const playerPosition = aheadCount + 1;

    return {
      checkpointPassed,
      nextCheckpointIndex: this.activeCheckpointIndex,
      currentLap: Math.min(this.activeRace.laps, this.currentLap),
      isRaceFinished,
      playerPosition,
      aiOpponents: this.aiOpponents,
    };
  }

  /**
   * Clean up 3D meshes when race finishes or is abandoned
   */
  public cleanup() {
    this.activeRace = null;
    this.aiOpponents = [];

    // Clear meshes
    while (this.checkpointGroup.children.length > 0) {
      const obj = this.checkpointGroup.children[0];
      this.checkpointGroup.remove(obj);
    }

    while (this.aiCarsGroup.children.length > 0) {
      const obj = this.aiCarsGroup.children[0];
      this.aiCarsGroup.remove(obj);
    }

    this.aiCarMeshes.clear();
  }
}
