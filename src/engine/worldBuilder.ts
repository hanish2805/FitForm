import * as THREE from 'three';
import { INTERACTIVE_STATIONS, WORLD_LOCATIONS } from '../data/worldLocations';
import { buildDetailedGym } from './gymBuilder';
import { buildWorldDistricts } from './districtsBuilder';
import { ColliderBox, CylinderPlatform, WorldCollisionData } from './physics';
import {
  createContactShadowTexture,
  createGrassTexture,
  createGymRubberTexture,
  createSignTexture,
  createTrackTexture,
  createWalkwayTexture,
  createWoodFloorTexture,
} from './textures';

export interface WorldBuildResult {
  group: THREE.Group;
  collisionData: WorldCollisionData;
  beacons: Map<string, THREE.Group>;
  waypointBeacon: THREE.Group;
  contactShadowTex: THREE.CanvasTexture;
  dispose: () => void;
}

export function buildFitnessWorld(maxAnisotropy: number): WorldBuildResult {
  const world = new THREE.Group();
  const colliders: ColliderBox[] = [];
  const platforms: CylinderPlatform[] = [];
  const beacons = new Map<string, THREE.Group>();
  const disposables: { dispose: () => void }[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    disposables.push(t);
    return t;
  };

  // Shared procedural textures
  const grassTex = trackTex(createGrassTexture(maxAnisotropy));
  const rubberTex = trackTex(createGymRubberTexture(maxAnisotropy));
  const trackTexMap = trackTex(createTrackTexture(maxAnisotropy));
  const walkwayTex = trackTex(createWalkwayTexture(maxAnisotropy));
  const woodTex = trackTex(createWoodFloorTexture(maxAnisotropy));
  const contactShadowTex = trackTex(createContactShadowTexture());

  // Shared PBR Materials
  const grassMat = trackMat(new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92, metalness: 0.0 }));
  const walkwayMat = trackMat(new THREE.MeshStandardMaterial({ map: walkwayTex, roughness: 0.78, metalness: 0.05 }));
  const rubberMat = trackMat(new THREE.MeshStandardMaterial({ map: rubberTex, roughness: 0.8, metalness: 0.05 }));
  const woodMat = trackMat(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65, metalness: 0.06 }));
  const trackMatPbr = trackMat(new THREE.MeshStandardMaterial({ map: trackTexMap, roughness: 0.85, metalness: 0.02 }));
  const steelDarkMat = trackMat(new THREE.MeshStandardMaterial({ color: '#1b221e', roughness: 0.35, metalness: 0.82 }));
  const chromeMat = trackMat(new THREE.MeshStandardMaterial({ color: '#d9e0dc', roughness: 0.18, metalness: 0.94 }));
  const concreteMat = trackMat(new THREE.MeshStandardMaterial({ color: '#353d38', roughness: 0.82, metalness: 0.06 }));
  const wallLightMat = trackMat(new THREE.MeshStandardMaterial({ color: '#1d2621', roughness: 0.68, metalness: 0.15 }));
  const voltMat = trackMat(new THREE.MeshStandardMaterial({ color: '#C7FF00', roughness: 0.25, metalness: 0.35, emissive: '#C7FF00', emissiveIntensity: 0.4 }));
  const glassMat = trackMat(new THREE.MeshPhysicalMaterial({ color: '#8ab4a8', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.32 }));

  const addCollider = (
    cx: number,
    cz: number,
    w: number,
    d: number,
    blocksCamera = true,
    height = 3.5,
    walkableTop = false,
  ) => {
    colliders.push({
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
      blocksCamera,
      height,
      walkableTop,
    });
  };

  const addPlatform = (x: number, z: number, radius: number, height: number) => {
    platforms.push({ x, z, radius, height });
  };

  // 1. Expansive Ground Terrain (extends well beyond playable [-62, 62] bounds)
  const ground = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(340, 340)), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  // Central Plaza Hub
  const plaza = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(8.5, 8.8, 0.04, 32)), walkwayMat);
  plaza.position.set(0, 0.02, 5);
  plaza.receiveShadow = true;
  world.add(plaza);

  const plazaRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(7.9, 8.2, 32)), voltMat);
  plazaRing.rotation.x = -Math.PI / 2;
  plazaRing.position.set(0, 0.045, 5);
  world.add(plazaRing);

  // Helper to build Signage Pillars
  const addSign = (x: number, z: number, rotY: number, title: string, subtitle: string, accent: string) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, 0, z);
    signGroup.rotation.y = rotY;
    const postL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 2.5, 0.14)), steelDarkMat);
    postL.position.set(-1.3, 1.25, 0);
    const postR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 2.5, 0.14)), steelDarkMat);
    postR.position.set(1.3, 1.25, 0);
    const tex = trackTex(createSignTexture(title, subtitle, accent, maxAnisotropy));
    const boardMat = trackMat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.2 }));
    const board = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.9, 0.95, 0.16)), [
      steelDarkMat, steelDarkMat, steelDarkMat, steelDarkMat, boardMat, boardMat,
    ]);
    board.position.set(0, 2.1, 0);
    board.castShadow = true;
    signGroup.add(postL, postR, board);
    world.add(signGroup);
    addCollider(x, z, 2.9, 0.45, false, 2.6);
  };

  // =========================================================================
  // A. TRAINING CENTER (Detailed Explorable 3D Gym at x: 0, z: -18)
  // =========================================================================
  buildDetailedGym({
    world,
    maxAnisotropy,
    trackGeo,
    trackMat,
    trackTex,
    addCollider,
    addSign,
    materials: {
      rubberMat,
      steelDarkMat,
      chromeMat,
      concreteMat,
      wallLightMat,
      voltMat,
      glassMat,
    },
  });

  // =========================================================================
  // B-E. CONNECTED CAMPUS + OUTDOOR PARK, PLAYER HOME, NUTRITION & ARENA
  // =========================================================================
  buildWorldDistricts({
    world,
    maxAnisotropy,
    trackGeo,
    trackMat,
    trackTex,
    addCollider,
    addPlatform,
    addSign,
    materials: {
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
    },
  });

  // =========================================================================
  // INSTANCED TREES & NATURAL OUTDOOR PERIMETER (Zero rectangular wall box)
  // =========================================================================
  const treePositions: [number, number, number][] = [];
  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    const ringDist = 66 + (i % 5) * 7.5;
    const tx = Math.cos(angle) * ringDist + Math.sin(i * 3.1) * 4;
    const tz = Math.sin(angle) * ringDist + Math.cos(i * 2.7) * 4;
    const scale = 0.85 + (i % 7) * 0.06;
    treePositions.push([tx, tz, scale]);
  }
  // Campus park trees near outdoor trails & districts (with trunk colliders!)
  [
    [17, -25, 1.05], [22, -26, 0.92], [51, -22, 1.1], [55, 16, 1.0],
    [-16, 10, 0.95], [-47, 14, 1.08], [-48, -24, 1.0], [8, 44, 1.12],
    [45, -18, 0.96], [-41, 22, 1.04],
  ].forEach(([tx, tz, s]) => {
    treePositions.push([tx, tz, s]);
    addCollider(tx, tz, 0.7 * s, 0.7 * s, false, 3.5);
  });

  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.34, 2.4, 8));
  const trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: '#4a3525', roughness: 0.9 }));
  const canopyGeo = trackGeo(new THREE.DodecahedronGeometry(1.65, 1));
  const canopyMat = trackMat(new THREE.MeshStandardMaterial({ color: '#2f5e35', roughness: 0.82 }));

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length);
  trunks.castShadow = true;
  canopies.castShadow = true;
  canopies.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  treePositions.forEach(([tx, tz, s], idx) => {
    dummy.position.set(tx, 1.2 * s, tz);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = idx * 0.9;
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(tx, 3.2 * s, tz);
    dummy.scale.set(s * 1.1, s * 1.25, s * 1.1);
    dummy.updateMatrix();
    canopies.setMatrixAt(idx, dummy.matrix);

    tint.setHSL(0.32 + (idx % 5) * 0.015, 0.38, 0.25 + (idx % 4) * 0.04);
    canopies.setColorAt(idx, tint);
  });
  trunks.computeBoundingSphere();
  canopies.computeBoundingSphere();
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
  world.add(trunks, canopies);

  // =========================================================================
  // INTERACTIVE STATION BEACONS
  // =========================================================================
  const ringGeo = trackGeo(new THREE.RingGeometry(0.85, 1.05, 32));
  const diamondGeo = trackGeo(new THREE.OctahedronGeometry(0.22, 0));

  INTERACTIVE_STATIONS.forEach((st) => {
    const loc = WORLD_LOCATIONS.find((l) => l.id === st.locationId);
    const col = loc?.accentColor ?? '#C7FF00';
    const bMat = trackMat(
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.72, side: THREE.DoubleSide }),
    );
    const beacon = new THREE.Group();
    beacon.position.set(st.x, st.y + 0.06, st.z);

    const ring = new THREE.Mesh(ringGeo, bMat);
    ring.rotation.x = -Math.PI / 2;
    const diamond = new THREE.Mesh(diamondGeo, bMat);
    diamond.position.y = 1.65;
    beacon.add(ring, diamond);

    world.add(beacon);
    beacons.set(st.id, beacon);
  });

  // Navigation Waypoint Sky Beam (shown when player selects a destination on the map)
  const waypointBeacon = new THREE.Group();
  waypointBeacon.visible = false;
  const beamMat = trackMat(
    new THREE.MeshBasicMaterial({ color: '#C7FF00', transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }),
  );
  const beam = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.85, 18, 16, 1, true)), beamMat);
  beam.position.y = 9;
  const beamRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(1.3, 1.65, 32)), beamMat);
  beamRing.rotation.x = -Math.PI / 2;
  beamRing.position.y = 0.08;
  waypointBeacon.add(beam, beamRing);
  world.add(waypointBeacon);

  return {
    group: world,
    collisionData: {
      colliders,
      platforms,
      worldBounds: 62,
    },
    beacons,
    waypointBeacon,
    contactShadowTex,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
