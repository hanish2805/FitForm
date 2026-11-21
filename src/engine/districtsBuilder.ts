import * as THREE from 'three';
import {
  createArenaScoreboardTexture,
  createCampusMapSignTexture,
  createGymWallMuralTexture,
  createHomeScreenTexture,
  createNutritionMenuTexture,
  createOakPlatformTexture,
  createParkPavingTexture,
  createTurfTexture,
  createWaterTexture,
} from './textures';

export interface DistrictBuildContext {
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
  addPlatform: (x: number, z: number, radius: number, height: number) => void;
  addSign: (
    x: number,
    z: number,
    rotY: number,
    title: string,
    subtitle: string,
    accent: string,
  ) => void;
  materials: {
    grassMat: THREE.MeshStandardMaterial;
    walkwayMat: THREE.MeshStandardMaterial;
    rubberMat: THREE.MeshStandardMaterial;
    woodMat: THREE.MeshStandardMaterial;
    trackMatPbr: THREE.MeshStandardMaterial;
    steelDarkMat: THREE.MeshStandardMaterial;
    chromeMat: THREE.MeshStandardMaterial;
    concreteMat: THREE.MeshStandardMaterial;
    wallLightMat: THREE.MeshStandardMaterial;
    voltMat: THREE.MeshStandardMaterial;
    glassMat: THREE.MeshPhysicalMaterial;
  };
}

