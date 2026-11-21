import assert from 'node:assert/strict';
import { EXERCISE_LIST } from '../src/data/exercises';
import { INTERACTIVE_STATIONS, WORLD_LOCATIONS } from '../src/data/worldLocations';
import { createCharacterRig, CharacterAnimState } from '../src/engine/characterRig';
import {
  computeCameraRelativeMove,
  createInitialPlayerState,
  getGroundHeightAt,
  resolveCameraOcclusion,
  SPRINT_SPEED,
  stepPlayerPhysics,
  WALK_SPEED,
  WorldCollisionData,
} from '../src/engine/physics';
import { DEFAULT_CHARACTER } from '../src/utils/storage';

const testWorld: WorldCollisionData = {
  colliders: [
    // Gym back wall at z = -28
    { minX: -13, maxX: 13, minZ: -28.25, maxZ: -27.75, height: 4.7, blocksCamera: true },
    // Gym rubber floor
    { minX: -13, maxX: 13, minZ: -28, maxZ: -8, height: 0.05, blocksCamera: false, walkableTop: true },
    // Olympic lifting platform (height 0.11)
    { minX: -10.8, maxX: -6.4, minZ: -25.4, maxZ: -22.0, height: 0.11, blocksCamera: false, walkableTop: true },
    // Squat rack
    { minX: -9.6, maxX: -7.6, minZ: -25.125, maxZ: -23.475, height: 2.6, blocksCamera: false },
    // Plyo jump box (height 0.47)
    { minX: -11.78, maxX: -10.82, minZ: -13.08, maxZ: -12.12, height: 0.47, blocksCamera: false, walkableTop: true },
    // Locker bench
    { minX: -10.025, maxX: -8.175, minZ: -10.05, maxZ: -9.55, height: 0.48, blocksCamera: false, walkableTop: true },
  ],
  platforms: [
    // Arena deck & podium
    { x: 26, z: 28, radius: 12.6, height: 0.28 },
    { x: 26, z: 28, radius: 2.35, height: 0.5 },
  ],
  worldBounds: 54,
};

function runFrames(
  startState: ReturnType<typeof createInitialPlayerState>,
  frames: number,
  inputFn: (i: number) => Parameters<typeof stepPlayerPhysics>[1],
  dt = 1 / 60,
) {
  let state = startState;
  let anyJump = false;
  let anyLand = false;
  let maxLandingImpact = 0;
  for (let i = 0; i < frames; i++) {
    const res = stepPlayerPhysics(state, inputFn(i), testWorld, dt);
    state = res.next;
    if (res.jumped) anyJump = true;
    if (res.landed) anyLand = true;
    if (state.landingImpact > maxLandingImpact) maxLandingImpact = state.landingImpact;
  }
  return { state, anyJump, anyLand, maxLandingImpact };
}

// 1. Camera-relative WASD orientation tests
{
  // Camera at yaw=0 sits at +Z looking toward -Z: W moves -Z, S moves +Z, D moves +X, A moves -X
  const w0 = computeCameraRelativeMove(1, 0, 0);
  assert.ok(w0.dirZ < -0.99 && Math.abs(w0.dirX) < 1e-5, 'yaw=0 W should move -Z');
  const d0 = computeCameraRelativeMove(0, 1, 0);
  assert.ok(d0.dirX > 0.99 && Math.abs(d0.dirZ) < 1e-5, 'yaw=0 D should move +X (camera right)');
  const a0 = computeCameraRelativeMove(0, -1, 0);
  assert.ok(a0.dirX < -0.99 && Math.abs(a0.dirZ) < 1e-5, 'yaw=0 A should move -X (camera left)');

  // Camera at yaw=PI sits at -Z looking toward +Z: W moves +Z, D moves -X
  const wPi = computeCameraRelativeMove(1, 0, Math.PI);
  assert.ok(wPi.dirZ > 0.99 && Math.abs(wPi.dirX) < 1e-5, 'yaw=PI W should move +Z');
  const dPi = computeCameraRelativeMove(0, 1, Math.PI);
  assert.ok(dPi.dirX < -0.99 && Math.abs(dPi.dirZ) < 1e-5, 'yaw=PI D should move -X (camera right)');

  // Camera at yaw=PI/2 sits at +X looking toward -X: W moves -X, D moves -Z
  const w90 = computeCameraRelativeMove(1, 0, Math.PI / 2);
  assert.ok(w90.dirX < -0.99 && Math.abs(w90.dirZ) < 1e-5, 'yaw=PI/2 W should move -X');
  const d90 = computeCameraRelativeMove(0, 1, Math.PI / 2);
  assert.ok(d90.dirZ < -0.99 && Math.abs(d90.dirX) < 1e-5, 'yaw=PI/2 D should move -Z');
}

