import * as THREE from 'three';
import { CarConfig, PaintFinish } from '../types/car';

export interface CarMeshComponents {
  rootGroup: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyMaterials: (THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial)[];
  cabinMesh: THREE.Mesh;
  windowMaterial: THREE.MeshPhysicalMaterial;
  caliperMaterials: THREE.MeshStandardMaterial[];
  rimMeshes: THREE.Group[];
  rimMaterials: THREE.MeshStandardMaterial[];
  wheels: {
    fl: THREE.Group;
    fr: THREE.Group;
    rl: THREE.Group;
    rr: THREE.Group;
    flTire: THREE.Mesh;
    frTire: THREE.Mesh;
    rlTire: THREE.Mesh;
    rrTire: THREE.Mesh;
  };
  headlights: THREE.Mesh;
  headlightBeams: THREE.SpotLight[];
  taillights: THREE.Mesh;
  taillightMaterial: THREE.MeshStandardMaterial;
  reverseLights: THREE.Mesh;
  spoilerGroup: THREE.Group;
  splitterGroup: THREE.Group;
  hoodGroup: THREE.Group;
  exhaustGroup: THREE.Group;
  underglowLight: THREE.PointLight | null;
  underglowMesh: THREE.Mesh | null;
  backfireFlames: THREE.Mesh[];
  backfireLight: THREE.PointLight;
}

