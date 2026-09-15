import * as THREE from 'three';
import { TrafficDensity, TimeOfDay, WeatherType } from '../types/car';
import { soundEngine } from '../audio/engineAudio';

export interface TrafficBlip {
  x: number;
  z: number;
  heading: number;
  type: 'hatchback' | 'sedan' | 'van' | 'taxi' | 'wagon';
}

interface LaneRoute {
  id: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  heading: number;
  speedLimit: number; // m/s
}

interface CivilianVehicle {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: THREE.Mesh[];
  taillightMat: THREE.MeshStandardMaterial;
  headlightMat: THREE.MeshStandardMaterial;
  headlightLight?: THREE.SpotLight;
  type: 'hatchback' | 'sedan' | 'van' | 'taxi' | 'wagon';
  position: THREE.Vector3;
  heading: number;
  currentSpeed: number;
  targetSpeed: number;
  route: LaneRoute;
  progress: number; // 0 to 1 along lane
  isBraking: boolean;
  active: boolean;
}

const CITY_ROUTES: LaneRoute[] = [
  // 1. Central Boulevard (North & South)
  { id: 'bvd_south', startX: 4.5, startZ: -380, endX: 4.5, endZ: 380, heading: 0, speedLimit: 14 },
  { id: 'bvd_north', startX: -4.5, startZ: 380, endX: -4.5, endZ: -380, heading: Math.PI, speedLimit: 14 },
  { id: 'bvd_south_outer', startX: 7.5, startZ: -380, endX: 7.5, endZ: 380, heading: 0, speedLimit: 15 },
  { id: 'bvd_north_outer', startX: -7.5, startZ: 380, endX: -7.5, endZ: -380, heading: Math.PI, speedLimit: 15 },

  // 2. Main Avenue (East & West)
  { id: 'ave_east', startX: -380, startZ: 4.5, endX: 380, endZ: 4.5, heading: Math.PI / 2, speedLimit: 14 },
  { id: 'ave_west', startX: 380, startZ: -4.5, endX: -380, endZ: -4.5, heading: -Math.PI / 2, speedLimit: 14 },
  { id: 'ave_east_outer', startX: -380, startZ: 7.5, endX: 380, endZ: 7.5, heading: Math.PI / 2, speedLimit: 15 },
  { id: 'ave_west_outer', startX: 380, startZ: -7.5, endX: -380, endZ: -7.5, heading: -Math.PI / 2, speedLimit: 15 },

  // 3. North Highway Ring (Fast Ring - Z: 250)
  { id: 'hwy_north_east', startX: -340, startZ: 254, endX: 340, endZ: 254, heading: Math.PI / 2, speedLimit: 24 },
  { id: 'hwy_north_west', startX: 340, startZ: 246, endX: -340, endZ: 246, heading: -Math.PI / 2, speedLimit: 24 },

  // 4. South Highway Ring (Fast Ring - Z: -250)
  { id: 'hwy_south_east', startX: -340, startZ: -246, endX: 340, endZ: -246, heading: Math.PI / 2, speedLimit: 24 },
  { id: 'hwy_south_west', startX: 340, startZ: -254, endX: -340, endZ: -254, heading: -Math.PI / 2, speedLimit: 24 },

  // 5. East Bypass (X: 250)
  { id: 'byp_east_south', startX: 254, startZ: -340, endX: 254, endZ: 340, heading: 0, speedLimit: 22 },
  { id: 'byp_east_north', startX: 246, startZ: 340, endX: 246, endZ: -340, heading: Math.PI, speedLimit: 22 },

  // 6. West Coastal Bypass (X: -250)
  { id: 'byp_west_south', startX: -246, startZ: -340, endX: -246, endZ: 340, heading: 0, speedLimit: 22 },
  { id: 'byp_west_north', startX: -254, startZ: 340, endX: -254, endZ: -340, heading: Math.PI, speedLimit: 22 },
];

