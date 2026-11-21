import * as THREE from 'three';
import { OUTFIT_CATALOG } from '../data/missions';
import { CharacterConfig, ExerciseId } from '../types/game';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | ExerciseId;

export interface CharacterJoints {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  formIndicatorRing: THREE.Mesh;
  formIndicatorCore: THREE.Mesh;
}

export interface LocomotionAnimOptions {
  dt?: number;
  speedRatio?: number;
  landingImpact?: number;
  verticalVelocity?: number;
  /** Optional 0..1 rep depth pulse (0 = ready top lockout, 1 = peak contraction/bottom). */
  repPhase?: number;
}

export interface CharacterRig {
  group: THREE.Group;
  joints: CharacterJoints;
  updateAppearance: (config: CharacterConfig) => void;
  animate: (
    state: CharacterAnimState,
    time: number,
    formMode?: 'correct' | 'mistake',
    showFormIndicators?: boolean,
    loco?: LocomotionAnimOptions,
  ) => void;
  dispose: () => void;
}

export function createCharacterRig(initialConfig: CharacterConfig): CharacterRig {
  const root = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  // Dynamic materials updated by updateAppearance
  const skinMat = trackMat(new THREE.MeshStandardMaterial({ color: initialConfig.skinTone, roughness: 0.58, metalness: 0.04 }));
  const hairMat = trackMat(new THREE.MeshStandardMaterial({ color: initialConfig.hairColor, roughness: 0.72, metalness: 0.08 }));
  const primaryOutfitMat = trackMat(new THREE.MeshStandardMaterial({ color: '#18211b', roughness: 0.55, metalness: 0.12 }));
  const secondaryOutfitMat = trackMat(new THREE.MeshStandardMaterial({ color: '#253229', roughness: 0.65, metalness: 0.08 }));
  const accentMat = trackMat(new THREE.MeshStandardMaterial({ color: '#C7FF00', roughness: 0.28, metalness: 0.65, emissive: '#C7FF00', emissiveIntensity: 0.16 }));
  const shoeMat = trackMat(new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.42, metalness: 0.15 }));
  const visorMat = trackMat(new THREE.MeshPhysicalMaterial({ color: '#101815', roughness: 0.12, metalness: 0.85, clearcoat: 1.0 }));

  // Build hierarchical skeletal rig anchored at bottom-center (y = 0)
  const hips = new THREE.Group();
  hips.position.set(0, 0.94, 0);
  root.add(hips);

  // Pelvis
  const pelvisGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.16, 0.2));
  const pelvis = new THREE.Mesh(pelvisGeo, secondaryOutfitMat);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Torso pivot
  const torso = new THREE.Group();
  torso.position.set(0, 0.08, 0);
  hips.add(torso);

  const waistMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.155, 0.138, 0.22, 14)), primaryOutfitMat);
  waistMesh.position.y = 0.11;
  waistMesh.castShadow = true;
  torso.add(waistMesh);

  const chestMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.38, 0.3, 0.22)), primaryOutfitMat);
  chestMesh.position.y = 0.35;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Athletic chest stripe accent
  const chestStripe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.39, 0.04, 0.23)), accentMat);
  chestStripe.position.y = 0.41;
  torso.add(chestStripe);

  // Collar / Neck
  const neckMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 12)), skinMat);
  neckMesh.position.y = 0.54;
  torso.add(neckMesh);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.61, 0);
  torso.add(headGroup);

  const headMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.128, 18, 16)), skinMat);
  headMesh.position.y = 0.1;
  headMesh.scale.set(0.92, 1.08, 0.98);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Eyes / brow detail for clear facing read
  const eyeGeo = trackGeo(new THREE.BoxGeometry(0.032, 0.018, 0.02));
  const eyeMat = trackMat(new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.2 }));
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.042, 0.115, 0.115);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.042, 0.115, 0.115);
  headGroup.add(leftEye, rightEye);

  // Hair variants
  const hairFade = new THREE.Group();
  const hairTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.21, 0.09, 0.22)), hairMat);
  hairTop.position.set(0, 0.21, -0.01);
  hairFade.add(hairTop);

  const hairPonytail = new THREE.Group();
  const hairCap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58)), hairMat);
  hairCap.position.set(0, 0.12, -0.01);
  const tail = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.035, 0.022, 0.22, 10)), hairMat);
  tail.position.set(0, 0.11, -0.15);
  tail.rotation.x = 0.55;
  hairPonytail.add(hairCap, tail);

  const hairBuzz = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
    hairMat,
  );
  hairBuzz.position.set(0, 0.11, -0.01);

  const hairWaves = new THREE.Group();
  const waveBase = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.142, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65)), hairMat);
  waveBase.position.set(0, 0.12, -0.02);
  const waveCrest = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.07, 0.24)), hairMat);
  waveCrest.position.set(0, 0.21, 0.02);
  waveCrest.rotation.x = -0.12;
  hairWaves.add(waveBase, waveCrest);

  headGroup.add(hairFade, hairPonytail, hairBuzz, hairWaves);

  // Accessories
  const headbandMesh = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.126, 0.018, 8, 24)), accentMat);
  headbandMesh.position.set(0, 0.16, 0);
  headbandMesh.rotation.x = Math.PI / 2;
  headGroup.add(headbandMesh);

  const visorMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.21, 0.048, 0.08)), visorMat);
  visorMesh.position.set(0, 0.12, 0.105);
  const visorRim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.215, 0.012, 0.085)), accentMat);
  visorRim.position.set(0, 0.145, 0.105);
  const visorGroup = new THREE.Group();
  visorGroup.add(visorMesh, visorRim);
  headGroup.add(visorGroup);

  // Helper to construct articulated arm
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.245, 0.45, 0);
    torso.add(shoulder);

    const shoulderCap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.068, 12, 10)), primaryOutfitMat);
    shoulderCap.castShadow = true;
    shoulder.add(shoulderCap);

    const upperArm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.052, 0.044, 0.27, 12)), skinMat);
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.28, 0);
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.043, 0.035, 0.25, 12)), skinMat);
    forearm.position.y = -0.125;
    forearm.castShadow = true;
    elbow.add(forearm);

    const wristband = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.06, 12)), accentMat);
    wristband.position.y = -0.21;
    elbow.add(wristband);

    const hand = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.04, 10, 10)), skinMat);
    hand.position.y = -0.265;
    elbow.add(hand);

    return { shoulder, elbow, wristband };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // Helper to construct articulated leg
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.105, -0.06, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.072, 0.056, 0.41, 12)), secondaryOutfitMat);
    thigh.position.y = -0.205;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.42, 0);
    hip.add(knee);

    const shin = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.052, 0.04, 0.39, 12)), skinMat);
    shin.position.y = -0.195;
    shin.castShadow = true;
    knee.add(shin);

    const shoeBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.095, 0.075, 0.21)), shoeMat);
    shoeBase.position.set(0, -0.42, 0.045);
    shoeBase.castShadow = true;
    knee.add(shoeBase);

    const shoeSole = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.1, 0.024, 0.22)), accentMat);
    shoeSole.position.set(0, -0.455, 0.045);
    knee.add(shoeSole);

    return { hip, knee };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // Form indicator guides (used in 3D Exercise Demonstration mode)
  const formIndicatorMat = trackMat(
    new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
  );
  const formIndicatorRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(0.58, 0.68, 36)), formIndicatorMat);
  formIndicatorRing.rotation.x = -Math.PI / 2;
  formIndicatorRing.position.y = 0.03;
  formIndicatorRing.visible = false;
  root.add(formIndicatorRing);

  const formIndicatorCore = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.24, 0.016, 8, 28)), formIndicatorMat);
  formIndicatorCore.rotation.x = Math.PI / 2;
  formIndicatorCore.position.set(0, 0.02, 0);
  formIndicatorCore.visible = false;
  hips.add(formIndicatorCore);

  const updateAppearance = (config: CharacterConfig) => {
    const outfit = OUTFIT_CATALOG[config.outfit] ?? OUTFIT_CATALOG.volt_pro;
    skinMat.color.set(config.skinTone);
    hairMat.color.set(config.hairColor);
    primaryOutfitMat.color.set(outfit.primaryHex);
    secondaryOutfitMat.color.set(outfit.secondaryHex);
    accentMat.color.set(outfit.accentHex);
    accentMat.emissive.set(outfit.accentHex);

    // Body build proportions
    if (config.bodyModel === 'athlete_power') {
      torso.scale.set(1.14, 1.02, 1.12);
      hips.scale.set(1.06, 1.0, 1.06);
    } else if (config.bodyModel === 'athlete_endurance') {
      torso.scale.set(0.92, 1.04, 0.92);
      hips.scale.set(0.95, 1.02, 0.95);
    } else {
      torso.scale.set(1.0, 1.0, 1.0);
      hips.scale.set(1.0, 1.0, 1.0);
    }

    // Hairstyle visibility
    hairFade.visible = config.hairstyle === 'fade';
    hairPonytail.visible = config.hairstyle === 'ponytail';
    hairBuzz.visible = config.hairstyle === 'buzz';
    hairWaves.visible = config.hairstyle === 'waves';

    // Accessories
    headbandMesh.visible = config.accessory === 'headband';
    visorGroup.visible = config.accessory === 'smart_visor';
    const showWristbands = config.accessory === 'wristbands';
    leftArm.wristband.visible = showWristbands;
    rightArm.wristband.visible = showWristbands;
  };

  updateAppearance(initialConfig);

  const resetPose = () => {
    hips.position.set(0, 0.94, 0);
    hips.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);
    leftArm.shoulder.rotation.set(0, 0, 0);
    leftArm.elbow.rotation.set(0, 0, 0);
    rightArm.shoulder.rotation.set(0, 0, 0);
    rightArm.elbow.rotation.set(0, 0, 0);
    leftLeg.hip.rotation.set(0, 0, 0);
    leftLeg.knee.rotation.set(0, 0, 0);
    rightLeg.hip.rotation.set(0, 0, 0);
    rightLeg.knee.rotation.set(0, 0, 0);
  };

  const dampVal = (curr: number, target: number, lambda: number, dt: number) =>
    dt > 0 ? THREE.MathUtils.damp(curr, target, lambda, dt) : target;

  const animate = (
    state: CharacterAnimState,
    time: number,
    formMode: 'correct' | 'mistake' = 'correct',
    showFormIndicators = false,
    loco?: LocomotionAnimOptions,
  ) => {
    formIndicatorRing.visible = showFormIndicators;
    formIndicatorCore.visible = showFormIndicators;
    if (showFormIndicators) {
      formIndicatorMat.color.set(formMode === 'correct' ? '#22c55e' : '#ef4444');
    }

    const mistake = formMode === 'mistake';
    const dt = loco?.dt ?? 0;
    const isLocomotion = state === 'idle' || state === 'walk' || state === 'run' || state === 'jump';

    if (isLocomotion) {
      const landing = loco?.landingImpact ?? 0;
      const speedRatio = loco?.speedRatio ?? 1;
      const vy = loco?.verticalVelocity ?? 0;
      const lambda = dt > 0 ? 16 : 999;

      let hipY = 0.94 - landing * 0.14;
      let hipRx = 0;
      let torsoRx = 0.02 + landing * 0.18;
      let torsoRy = 0;
      let lShRx = 0;
      let lShRz = -0.09;
      let lElRx = -0.18;
      let rShRx = 0;
      let rShRz = 0.09;
      let rElRx = -0.18;
      let lHipRx = 0;
      let lKneeRx = landing * 0.48;
      let rHipRx = 0;
      let rKneeRx = landing * 0.48;

      if (state === 'idle') {
        const b = Math.sin(time * 2.2);
        hipY += b * 0.012;
        torsoRx += b * 0.015;
      } else if (state === 'walk') {
        const amp = THREE.MathUtils.clamp(speedRatio, 0.25, 1.15);
        const c = time * 7.6;
        const swing = Math.sin(c) * 0.56 * amp;
        hipY += Math.abs(Math.cos(c)) * 0.036 * amp;
        torsoRx = 0.07 * amp + landing * 0.14;
        torsoRy = -swing * 0.18;
        lHipRx = swing;
        rHipRx = -swing;
        lKneeRx += Math.max(0, -Math.cos(c) * 0.48 * amp);
        rKneeRx += Math.max(0, Math.cos(c) * 0.48 * amp);
        lShRx = -swing * 0.72;
        rShRx = swing * 0.72;
        lElRx = -0.32;
        rElRx = -0.32;
      } else if (state === 'run') {
        const amp = THREE.MathUtils.clamp(speedRatio, 0.5, 1.2);
        const c = time * 12.2;
        const swing = Math.sin(c) * 0.92 * amp;
        hipY = 0.91 - landing * 0.1 + Math.abs(Math.cos(c)) * 0.08 * amp;
        torsoRx = (mistake ? 0.42 : 0.24) * amp;
        torsoRy = -swing * 0.24;
        lHipRx = swing;
        rHipRx = -swing;
        lKneeRx += Math.max(0.06, -Math.cos(c) * 0.95 * amp);
        rKneeRx += Math.max(0.06, Math.cos(c) * 0.95 * amp);
        lShRx = -swing * 0.95;
        rShRx = swing * 0.95;
        lShRz = mistake ? -0.35 : -0.06;
        rShRz = mistake ? 0.35 : 0.06;
        lElRx = -1.35;
        rElRx = -1.35;
      } else if (state === 'jump') {
        const rising = vy >= -0.8;
        hipY = rising ? 0.98 : 0.94;
        torsoRx = rising ? 0.12 : 0.2;
        lHipRx = rising ? -0.52 : -0.32;
        lKneeRx = rising ? 0.92 : 0.55;
        rHipRx = rising ? -0.28 : -0.45;
        rKneeRx = rising ? 0.58 : 0.75;
        lShRx = rising ? -2.05 : -1.35;
        rShRx = rising ? -2.05 : -1.35;
        lShRz = -0.24;
        rShRz = 0.24;
      }

      hips.position.set(0, dampVal(hips.position.y, hipY, lambda, dt), dampVal(hips.position.z, 0, lambda, dt));
      hips.rotation.set(dampVal(hips.rotation.x, hipRx, lambda, dt), 0, 0);
      torso.rotation.set(dampVal(torso.rotation.x, torsoRx, lambda, dt), dampVal(torso.rotation.y, torsoRy, lambda, dt), 0);
      headGroup.rotation.set(dampVal(headGroup.rotation.x, 0, lambda, dt), 0, 0);
      leftArm.shoulder.rotation.set(dampVal(leftArm.shoulder.rotation.x, lShRx, lambda, dt), 0, dampVal(leftArm.shoulder.rotation.z, lShRz, lambda, dt));
      leftArm.elbow.rotation.set(dampVal(leftArm.elbow.rotation.x, lElRx, lambda, dt), 0, 0);
      rightArm.shoulder.rotation.set(dampVal(rightArm.shoulder.rotation.x, rShRx, lambda, dt), 0, dampVal(rightArm.shoulder.rotation.z, rShRz, lambda, dt));
      rightArm.elbow.rotation.set(dampVal(rightArm.elbow.rotation.x, rElRx, lambda, dt), 0, 0);
      leftLeg.hip.rotation.set(dampVal(leftLeg.hip.rotation.x, lHipRx, lambda, dt), 0, dampVal(leftLeg.hip.rotation.z, 0, lambda, dt));
      leftLeg.knee.rotation.set(dampVal(leftLeg.knee.rotation.x, lKneeRx, lambda, dt), 0, 0);
      rightLeg.hip.rotation.set(dampVal(rightLeg.hip.rotation.x, rHipRx, lambda, dt), 0, dampVal(rightLeg.hip.rotation.z, 0, lambda, dt));
      rightLeg.knee.rotation.set(dampVal(rightLeg.knee.rotation.x, rKneeRx, lambda, dt), 0, 0);
      return;
    }

    resetPose();

    switch (state) {
      case 'running': {
        const c = time * 12.5;
        const swing = Math.sin(c) * 0.92;
        hips.position.y = 0.91 + Math.abs(Math.cos(c)) * 0.08;
        torso.rotation.x = mistake ? 0.42 : 0.22; // mistake = hunched forward
        torso.rotation.y = -swing * 0.24;
        leftLeg.hip.rotation.x = swing;
        rightLeg.hip.rotation.x = -swing;
        leftLeg.knee.rotation.x = Math.max(0.05, -Math.cos(c) * 0.95);
        rightLeg.knee.rotation.x = Math.max(0.05, Math.cos(c) * 0.95);
        leftArm.shoulder.rotation.x = -swing * 0.95;
        rightArm.shoulder.rotation.x = swing * 0.95;
        leftArm.shoulder.rotation.z = mistake ? -0.35 : -0.06;
        rightArm.shoulder.rotation.z = mistake ? 0.35 : 0.06;
        leftArm.elbow.rotation.x = -1.35;
        rightArm.elbow.rotation.x = -1.35;
        break;
      }
      case 'pushups': {
        const rep = loco?.repPhase !== undefined ? loco.repPhase : (Math.sin(time * 3.2) + 1) * 0.5;
        const breathe = loco?.repPhase !== undefined ? Math.sin(time * 2.4) * 0.008 : 0;
        const depth = mistake ? Math.max(0.18, rep * 0.52) : rep;
        hips.position.set(0, 0.36 + breathe - depth * 0.17, -0.15);
        hips.rotation.x = Math.PI / 2 - 0.12 + (mistake ? 0.28 : 0);
        torso.rotation.x = mistake ? -0.32 : 0.0; // sagging lower back if mistake
        headGroup.rotation.x = -0.7;
        const flare = mistake ? 0.65 : 0.22;
        leftArm.shoulder.rotation.set(-1.35 + depth * 0.45, 0, -flare);
        rightArm.shoulder.rotation.set(-1.35 + depth * 0.45, 0, flare);
        leftArm.elbow.rotation.x = -depth * 1.35;
        rightArm.elbow.rotation.x = -depth * 1.35;
        leftLeg.knee.rotation.x = 0.06;
        rightLeg.knee.rotation.x = 0.06;
        break;
      }
      case 'squats': {
        const rep = loco?.repPhase !== undefined ? loco.repPhase : (Math.sin(time * 2.8) + 1) * 0.5;
        const breathe = loco?.repPhase !== undefined ? Math.sin(time * 2.2) * 0.01 : 0;
        const depth = mistake ? Math.max(0.15, rep * 0.54) : rep;
        hips.position.y = 0.94 + breathe - depth * 0.42;
        hips.position.z = -depth * 0.16;
        torso.rotation.x = depth * (mistake ? 0.68 : 0.34) + 0.04;
        leftLeg.hip.rotation.x = -depth * 1.38 - 0.04;
        rightLeg.hip.rotation.x = -depth * 1.38 - 0.04;
        // Knee valgus cave on mistake
        leftLeg.hip.rotation.z = mistake ? 0.22 * depth : -0.12 * depth;
        rightLeg.hip.rotation.z = mistake ? -0.22 * depth : 0.12 * depth;
        leftLeg.knee.rotation.x = depth * 1.55 + 0.06;
        rightLeg.knee.rotation.x = depth * 1.55 + 0.06;
        leftArm.shoulder.rotation.x = -0.22 - depth * 1.15;
        rightArm.shoulder.rotation.x = -0.22 - depth * 1.15;
        break;
      }
      case 'lunges': {
        const c = loco?.repPhase !== undefined ? loco.repPhase : Math.sin(time * 2.6);
        const sideSign = c >= 0 ? 1 : -1;
        const amt = Math.abs(c);
        hips.position.y = 0.94 - amt * 0.34;
        torso.rotation.x = mistake ? 0.48 * amt : 0.08 * amt;
        if (sideSign > 0) {
          leftLeg.hip.rotation.x = -amt * 0.95;
          leftLeg.knee.rotation.x = amt * 1.15;
          rightLeg.hip.rotation.x = amt * 0.65;
          rightLeg.knee.rotation.x = amt * 1.25;
        } else {
          rightLeg.hip.rotation.x = -amt * 0.95;
          rightLeg.knee.rotation.x = amt * 1.15;
          leftLeg.hip.rotation.x = amt * 0.65;
          leftLeg.knee.rotation.x = amt * 1.25;
        }
        leftArm.shoulder.rotation.x = -0.3 * amt;
        rightArm.shoulder.rotation.x = -0.3 * amt;
        break;
      }
      case 'planks': {
        const breath = Math.sin(time * 2.2) * 0.012;
        hips.position.set(0, (mistake ? 0.24 : 0.34) + breath, -0.15);
        hips.rotation.x = Math.PI / 2 - 0.1 + (mistake ? 0.26 : 0);
        torso.rotation.x = mistake ? -0.34 : 0.02;
        headGroup.rotation.x = mistake ? -1.1 : -0.6;
        leftArm.shoulder.rotation.set(-1.35, 0, -0.1);
        rightArm.shoulder.rotation.set(-1.35, 0, 0.1);
        leftArm.elbow.rotation.x = -1.45;
        rightArm.elbow.rotation.x = -1.45;
        break;
      }
      case 'jumping_jacks': {
        const rep = loco?.repPhase !== undefined ? loco.repPhase : (Math.sin(time * 5.2) + 1) * 0.5;
        hips.position.y = 0.94 + rep * 0.14;
        leftLeg.hip.rotation.z = -rep * 0.42;
        rightLeg.hip.rotation.z = rep * 0.42;
        leftArm.shoulder.rotation.z = -0.12 - rep * (mistake ? 1.3 : 2.65);
        rightArm.shoulder.rotation.z = 0.12 + rep * (mistake ? 1.3 : 2.65);
        leftArm.elbow.rotation.x = mistake ? -0.8 : -0.12;
        rightArm.elbow.rotation.x = mistake ? -0.8 : -0.12;
        break;
      }
      case 'mountain_climbers': {
        const c = loco?.repPhase !== undefined ? loco.repPhase : Math.sin(time * 8.0);
        hips.position.set(0, 0.44 + (mistake ? Math.abs(c) * 0.16 : 0), -0.15);
        hips.rotation.x = Math.PI / 2 - 0.25;
        headGroup.rotation.x = -0.65;
        leftArm.shoulder.rotation.set(-1.25, 0, -0.12);
        rightArm.shoulder.rotation.set(-1.25, 0, 0.12);
        const lDrive = Math.max(0, c);
        const rDrive = Math.max(0, -c);
        leftLeg.hip.rotation.x = -lDrive * 1.15;
        leftLeg.knee.rotation.x = lDrive * 1.45;
        rightLeg.hip.rotation.x = -rDrive * 1.15;
        rightLeg.knee.rotation.x = rDrive * 1.45;
        break;
      }
      case 'pullups': {
        const rep = loco?.repPhase !== undefined ? loco.repPhase : (Math.sin(time * 2.4) + 1) * 0.5;
        const pull = mistake ? Math.max(0.15, rep * 0.52) : rep;
        hips.position.y = 1.18 + pull * 0.48;
        torso.rotation.x = mistake ? Math.sin(time * 4.8) * 0.22 : -0.06;
        leftArm.shoulder.rotation.set(-2.9 + pull * 1.15, 0, -0.22);
        rightArm.shoulder.rotation.set(-2.9 + pull * 1.15, 0, 0.22);
        leftArm.elbow.rotation.x = -pull * 1.85;
        rightArm.elbow.rotation.x = -pull * 1.85;
        leftLeg.knee.rotation.x = mistake ? 0.65 : 0.18;
        rightLeg.knee.rotation.x = mistake ? 0.65 : 0.18;
        break;
      }
    }
  };

  return {
    group: root,
    joints: {
      root,
      hips,
      torso,
      headGroup,
      leftShoulder: leftArm.shoulder,
      leftElbow: leftArm.elbow,
      rightShoulder: rightArm.shoulder,
      rightElbow: rightArm.elbow,
      leftHip: leftLeg.hip,
      leftKnee: leftLeg.knee,
      rightHip: rightLeg.hip,
      rightKnee: rightLeg.knee,
      formIndicatorRing,
      formIndicatorCore,
    },
    updateAppearance,
    animate,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