export function createCarModel(config: CarConfig): CarMeshComponents {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'CarRoot_' + config.id;

  // --- Materials ---
  const bodyMat = createPaintMaterial(config.visuals.paintColor, config.visuals.paintFinish);
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    metalness: 0.3,
  });
  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.2,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.1,
    metalness: 0.95,
  });

  // Window Tint Material
  const tintOpacity = config.visuals.windowTint === 'clear' ? 0.35 : config.visuals.windowTint === 'smoke35' ? 0.65 : config.visuals.windowTint === 'limo5' ? 0.92 : 0.78;
  const tintColor = config.visuals.windowTint === 'chameleon' ? 0x22d3ee : 0x09090b;
  const windowMaterial = new THREE.MeshPhysicalMaterial({
    color: tintColor,
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: tintOpacity,
    reflectivity: 0.95,
  });

  const caliperColor = new THREE.Color(config.visuals.caliperColor);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: caliperColor,
    roughness: 0.3,
    metalness: 0.7,
  });

  const rimColor = new THREE.Color(config.visuals.rimColor);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.25,
    metalness: 0.85,
  });

  // --- Chassis & Main Body ---
  const carBodyGroup = new THREE.Group();
  carBodyGroup.name = 'ChassisBody';

  // Base lower hull (streamlined sports car silhouette)
  const hullGeo = new THREE.BoxGeometry(1.9, 0.45, 4.4);
  const hull = new THREE.Mesh(hullGeo, bodyMat);
  hull.position.y = 0.48;
  hull.castShadow = true;
  hull.receiveShadow = true;
  carBodyGroup.add(hull);

  // Front Hood wedge
  const hoodGeo = new THREE.BoxGeometry(1.82, 0.28, 1.5);
  const hood = new THREE.Mesh(hoodGeo, bodyMat);
  hood.position.set(0, 0.58, 1.25);
  hood.rotation.x = 0.08;
  hood.castShadow = true;
  carBodyGroup.add(hood);

  // Front nose bumper
  const noseGeo = new THREE.BoxGeometry(1.88, 0.38, 0.45);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.position.set(0, 0.42, 2.15);
  nose.castShadow = true;
  carBodyGroup.add(nose);

  // Front grille intake
  const grilleGeo = new THREE.BoxGeometry(1.4, 0.2, 0.05);
  const grille = new THREE.Mesh(grilleGeo, blackTrimMat);
  grille.position.set(0, 0.36, 2.38);
  carBodyGroup.add(grille);

  // Cabin / Glass Greenhouse
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.48, 2.1);
  const cabin = new THREE.Mesh(cabinGeo, windowMaterial);
  cabin.position.set(0, 0.92, -0.2);
  cabin.castShadow = true;
  carBodyGroup.add(cabin);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(1.42, 0.05, 1.6);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.16, -0.22);
  roof.castShadow = true;
  carBodyGroup.add(roof);

  // Rear deck / Trunk
  const rearDeckGeo = new THREE.BoxGeometry(1.8, 0.35, 1.2);
  const rearDeck = new THREE.Mesh(rearDeckGeo, bodyMat);
  rearDeck.position.set(0, 0.62, -1.55);
  rearDeck.rotation.x = -0.05;
  rearDeck.castShadow = true;
  carBodyGroup.add(rearDeck);

  // Rear Diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.82, 0.24, 0.4);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuser.position.set(0, 0.32, -2.18);
  diffuser.rotation.x = 0.15;
  diffuser.castShadow = true;
  carBodyGroup.add(diffuser);

  // Side mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.14);
  const mirrorL = new THREE.Mesh(mirrorGeo, carbonMat);
  mirrorL.position.set(0.98, 0.85, 0.6);
  const mirrorR = mirrorL.clone();
  mirrorR.position.set(-0.98, 0.85, 0.6);
  carBodyGroup.add(mirrorL, mirrorR);

  // --- Headlights ---
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xffffff,
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });
  const headlightGeo = new THREE.BoxGeometry(0.42, 0.12, 0.1);
  const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
  headlightL.position.set(0.65, 0.55, 2.36);
  headlightL.rotation.y = -0.15;
  const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
  headlightR.position.set(-0.65, 0.55, 2.36);
  headlightR.rotation.y = 0.15;

  const headlightsGroup = new THREE.Group();
  headlightsGroup.add(headlightL, headlightR);
  carBodyGroup.add(headlightsGroup);

  // Headlight Spotlights for night illumination
  const spotL = new THREE.SpotLight(0xffffff, 4.0, 75, Math.PI / 6, 0.3, 1.2);
  spotL.position.set(0.65, 0.55, 2.36);
  spotL.target.position.set(0.65, 0, 30);
  const spotR = new THREE.SpotLight(0xffffff, 4.0, 75, Math.PI / 6, 0.3, 1.2);
  spotR.position.set(-0.65, 0.55, 2.36);
  spotR.target.position.set(-0.65, 0, 30);
  spotL.castShadow = false;
  spotR.castShadow = false;
  carBodyGroup.add(spotL, spotL.target, spotR, spotR.target);

  // --- Taillights & Brake glow ---
  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.0,
    roughness: 0.2,
  });
  const taillightGeo = new THREE.BoxGeometry(1.65, 0.12, 0.08);
  const taillightBar = new THREE.Mesh(taillightGeo, taillightMaterial);
  taillightBar.position.set(0, 0.62, -2.22);
  carBodyGroup.add(taillightBar);

  // Reverse light
  const reverseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    roughness: 0.2,
  });
  const reverseGeo = new THREE.BoxGeometry(0.3, 0.08, 0.04);
  const reverseLight = new THREE.Mesh(reverseGeo, reverseMat);
  reverseLight.position.set(0, 0.45, -2.22);
  carBodyGroup.add(reverseLight);

  // --- European Union Long License Plate ---
  const euPlateGroup = new THREE.Group();
  const plateHolderMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const plateHolder = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.02), plateHolderMat);
  plateHolder.position.set(0, 0.36, -2.23);

  const plateWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const plateWhite = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.11, 0.022), plateWhiteMat);
  plateWhite.position.set(0, 0.36, -2.232);

  // Blue EU band on left edge
  const euBlueMat = new THREE.MeshBasicMaterial({ color: 0x003399 });
  const euBlueBand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.024), euBlueMat);
  euBlueBand.position.set(-0.23, 0.36, -2.233);

  // EU Star ring dot
  const euStarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const euStar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.026), euStarMat);
  euStar.position.set(-0.23, 0.38, -2.234);

  // Black plate letters
  const plateTextMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const plateChar1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.025), plateTextMat);
  plateChar1.position.set(-0.08, 0.36, -2.234);
  const plateChar2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.025), plateTextMat);
  plateChar2.position.set(0.1, 0.36, -2.234);

  euPlateGroup.add(plateHolder, plateWhite, euBlueBand, euStar, plateChar1, plateChar2);
  carBodyGroup.add(euPlateGroup);

  // --- Customizable Mod Shop Parts Groups ---
  const spoilerGroup = new THREE.Group();
  spoilerGroup.name = 'SpoilerGroup';
  buildSpoiler(spoilerGroup, config.visuals.spoiler, bodyMat, carbonMat);
  carBodyGroup.add(spoilerGroup);

  const splitterGroup = new THREE.Group();
  splitterGroup.name = 'SplitterGroup';
  buildSplitter(splitterGroup, config.visuals.frontSplitter, carbonMat);
  carBodyGroup.add(splitterGroup);

  const hoodGroup = new THREE.Group();
  hoodGroup.name = 'HoodGroup';
  buildHoodVents(hoodGroup, config.visuals.hood, carbonMat);
  carBodyGroup.add(hoodGroup);

  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'ExhaustGroup';
  buildExhaust(exhaustGroup, config.visuals.exhaust, chromeMat);
  carBodyGroup.add(exhaustGroup);

  // Backfire flames (hidden by default)
  const backfireFlames: THREE.Mesh[] = [];
  const flameGeo = new THREE.ConeGeometry(0.09, 0.5, 8);
  flameGeo.rotateX(-Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Hot blue-orange flame
    transparent: true,
    opacity: 0.0,
  });
  const flameL = new THREE.Mesh(flameGeo, flameMat);
  flameL.position.set(0.35, 0.28, -2.5);
  const flameR = new THREE.Mesh(flameGeo, flameMat.clone());
  flameR.position.set(-0.35, 0.28, -2.5);
  carBodyGroup.add(flameL, flameR);
  backfireFlames.push(flameL, flameR);

  const backfireLight = new THREE.PointLight(0x0284c7, 0, 4);
  backfireLight.position.set(0, 0.3, -2.4);
  carBodyGroup.add(backfireLight);

  // --- Neon Underglow ---
  let underglowLight: THREE.PointLight | null = null;
  let underglowMesh: THREE.Mesh | null = null;
  if (config.visuals.underglowColor) {
    const underglowColor = new THREE.Color(config.visuals.underglowColor);
    underglowLight = new THREE.PointLight(underglowColor, 3.5, 5.5, 1.5);
    underglowLight.position.set(0, 0.15, 0);
    carBodyGroup.add(underglowLight);

    const glowBarGeo = new THREE.PlaneGeometry(1.6, 3.4);
    glowBarGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: underglowColor,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    underglowMesh = new THREE.Mesh(glowBarGeo, glowMat);
    underglowMesh.position.set(0, 0.05, 0);
    carBodyGroup.add(underglowMesh);
  }

  rootGroup.add(carBodyGroup);

  // --- 4 Wheels (Front-Left, Front-Right, Rear-Left, Rear-Right) ---
  const wheelBaseX = 0.94 + config.visuals.stanceOffset;
  const wheelBaseZ_Front = 1.35;
  const wheelBaseZ_Rear = -1.35;
  const wheelRadius = 0.35 * (config.visuals.rimSizeInch / 19);

  const rimMeshes: THREE.Group[] = [];
  const caliperMaterials: THREE.MeshStandardMaterial[] = [caliperMat];
  const rimMaterials: THREE.MeshStandardMaterial[] = [rimMat];

  const createSingleWheel = (isLeft: boolean, isFront: boolean) => {
    const wheelGroup = new THREE.Group();

    // Tire tread
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.32, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.9,
      metalness: 0.05,
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim group (rotates with tire)
    const rimGroup = new THREE.Group();
    buildRim(rimGroup, config.visuals.rimStyle, rimMat, wheelRadius);
    tire.add(rimGroup);
    rimMeshes.push(rimGroup);

    // Brake disc & caliper (stationary relative to wheel spin)
    const discGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, 0.04, 20);
    discGeo.rotateZ(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.25,
      metalness: 0.9,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    wheelGroup.add(disc);

    // Brake caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(isLeft ? -0.06 : 0.06, wheelRadius * 0.45, 0);
    wheelGroup.add(caliper);

    return { group: wheelGroup, tire };
  };

  const wheelFL = createSingleWheel(true, true);
  wheelFL.group.position.set(wheelBaseX, wheelRadius, wheelBaseZ_Front);
  wheelFL.group.rotation.z = THREE.MathUtils.degToRad(config.tuning.camberDeg);

  const wheelFR = createSingleWheel(false, true);
  wheelFR.group.position.set(-wheelBaseX, wheelRadius, wheelBaseZ_Front);
  wheelFR.group.rotation.z = -THREE.MathUtils.degToRad(config.tuning.camberDeg);

  const wheelRL = createSingleWheel(true, false);
  wheelRL.group.position.set(wheelBaseX, wheelRadius, wheelBaseZ_Rear);
  wheelRL.group.rotation.z = THREE.MathUtils.degToRad(config.tuning.camberDeg * 0.6);

  const wheelRR = createSingleWheel(false, false);
  wheelRR.group.position.set(-wheelBaseX, wheelRadius, wheelBaseZ_Rear);
  wheelRR.group.rotation.z = -THREE.MathUtils.degToRad(config.tuning.camberDeg * 0.6);

  rootGroup.add(wheelFL.group, wheelFR.group, wheelRL.group, wheelRR.group);

  return {
    rootGroup,
    bodyMesh: hull,
    bodyMaterials: [bodyMat],
    cabinMesh: cabin,
    windowMaterial,
    caliperMaterials,
    rimMeshes,
    rimMaterials,
    wheels: {
      fl: wheelFL.group,
      fr: wheelFR.group,
      rl: wheelRL.group,
      rr: wheelRR.group,
      flTire: wheelFL.tire,
      frTire: wheelFR.tire,
      rlTire: wheelRL.tire,
      rrTire: wheelRR.tire,
    },
    headlights: headlightsGroup as unknown as THREE.Mesh,
    headlightBeams: [spotL, spotR],
    taillights: taillightBar,
    taillightMaterial,
    reverseLights: reverseLight,
    spoilerGroup,
    splitterGroup,
    hoodGroup,
    exhaustGroup,
    underglowLight,
    underglowMesh,
    backfireFlames,
    backfireLight,
  };
}