export function buildWorldDistricts(ctx: DistrictBuildContext): void {
  const {
    world,
    maxAnisotropy,
    trackGeo,
    trackMat,
    trackTex,
    addCollider,
    addPlatform,
    addSign,
    materials,
  } = ctx;

  const {
    grassMat,
    walkwayMat,
    rubberMat,
    woodMat,
    trackMatPbr,
    steelDarkMat,
    chromeMat,
    concreteMat,
    wallLightMat,
    voltMat,
    glassMat,
  } = materials;

  // Shared district-level procedural textures & PBR materials
  const parkPaverTex = trackTex(createParkPavingTexture(maxAnisotropy));
  const parkPaverMat = trackMat(
    new THREE.MeshStandardMaterial({ map: parkPaverTex, roughness: 0.8, metalness: 0.05 }),
  );
  const waterTex = trackTex(createWaterTexture(maxAnisotropy));
  const waterMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: waterTex,
      roughness: 0.14,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
    }),
  );
  const turfTex = trackTex(createTurfTexture(maxAnisotropy));
  const turfMat = trackMat(
    new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.88, metalness: 0.02 }),
  );
  const oakPlatTex = trackTex(createOakPlatformTexture(maxAnisotropy));
  const oakPlatMat = trackMat(
    new THREE.MeshStandardMaterial({ map: oakPlatTex, roughness: 0.58, metalness: 0.06 }),
  );

  const skyAccentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.28,
      metalness: 0.35,
      emissive: '#38bdf8',
      emissiveIntensity: 0.35,
    }),
  );
  const emeraldAccentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#34d399',
      roughness: 0.32,
      metalness: 0.25,
      emissive: '#34d399',
      emissiveIntensity: 0.32,
    }),
  );
  const violetAccentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#a78bfa',
      roughness: 0.35,
      metalness: 0.22,
      emissive: '#a78bfa',
      emissiveIntensity: 0.3,
    }),
  );
  const orangeAccentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#f97316',
      roughness: 0.32,
      metalness: 0.25,
      emissive: '#f97316',
      emissiveIntensity: 0.38,
    }),
  );
  const warmFabricMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.88, metalness: 0.02 }),
  );
  const charcoalFabricMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#272c2a', roughness: 0.85, metalness: 0.05 }),
  );
  const timberMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#785336', roughness: 0.68, metalness: 0.04 }),
  );
  const leafMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#2d6a3e', roughness: 0.82, metalness: 0.02 }),
  );
  const rockMat = trackMat(
    new THREE.MeshStandardMaterial({ color: '#4d5550', roughness: 0.92, metalness: 0.05 }),
  );
  const lampGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#fef9c3',
      emissive: '#fef08a',
      emissiveIntensity: 0.95,
      roughness: 0.2,
    }),
  );
  const mirrorMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: '#cfd9d4',
      roughness: 0.05,
      metalness: 0.96,
      clearcoat: 1.0,
    }),
  );

  // =========================================================================
  // CAMPUS CONNECTION NETWORK & CENTRAL PLAZA PROPS
  // =========================================================================
  const addWalkwaySegment = (
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    width: number,
    mat: THREE.Material = walkwayMat,
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const mesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(width, 0.03, len)), mat);
    mesh.position.set((x1 + x2) / 2, 0.015, (z1 + z2) / 2);
    mesh.rotation.y = angle;
    mesh.receiveShadow = true;
    world.add(mesh);
  };

  // Radial avenues from Central Plaza (0, 5) to all 5 districts
  addWalkwaySegment(0, 5, 0, -8.5, 5.5); // North -> Training Center
  addWalkwaySegment(0, 5, 22, 2, 4.2); // East -> Outdoor Park
  addWalkwaySegment(0, 5, -24.5, -8.5, 4.2); // West -> Player Home
  addWalkwaySegment(0, 5, -21, 20, 4.2); // South-West -> Nutrition Center
  addWalkwaySegment(0, 5, 17, 20, 4.2); // South-East -> Competition Arena

  // Perimeter Inter-District Loop Trails (connecting every zone to its neighbors!)
  addWalkwaySegment(-13, -15, -24.5, -10, 3.0, parkPaverMat); // Training Center W <-> Player Home
  addWalkwaySegment(-34, -2, -25, 19, 3.0, parkPaverMat); // Player Home S <-> Nutrition Center N
  addWalkwaySegment(-16, 26, 13.5, 27.5, 3.2, parkPaverMat); // Nutrition Center E <-> Arena W
  addWalkwaySegment(34, 11.5, 26.5, 15.5, 3.2, parkPaverMat); // Outdoor Park S <-> Arena N
  addWalkwaySegment(13, -17, 22.5, -11.5, 3.0, parkPaverMat); // Training Center E <-> Park Cycling Trail

  // Sculptural Campus Monument (Plaza South-West edge: -5.4, 9.2)
  const buildPlazaMonument = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.04, z);
    const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.15, 1.35, 0.35, 8)), concreteMat);
    base.position.y = 0.175;
    base.castShadow = true;
    const plinth = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.62, 0.78, 0.85, 8)), steelDarkMat);
    plinth.position.y = 0.77;
    plinth.castShadow = true;
    const ring = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.75, 0.08, 10, 24)), voltMat);
    ring.position.y = 1.95;
    ring.rotation.y = Math.PI / 5;
    const core = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.28, 0)), voltMat);
    core.position.y = 1.95;
    g.add(base, plinth, ring, core);
    world.add(g);
    addCollider(x, z, 2.3, 2.3, false, 2.6);
  };
  buildPlazaMonument(-5.2, 9.2);

  // Central Campus Directory Kiosk (Plaza South-East edge: 5.2, 9.2)
  const buildDirectoryKiosk = (x: number, z: number, rotY: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.04, z);
    g.rotation.y = rotY;
    const postL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 2.6, 0.14)), steelDarkMat);
    postL.position.set(-1.5, 1.3, 0);
    const postR = postL.clone();
    postR.position.set(1.5, 1.3, 0);
    const mapTex = trackTex(createCampusMapSignTexture(maxAnisotropy));
    const mapMat = trackMat(new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.38, metalness: 0.15 }));
    const board = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 1.55, 0.16)), [
      steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, mapMat, mapMat,
    ]);
    board.position.set(0, 1.75, 0);
    board.castShadow = true;
    g.add(postL, postR, board);
    world.add(g);
    addCollider(x, z, 3.2, 0.55, false, 2.6);
  };
  buildDirectoryKiosk(5.2, 9.2, -Math.PI / 5);

  // Helper: Campus Solar Streetlamp & Park Bench & Composite Shrub Cluster
  const lampBaseGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.18, 0.25, 10));
  const lampPoleGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.07, 4.0, 10));
  const lampArmGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.08, 0.8));
  const lampHeadGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.08, 0.45));
  const addStreetLamp = (x: number, z: number, rotY = 0) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const base = new THREE.Mesh(lampBaseGeo, concreteMat);
    base.position.y = 0.125;
    const pole = new THREE.Mesh(lampPoleGeo, steelDarkMat);
    pole.position.y = 2.0;
    pole.castShadow = true;
    const arm = new THREE.Mesh(lampArmGeo, steelDarkMat);
    arm.position.set(0, 3.92, 0.35);
    const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
    head.position.set(0, 3.85, 0.68);
    g.add(base, pole, arm, head);
    world.add(g);
    addCollider(x, z, 0.4, 0.4, false, 4.0);
  };

  const benchLegGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.42, 0.52));
  const benchSeatGeo = trackGeo(new THREE.BoxGeometry(1.75, 0.08, 0.54));
  const benchBackGeo = trackGeo(new THREE.BoxGeometry(1.75, 0.36, 0.08));
  const addParkBench = (x: number, z: number, rotY: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.02, z);
    g.rotation.y = rotY;
    const legL = new THREE.Mesh(benchLegGeo, steelDarkMat);
    legL.position.set(-0.72, 0.21, 0);
    const legR = legL.clone();
    legR.position.set(0.72, 0.21, 0);
    const seat = new THREE.Mesh(benchSeatGeo, timberMat);
    seat.position.set(0, 0.44, 0);
    seat.castShadow = true;
    const back = new THREE.Mesh(benchBackGeo, timberMat);
    back.position.set(0, 0.72, -0.24);
    back.rotation.x = -0.14;
    g.add(legL, legR, seat, back);
    world.add(g);
    const w = Math.abs(Math.cos(rotY)) > 0.7 ? 1.85 : 0.7;
    const d = Math.abs(Math.cos(rotY)) > 0.7 ? 0.7 : 1.85;
    addCollider(x, z, w, d, false, 0.9);
  };

  const shrubRingGeo = trackGeo(new THREE.CylinderGeometry(0.72, 0.78, 0.16, 12));
  const shrubS1Geo = trackGeo(new THREE.DodecahedronGeometry(0.55, 1));
  const shrubS2Geo = trackGeo(new THREE.DodecahedronGeometry(0.38, 1));
  const shrubS3Geo = trackGeo(new THREE.DodecahedronGeometry(0.34, 1));
  const addShrubCluster = (x: number, z: number, scale = 1) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.set(scale, scale, scale);
    const ring = new THREE.Mesh(shrubRingGeo, rockMat);
    ring.position.y = 0.08;
    const s1 = new THREE.Mesh(shrubS1Geo, leafMat);
    s1.position.set(0, 0.45, 0);
    const s2 = new THREE.Mesh(shrubS2Geo, leafMat);
    s2.position.set(0.35, 0.32, 0.2);
    const s3 = new THREE.Mesh(shrubS3Geo, leafMat);
    s3.position.set(-0.32, 0.3, -0.22);
    g.add(ring, s1, s2, s3);
    world.add(g);
  };

  // Lamps along plaza & avenues
  [
    [-7.5, 2.2, Math.PI / 4],
    [7.5, 2.2, -Math.PI / 4],
    [13.5, 1.0, 0],
    [-14.5, -3.5, 0],
    [-13.5, 15.5, Math.PI / 4],
    [11.5, 15.5, -Math.PI / 4],
    [35.5, -19.5, 0],
    [-24, 16.5, Math.PI],
  ].forEach(([lx, lz, rot]) => addStreetLamp(lx, lz, rot));

  // Plaza Benches & Decorative Shrubs
  addParkBench(-6.8, 5.2, Math.PI / 2);
  addParkBench(6.8, 5.2, -Math.PI / 2);
  addShrubCluster(-8.5, -5.8, 1.05);
  addShrubCluster(8.5, -5.8, 1.05);
  addShrubCluster(-19, 14, 1.15);
  addShrubCluster(18, -9, 1.1);

  // =========================================================================
  // B. OUTDOOR PARK & SPRINT COMPLEX (East: x: 36, z: -2)
  // =========================================================================
  const trackGroup = new THREE.Group();
  trackGroup.position.set(36, 0.025, -2);
  const trackOuter = new THREE.Mesh(trackGeo(new THREE.RingGeometry(8.5, 13.6, 48)), trackMatPbr);
  trackOuter.rotation.x = -Math.PI / 2;
  trackOuter.scale.set(1.0, 1.45, 1.0);
  trackOuter.receiveShadow = true;
  trackGroup.add(trackOuter);

  const trackInnerCurb = new THREE.Mesh(trackGeo(new THREE.RingGeometry(8.25, 8.5, 48)), warmFabricMat);
  trackInnerCurb.rotation.x = -Math.PI / 2;
  trackInnerCurb.scale.set(1.0, 1.45, 1.0);
  trackInnerCurb.position.y = 0.004;
  trackGroup.add(trackInnerCurb);

  const infield = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(8.25, 36)), grassMat);
  infield.rotation.x = -Math.PI / 2;
  infield.scale.set(1.0, 1.45, 1.0);
  infield.position.y = 0.005;
  trackGroup.add(infield);
  world.add(trackGroup);

  // Infield Agility & Parkour Turf Pad (x: 36, z: -2)
  const parkTurf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.2, 0.04, 8.2)), turfMat);
  parkTurf.position.set(36, 0.02, -2);
  parkTurf.receiveShadow = true;
  world.add(parkTurf);
  addCollider(36, -2, 5.2, 8.2, false, 0.04, true);

  // Stepped Parkour Balance & Vault Blocks (along east edge of infield lawn: x = 39.8)
  [
    { z: -5.0, h: 0.32, accent: skyAccentMat },
    { z: -2.0, h: 0.52, accent: voltMat },
    { z: 1.0, h: 0.72, accent: orangeAccentMat },
  ].forEach(({ z, h, accent }) => {
    const bx = 39.8;
    const block = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.15, h, 1.15)), oakPlatMat);
    block.position.set(bx, h / 2, z);
    block.castShadow = true;
    block.receiveShadow = true;
    const rim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.05, 1.18)), accent);
    rim.position.set(bx, h - 0.025, z);
    world.add(block, rim);
    addCollider(bx, z, 1.16, 1.16, false, h, true);
  });

  // Slalom Hurdles along West side of Infield Lawn (x = 32.2)
  const hurdleBarGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8));
  const hurdleCrossGeo = trackGeo(new THREE.BoxGeometry(0.98, 0.06, 0.06));
  [-4.8, -2.6, -0.4, 1.8].forEach((hz) => {
    const hg = new THREE.Group();
    hg.position.set(32.2, 0.04, hz);
    const barL = new THREE.Mesh(hurdleBarGeo, steelDarkMat);
    barL.position.set(-0.45, 0.275, 0);
    const barR = barL.clone();
    barR.position.set(0.45, 0.275, 0);
    const cross = new THREE.Mesh(hurdleCrossGeo, orangeAccentMat);
    cross.position.set(0, 0.54, 0);
    hg.add(barL, barR, cross);
    world.add(hg);
  });

  // Sprint Start Timing Gate (x: 26.5, z: 4.5)
  const sprintArch = new THREE.Group();
  sprintArch.position.set(26.5, 0, 4.5);
  const sPostL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 3.3, 0.24)), steelDarkMat);
  sPostL.position.set(-2.4, 1.65, 0);
  sPostL.castShadow = true;
  const sPostR = sPostL.clone();
  sPostR.position.set(2.4, 1.65, 0);
  const sTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.2, 0.44, 0.3)), steelDarkMat);
  sTop.position.set(0, 3.3, 0);
  const sStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.8, 0.12, 0.32)), skyAccentMat);
  sStrip.position.set(0, 3.04, 0);
  const startMat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.4, 0.03, 0.7)), warmFabricMat);
  startMat.position.set(0, 0.035, 0);
  sprintArch.add(sPostL, sPostR, sTop, sStrip, startMat);
  world.add(sprintArch);
  addCollider(26.5 - 2.4, 4.5, 0.38, 0.38, false, 3.4);
  addCollider(26.5 + 2.4, 4.5, 0.38, 0.38, false, 3.4);

  addSign(22.5, 7.6, -Math.PI / 5, 'OUTDOOR PARK', 'Track · Calisthenics · Pond', '#38bdf8');

  // Expanded Outdoor Calisthenics & Street Workout Park (x: 36, z: -15)
  const caliPad = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.6, 0.06, 4.8)), rubberMat);
  caliPad.position.set(36, 0.03, -15);
  caliPad.receiveShadow = true;
  world.add(caliPad);
  addCollider(36, -15, 7.6, 4.8, false, 0.06, true);

  const buildOutdoorCalisthenicsPark = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.06, z);

    // Main High Pull-Up Bay + Overhead Monkey-Bar Span
    const caliPostGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 2.65, 10));
    const postPositions = [-1.9, 0, 1.9];
    postPositions.forEach((px) => {
      [-0.75, 0.75].forEach((pz) => {
        const post = new THREE.Mesh(caliPostGeo, steelDarkMat);
        post.position.set(px, 1.325, pz);
        post.castShadow = true;
        g.add(post);
      });
    });

    // High Pull-up bars + Neon Grips
    const highBarGeo = trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 3.9, 10));
    [-0.75, 0.75].forEach((bz) => {
      const topBar = new THREE.Mesh(highBarGeo, chromeMat);
      topBar.rotation.z = Math.PI / 2;
      topBar.position.set(0, 2.48, bz);
      g.add(topBar);
    });
    const caliGripGeo = trackGeo(new THREE.CylinderGeometry(0.038, 0.038, 0.35, 10));
    [-0.95, 0.95].forEach((gx) => {
      const grip = new THREE.Mesh(caliGripGeo, skyAccentMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(gx, 2.48, 0.75);
      g.add(grip);
    });
    // Monkey-bar rungs connecting front & back
    const rungGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 1.5, 8));
    for (let rx = -1.6; rx <= 1.6; rx += 0.45) {
      const rung = new THREE.Mesh(rungGeo, chromeMat);
      rung.rotation.x = Math.PI / 2;
      rung.position.set(rx, 2.52, 0);
      g.add(rung);
    }

    // Parallel Dip Station on right side
    [-0.36, 0.36].forEach((dz) => {
      const dipBar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 1.55, 8)), chromeMat);
      dipBar.rotation.z = Math.PI / 2;
      dipBar.position.set(2.75, 1.18, dz);
      const leg1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 1.18, 8)), steelDarkMat);
      leg1.position.set(2.1, 0.59, dz);
      const leg2 = leg1.clone();
      leg2.position.set(3.4, 0.59, dz);
      g.add(dipBar, leg1, leg2);
    });

    world.add(g);
    addCollider(x, z - 0.75, 4.1, 0.35, false, 2.65);
    addCollider(x + 2.75, z, 1.55, 0.95, false, 1.25);
  };
  buildOutdoorCalisthenicsPark(36, -15.2);
  addParkBench(31.2, -16.2, Math.PI / 6);

  // Reflecting Park Pond, Stone Rim & Shaded Timber Viewing Deck (x: 47.5, z: 10)
  const buildParkPondAndPergola = () => {
    const pondX = 48.2;
    const pondZ = 10.5;
    const water = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(4.4, 28)), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(pondX, 0.03, pondZ);
    world.add(water);

    // Stone Rim Boulders around Pond (with colliders so player stays dry on boardwalk)
    const boulderGeo = trackGeo(new THREE.DodecahedronGeometry(0.62, 0));
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rx = pondX + Math.cos(a) * 4.55;
      const rz = pondZ + Math.sin(a) * 4.55;
      // Leave west boardwalk gap clear
      if (rx < 44.8 && Math.abs(rz - 10.5) < 2.2) continue;
      const s = 0.92 + (i % 3) * 0.22;
      const rock = new THREE.Mesh(boulderGeo, rockMat);
      rock.position.set(rx, 0.24, rz);
      rock.scale.set(1.2 * s, 0.72 * s, 1.0 * s);
      rock.rotation.y = i * 0.8;
      rock.castShadow = true;
      world.add(rock);
    }
    addCollider(pondX + 1.0, pondZ, 6.2, 7.6, false, 0.8);

    // Walkable Timber Pier & Shaded Pergola (x: 42.4, z: 10.5)
    const pierX = 42.4;
    const pierZ = 10.5;
    const pier = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.4, 0.14, 4.6)), woodMat);
    pier.position.set(pierX, 0.07, pierZ);
    pier.receiveShadow = true;
    world.add(pier);
    addCollider(pierX, pierZ, 5.4, 4.6, false, 0.14, true);

    // 4 Pergola Timber Columns + Slatted Roof
    const pergolaColGeo = trackGeo(new THREE.BoxGeometry(0.22, 2.9, 0.22));
    [[-2.2, -1.9], [2.2, -1.9], [-2.2, 1.9], [2.2, 1.9]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(pergolaColGeo, timberMat);
      col.position.set(pierX + px, 1.52, pierZ + pz);
      col.castShadow = true;
      world.add(col);
      addCollider(pierX + px, pierZ + pz, 0.28, 0.28, true, 3.0);
    });
    const pergolaSlatGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.14, 4.4));
    for (let s = -2.2; s <= 2.2; s += 0.55) {
      const slat = new THREE.Mesh(pergolaSlatGeo, timberMat);
      slat.position.set(pierX + s, 3.02, pierZ);
      slat.castShadow = true;
      world.add(slat);
    }
    addParkBench(pierX - 0.4, pierZ - 1.1, 0);
  };
  buildParkPondAndPergola();

  // Covered Park Cycling Shelter (x: 22.5, z: -11.5)
  const buildBikeShelterAndFleet = (x: number, z: number) => {
    const pad = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.05, 6.2)), concreteMat);
    pad.position.set(x, 0.025, z);
    pad.receiveShadow = true;
    world.add(pad);
    addCollider(x, z, 2.6, 6.2, false, 0.05, true);

    // Shelter Posts & Slanted Canopy
    [-2.7, 2.7].forEach((pz) => {
      const p = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 2.55, 10)), steelDarkMat);
      p.position.set(x - 1.0, 1.3, z + pz);
      p.castShadow = true;
      world.add(p);
      addCollider(x - 1.0, z + pz, 0.25, 0.25, false, 2.6);
    });
    const roof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.5, 0.1, 6.0)), steelDarkMat);
    roof.position.set(x, 2.62, z);
    roof.rotation.z = -0.1;
    roof.castShadow = true;
    world.add(roof);

    // 3 Road Bikes
    [-1.9, 0, 1.9].forEach((bz) => {
      const g = new THREE.Group();
      g.position.set(x + 0.1, 0.05, z + bz);
      g.rotation.y = Math.PI / 2 - 0.15;
      const wheelGeo = trackGeo(new THREE.TorusGeometry(0.32, 0.04, 8, 20));
      const wFront = new THREE.Mesh(wheelGeo, steelDarkMat);
      wFront.rotation.y = Math.PI / 2;
      wFront.position.set(0, 0.36, 0.52);
      const wRear = wFront.clone();
      wRear.position.set(0, 0.36, -0.52);
      const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.07, 0.07, 1.0)), skyAccentMat);
      frame.position.set(0, 0.64, 0);
      const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.07, 0.24)), steelDarkMat);
      seat.position.set(0, 0.85, -0.25);
      const handle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8)), chromeMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0, 0.95, 0.42);
      g.add(wFront, wRear, frame, seat, handle);
      world.add(g);
      addCollider(x + 0.1, z + bz, 1.35, 0.6, false, 1.0);
    });
  };
  buildBikeShelterAndFleet(22.5, -11.5);

  // =========================================================================
  // C. PLAYER HOME — MODERN ATHLETE VILLA & COURTYARD (West: x: -34, z: -10)
  // =========================================================================
  const homeX = -34;
  const homeZ = -10;
  const homeW = 16;
  const homeD = 12.5;

  const homeFloor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(homeW, 0.05, homeD)), woodMat);
  homeFloor.position.set(homeX, 0.025, homeZ);
  homeFloor.receiveShadow = true;
  world.add(homeFloor);
  addCollider(homeX, homeZ, homeW, homeD, false, 0.05, true);

  // East Garden Stone Patio extending outside doorway (x: -24.2, z: -10)
  const patio = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.6, 0.04, 9.2)), parkPaverMat);
  patio.position.set(-24.2, 0.02, homeZ);
  patio.receiveShadow = true;
  world.add(patio);
  addCollider(-24.2, homeZ, 3.6, 9.2, false, 0.04, true);

  const addHomeWall = (x: number, z: number, w: number, d: number, lowerH: number, glassH: number) => {
    const lower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, lowerH, d)), wallLightMat);
    lower.position.set(x, lowerH / 2, z);
    lower.castShadow = true;
    lower.receiveShadow = true;
    world.add(lower);

    const glass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w * 0.98, glassH, d * 0.6)), glassMat);
    glass.position.set(x, lowerH + glassH / 2, z);
    world.add(glass);

    const topTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(w, 0.25, d * 1.1)), steelDarkMat);
    topTrim.position.set(x, lowerH + glassH + 0.12, z);
    world.add(topTrim);
    addCollider(x, z, w + 0.08, d + 0.08, true, lowerH + glassH + 0.25);
  };

  addHomeWall(homeX, homeZ - homeD / 2, homeW, 0.36, 2.3, 1.2); // North wall
  addHomeWall(homeX - homeW / 2, homeZ, 0.36, homeD, 2.1, 1.4); // West wall
  addHomeWall(homeX, homeZ + homeD / 2, homeW, 0.36, 0.85, 2.65); // South panoramic glass wall
  // East wall wings leaving 4.8m sliding glass entry (z: -12.4..-7.6)
  addHomeWall(homeX + homeW / 2, homeZ - 4.35, 0.36, 3.85, 0.75, 2.75);
  addHomeWall(homeX + homeW / 2, homeZ + 4.35, 0.36, 3.85, 0.75, 2.75);

  // Architectural Flat Roof + East Doorway Pergola Overhang + Violet Accent Trim
  const homeRoof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(homeW + 1.2, 0.24, homeD + 1.2)), steelDarkMat);
  homeRoof.position.set(homeX, 3.85, homeZ);
  homeRoof.castShadow = true;
  const homeTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.08, 5.2)), violetAccentMat);
  homeTrim.position.set(homeX + homeW / 2 + 0.56, 3.85, homeZ);
  world.add(homeRoof, homeTrim);

  // Warm Residential Interior Lighting (non-shadow PointLight)
  const homeWarmLight = new THREE.PointLight('#ffe8cc', 14, 18, 1.6);
  homeWarmLight.position.set(homeX, 3.45, homeZ);
  world.add(homeWarmLight);

  addSign(homeX + 10.2, homeZ + 4.8, Math.PI / 2, 'PLAYER HOME', 'Sleep · Recovery · Wardrobe', '#a78bfa');

  // Sleep & Recovery Alcove (x: -38.0, z: -13.0)
  const rug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.2, 0.015, 3.6)), charcoalFabricMat);
  rug.position.set(-37.8, 0.058, -12.8);
  world.add(rug);

  const bedGroup = new THREE.Group();
  bedGroup.position.set(-38.2, 0.05, -13.2);
  const bedFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 0.34, 2.7)), timberMat);
  bedFrame.position.set(0, 0.17, 0);
  bedFrame.castShadow = true;
  const headboard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.4, 1.05, 0.18)), charcoalFabricMat);
  headboard.position.set(0, 0.56, -1.28);
  const mattress = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.05, 0.26, 2.45)), warmFabricMat);
  mattress.position.set(0, 0.44, 0.05);
  const duvet = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.28, 1.55)), violetAccentMat);
  duvet.position.set(0, 0.46, 0.48);
  const pillowL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.16, 0.46)), warmFabricMat);
  pillowL.position.set(-0.5, 0.62, -0.82);
  const pillowR = pillowL.clone();
  pillowR.position.set(0.5, 0.62, -0.82);
  // Nightstand + glowing bedside lamp
  const stand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.52, 0.52)), timberMat);
  stand.position.set(1.52, 0.26, -0.95);
  const lampShade = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.18, 0.22, 12)), lampGlowMat);
  lampShade.position.set(1.52, 0.72, -0.95);
  bedGroup.add(bedFrame, headboard, mattress, duvet, pillowL, pillowR, stand, lampShade);
  world.add(bedGroup);
  addCollider(-37.8, -13.2, 3.2, 2.8, false, 1.1);

  // Wardrobe & Athlete Telemetry Console (x: -30.5, z: -14.3)
  const wardrobeGroup = new THREE.Group();
  wardrobeGroup.position.set(-30.5, 0.05, -14.4);
  const closetBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 2.3, 0.78)), steelDarkMat);
  closetBody.position.set(0, 1.15, 0);
  closetBody.castShadow = true;
  const mirror = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.15, 1.75, 0.05)), mirrorMat);
  mirror.position.set(-0.45, 1.18, 0.4);
  const closetAccent = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.32, 0.06, 0.8)), violetAccentMat);
  closetAccent.position.set(0, 2.32, 0);
  // Stats Terminal Desk beside wardrobe
  const desk = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.15, 0.85, 0.65)), timberMat);
  desk.position.set(1.9, 0.425, 0.05);
  const screenTex = trackTex(createHomeScreenTexture(maxAnisotropy));
  const screenMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: screenTex,
      emissiveMap: screenTex,
      emissive: '#ffffff',
      emissiveIntensity: 0.72,
      roughness: 0.25,
    }),
  );
  const monitor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.92, 0.56, 0.06)), [
    steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, screenMat, steelDarkMat,
  ]);
  monitor.position.set(1.9, 1.24, -0.05);
  wardrobeGroup.add(closetBody, mirror, closetAccent, desk, monitor);
  world.add(wardrobeGroup);
  addCollider(-29.7, -14.4, 4.1, 0.9, false, 2.35);

  // Recovery Lounge & Mobility Corner (x: -37.8, z: -6.6)
  const sofa = new THREE.Group();
  sofa.position.set(-38.0, 0.05, -6.5);
  const sofaBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.36, 0.95)), charcoalFabricMat);
  sofaBase.position.y = 0.18;
  sofaBase.castShadow = true;
  const sofaBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.52, 0.22)), charcoalFabricMat);
  sofaBack.position.set(0, 0.58, 0.36);
  const coffeeTable = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.35, 0.32, 0.7)), timberMat);
  coffeeTable.position.set(0, 0.16, -1.25);
  const yogaMat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.8, 0.03, 0.75)), violetAccentMat);
  yogaMat.position.set(3.4, 0.015, -0.4);
  sofa.add(sofaBase, sofaBack, coffeeTable, yogaMat);
  world.add(sofa);
  addCollider(-38.0, -6.5, 2.7, 1.1, false, 0.85);
  addCollider(-38.0, -7.75, 1.4, 0.75, false, 0.45);

  // Patio Planters & Lounge Chairs (flanking doorway, leaving center z=-10 clear!)
  [-13.0, -7.0].forEach((pz) => {
    const planter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.7, 0.48, 1.3)), timberMat);
    planter.position.set(-24.0, 0.26, pz);
    const bush = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.45, 1)), leafMat);
    bush.position.set(-24.0, 0.72, pz);
    world.add(planter, bush);
    addCollider(-24.0, pz, 0.8, 1.4, false, 1.1);
  });

  // =========================================================================
  // D. NUTRITION CENTER — ECO-CULINARY PAVILION (South-West: x: -24, z: 26)
  // =========================================================================
  const nutX = -24;
  const nutZ = 26;
  const nutDeck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(16.5, 0.06, 13.5)), woodMat);
  nutDeck.position.set(nutX, 0.03, nutZ);
  nutDeck.receiveShadow = true;
  world.add(nutDeck);
  addCollider(nutX, nutZ, 16.5, 13.5, false, 0.06, true);

  // Canopy Pavilion Pillars, Timber Beams & Skylight Roof
  [[-7.5, -6.0], [7.5, -6.0], [-7.5, 6.0], [7.5, 6.0]].forEach(([px, pz]) => {
    const p = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.2, 4.0, 12)), steelDarkMat);
    p.position.set(nutX + px, 2.0, nutZ + pz);
    p.castShadow = true;
    world.add(p);
    addCollider(nutX + px, nutZ + pz, 0.45, 0.45, true, 4.0);
  });

  const nutRoofLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.8, 0.22, 14.2)), steelDarkMat);
  nutRoofLeft.position.set(nutX - 4.8, 4.08, nutZ);
  nutRoofLeft.castShadow = true;
  const nutRoofRight = nutRoofLeft.clone();
  nutRoofRight.position.set(nutX + 4.8, 4.08, nutZ);
  const nutSkylight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 0.14, 13.8)), glassMat);
  nutSkylight.position.set(nutX, 4.12, nutZ);
  const nutTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(16.8, 0.08, 0.12)), emeraldAccentMat);
  nutTrim.position.set(nutX, 3.96, nutZ - 7.05);
  world.add(nutRoofLeft, nutRoofRight, nutSkylight, nutTrim);

  // Warm Pavilion Lighting (non-shadow PointLight)
  const nutLight = new THREE.PointLight('#dcfce7', 14, 19, 1.5);
  nutLight.position.set(nutX, 3.65, nutZ);
  world.add(nutLight);

  // Full Fuel Service Bar Counter (x: -24, z: 29.4) + Menu Board + Blenders + Stools
  const barGroup = new THREE.Group();
  barGroup.position.set(nutX, 0.06, 29.4);
  const barMain = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.0, 1.06, 1.15)), concreteMat);
  barMain.position.set(0, 0.53, 0);
  barMain.castShadow = true;
  const barTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.2, 0.08, 1.32)), warmFabricMat);
  barTop.position.set(0, 1.08, -0.04);
  const barLed = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.9, 0.07, 0.06)), emeraldAccentMat);
  barLed.position.set(0, 0.92, -0.59);

  // Hanging Digital Menu Board above Counter
  const menuTex = trackTex(createNutritionMenuTexture(maxAnisotropy));
  const menuMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: menuTex,
      emissiveMap: menuTex,
      emissive: '#ffffff',
      emissiveIntensity: 0.72,
      roughness: 0.28,
    }),
  );
  const menuBoard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(4.6, 1.65, 0.14)), [
    steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, menuMat, menuMat,
  ]);
  menuBoard.position.set(0, 2.85, 0.2);

  // Chilled Glass Display Case + Fruit/Bowl Props
  const displayGlass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.55, 0.65)), glassMat);
  displayGlass.position.set(-1.8, 1.4, 0);
  const fruitColors = ['#ef4444', '#f59e0b', '#22c55e', '#a855f7'];
  fruitColors.forEach((col, i) => {
    const bowl = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.18, 12, 10)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.42 })),
    );
    bowl.position.set(-2.65 + i * 0.56, 1.28, 0);
    barGroup.add(bowl);
  });

  // Two Smoothie Blenders on Right Side of Counter
  [1.4, 2.4].forEach((bx) => {
    const bBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 12)), steelDarkMat);
    bBase.position.set(bx, 1.21, 0);
    const bPitcher = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.13, 0.1, 0.34, 12)), glassMat);
    bPitcher.position.set(bx, 1.47, 0);
    barGroup.add(bBase, bPitcher);
  });

  // 4 Bar Stools in front of Counter (z = -1.35 relative -> world z = 28.05)
  [-2.4, -0.8, 0.8, 2.4].forEach((sx) => {
    const stem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.68, 10)), chromeMat);
    stem.position.set(sx, 0.34, -1.25);
    const stoolTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 14)), timberMat);
    stoolTop.position.set(sx, 0.7, -1.25);
    barGroup.add(stem, stoolTop);
  });

  barGroup.add(barMain, barTop, barLed, menuBoard, displayGlass);
  world.add(barGroup);
  addCollider(nutX, 29.4, 8.2, 1.4, false, 1.2);
  addCollider(nutX, 28.15, 5.4, 0.65, false, 0.8);

  // Bistro Dining Tables with Parasol Umbrellas (flanking North entry aisle)
  const buildBistroSet = (tx: number, tz: number, umbrellaColor: string) => {
    const g = new THREE.Group();
    g.position.set(tx, 0.06, tz);
    const pedestal = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.28, 0.74, 12)), steelDarkMat);
    pedestal.position.y = 0.37;
    const tableTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 18)), warmFabricMat);
    tableTop.position.y = 0.76;
    tableTop.castShadow = true;
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 2.35, 8)), chromeMat);
    pole.position.y = 1.25;
    const canopy = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(1.32, 0.45, 8)),
      trackMat(new THREE.MeshStandardMaterial({ color: umbrellaColor, roughness: 0.7 })),
    );
    canopy.position.y = 2.42;
    canopy.castShadow = true;
    g.add(pedestal, tableTop, pole, canopy);

    [-0.95, 0.95].forEach((cx) => {
      const chair = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 0.46, 0.42)), timberMat);
      chair.position.set(cx, 0.23, 0);
      g.add(chair);
    });
    world.add(g);
    addCollider(tx, tz, 2.1, 1.35, false, 1.0);
  };
  buildBistroSet(nutX - 5.2, nutZ - 2.6, '#10b981');
  buildBistroSet(nutX + 5.2, nutZ - 2.6, '#8DAF26');

  // Raised Produce Planter Boxes at Pavilion Corners
  [[-6.4, -5.0], [6.4, -5.0]].forEach(([px, pz]) => {
    const box = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.2, 0.55, 0.85)), timberMat);
    box.position.set(nutX + px, 0.33, nutZ + pz);
    const greens = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.0, 0.32, 0.65)), leafMat);
    greens.position.set(nutX + px, 0.72, nutZ + pz);
    world.add(box, greens);
    addCollider(nutX + px, nutZ + pz, 2.3, 0.95, false, 1.0);
  });

  addSign(nutX + 5.8, nutZ - 7.0, Math.PI * 0.85, 'NUTRITION PAVILION', 'Meals · Macros · Hydration', '#34d399');

  // =========================================================================
  // E. SUMMIT COMPETITION ARENA (South-East: x: 26, z: 28)
  // =========================================================================
  const arX = 26;
  const arZ = 28;

  // Stepped Octagonal Stadium Deck (step ring y=0.14 + main deck y=0.28)
  const arenaStepRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(13.5, 13.9, 0.14, 8)), parkPaverMat);
  arenaStepRing.position.set(arX, 0.07, arZ);
  arenaStepRing.receiveShadow = true;
  world.add(arenaStepRing);
  addPlatform(arX, arZ, 13.7, 0.14);

  const arenaBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(12.5, 13.0, 0.28, 8)), concreteMat);
  arenaBase.position.set(arX, 0.14, arZ);
  arenaBase.receiveShadow = true;
  world.add(arenaBase);
  addPlatform(arX, arZ, 12.6, 0.28);

  const arenaTrim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(12.3, 0.12, 8, 8)), orangeAccentMat);
  arenaTrim.rotation.x = Math.PI / 2;
  arenaTrim.rotation.z = Math.PI / 8;
  arenaTrim.position.set(arX, 0.3, arZ);
  world.add(arenaTrim);

  // Center Winner's & Challenger Podium (height 0.50 matching physics test expectations)
  const podium = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.2, 2.5, 0.22, 16)), steelDarkMat);
  podium.position.set(arX, 0.39, arZ);
  const podiumRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(1.75, 2.05, 24)), orangeAccentMat);
  podiumRing.rotation.x = -Math.PI / 2;
  podiumRing.position.set(arX, 0.505, arZ);
  world.add(podium, podiumRing);
  addPlatform(arX, arZ, 2.35, 0.5);

  // Arena Warm-Up Conditioning Pad (West side of Arena Deck: x: 18.2, z: 28)
  const warmupTurf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 0.03, 4.4)), turfMat);
  warmupTurf.position.set(18.2, 0.295, arZ);
  warmupTurf.receiveShadow = true;
  world.add(warmupTurf);

  // 3 Tiered Spectator Bleacher Banks (North-East, South-East, South-West)
  const bleacherBenchGeo = trackGeo(new THREE.BoxGeometry(5.8, 0.36, 0.68));
  const bleacherRailGeo = trackGeo(new THREE.BoxGeometry(5.8, 0.9, 0.1));
  const buildBleacherBank = (bx: number, bz: number, rotY: number) => {
    const g = new THREE.Group();
    g.position.set(bx, 0.28, bz);
    g.rotation.y = rotY;
    for (let tier = 0; tier < 3; tier++) {
      const bench = new THREE.Mesh(
        bleacherBenchGeo,
        tier === 1 ? orangeAccentMat : steelDarkMat,
      );
      bench.position.set(0, 0.18 + tier * 0.38, -tier * 0.72);
      bench.castShadow = true;
      g.add(bench);
    }
    const backRail = new THREE.Mesh(bleacherRailGeo, steelDarkMat);
    backRail.position.set(0, 1.4, -1.8);
    g.add(backRail);
    world.add(g);
    addCollider(bx, bz, 4.6, 3.2, true, 1.85);
  };
  buildBleacherBank(arX + 6.4, arZ - 5.2, -Math.PI * 0.25);
  buildBleacherBank(arX + 6.4, arZ + 5.2, -Math.PI * 0.75);
  buildBleacherBank(arX - 6.4, arZ + 5.2, Math.PI * 0.75);

  // Grand Stadium Jumbotron Arch (South edge of Arena: x: 26, z: 38.6)
  const buildArenaJumbotron = (jx: number, jz: number) => {
    const g = new THREE.Group();
    g.position.set(jx, 0.28, jz);
    const towerL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.42, 6.2, 0.42)), steelDarkMat);
    towerL.position.set(-3.2, 3.1, 0);
    towerL.castShadow = true;
    const towerR = towerL.clone();
    towerR.position.set(3.2, 3.1, 0);

    const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.2, 2.75, 0.35)), steelDarkMat);
    frame.position.set(0, 4.75, 0);
    frame.castShadow = true;

    const scoreTex = trackTex(createArenaScoreboardTexture(maxAnisotropy));
    const scoreMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: scoreTex,
        emissiveMap: scoreTex,
        emissive: '#ffffff',
        emissiveIntensity: 0.78,
        roughness: 0.25,
      }),
    );
    const screen = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6.6, 2.3)), scoreMat);
    screen.position.set(0, 4.75, -0.19);
    screen.rotation.y = Math.PI; // Faces North (-Z) into Arena center!
    const topBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(7.3, 0.12, 0.4)), orangeAccentMat);
    topBar.position.set(0, 6.18, 0);

    g.add(towerL, towerR, frame, screen, topBar);
    world.add(g);
    addCollider(jx - 3.2, jz, 0.6, 0.6, true, 6.2);
    addCollider(jx + 3.2, jz, 0.6, 0.6, true, 6.2);
  };
  buildArenaJumbotron(arX, arZ + 10.6);

  // 4 Floodlight Pylons around Arena + Stadium Spotlight Glow (non-shadow)
  [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([lx, lz]) => {
    const pylon = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.24, 6.4, 10)), steelDarkMat);
    pylon.position.set(arX + lx, 3.2, arZ + lz);
    pylon.castShadow = true;
    const lightHead = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.2, 0.44, 0.42)),
      trackMat(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f97316', emissiveIntensity: 0.75 })),
    );
    lightHead.position.set(arX + lx, 6.4, arZ + lz);
    lightHead.lookAt(arX, 0, arZ);
    world.add(pylon, lightHead);
    addCollider(arX + lx, arZ + lz, 0.55, 0.55, true, 6.4);
  });

  const arenaStageLight = new THREE.PointLight('#ffedd5', 16, 22, 1.5);
  arenaStageLight.position.set(arX, 6.0, arZ);
  world.add(arenaStageLight);

  addSign(arX - 9.8, arZ - 11.8, -Math.PI * 0.78, 'COMPETITION ARENA', 'Timed Trials · Tier Unlocks', '#f97316');

  // Subtle decorative gym/outdoor info sign on plaza-facing Outdoor trail
  const parkInfoTex = trackTex(
    createGymWallMuralTexture('CAMPUS LOOP', 'Connected 5-District World', '#C7FF00', maxAnisotropy),
  );
  const parkInfoMat = trackMat(new THREE.MeshStandardMaterial({ map: parkInfoTex, roughness: 0.42 }));
  const infoPanel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 1.0, 0.14)), [
    steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, parkInfoMat, parkInfoMat,
  ]);
  infoPanel.position.set(0, 1.6, 12.2);
  const infoPostL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 2.1, 0.12)), steelDarkMat);
  infoPostL.position.set(-1.15, 1.05, 12.2);
  const infoPostR = infoPostL.clone();
  infoPostR.position.set(1.15, 1.05, 12.2);
  world.add(infoPanel, infoPostL, infoPostR);
  addCollider(0, 12.2, 2.7, 0.4, false, 2.2);
}
