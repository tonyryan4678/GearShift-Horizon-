import * as THREE from 'three';
import { TimeOfDay } from '../types/car';

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SpeedTrapZone {
  id: string;
  name: string;
  position: THREE.Vector3;
  targetSpeeds: [number, number, number]; // 1-star, 2-star, 3-star (mph)
  radius: number;
}

export interface DriftZoneDef {
  id: string;
  name: string;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  radius: number;
  targetScores: [number, number, number];
}

export interface ModShopZone {
  id: string;
  name: string;
  position: THREE.Vector3;
  radius: number;
}

export interface WorldEnvironment {
  sceneGroup: THREE.Group;
  colliders: ColliderBox[];
  speedTraps: SpeedTrapZone[];
  driftZones: DriftZoneDef[];
  modShops: ModShopZone[];
  streetLights: THREE.SpotLight[];
  ambientLight: THREE.AmbientLight;
  sunLight: THREE.DirectionalLight;
  skyMesh: THREE.Mesh;
  setTimeOfDay: (time: TimeOfDay) => void;
  update: (delta: number) => void;
}

export function createCityWorld(scene: THREE.Scene): WorldEnvironment {
  const sceneGroup = new THREE.Group();
  sceneGroup.name = 'CityWorldRoot';
  scene.add(sceneGroup);

  const colliders: ColliderBox[] = [];
  const streetLights: THREE.SpotLight[] = [];

  // --- Lighting Setup ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  sceneGroup.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
  sunLight.position.set(120, 180, 80);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 400;
  const shadowRange = 140;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sceneGroup.add(sunLight);

  // Large Dome Sky
  const skyGeo = new THREE.SphereGeometry(600, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  sceneGroup.add(skyMesh);

  // --- Ground & Terrain ---
  const worldSize = 1000;
  const terrainGeo = new THREE.PlaneGeometry(worldSize, worldSize);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = true;
  sceneGroup.add(terrain);

  // --- Road Network Materials ---
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.75,
    metalness: 0.1,
  });
  const roadStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Yellow center lines
  const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc }); // White lane dividers
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });

  // Helper to build asphalt roads
  const createRoadSegment = (
    centerX: number,
    centerZ: number,
    width: number,
    length: number,
    isVertical: boolean
  ) => {
    const roadGeo = new THREE.PlaneGeometry(width, length);
    roadGeo.rotateX(-Math.PI / 2);
    if (!isVertical) roadGeo.rotateY(Math.PI / 2);

    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(centerX, 0.05, centerZ);
    road.receiveShadow = true;
    sceneGroup.add(road);

    // Curbs on edges
    const curbGeo = new THREE.BoxGeometry(
      isVertical ? 0.4 : length,
      0.15,
      isVertical ? length : 0.4
    );
    const curbL = new THREE.Mesh(curbGeo, curbMat);
    const curbR = new THREE.Mesh(curbGeo, curbMat);
    const halfW = width / 2;
    if (isVertical) {
      curbL.position.set(centerX - halfW, 0.08, centerZ);
      curbR.position.set(centerX + halfW, 0.08, centerZ);
    } else {
      curbL.position.set(centerX, 0.08, centerZ - halfW);
      curbR.position.set(centerX, 0.08, centerZ + halfW);
    }
    sceneGroup.add(curbL, curbR);

    // Center divider dashed line
    const numDashes = Math.floor(length / 10);
    for (let i = 0; i < numDashes; i++) {
      const dashGeo = new THREE.PlaneGeometry(isVertical ? 0.35 : 5, isVertical ? 5 : 0.35);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, roadStripeMat);
      const offset = (i - numDashes / 2) * 10;
      if (isVertical) {
        dash.position.set(centerX, 0.06, centerZ + offset);
      } else {
        dash.position.set(centerX + offset, 0.06, centerZ);
      }
      sceneGroup.add(dash);
    }
  };

  // 1. Central Boulevard (Runs Z from -400 to +400, 24m wide)
  createRoadSegment(0, 0, 24, 800, true);

  // 2. Main Avenue East-West (Runs X from -400 to +400, Z: 0, 24m wide)
  createRoadSegment(0, 0, 24, 800, false);

  // 3. North Highway Ring (Z: 250, width 20m, runs X: -350 to 350)
  createRoadSegment(0, 250, 20, 700, false);

  // 4. South Highway Ring (Z: -250, width 20m, runs X: -350 to 350)
  createRoadSegment(0, -250, 20, 700, false);

  // 5. East Bypass (X: 250, width 20m, runs Z: -350 to 350)
  createRoadSegment(250, 0, 20, 700, true);

  // 6. West Coastal Loop (X: -250, width 20m, runs Z: -350 to 350)
  createRoadSegment(-250, 0, 20, 700, true);

  // 7. Diagonal Drift Track / Harbor Bypass
  const diagGeo = new THREE.PlaneGeometry(20, 320);
  diagGeo.rotateX(-Math.PI / 2);
  diagGeo.rotateY(Math.PI / 4);
  const diagRoad = new THREE.Mesh(diagGeo, asphaltMat);
  diagRoad.position.set(130, 0.05, 130);
  diagRoad.receiveShadow = true;
  sceneGroup.add(diagRoad);

  // --- Street Lamps with Point / Spot Lights ---
  const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const addStreetLamp = (x: number, z: number, rotationY = 0) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0, z);
    lampGroup.rotation.y = rotationY;

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    const pole = new THREE.Mesh(poleGeo, lampPoleMat);
    pole.position.y = 3.75;
    lampGroup.add(pole);

    // Arm
    const armGeo = new THREE.BoxGeometry(2.0, 0.12, 0.12);
    const arm = new THREE.Mesh(armGeo, lampPoleMat);
    arm.position.set(1.0, 7.2, 0);
    lampGroup.add(arm);

    // Light fixture
    const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const bulb = new THREE.Mesh(bulbGeo, lampBulbMat);
    bulb.position.set(1.9, 7.0, 0);
    lampGroup.add(bulb);

    // Spotlight
    const spot = new THREE.SpotLight(0xfef08a, 2.5, 35, Math.PI / 4, 0.5, 1.2);
    spot.position.set(x + Math.cos(rotationY) * 1.9, 7.0, z - Math.sin(rotationY) * 1.9);
    spot.target.position.set(spot.position.x, 0, spot.position.z);
    sceneGroup.add(spot, spot.target);
    streetLights.push(spot);

    sceneGroup.add(lampGroup);

    // Simple collision for pole
    colliders.push({
      minX: x - 0.4,
      maxX: x + 0.4,
      minZ: z - 0.4,
      maxZ: z + 0.4,
    });
  };

  // Place Street Lamps along main roads
  for (let z = -350; z <= 350; z += 70) {
    addStreetLamp(14, z, Math.PI);
    addStreetLamp(-14, z, 0);
  }
  for (let x = -350; x <= 350; x += 70) {
    if (Math.abs(x) > 20) {
      addStreetLamp(x, 14, Math.PI / 2);
      addStreetLamp(x, -14, -Math.PI / 2);
    }
  }

  // --- European Autobahn & Speed Limit Signage ---
  const addEuropeanSign = (x: number, z: number, type: 'autobahn_unlimited' | 'speed_130' | 'speed_100') => {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, 0, z);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.8, 12), poleMat);
    pole.position.set(0, 1.9, 0);
    signGroup.add(pole);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const signPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.04, 24), plateMat);
    signPlate.rotation.x = Math.PI / 2;
    signPlate.position.set(0, 3.2, 0);
    signGroup.add(signPlate);

    if (type === 'autobahn_unlimited') {
      // Iconic German Zeichen 282: 4 diagonal black slash lines across white circle
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      for (let i = -0.15; i <= 0.15; i += 0.1) {
        const slash = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.1, 0.05), lineMat);
        slash.rotation.z = -Math.PI / 4;
        slash.position.set(i * 1.5, 3.2, 0.025);
        signGroup.add(slash);
      }
    } else {
      // European circular speed limit with red border
      const redRingMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
      const redRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 8, 24), redRingMat);
      redRing.position.set(0, 3.2, 0.025);
      signGroup.add(redRing);

      // Black speed number block representation
      const numMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      const numBlock = new THREE.Mesh(new THREE.BoxGeometry(type === 'speed_130' ? 0.45 : 0.35, 0.28, 0.05), numMat);
      numBlock.position.set(0, 3.2, 0.026);
      signGroup.add(numBlock);
    }

    sceneGroup.add(signGroup);
  };

  addEuropeanSign(13.5, 60, 'autobahn_unlimited');
  addEuropeanSign(-13.5, -60, 'autobahn_unlimited');
  addEuropeanSign(13.5, 220, 'speed_130');
  addEuropeanSign(-13.5, -220, 'speed_100');

  // --- Buildings & Urban Skyscrapers ---
  const glassMat1 = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.85,
  });
  const glassMat2 = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.2,
    metalness: 0.75,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.8,
    metalness: 0.1,
  });
  const modernMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.4,
    metalness: 0.2,
  });

  const addBuilding = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    hasNeon = false
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const building = new THREE.Mesh(geo, mat);
    building.position.set(x, h / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    sceneGroup.add(building);

    // Lit windows / decorative accent lines
    if (hasNeon) {
      const edgeGeo = new THREE.BoxGeometry(w * 1.01, 0.8, d * 1.01);
      const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const neonRoof = new THREE.Mesh(edgeGeo, neonMat);
      neonRoof.position.set(x, h - 0.5, z);
      sceneGroup.add(neonRoof);
    }

    // Add collider
    colliders.push({
      minX: x - w / 2 - 0.5,
      maxX: x + w / 2 + 0.5,
      minZ: z - d / 2 - 0.5,
      maxZ: z + d / 2 + 0.5,
    });
  };

  // Downtown Skyscrapers in city blocks
  // North-East Block
  addBuilding(80, 80, 50, 110, 50, glassMat1, true);
  addBuilding(150, 80, 45, 85, 45, glassMat2);
  addBuilding(80, 150, 45, 95, 45, modernMat, true);
  addBuilding(150, 150, 55, 140, 55, glassMat1, true);

  // North-West Block
  addBuilding(-80, 80, 50, 90, 50, modernMat);
  addBuilding(-150, 80, 45, 120, 45, glassMat1, true);
  addBuilding(-80, 150, 55, 75, 55, concreteMat);
  addBuilding(-150, 150, 50, 105, 50, glassMat2, true);

  // South-West Block
  addBuilding(-80, -80, 45, 80, 45, glassMat2);
  addBuilding(-150, -80, 55, 130, 55, glassMat1, true);
  addBuilding(-80, -150, 50, 95, 50, modernMat);
  addBuilding(-150, -150, 45, 70, 45, concreteMat);

  // South-East Block (Around Mod Shop Plaza)
  addBuilding(160, -80, 50, 95, 50, modernMat);
  addBuilding(80, -160, 45, 65, 45, concreteMat);
  addBuilding(160, -160, 55, 115, 55, glassMat1, true);

  // --- APEX CUSTOMS / FORZA MOD SHOP GARAGE BUILDING ---
  // Positioned at X: 75, Z: -75 (Near central boulevard with easy open driveway!)
  const shopX = 75;
  const shopZ = -75;
  const shopWidth = 44;
  const shopHeight = 12;
  const shopDepth = 36;

  const shopGroup = new THREE.Group();
  shopGroup.position.set(shopX, 0, shopZ);

  // Main garage structure
  const shopWallMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.7,
  });
  const shopWall = new THREE.Mesh(new THREE.BoxGeometry(shopWidth, shopHeight, shopDepth), shopWallMat);
  shopWall.position.y = shopHeight / 2;
  shopWall.castShadow = true;
  shopGroup.add(shopWall);

  // Large Open Bay Doors with illuminated glass
  const bayDoorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 1), bayDoorMat);
  bayDoor.position.set(0, 3.5, shopDepth / 2 + 0.5);
  shopGroup.add(bayDoor);

  // Giant Glowing Neon Signboard: "APEX HORIZON MOD SHOP"
  const signBackMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(26, 3.2, 0.8), signBackMat);
  signBack.position.set(0, shopHeight + 1.6, shopDepth / 2 + 0.4);
  shopGroup.add(signBack);

  const neonTextMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const neonBar = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 0.9), neonTextMat);
  neonBar.position.set(0, shopHeight + 2.6, shopDepth / 2 + 0.45);
  shopGroup.add(neonBar);

  const neonBar2 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 0.9), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
  neonBar2.position.set(0, shopHeight + 0.6, shopDepth / 2 + 0.45);
  shopGroup.add(neonBar2);

  // Glowing Garage Entry Pad on Asphalt
  const padGeo = new THREE.PlaneGeometry(16, 14);
  padGeo.rotateX(-Math.PI / 2);
  const padMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
  });
  const entryPad = new THREE.Mesh(padGeo, padMat);
  entryPad.position.set(0, 0.08, shopDepth / 2 + 9);
  shopGroup.add(entryPad);

  // Neon Beacon Light
  const shopLight = new THREE.PointLight(0x38bdf8, 5, 45, 1.2);
  shopLight.position.set(0, 6, shopDepth / 2 + 8);
  shopGroup.add(shopLight);

  sceneGroup.add(shopGroup);

  // Collider for mod shop
  colliders.push({
    minX: shopX - shopWidth / 2,
    maxX: shopX + shopWidth / 2,
    minZ: shopZ - shopDepth / 2,
    maxZ: shopZ + shopDepth / 2,
  });

  // Mod Shop trigger zone
  const modShops: ModShopZone[] = [
    {
      id: 'main_apex_customs',
      name: 'Apex Customs Mod Shop',
      position: new THREE.Vector3(shopX, 0, shopZ + shopDepth / 2 + 8),
      radius: 12,
    },
  ];

  // --- Speed Traps ---
  const createSpeedTrapMesh = (x: number, z: number, name: string) => {
    const gantryGroup = new THREE.Group();
    gantryGroup.position.set(x, 0, z);

    // Gantry structure across road
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 9, 8), gantryMat);
    p1.position.set(-13, 4.5, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 9, 8), gantryMat);
    p2.position.set(13, 4.5, 0);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.8, 0.8), gantryMat);
    bar.position.set(0, 8.5, 0);

    // Speed camera box + radar lens
    const camMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const camBox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), camMat);
    camBox.position.set(0, 7.8, 0);

    const flashLensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), flashLensMat);
    lens.position.set(0, 7.7, 0.8);

    gantryGroup.add(p1, p2, bar, camBox, lens);
    sceneGroup.add(gantryGroup);
  };

  createSpeedTrapMesh(0, 180, 'Boulevard Radar');
  createSpeedTrapMesh(0, -180, 'Downtown Speed Trap');

  const speedTraps: SpeedTrapZone[] = [
    {
      id: 'st_boulevard',
      name: 'North Boulevard Speed Trap',
      position: new THREE.Vector3(0, 0, 180),
      targetSpeeds: [100, 140, 175],
      radius: 14,
    },
    {
      id: 'st_downtown',
      name: 'Downtown Expressway Speed Trap',
      position: new THREE.Vector3(0, 0, -180),
      targetSpeeds: [110, 150, 190],
      radius: 14,
    },
  ];

  // --- Drift Zones ---
  const driftZones: DriftZoneDef[] = [
    {
      id: 'dz_harbor',
      name: 'Harbor S-Bends Drift Zone',
      startPos: new THREE.Vector3(50, 0, 50),
      endPos: new THREE.Vector3(200, 0, 200),
      radius: 28,
      targetScores: [3000, 8000, 18000],
    },
    {
      id: 'dz_ring',
      name: 'North Highway Sweeper',
      startPos: new THREE.Vector3(-150, 0, 250),
      endPos: new THREE.Vector3(150, 0, 250),
      radius: 24,
      targetScores: [4000, 10000, 22000],
    },
  ];

  // Drift zone flags
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const flagGeo = new THREE.ConeGeometry(0.8, 2.5, 4);
  flagGeo.rotateX(Math.PI);
  const flag1 = new THREE.Mesh(flagGeo, flagMat);
  flag1.position.set(50, 3, 50);
  const flag2 = new THREE.Mesh(flagGeo, flagMat);
  flag2.position.set(200, 3, 200);
  sceneGroup.add(flag1, flag2);

  // Time of Day function
  const setTimeOfDay = (time: TimeOfDay) => {
    if (time === 'day') {
      sunLight.intensity = 2.6;
      sunLight.color.setHex(0xfffaed);
      ambientLight.intensity = 1.2;
      ambientLight.color.setHex(0xffffff);
      skyMat.color.setHex(0x60a5fa); // Bright daylight blue
      streetLights.forEach((sl) => (sl.intensity = 0.0));
    } else if (time === 'sunset') {
      sunLight.intensity = 1.8;
      sunLight.color.setHex(0xf97316); // Golden orange
      ambientLight.intensity = 0.9;
      ambientLight.color.setHex(0xfda4af);
      skyMat.color.setHex(0xc2410c); // Sunset crimson orange
      streetLights.forEach((sl) => (sl.intensity = 1.2));
    } else if (time === 'night') {
      sunLight.intensity = 0.15;
      sunLight.color.setHex(0x38bdf8);
      ambientLight.intensity = 0.35;
      ambientLight.color.setHex(0x1e1b4b);
      skyMat.color.setHex(0x030712); // Midnight dark sky
      streetLights.forEach((sl) => (sl.intensity = 3.2));
    }
  };

  setTimeOfDay('day');

  return {
    sceneGroup,
    colliders,
    speedTraps,
    driftZones,
    modShops,
    streetLights,
    ambientLight,
    sunLight,
    skyMesh,
    setTimeOfDay,
    update: () => {
      // Small pulse for entry pad or neon sign
      const time = performance.now() * 0.003;
      padMat.opacity = 0.25 + Math.sin(time) * 0.15;
    },
  };
}