/**
 * Creates paint physical shader material with realistic dual-stage clearcoat lacquer, metallic flakes & iridescence
 */
export function createPaintMaterial(colorHex: string, finish: PaintFinish): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(colorHex);
  switch (finish) {
    case 'metallic':
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.16,
        metalness: 0.88,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      });
    case 'matte':
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.82,
        metalness: 0.12,
        clearcoat: 0.12,
        clearcoatRoughness: 0.6,
        sheen: 0.45,
      });
    case 'pearlescent':
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.14,
        metalness: 0.7,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        iridescence: 0.75,
        iridescenceIOR: 1.38,
        reflectivity: 0.95,
      });
    case 'gloss':
    default:
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.12,
        metalness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        reflectivity: 0.92,
      });
  }
}

/**
 * Build modular spoilers
 */
function buildSpoiler(group: THREE.Group, spoilerType: string, bodyMat: THREE.Material, carbonMat: THREE.Material) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (spoilerType === 'none') return;

  if (spoilerType === 'ducktail') {
    const lipGeo = new THREE.BoxGeometry(1.7, 0.1, 0.25);
    const lip = new THREE.Mesh(lipGeo, bodyMat);
    lip.position.set(0, 0.84, -2.12);
    lip.rotation.x = -0.35;
    lip.castShadow = true;
    group.add(lip);
  } else if (spoilerType === 'gt_wing') {
    // Carbon deck blade
    const wingGeo = new THREE.BoxGeometry(1.9, 0.06, 0.38);
    const wing = new THREE.Mesh(wingGeo, carbonMat);
    wing.position.set(0, 1.25, -2.05);
    wing.rotation.x = -0.1;
    wing.castShadow = true;

    // Endplates
    const endGeo = new THREE.BoxGeometry(0.04, 0.22, 0.44);
    const endL = new THREE.Mesh(endGeo, carbonMat);
    endL.position.set(0.95, 1.25, -2.05);
    const endR = endL.clone();
    endR.position.set(-0.95, 1.25, -2.05);

    // Upright stanchions
    const strutGeo = new THREE.BoxGeometry(0.05, 0.5, 0.14);
    const strutL = new THREE.Mesh(strutGeo, carbonMat);
    strutL.position.set(0.5, 1.0, -1.95);
    strutL.rotation.x = 0.15;
    const strutR = strutL.clone();
    strutR.position.set(-0.5, 1.0, -1.95);

    group.add(wing, endL, endR, strutL, strutR);
  } else if (spoilerType === 'time_attack') {
    // Massive dual element chassis mount wing
    const mainWingGeo = new THREE.BoxGeometry(2.1, 0.07, 0.45);
    const mainWing = new THREE.Mesh(mainWingGeo, carbonMat);
    mainWing.position.set(0, 1.42, -2.25);
    mainWing.rotation.x = -0.15;

    const topWingGeo = new THREE.BoxGeometry(2.0, 0.04, 0.25);
    const topWing = new THREE.Mesh(topWingGeo, carbonMat);
    topWing.position.set(0, 1.56, -2.35);
    topWing.rotation.x = -0.25;

    const endGeo = new THREE.BoxGeometry(0.04, 0.38, 0.6);
    const endL = new THREE.Mesh(endGeo, carbonMat);
    endL.position.set(1.05, 1.45, -2.25);
    const endR = endL.clone();
    endR.position.set(-1.05, 1.45, -2.25);

    // Chassis mounts
    const swanGeo = new THREE.BoxGeometry(0.06, 0.9, 0.2);
    const swanL = new THREE.Mesh(swanGeo, carbonMat);
    swanL.position.set(0.6, 1.05, -2.15);
    swanL.rotation.x = -0.15;
    const swanR = swanL.clone();
    swanR.position.set(-0.6, 1.05, -2.15);

    group.add(mainWing, topWing, endL, endR, swanL, swanR);
  }
}