const TRAFFIC_COLORS = [
  0x94a3b8, // European Silver
  0x1e293b, // Obsidian Slate
  0x0284c7, // French Racing Blue
  0xdc2626, // Crimson Red
  0xf8fafc, // Alpine White
  0x334155, // Charcoal Grey
  0x15803d, // British Racing Green
  0xca8a04, // Metallic Gold
];

export class TrafficManager {
  private scene: THREE.Scene;
  private vehicles: CivilianVehicle[] = [];
  public density: TrafficDensity = 'medium';
  private lastHonkTime = 0;

  constructor(scene: THREE.Scene, initialDensity: TrafficDensity = 'medium') {
    this.scene = scene;
    this.density = initialDensity;
    this.createVehiclePool(24);
    this.applyDensity(this.density);
  }

  private createVehiclePool(count: number) {
    const types: ('hatchback' | 'sedan' | 'van' | 'taxi' | 'wagon')[] = [
      'hatchback',
      'sedan',
      'taxi',
      'wagon',
      'hatchback',
      'van',
      'sedan',
      'wagon',
    ];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const color = type === 'taxi' ? 0xfef08a : TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
      const veh = this.buildCivilianMesh(type, color);

      const route = CITY_ROUTES[i % CITY_ROUTES.length];
      const progress = Math.random();

      veh.route = route;
      veh.progress = progress;
      veh.heading = route.heading;
      veh.group.rotation.y = route.heading;
      veh.targetSpeed = route.speedLimit * (0.85 + Math.random() * 0.25);
      veh.currentSpeed = veh.targetSpeed;

      const posX = route.startX + (route.endX - route.startX) * progress;
      const posZ = route.startZ + (route.endZ - route.startZ) * progress;
      veh.position.set(posX, 0, posZ);
      veh.group.position.copy(veh.position);

      this.scene.add(veh.group);
      this.vehicles.push(veh);
    }
  }

  private buildCivilianMesh(
    type: 'hatchback' | 'sedan' | 'van' | 'taxi' | 'wagon',
    paintColor: number
  ): CivilianVehicle {
    const group = new THREE.Group();
    group.name = `TrafficCar_${type}`;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: paintColor,
      roughness: 0.35,
      metalness: 0.6,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.3,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
    });

    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });

    let bodyMesh: THREE.Mesh;
    const wheels: THREE.Mesh[] = [];

    if (type === 'hatchback') {
      // Compact Euro hatchback
      const bodyGeo = new THREE.BoxGeometry(1.72, 0.45, 3.6);
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.44;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const cabinGeo = new THREE.BoxGeometry(1.45, 0.48, 1.8);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 0.85, -0.2);
      cabin.castShadow = true;
      group.add(cabin);
    } else if (type === 'van') {
      // European delivery van
      const bodyGeo = new THREE.BoxGeometry(1.9, 0.95, 4.4);
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.72;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const windGeo = new THREE.BoxGeometry(1.75, 0.4, 0.8);
      const wind = new THREE.Mesh(windGeo, glassMat);
      wind.position.set(0, 0.95, 1.3);
      group.add(wind);
    } else if (type === 'taxi') {
      // Euro Ivory City Taxi with roof sign
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.46, 4.2);
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.45;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const cabinGeo = new THREE.BoxGeometry(1.5, 0.46, 2.0);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 0.86, -0.2);
      group.add(cabin);

      // Roof Taxi Sign
      const signGeo = new THREE.BoxGeometry(0.5, 0.12, 0.18);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 1.15, -0.2);
      group.add(sign);
    } else {
      // Sedan / Station Wagon
      const isWagon = type === 'wagon';
      const bodyGeo = new THREE.BoxGeometry(1.82, 0.46, 4.3);
      bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.45;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const cabinGeo = new THREE.BoxGeometry(1.5, 0.46, isWagon ? 2.5 : 2.0);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 0.86, isWagon ? -0.4 : -0.2);
      cabin.castShadow = true;
      group.add(cabin);
    }

    // Headlights (Front is +Z)
    const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
    const hlL = new THREE.Mesh(hlGeo, headlightMat);
    hlL.position.set(0.62, 0.48, 1.9);
    const hlR = new THREE.Mesh(hlGeo, headlightMat);
    hlR.position.set(-0.62, 0.48, 1.9);
    group.add(hlL, hlR);

    // Taillights (Rear is -Z)
    const tlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
    const tlL = new THREE.Mesh(tlGeo, taillightMat);
    tlL.position.set(0.62, 0.48, -1.9);
    const tlR = new THREE.Mesh(tlGeo, taillightMat);
    tlR.position.set(-0.62, 0.48, -1.9);
    group.add(tlL, tlR);

    // Front/Rear Bumpers & Grille
    const bumperGeo = new THREE.BoxGeometry(1.78, 0.18, 0.15);
    const fBumper = new THREE.Mesh(bumperGeo, trimMat);
    fBumper.position.set(0, 0.28, 1.95);
    const rBumper = new THREE.Mesh(bumperGeo, trimMat);
    rBumper.position.set(0, 0.28, -1.95);
    group.add(fBumper, rBumper);

    // 4 Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

    const createWheel = (x: number, z: number) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, 0.32, z);

      const tireGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;

      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.25, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);

      wheelGroup.add(tire, rim);
      group.add(wheelGroup);
      wheels.push(tire);
    };

    createWheel(0.86, 1.25);
    createWheel(-0.86, 1.25);
    createWheel(0.86, -1.25);
    createWheel(-0.86, -1.25);

    return {
      group,
      bodyMesh,
      wheels,
      taillightMat,
      headlightMat,
      type,
      position: new THREE.Vector3(),
      heading: 0,
      currentSpeed: 15,
      targetSpeed: 15,
      route: CITY_ROUTES[0],
      progress: 0,
      isBraking: false,
      active: true,
    };
  }

  public applyDensity(density: TrafficDensity) {
    this.density = density;
    const activeCount =
      density === 'off' ? 0 : density === 'low' ? 8 : density === 'medium' ? 16 : 24;

    this.vehicles.forEach((veh, idx) => {
      veh.active = idx < activeCount;
      veh.group.visible = veh.active;
    });
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    timeOfDay: TimeOfDay,
    weather: WeatherType
  ) {
    if (this.density === 'off') return;

    const isNightOrDark = timeOfDay === 'night' || timeOfDay === 'sunset' || weather === 'rain' || weather === 'fog';

    for (let i = 0; i < this.vehicles.length; i++) {
      const veh = this.vehicles[i];
      if (!veh.active) continue;

      // Adjust headlights brightness for time of day / rain / fog
      if (isNightOrDark) {
        veh.headlightMat.emissiveIntensity = 2.4;
      } else {
        veh.headlightMat.emissiveIntensity = 0.5;
      }

      // Check distance to player
      const distToPlayer = veh.position.distanceTo(playerPos);

      // Despawn & Recycle if too far from player (> 280m)
      if (distToPlayer > 280) {
        this.recycleVehicleAhead(veh, playerPos);
        continue;
      }

      // Forward sensor: Check for player or other civilian vehicle ahead in lane
      let shouldBrake = false;
      const fwdX = Math.sin(veh.heading);
      const fwdZ = Math.cos(veh.heading);

      // 1. Check proximity to player
      const toPlayer = new THREE.Vector3().subVectors(playerPos, veh.position);
      const forwardDistToPlayer = toPlayer.x * fwdX + toPlayer.z * fwdZ;
      const lateralDistToPlayer = Math.abs(-toPlayer.x * fwdZ + toPlayer.z * fwdX);

      if (forwardDistToPlayer > 0 && forwardDistToPlayer < 14 && lateralDistToPlayer < 3.2) {
        shouldBrake = true;
      }

      // Collision with player car
      if (distToPlayer < 3.4) {
        // Soft pushback & European horn honk!
        const now = performance.now();
        if (now - this.lastHonkTime > 3500) {
          this.lastHonkTime = now;
          soundEngine.triggerHorn();
        }
        veh.currentSpeed = Math.max(0, veh.currentSpeed - dt * 25);
        shouldBrake = true;
      }

      // 2. Check proximity to other civilian traffic ahead in same route
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (!other.active) continue;

        if (other.route.id === veh.route.id) {
          const diffProg = other.progress - veh.progress;
          if (diffProg > 0 && diffProg < 0.04) {
            shouldBrake = true;
            break;
          }
        }
      }

      veh.isBraking = shouldBrake;

      // Smooth braking & acceleration physics
      if (shouldBrake) {
        veh.currentSpeed = Math.max(0, veh.currentSpeed - dt * 18);
        veh.taillightMat.emissiveIntensity = 3.6; // Bright red brake lights!
      } else {
        veh.currentSpeed = THREE.MathUtils.damp(veh.currentSpeed, veh.targetSpeed, 3, dt);
        veh.taillightMat.emissiveIntensity = isNightOrDark ? 1.0 : 0.4;
      }

      // Advance along route
      const routeLength = Math.hypot(
        veh.route.endX - veh.route.startX,
        veh.route.endZ - veh.route.startZ
      );
      const progressDelta = (veh.currentSpeed * dt) / Math.max(1, routeLength);
      veh.progress += progressDelta;

      if (veh.progress >= 1.0) {
        veh.progress = 0.0; // Loop or switch lane
      }

      // Update position
      const newX = veh.route.startX + (veh.route.endX - veh.route.startX) * veh.progress;
      const newZ = veh.route.startZ + (veh.route.endZ - veh.route.startZ) * veh.progress;
      veh.position.set(newX, 0, newZ);
      veh.group.position.copy(veh.position);

      // Rotate wheels with speed
      const wheelSpin = (veh.currentSpeed / 0.32) * dt;
      veh.wheels.forEach((w) => (w.rotation.x += wheelSpin));
    }
  }

  private recycleVehicleAhead(veh: CivilianVehicle, playerPos: THREE.Vector3) {
    // Pick a random route near player
    const nearbyRoutes = CITY_ROUTES.filter((r) => {
      const midX = (r.startX + r.endX) / 2;
      const midZ = (r.startZ + r.endZ) / 2;
      return Math.hypot(midX - playerPos.x, midZ - playerPos.z) < 220;
    });

    const route = nearbyRoutes.length > 0
      ? nearbyRoutes[Math.floor(Math.random() * nearbyRoutes.length)]
      : CITY_ROUTES[Math.floor(Math.random() * CITY_ROUTES.length)];

    veh.route = route;
    veh.progress = 0.1 + Math.random() * 0.8;
    veh.heading = route.heading;
    veh.group.rotation.y = route.heading;
    veh.targetSpeed = route.speedLimit * (0.85 + Math.random() * 0.25);
    veh.currentSpeed = veh.targetSpeed;

    const posX = route.startX + (route.endX - route.startX) * veh.progress;
    const posZ = route.startZ + (route.endZ - route.startZ) * veh.progress;
    veh.position.set(posX, 0, posZ);
    veh.group.position.copy(veh.position);
  }

  /**
   * Returns active traffic coordinates for the live GPS Radar
   */
  public getTrafficBlips(): TrafficBlip[] {
    if (this.density === 'off') return [];
    const blips: TrafficBlip[] = [];
    for (const veh of this.vehicles) {
      if (veh.active) {
        blips.push({
          x: veh.position.x,
          z: veh.position.z,
          heading: veh.heading,
          type: veh.type,
        });
      }
    }
    return blips;
  }
}
