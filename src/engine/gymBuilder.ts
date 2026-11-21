import * as THREE from 'three';
import {
  createGymWallMuralTexture,
  createOakPlatformTexture,
  createTreadmillConsoleTexture,
  createTurfTexture,
} from './textures';

export interface GymBuildContext {
  world: THREE.Group;
  maxAnisotropy: number;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  trackTex: <T extends THREE.Texture>(t: T) => T;
  addCollider: (
    cx: number,
    cz: number,
    w: number,
    d: number,
    blocksCamera?: boolean,
    height?: number,
    walkableTop?: boolean,
  ) => void;
  addSign: (
    x: number,
    z: number,
    rotY: number,
    title: string,
    subtitle: string,
    accent: string,
  ) => void;
  materials: {
    rubberMat: THREE.MeshStandardMaterial;
    steelDarkMat: THREE.MeshStandardMaterial;
    chromeMat: THREE.MeshStandardMaterial;
    concreteMat: THREE.MeshStandardMaterial;
    wallLightMat: THREE.MeshStandardMaterial;
    voltMat: THREE.MeshStandardMaterial;
    glassMat: THREE.MeshPhysicalMaterial;
  };
}

export function buildDetailedGym(ctx: GymBuildContext): void {
  const { world, maxAnisotropy, trackGeo, trackMat, trackTex, addCollider, addSign, materials } = ctx;
  const { rubberMat, steelDarkMat, chromeMat, concreteMat, wallLightMat, voltMat, glassMat } = materials;

  const gymX = 0;
  const gymZ = -18;
  const gymW = 26;
  const gymD = 20;

  // Gym-specific procedural PBR materials
  const leatherMat = trackMat(new THREE.MeshStandardMaterial({ color: '#141916', roughness: 0.62, metalness: 0.08 }));
  const leatherAccentMat = trackMat(new THREE.MeshStandardMaterial({ color: '#26302a', roughness: 0.58, metalness: 0.1 }));
  const cyanMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.28, metalness: 0.3, emissive: '#38bdf8', emissiveIntensity: 0.35 }),
  );
  const orangeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.35, metalness: 0.2 }),
  );
  const redPlateMat = trackMat(new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.45, metalness: 0.15 }));
  const mirrorMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: '#cfd9d4',
      roughness: 0.05,
      metalness: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    }),
  );
  const ledPanelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#f4ffe0',
      emissive: '#e9ffbf',
      emissiveIntensity: 0.95,
      roughness: 0.2,
    }),
  );
  const beltMat = trackMat(new THREE.MeshStandardMaterial({ color: '#0e1210', roughness: 0.88, metalness: 0.04 }));
  const turfTex = trackTex(createTurfTexture(maxAnisotropy));
  const turfMat = trackMat(new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.9, metalness: 0.02 }));
  const oakPlatTex = trackTex(createOakPlatformTexture(maxAnisotropy));
  const oakPlatMat = trackMat(new THREE.MeshStandardMaterial({ map: oakPlatTex, roughness: 0.58, metalness: 0.06 }));
  const consoleTex = trackTex(createTreadmillConsoleTexture(maxAnisotropy));
  const consoleScreenMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: consoleTex,
      emissiveMap: consoleTex,
      emissive: '#ffffff',
      emissiveIntensity: 0.75,
      roughness: 0.25,
    }),
  );

  // =========================================================================
  // 1. FLOOR, ENTRANCE APRON & ARCHITECTURAL WALLS
  // =========================================================================
  const gymFloor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gymW, 0.05, gymD)), rubberMat);
  gymFloor.position.set(gymX, 0.025, gymZ);
  gymFloor.receiveShadow = true;
  world.add(gymFloor);
  addCollider(gymX, gymZ, gymW, gymD, false, 0.05, true);

  const entranceApron = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(9.0, 0.036, 1.4)), concreteMat);
  entranceApron.position.set(gymX, 0.018, gymZ + gymD / 2 + 0.5);
  entranceApron.receiveShadow = true;
  world.add(entranceApron);
  addCollider(gymX, gymZ + gymD / 2 + 0.5, 9.0, 1.4, false, 0.036, true);

  // Architectural wall helper with lower solid wall + upper clerestory glass + steel header
  const buildPerimeterWall = (x: number, z: number, w: number, d: number, lowerH: number, glassH: number) => {
    const lower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, lowerH, d)), wallLightMat);
    lower.position.set(x, lowerH / 2, z);
    lower.castShadow = true;
    lower.receiveShadow = true;
    world.add(lower);

    const glass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w * 0.99, glassH, d * 0.65)), glassMat);
    glass.position.set(x, lowerH + glassH / 2, z);
    world.add(glass);

    const header = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 0.26, d * 1.15)), steelDarkMat);
    header.position.set(x, lowerH + glassH + 0.13, z);
    header.castShadow = true;
    world.add(header);

    addCollider(x, z, w + 0.08, d + 0.08, true, lowerH + glassH + 0.26);
  };

  // North, West, East perimeter walls
  buildPerimeterWall(gymX, gymZ - gymD / 2, gymW, 0.45, 3.45, 0.95); // North wall z = -28
  buildPerimeterWall(gymX - gymW / 2, gymZ, 0.45, gymD, 3.1, 1.3); // West wall x = -13
  buildPerimeterWall(gymX + gymW / 2, gymZ, 0.45, gymD, 3.1, 1.3); // East wall x = +13

  // South Curtain-Wall Wings leaving 8m center entrance (x: -4..+4)
  buildPerimeterWall(gymX - 8.5, gymZ + gymD / 2, 9.0, 0.35, 0.68, 3.5);
  buildPerimeterWall(gymX + 8.5, gymZ + gymD / 2, 9.0, 0.35, 0.68, 3.5);

  // Mullions along South glass wings
  const mullionGeo = trackGeo(new THREE.BoxGeometry(0.14, 4.4, 0.42));
  [-12.6, -9.8, -7.0, -4.15, 4.15, 7.0, 9.8, 12.6].forEach((mx) => {
    const mullion = new THREE.Mesh(mullionGeo, steelDarkMat);
    mullion.position.set(mx, 2.2, gymZ + gymD / 2);
    mullion.castShadow = true;
    world.add(mullion);
  });

  // Entrance Steel Portal Arch & Neon Trim
  const archTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.8, 0.52, 0.65)), steelDarkMat);
  archTop.position.set(gymX, 4.25, gymZ + gymD / 2);
  archTop.castShadow = true;
  const archStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.2, 0.08, 0.7)), voltMat);
  archStrip.position.set(gymX, 3.98, gymZ + gymD / 2);
  world.add(archTop, archStrip);

  addSign(gymX - 5.6, gymZ + gymD / 2 + 0.75, 0, 'TRAINING CENTER', 'Strength · Turf · Cardio', '#C7FF00');

  // Structural Interior Steel Columns
  const colPositions: [number, number][] = [
    [-12.68, -12], [-12.68, -18], [-12.68, -24],
    [12.68, -12], [12.68, -18], [12.68, -24],
    [-4.4, -27.68], [4.4, -27.68],
  ];
  const interiorColGeo = trackGeo(new THREE.BoxGeometry(0.32, 4.55, 0.32));
  colPositions.forEach(([cx, cz]) => {
    const col = new THREE.Mesh(interiorColGeo, steelDarkMat);
    col.position.set(cx, 2.275, cz);
    col.castShadow = true;
    world.add(col);
  });

  // Exposed Roof Trusses + Suspended LED Light Bars
  const trussGeo = trackGeo(new THREE.BoxGeometry(gymW + 0.3, 0.26, 0.28));
  for (let bz = gymZ - 7; bz <= gymZ + 7; bz += 4.6) {
    const beam = new THREE.Mesh(trussGeo, steelDarkMat);
    beam.position.set(gymX, 4.55, bz);
    beam.castShadow = true;
    world.add(beam);
  }

  const lightFixtureCoords: [number, number][] = [
    [-5.8, -21.8],
    [5.8, -21.8],
    [-5.8, -14.2],
    [5.8, -14.2],
  ];
  const fixtureHousingGeo = trackGeo(new THREE.BoxGeometry(4.6, 0.12, 0.34));
  const fixtureDiffuserGeo = trackGeo(new THREE.BoxGeometry(4.3, 0.05, 0.24));
  lightFixtureCoords.forEach(([lx, lz]) => {
    const housing = new THREE.Mesh(fixtureHousingGeo, steelDarkMat);
    housing.position.set(lx, 4.35, lz);
    const diffuser = new THREE.Mesh(fixtureDiffuserGeo, ledPanelMat);
    diffuser.position.set(lx, 4.28, lz);
    world.add(housing, diffuser);
  });

  // Dedicated Interior Gym Lighting (non-shadow PointLights to keep shadow caster count = 1)
  const gymLightNorth = new THREE.PointLight('#f4f9ef', 18, 24, 1.5);
  gymLightNorth.position.set(0, 4.1, -22.2);
  const gymLightSouth = new THREE.PointLight('#f4f9ef', 16, 22, 1.5);
  gymLightSouth.position.set(0, 4.1, -14.2);
  const cardioAccent = new THREE.PointLight('#bae6fd', 7.5, 13, 1.6);
  cardioAccent.position.set(9.2, 3.4, -17.5);
  world.add(gymLightNorth, gymLightSouth, cardioAccent);

  // =========================================================================
  // 2. WALL MURALS & FRAMED GYM MIRROR WALL
  // =========================================================================
  const addWallMural = (
    x: number,
    y: number,
    z: number,
    rotY: number,
    w: number,
    h: number,
    title: string,
    subtitle: string,
    accent: string,
  ) => {
    const tex = trackTex(createGymWallMuralTexture(title, subtitle, accent, maxAnisotropy));
    const mat = trackMat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.15 }));
    const board = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, h, 0.06)), [
      steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, mat, steelDarkMat,
    ]);
    board.position.set(x, y, z);
    board.rotation.y = rotY;
    world.add(board);
  };

  addWallMural(-12.72, 2.15, -21.0, Math.PI / 2, 4.2, 1.45, 'STRENGTH BAY', 'Squat · Deadlifts · Kettlebells', '#C7FF00');
  addWallMural(-12.72, 2.15, -14.6, Math.PI / 2, 4.2, 1.45, 'TURF & PLYO', 'Agility · Core · Box Jumps', '#34d399');
  addWallMural(12.72, 2.15, -17.5, -Math.PI / 2, 4.6, 1.45, 'CARDIO BAY', 'Smart Treadmills · Spin Bikes', '#38bdf8');

  // 3-Panel Mirror Wall behind Pull-up & Free Weight Bay (North Wall z = -27.72)
  const mirrorFrameGeo = trackGeo(new THREE.BoxGeometry(3.2, 2.35, 0.08));
  const mirrorGlassGeo = trackGeo(new THREE.BoxGeometry(3.0, 2.15, 0.04));
  const mirrorLedGeo = trackGeo(new THREE.BoxGeometry(3.1, 0.05, 0.1));
  [-1.2, 2.6, 6.4].forEach((mx) => {
    const frame = new THREE.Mesh(mirrorFrameGeo, steelDarkMat);
    frame.position.set(mx, 1.85, -27.72);
    const glass = new THREE.Mesh(mirrorGlassGeo, mirrorMat);
    glass.position.set(mx, 1.85, -27.68);
    const topLed = new THREE.Mesh(mirrorLedGeo, voltMat);
    topLed.position.set(mx, 3.05, -27.68);
    world.add(frame, glass, topLed);
  });

  // =========================================================================
  // 3. ZONE 1: OLYMPIC LIFTING PLATFORM & POWER SQUAT RACK (North-West)
  // =========================================================================
  const liftPlatX = -8.6;
  const liftPlatZ = -23.7;
  const platGroup = new THREE.Group();
  platGroup.position.set(liftPlatX, 0.05, liftPlatZ);
  const platRubber = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.4, 0.06, 3.4)), steelDarkMat);
  platRubber.position.y = 0.03;
  platRubber.receiveShadow = true;
  const platOak = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.064, 3.32)), oakPlatMat);
  platOak.position.y = 0.03;
  platOak.receiveShadow = true;
  const platTrimF = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.42, 0.02, 0.06)), voltMat);
  platTrimF.position.set(0, 0.055, 1.7);
  platGroup.add(platRubber, platOak, platTrimF);
  world.add(platGroup);
  addCollider(liftPlatX, liftPlatZ, 4.4, 3.4, false, 0.11, true);

  // Power Squat Rack on Platform (x: -8.6, z: -24.3)
  const buildPowerRack = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.11, z);

    // Base rails
    [-0.78, 0.78].forEach((bx) => {
      const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.08, 1.55)), steelDarkMat);
      base.position.set(bx, 0.04, 0);
      g.add(base);
    });
    // 4 Uprights + Spotter arms + J-hooks
    const postGeo = trackGeo(new THREE.BoxGeometry(0.11, 2.55, 0.11));
    [[-0.78, -0.65], [0.78, -0.65], [-0.78, 0.65], [0.78, 0.65]].forEach(([ux, uz]) => {
      const post = new THREE.Mesh(postGeo, steelDarkMat);
      post.position.set(ux, 1.28, uz);
      post.castShadow = true;
      g.add(post);
    });
    [-0.78, 0.78].forEach((sx) => {
      const spotter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.07, 1.15)), voltMat);
      spotter.position.set(sx, 0.92, 0.02);
      const topSide = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.1, 1.4)), steelDarkMat);
      topSide.position.set(sx, 2.48, 0);
      g.add(spotter, topSide);
    });

    const topCross = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 1.66, 10)), chromeMat);
    topCross.rotation.z = Math.PI / 2;
    topCross.position.set(0, 2.46, 0.62);

    // Loaded Olympic Barbell
    const barbell = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 2.4, 12)), chromeMat);
    barbell.rotation.z = Math.PI / 2;
    barbell.position.set(0, 1.48, 0.64);
    g.add(topCross, barbell);

    // Multi-size Bumper Plates on Barbell
    const plateSpecs = [
      { offset: 0.92, radius: 0.25, mat: steelDarkMat },
      { offset: 1.0, radius: 0.22, mat: cyanMat },
      { offset: 1.07, radius: 0.17, mat: voltMat },
    ];
    plateSpecs.forEach(({ offset, radius, mat }) => {
      const geo = trackGeo(new THREE.CylinderGeometry(radius, radius, 0.052, 20));
      [-1, 1].forEach((side) => {
        const p = new THREE.Mesh(geo, mat);
        p.rotation.z = Math.PI / 2;
        p.position.set(side * offset, 1.48, 0.64);
        p.castShadow = true;
        g.add(p);
      });
    });

    world.add(g);
    addCollider(x, z, 2.0, 1.65, false, 2.6);
  };
  buildPowerRack(-8.6, -24.3);

  // Bumper Plate Tree & Kettlebell Rack (x: -11.6, z: -21.2)
  const buildKettlebellAndPlateRack = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);

    const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.7, 1.15, 1.7)), steelDarkMat);
    frame.position.set(0, 0.575, 0);
    frame.castShadow = true;
    const shelf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.75, 0.06, 1.75)), chromeMat);
    shelf.position.set(0, 0.52, 0);
    g.add(frame, shelf);

    // Kettlebells on top shelf
    const kbColors = [voltMat, cyanMat, orangeMat, redPlateMat];
    kbColors.forEach((mat, idx) => {
      const kz = -0.58 + idx * 0.38;
      const body = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.115, 12, 10)), mat);
      body.position.set(0.05, 0.65, kz);
      const handle = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.075, 0.02, 8, 12, Math.PI)), steelDarkMat);
      handle.position.set(0.05, 0.76, kz);
      handle.rotation.y = Math.PI / 2;
      g.add(body, handle);
    });

    // Spare plates along bottom
    [-0.5, 0, 0.5].forEach((pz, i) => {
      const sp = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.22 - i * 0.02, 0.22 - i * 0.02, 0.05, 16)),
        i === 0 ? voltMat : steelDarkMat,
      );
      sp.rotation.z = Math.PI / 2;
      sp.position.set(0.1, 1.24, pz);
      g.add(sp);
    });

    world.add(g);
    addCollider(x, z, 0.9, 1.85, false, 1.35);
  };
  buildKettlebellAndPlateRack(-11.6, -21.2);

  // =========================================================================
  // 4. ZONE 2: CALISTHENICS & CABLE RIG + FREE WEIGHTS & BENCHES (North)
  // =========================================================================
  // Dual-Tower Functional Pull-Up & Cable Crossover Rig (x: -0.5, z: -25.1)
  const buildCalisthenicsCableRig = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);

    // Two heavy towers
    const towerGeo = trackGeo(new THREE.BoxGeometry(0.38, 2.65, 0.55));
    const weightBrickGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.06, 0.14));
    const guideRodGeo = trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 1.9, 8));
    const pulleyWheelGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12));
    [-1.25, 1.25].forEach((tx) => {
      const tower = new THREE.Mesh(towerGeo, steelDarkMat);
      tower.position.set(tx, 1.325, 0);
      tower.castShadow = true;
      g.add(tower);

      // Weight stack bricks recessed on front face
      for (let i = 0; i < 8; i++) {
        const brick = new THREE.Mesh(
          weightBrickGeo,
          i === 4 ? voltMat : chromeMat,
        );
        brick.position.set(tx, 0.35 + i * 0.11, 0.26);
        g.add(brick);
      }

      // Guide rods + pulley arm
      const rod = new THREE.Mesh(guideRodGeo, chromeMat);
      rod.position.set(tx, 1.25, 0.31);
      const pulleyWheel = new THREE.Mesh(pulleyWheelGeo, voltMat);
      pulleyWheel.rotation.z = Math.PI / 2;
      pulleyWheel.position.set(tx, 2.35, 0.34);
      g.add(rod, pulleyWheel);
    });

    // Overhead Pull-Up Bar & Neon Grips
    const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 2.35, 12)), chromeMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.48, 0);
    const gripL = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.34, 10)), voltMat);
    gripL.rotation.z = Math.PI / 2;
    gripL.position.set(-0.48, 2.48, 0);
    const gripR = gripL.clone();
    gripR.position.set(0.48, 2.48, 0);

    // Parallel Dip Attachments
    [-0.36, 0.36].forEach((dx) => {
      const dip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.55, 8)), chromeMat);
      dip.rotation.x = Math.PI / 2;
      dip.position.set(dx, 1.25, 0.32);
      g.add(dip);
    });

    g.add(bar, gripL, gripR);
    world.add(g);
    addCollider(x, z, 2.95, 0.78, false, 2.65);
  };
  buildCalisthenicsCableRig(-0.5, -25.1);

  // Olympic Barbell Bench Press (x: 3.8, z: -24.4)
  const buildBarbellBench = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);

    const pad = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.11, 1.38)), leatherMat);
    pad.position.set(0, 0.48, 0.15);
    pad.castShadow = true;
    const frameSpine = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.09, 1.45)), steelDarkMat);
    frameSpine.position.set(0, 0.38, 0.08);
    const frontFoot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 0.38, 0.12)), steelDarkMat);
    frontFoot.position.set(0, 0.19, 0.65);

    // Uprights & Barbell
    [-0.56, 0.56].forEach((ux) => {
      const post = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 1.18, 0.12)), steelDarkMat);
      post.position.set(ux, 0.59, -0.42);
      post.castShadow = true;
      g.add(post);
    });
    const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 2.1, 10)), chromeMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.08, -0.42);
    [-0.82, 0.82].forEach((px) => {
      const plate = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.21, 0.21, 0.055, 18)), steelDarkMat);
      plate.rotation.z = Math.PI / 2;
      plate.position.set(px, 1.08, -0.42);
      const rim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16)), voltMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(px, 1.08, -0.42);
      g.add(plate, rim);
    });

    g.add(pad, frameSpine, frontFoot, bar);
    world.add(g);
    addCollider(x, z, 2.15, 1.65, false, 1.25);
  };
  buildBarbellBench(3.8, -24.4);

  // Adjustable Incline Dumbbell Bench (x: 7.4, z: -23.6) + 2-Tier Dumbbell Rack (x: 7.4, z: -26.2)
  const buildInclineBenchAndDumbbells = (bx: number, bz: number, rx: number, rz: number) => {
    const b = new THREE.Group();
    b.position.set(bx, 0.05, bz);
    const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.09, 0.42)), leatherMat);
    seat.position.set(0, 0.46, 0.35);
    const backRest = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.09, 0.78)), leatherAccentMat);
    backRest.position.set(0, 0.72, -0.18);
    backRest.rotation.x = 0.55;
    const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.36, 1.1)), steelDarkMat);
    base.position.set(0, 0.18, 0.05);
    b.add(seat, backRest, base);
    world.add(b);
    addCollider(bx, bz, 0.65, 1.35, false, 1.05);

    const rack = new THREE.Group();
    rack.position.set(rx, 0.05, rz);
    const rackBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.88, 0.58)), steelDarkMat);
    rackBody.position.set(0, 0.44, 0);
    rackBody.castShadow = true;
    rack.add(rackBody);

    const dbBarGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8));
    const dbBellGeos = Array.from({ length: 7 }, (_, idx) => {
      const bellSize = 0.055 + idx * 0.005;
      return {
        bell: trackGeo(new THREE.CylinderGeometry(bellSize, bellSize, 0.06, 6)),
        band: trackGeo(new THREE.CylinderGeometry(bellSize + 0.003, bellSize + 0.003, 0.016, 6)),
      };
    });
    for (let tier = 0; tier < 2; tier++) {
      const yPos = tier === 0 ? 0.52 : 0.92;
      const zOff = tier === 0 ? 0.14 : -0.06;
      for (let i = -3; i <= 3; i++) {
        const { bell, band: bandGeo } = dbBellGeos[i + 3];
        const dbBar = new THREE.Mesh(dbBarGeo, chromeMat);
        dbBar.rotation.x = Math.PI / 2;
        dbBar.position.set(i * 0.33, yPos, zOff);
        const bell1 = new THREE.Mesh(bell, steelDarkMat);
        bell1.rotation.x = Math.PI / 2;
        bell1.position.set(i * 0.33, yPos, zOff + 0.13);
        const bell2 = bell1.clone();
        bell2.position.set(i * 0.33, yPos, zOff - 0.13);
        const band = new THREE.Mesh(bandGeo, voltMat);
        band.rotation.x = Math.PI / 2;
        band.position.set(i * 0.33, yPos, zOff + 0.13);
        rack.add(dbBar, bell1, bell2, band);
      }
    }
    world.add(rack);
    addCollider(rx, rz, 2.7, 0.72, false, 1.05);
  };
  buildInclineBenchAndDumbbells(7.4, -23.6, 7.4, -26.2);

  // =========================================================================
  // 5. ZONE 3: TURF CONDITIONING LANE, PLYO BOXES & MATS (West / Center)
  // =========================================================================
  const turfStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 0.016, 8.4)), turfMat);
  turfStrip.position.set(-7.5, 0.058, -15.0);
  turfStrip.receiveShadow = true;
  world.add(turfStrip);

  // 3 Climbable Plyometric Jump Boxes (walkableTop: true!)
  const plyoSpecs = [
    { z: -12.6, h: 0.42, accent: voltMat },
    { z: -14.4, h: 0.62, accent: cyanMat },
    { z: -16.2, h: 0.82, accent: orangeMat },
  ];
  plyoSpecs.forEach(({ z, h, accent }) => {
    const px = -11.3;
    const box = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, h, 0.95)), oakPlatMat);
    box.position.set(px, 0.05 + h / 2, z);
    box.castShadow = true;
    box.receiveShadow = true;
    const topRim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.97, 0.04, 0.97)), accent);
    topRim.position.set(px, 0.05 + h - 0.02, z);
    world.add(box, topRim);
    addCollider(px, z, 0.96, 0.96, false, 0.05 + h, true);
  });

  // Medicine Ball Rack (x: -11.3, z: -18.2)
  const medRack = new THREE.Group();
  medRack.position.set(-11.3, 0.05, -18.2);
  const medPost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.55, 1.35, 0.55)), steelDarkMat);
  medPost.position.y = 0.675;
  medRack.add(medPost);
  [0.35, 0.72, 1.08].forEach((my, i) => {
    const ball = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.16, 12, 10)),
      i === 0 ? voltMat : i === 1 ? cyanMat : orangeMat,
    );
    ball.position.set(0.18, my, 0);
    medRack.add(ball);
  });
  world.add(medRack);
  addCollider(-11.3, -18.2, 0.7, 0.7, false, 1.4);

  // Agility Cones along Turf Edge
  const coneGeo = trackGeo(new THREE.ConeGeometry(0.13, 0.28, 10));
  [-11.8, -13.8, -15.8, -17.8].forEach((cz) => {
    const cone = new THREE.Mesh(coneGeo, orangeMat);
    cone.position.set(-9.3, 0.2, cz);
    world.add(cone);
  });

  // Exercise Mats & Foam Rollers (x: -3.2, z: -14.8 & -17.6)
  const matBodyGeo = trackGeo(new THREE.BoxGeometry(1.45, 0.042, 2.35));
  const matTrimGeo = trackGeo(new THREE.BoxGeometry(1.47, 0.046, 0.14));
  const buildExerciseMat = (x: number, z: number, color: string) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);
    const matBody = new THREE.Mesh(
      matBodyGeo,
      trackMat(new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.04 })),
    );
    matBody.position.y = 0.021;
    matBody.receiveShadow = true;
    const trim = new THREE.Mesh(matTrimGeo, voltMat);
    trim.position.set(0, 0.023, 1.04);
    g.add(matBody, trim);
    world.add(g);
  };
  buildExerciseMat(-3.2, -14.8, '#1e2b24');
  buildExerciseMat(-3.2, -17.6, '#1b242a');

  // Foam Roller beside mats
  const roller = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 12)), cyanMat);
  roller.rotation.z = Math.PI / 2;
  roller.position.set(-1.95, 0.13, -16.2);
  world.add(roller);

  // =========================================================================
  // 6. ZONE 4: CARDIO ENDURANCE BAY (East Wing: Treadmills & Spin Bikes)
  // =========================================================================
  const tmDeckGeo = trackGeo(new THREE.BoxGeometry(0.98, 0.18, 2.15));
  const tmBeltGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.022, 1.82));
  const tmHoodGeo = trackGeo(new THREE.BoxGeometry(0.96, 0.22, 0.42));
  const tmPostGeo = trackGeo(new THREE.BoxGeometry(0.09, 1.38, 0.1));
  const tmRailGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8));
  const tmConsoleGeo = trackGeo(new THREE.BoxGeometry(1.0, 0.42, 0.24));
  const tmScreenGeo = trackGeo(new THREE.PlaneGeometry(0.78, 0.3));

  const buildSmartTreadmill = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);
    g.rotation.y = -Math.PI / 2; // Console sits on East (+X) with screen facing West (-X) aisle

    const deck = new THREE.Mesh(tmDeckGeo, steelDarkMat);
    deck.position.set(0, 0.09, 0);
    deck.castShadow = true;
    const belt = new THREE.Mesh(tmBeltGeo, beltMat);
    belt.position.set(0, 0.19, 0.08);
    const hood = new THREE.Mesh(tmHoodGeo, leatherAccentMat);
    hood.position.set(0, 0.22, -0.82);

    const postL = new THREE.Mesh(tmPostGeo, steelDarkMat);
    postL.position.set(-0.44, 0.76, -0.84);
    const postR = postL.clone();
    postR.position.set(0.44, 0.76, -0.84);

    // Side Handrails
    [-0.44, 0.44].forEach((hx) => {
      const rail = new THREE.Mesh(tmRailGeo, chromeMat);
      rail.rotation.x = Math.PI / 2 - 0.15;
      rail.position.set(hx, 1.05, -0.5);
      g.add(rail);
    });

    const consoleHousing = new THREE.Mesh(tmConsoleGeo, steelDarkMat);
    consoleHousing.position.set(0, 1.45, -0.78);
    consoleHousing.rotation.x = -0.38;
    const consoleScreen = new THREE.Mesh(tmScreenGeo, consoleScreenMat);
    consoleScreen.position.set(0, 1.46, -0.65);
    consoleScreen.rotation.x = -0.38;

    g.add(deck, belt, hood, postL, postR, consoleHousing, consoleScreen);
    world.add(g);
    addCollider(x, z, 2.2, 1.12, false, 1.65);
  };
  buildSmartTreadmill(9.8, -21.2);
  buildSmartTreadmill(9.8, -18.4);
  buildSmartTreadmill(9.8, -15.6);

  // Indoor Spin Bikes (x: 9.8, z: -12.8 & -10.8)
  const buildSpinBike = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.05, z);
    g.rotation.y = -Math.PI / 2;

    const baseFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.08, 1.25)), steelDarkMat);
    baseFrame.position.set(0, 0.04, 0);
    const flywheel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 18)), chromeMat);
    flywheel.rotation.z = Math.PI / 2;
    flywheel.position.set(0, 0.34, 0.36);
    const flywheelAccent = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 14)), voltMat);
    flywheelAccent.rotation.z = Math.PI / 2;
    flywheelAccent.position.set(0, 0.34, 0.36);
    const seatPost = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.72, 0.08)), steelDarkMat);
    seatPost.position.set(0, 0.42, -0.34);
    const saddle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.08, 0.26)), leatherMat);
    saddle.position.set(0, 0.82, -0.34);
    const stem = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.85, 0.08)), steelDarkMat);
    stem.position.set(0, 0.52, 0.26);
    const handlebar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.48, 8)), chromeMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 0.96, 0.26);

    g.add(baseFrame, flywheel, flywheelAccent, seatPost, saddle, stem, handlebar);
    world.add(g);
    addCollider(x, z, 1.35, 0.68, false, 1.05);
  };
  buildSpinBike(9.8, -12.8);
  buildSpinBike(9.8, -10.8);

  // =========================================================================
  // 7. ZONE 5: ENTRANCE ATHLETE LOCKERS & HYDRATION STATION
  // =========================================================================
  // Athlete Locker Bank & Changing Bench (South-West Corner: x: -11.4, z: -9.8)
  const lockerBank = new THREE.Group();
  lockerBank.position.set(-11.4, 0.05, -9.8);
  const lockers = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.2, 2.05, 0.62)), steelDarkMat);
  lockers.position.set(0, 1.025, 0);
  lockers.castShadow = true;
  lockerBank.add(lockers);
  const doorGeo = trackGeo(new THREE.BoxGeometry(0.44, 1.88, 0.04));
  const badgeGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.06, 0.05));
  [-0.75, -0.25, 0.25, 0.75].forEach((lx) => {
    const door = new THREE.Mesh(doorGeo, leatherAccentMat);
    door.position.set(lx, 1.02, -0.31);
    const badge = new THREE.Mesh(badgeGeo, voltMat);
    badge.position.set(lx, 1.72, -0.32);
    lockerBank.add(door, badge);
  });
  world.add(lockerBank);
  addCollider(-11.4, -9.8, 2.3, 0.75, false, 2.1);

  const lockerBench = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.8, 0.42, 0.46)), oakPlatMat);
  lockerBench.position.set(-9.1, 0.26, -9.8);
  lockerBench.castShadow = true;
  world.add(lockerBench);
  addCollider(-9.1, -9.8, 1.85, 0.5, false, 0.48, true);

  // Chilled Hydration & Towel Station (South-East near Entrance: x: 5.8, z: -9.2)
  const hydroGroup = new THREE.Group();
  hydroGroup.position.set(5.8, 0.05, -9.2);
  const hydroBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.85, 1.55, 0.6)), steelDarkMat);
  hydroBody.position.set(0, 0.775, 0);
  hydroBody.castShadow = true;
  const hydroRecess = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.45, 0.08)), cyanMat);
  hydroRecess.position.set(0, 1.05, -0.28);
  const towelRack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.6, 0.92, 0.52)), chromeMat);
  towelRack.position.set(0.85, 0.46, 0);
  const towels = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.48, 0.24, 0.42)),
    trackMat(new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.9 })),
  );
  towels.position.set(0.85, 1.02, 0);
  hydroGroup.add(hydroBody, hydroRecess, towelRack, towels);
  world.add(hydroGroup);
  addCollider(6.2, -9.2, 1.75, 0.72, false, 1.6);
}