/**
 * Build Front Splitter / Canards
 */
function buildSplitter(group: THREE.Group, splitterType: string, carbonMat: THREE.Material) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (splitterType === 'stock') return;

  // Carbon Front Lip
  const lipGeo = new THREE.BoxGeometry(1.98, 0.05, 0.5);
  const lip = new THREE.Mesh(lipGeo, carbonMat);
  lip.position.set(0, 0.22, 2.3);
  lip.castShadow = true;
  group.add(lip);

  if (splitterType === 'race_canards') {
    // Aerodynamic dive planes / canards
    const canardGeo = new THREE.BoxGeometry(0.28, 0.03, 0.2);
    const canardL1 = new THREE.Mesh(canardGeo, carbonMat);
    canardL1.position.set(0.92, 0.42, 2.15);
    canardL1.rotation.set(-0.2, 0.3, 0.2);

    const canardL2 = canardL1.clone();
    canardL2.position.set(0.94, 0.55, 2.05);

    const canardR1 = canardL1.clone();
    canardR1.position.set(-0.92, 0.42, 2.15);
    canardR1.rotation.set(-0.2, -0.3, -0.2);

    const canardR2 = canardR1.clone();
    canardR2.position.set(-0.94, 0.55, 2.05);

    group.add(canardL1, canardL2, canardR1, canardR2);
  }
}