// 2. Walking speed & smooth stopping
{
  const start = createInitialPlayerState(0, 0, 0, 0);
  const { state: walked } = runFrames(start, 60, () => ({
    forward: 1,
    right: 0,
    sprint: false,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.ok(Math.abs(walked.horizontalSpeed - WALK_SPEED) < 0.15, `Expected walk speed ~${WALK_SPEED}, got ${walked.horizontalSpeed}`);
  assert.ok(walked.z < -4.0, 'Player should advance forward along -Z');
  assert.equal(walked.sprinting, false);
}

// 3. Sprinting speed, stamina drain, and exhaustion cutoff
{
  const start = createInitialPlayerState(0, 0, 0, 0);
  const { state: sprinting } = runFrames(start, 60, () => ({
    forward: 1,
    right: 0,
    sprint: true,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.ok(Math.abs(sprinting.horizontalSpeed - SPRINT_SPEED) < 0.2, `Expected sprint speed ~${SPRINT_SPEED}, got ${sprinting.horizontalSpeed}`);
  assert.ok(sprinting.stamina < 86 && sprinting.stamina > 80, 'Stamina should drain during 1s sprint');

  // Drain stamina completely over 7 seconds
  const { state: exhausted } = runFrames(start, 60 * 7, () => ({
    forward: 1,
    right: 0,
    sprint: true,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.equal(exhausted.sprinting, false, 'Sprinting should stop when stamina reaches 0');
  assert.ok(exhausted.horizontalSpeed <= WALK_SPEED + 0.3, 'Speed should fall back to walk speed when exhausted');

  // Recover stamina when idle
  const { state: recovered } = runFrames(exhausted, 120, () => ({
    forward: 0,
    right: 0,
    sprint: false,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.ok(recovered.stamina > 25, 'Stamina should regenerate when idle/walking');
}

// 4. Jump arc, gravity, landing, coyote time & jump buffer
{
  const start = createInitialPlayerState(0, 0, 0, 0);
  const res1 = stepPlayerPhysics(
    start,
    { forward: 0, right: 0, sprint: false, jumpPressed: true, camYaw: 0 },
    testWorld,
    1 / 60,
  );
  assert.equal(res1.jumped, true, 'Jump should trigger immediately on grounded Space press');
  assert.equal(res1.next.isGrounded, false);
  assert.ok(res1.next.vy > 6.0);

  // Run 20 frames -> should be near apex above ground
  const { state: midAir } = runFrames(res1.next, 20, () => ({
    forward: 0,
    right: 0,
    sprint: false,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.ok(midAir.y > 0.8, `Expected player mid-jump > 0.8m, got ${midAir.y}`);

  // Run another 45 frames -> should land back at y=0
  const { state: landedState, anyLand, maxLandingImpact } = runFrames(midAir, 45, () => ({
    forward: 0,
    right: 0,
    sprint: false,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.equal(anyLand, true, 'Should trigger landed event on touchdown');
  assert.equal(landedState.isGrounded, true);
  assert.equal(landedState.y, 0);
  assert.ok(maxLandingImpact > 0.3, `Landing impact squash should register on touchdown, got ${maxLandingImpact}`);

  // Jump input buffer: press Space 3 frames before touching the ground
  const fallingState = { ...createInitialPlayerState(0, 0.35, 0, 0), isGrounded: false, vy: -6.0 };
  const buffered = runFrames(fallingState, 10, (i) => ({
    forward: 0,
    right: 0,
    sprint: false,
    jumpPressed: i === 0,
    camYaw: 0,
  }));
  assert.equal(buffered.anyJump, true, 'Jump input buffer should execute jump upon landing');

  // Coyote time: step off Arena deck (radius 12.6, height 0.28) and press jump 3 frames later
  const edgeStart = createInitialPlayerState(26, 0.28, 28 + 12.55, 0);
  const { state: justSteppedOff } = runFrames(edgeStart, 3, () => ({
    forward: -1, // south off platform
    right: 0,
    sprint: false,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.equal(justSteppedOff.isGrounded, false);
  const coyoteJump = stepPlayerPhysics(
    justSteppedOff,
    { forward: -1, right: 0, sprint: false, jumpPressed: true, camYaw: 0 },
    testWorld,
    1 / 60,
  );
  assert.equal(coyoteJump.jumped, true, 'Coyote time should allow jump briefly after stepping off platform');
}

// 5. Collision detection: walls, equipment, elevated platforms & world bounds
{
  // Walk straight North toward Gym back wall at z = -27.75
  const nearWall = createInitialPlayerState(0, 0, -26.5, 0);
  const { state: againstWall } = runFrames(nearWall, 90, () => ({
    forward: 1,
    right: 0,
    sprint: true,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.ok(againstWall.z >= -27.75 + 0.41, `Player must not pass through gym wall, got z=${againstWall.z}`);

  // Diagonal slide along wall (W + D at yaw=0)
  const { state: slid } = runFrames(againstWall, 45, () => ({
    forward: 1,
    right: 1,
    sprint: false,
    jumpPressed: false,
    camYaw: 0,
  }));
  assert.ok(slid.x > againstWall.x + 1.5, 'Player should slide smoothly along X while pressed against Z wall');

  // Elevated platform height detection at Arena podium
  assert.equal(getGroundHeightAt(26, 28, 0.4, testWorld), 0.5, 'Arena center podium height should be 0.5');
  assert.equal(getGroundHeightAt(31, 28, 0.2, testWorld), 0.28, 'Arena outer deck height should be 0.28');
  assert.equal(getGroundHeightAt(0, 0, 0, testWorld), 0, 'Open plaza ground height should be 0');
}

// 6. Camera occlusion raycast against walls
{
  // Player inside gym near back wall (z = -26.8), camera wants to sit at z = -32 (behind wall at z = -28)
  const safe = resolveCameraOcclusion(0, 1.3, -26.8, 0, 2.5, -32, testWorld.colliders);
  assert.equal(safe.clipped, true, 'Camera ray crossing gym wall should report clipped');
  assert.ok(safe.z > -27.75, `Camera must stay in front of gym wall (-27.75), got z=${safe.z}`);
}

// 7. CharacterRig animation integrity across locomotion & all 8 workouts
{
  const rig = createCharacterRig(DEFAULT_CHARACTER);
  const states: CharacterAnimState[] = [
    'idle',
    'walk',
    'run',
    'jump',
    'pushups',
    'squats',
    'lunges',
    'planks',
    'jumping_jacks',
    'mountain_climbers',
    'running',
    'pullups',
  ];

  for (const st of states) {
    rig.animate(st, 1.25, 'correct', true, {
      dt: 1 / 60,
      speedRatio: 1,
      landingImpact: 0.2,
      verticalVelocity: 2.5,
    });
    assert.ok(!Number.isNaN(rig.joints.hips.position.y), `Hips Y NaN in state ${st}`);
    assert.ok(!Number.isNaN(rig.joints.leftShoulder.rotation.x), `Left shoulder NaN in state ${st}`);
    assert.ok(!Number.isNaN(rig.joints.rightHip.rotation.x), `Right hip NaN in state ${st}`);
  }
  rig.dispose();
}

// 8. Detailed 3D Gym: plyo box jump-landing, lifting platform height, and all gym stations mapped
{
  // Olympic lifting platform ground elevation
  assert.equal(
    getGroundHeightAt(-8.6, -22.3, 0.2, testWorld),
    0.11,
    'Olympic lifting platform should elevate player cleanly to y=0.11',
  );

  // Jump onto 0.47m Plyo Box from adjacent turf floor (box center x=-11.3, width 0.96)
  const beforeBox = createInitialPlayerState(-9.95, 0.05, -12.6, Math.PI / 2);
  const { state: onBox } = runFrames(beforeBox, 45, (i) => ({
    forward: i < 10 ? 1 : 0,
    right: 0,
    sprint: false,
    jumpPressed: i === 2,
    camYaw: Math.PI / 2, // forward moves -X toward x=-11.3
  }));
  assert.ok(onBox.x < -10.82 && onBox.x > -11.78, `Player should land atop plyo box x, got x=${onBox.x}`);
  assert.ok(Math.abs(onBox.y - 0.47) < 0.02, `Player should stand atop 0.47m plyo box, got y=${onBox.y}`);

  // Verify every Training Center workout station has at least one matching exercise
  const gymStations = INTERACTIVE_STATIONS.filter((s) => s.locationId === 'training_center');
  assert.ok(gymStations.length >= 6, `Expected at least 6 interactive gym stations, got ${gymStations.length}`);
  for (const st of gymStations) {
    const exercises = EXERCISE_LIST.filter((ex) => ex.stationTypes.includes(st.stationType));
    assert.ok(exercises.length > 0, `Gym station ${st.id} (${st.stationType}) has no mapped exercises`);
  }
}

// 9. Expanded Connected World: Outdoor Park, Player Home, Nutrition Center, Competition Arena
{
  assert.equal(WORLD_LOCATIONS.length, 5, 'Campus should include all 5 connected districts');

  for (const loc of WORLD_LOCATIONS) {
    const stations = INTERACTIVE_STATIONS.filter((s) => s.locationId === loc.id);
    assert.ok(stations.length >= 1, `District ${loc.id} must have interactive stations`);
    assert.ok(
      loc.spawnX !== undefined && loc.spawnZ !== undefined,
      `District ${loc.id} should define safe fast-travel spawn coordinates`,
    );
    const distFromCenter = Math.hypot((loc.spawnX ?? loc.x) - loc.x, (loc.spawnZ ?? loc.z) - loc.z);
    assert.ok(
      distFromCenter <= loc.radius,
      `District ${loc.id} spawn should fall within district detection radius`,
    );
  }

  // Verify workout stations across Outdoor Park & Arena map to valid exercises
  const outdoorStations = INTERACTIVE_STATIONS.filter((s) => s.locationId === 'outdoor_zone');
  assert.ok(outdoorStations.length >= 3, `Expected >=3 Outdoor Park stations, got ${outdoorStations.length}`);
  for (const st of outdoorStations) {
    const mapped = EXERCISE_LIST.filter((ex) => ex.stationTypes.includes(st.stationType));
    assert.ok(mapped.length > 0, `Outdoor station ${st.id} has no mapped exercises`);
  }

  const arenaWarmup = INTERACTIVE_STATIONS.find((s) => s.id === 'arena_warmup');
  assert.ok(arenaWarmup && arenaWarmup.y === 0.28, 'Arena warm-up pad should align with 0.28m stadium deck');
  const arenaStage = INTERACTIVE_STATIONS.find((s) => s.id === 'arena_stage');
  assert.ok(arenaStage && arenaStage.y === 0.5, 'Arena stage beacon should sit atop 0.5m center podium');
}

console.log('ALL FITFORM THIRD-PERSON MOVEMENT, CAMERA, COLLISION, GYM & EXPANDED WORLD TESTS PASSED!');