/**
 * Build Hood Scoops / Extractors
 */
function buildHoodVents(group: THREE.Group, hoodType: string, carbonMat: THREE.Material) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (hoodType === 'stock') return;

  if (hoodType === 'carbon_vented') {
    const ventGeo = new THREE.BoxGeometry(0.38, 0.05, 0.7);
    const ventL = new THREE.Mesh(ventGeo, carbonMat);
    ventL.position.set(0.42, 0.74, 1.25);
    ventL.rotation.x = 0.12;

    const ventR = ventL.clone();
    ventR.position.set(-0.42, 0.74, 1.25);

    group.add(ventL, ventR);
  } else if (hoodType === 'cowl_induction') {
    // Aggressive muscle cowl scoop
    const cowlGeo = new THREE.BoxGeometry(0.72, 0.14, 1.1);
    const cowl = new THREE.Mesh(cowlGeo, carbonMat);
    cowl.position.set(0, 0.78, 1.15);
    cowl.rotation.x = 0.05;
    group.add(cowl);
  }
}

/**
 * Build Exhaust tips
 */
function buildExhaust(group: THREE.Group, exhaustType: string, chromeMat: THREE.Material) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const tipMat = exhaustType === 'quad_burn' ? new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.9,
  }) : chromeMat;

  if (exhaustType === 'stock' || exhaustType === 'titanium_dual') {
    const tipGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16);
    tipGeo.rotateX(Math.PI / 2);
    const tipL = new THREE.Mesh(tipGeo, tipMat);
    tipL.position.set(0.38, 0.28, -2.25);
    const tipR = tipL.clone();
    tipR.position.set(-0.38, 0.28, -2.25);
    group.add(tipL, tipR);
  } else if (exhaustType === 'quad_burn') {
    const tipGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.35, 16);
    tipGeo.rotateX(Math.PI / 2);
    const t1 = new THREE.Mesh(tipGeo, tipMat);
    t1.position.set(0.32, 0.28, -2.25);
    const t2 = new THREE.Mesh(tipGeo, tipMat);
    t2.position.set(0.48, 0.28, -2.25);
    const t3 = new THREE.Mesh(tipGeo, tipMat);
    t3.position.set(-0.32, 0.28, -2.25);
    const t4 = new THREE.Mesh(tipGeo, tipMat);
    t4.position.set(-0.48, 0.28, -2.25);
    group.add(t1, t2, t3, t4);
  } else if (exhaustType === 'cannon') {
    // 4-inch angled cannon drift muffler
    const tipGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 16);
    tipGeo.rotateX(Math.PI / 2);
    const cannon = new THREE.Mesh(tipGeo, tipMat);
    cannon.position.set(0.48, 0.26, -2.28);
    cannon.rotation.y = 0.15;
    cannon.rotation.x = -0.1;
    group.add(cannon);
  }
}

/**
 * Build 3D Wheel Rims
 */
function buildRim(group: THREE.Group, style: string, rimMat: THREE.Material, radius: number) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  // Outer lip
  const lipGeo = new THREE.TorusGeometry(radius * 0.85, 0.03, 12, 24);
  const lip = new THREE.Mesh(lipGeo, rimMat);
  group.add(lip);

  // Center hub
  const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, rimMat);
  group.add(hub);

  if (style === 'spoke5') {
    const numSpokes = 5;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(radius * 0.8, 0.05, 0.04);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.cos(angle) * (radius * 0.42), Math.sin(angle) * (radius * 0.42), 0);
      spoke.rotation.z = angle;
      group.add(spoke);
    }
  } else if (style === 'mesh') {
    const numSpokes = 10;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(radius * 0.8, 0.025, 0.03);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.cos(angle) * (radius * 0.42), Math.sin(angle) * (radius * 0.42), 0);
      spoke.rotation.z = angle + 0.15;
      const crossSpoke = spoke.clone();
      crossSpoke.rotation.z = angle - 0.15;
      group.add(spoke, crossSpoke);
    }
  } else if (style === 'deepdish') {
    // Deep stepped rim with deep offset
    const deepLipGeo = new THREE.CylinderGeometry(radius * 0.85, radius * 0.65, 0.16, 24, 1, true);
    deepLipGeo.rotateZ(Math.PI / 2);
    const deepLip = new THREE.Mesh(deepLipGeo, rimMat);
    group.add(deepLip);

    const numSpokes = 6;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(radius * 0.65, 0.04, 0.03);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(Math.cos(angle) * (radius * 0.32), Math.sin(angle) * (radius * 0.32), -0.05);
      spoke.rotation.z = angle;
      group.add(spoke);
    }
  } else if (style === 'carbon_aero') {
    // Solid aerodisc with cooling slots
    const discGeo = new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.04, 24);
    discGeo.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, rimMat);
    group.add(disc);
  }
}
