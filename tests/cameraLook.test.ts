import assert from 'node:assert/strict';
import {
  applyCameraLookDelta,
  createCameraLookState,
  MAX_CAMERA_PITCH,
  MAX_POINTER_DELTA_PX,
  MIN_CAMERA_PITCH,
  POINTER_LOCK_BASE_SENS,
  shouldSuppressEscapePause,
  snapCameraLook,
  stepCameraLookDamping,
  TOUCH_ORBIT_BASE_SENS,
} from '../src/engine/cameraLook';
import { computeCameraRelativeMove } from '../src/engine/physics';

// 1. Initial camera state & pitch clamping
{
  const state = createCameraLookState(Math.PI, 0.28, 6.2);
  assert.equal(state.yaw, Math.PI);
  assert.equal(state.pitch, 0.28);
  assert.equal(state.targetYaw, Math.PI);
  assert.equal(state.targetPitch, 0.28);
  assert.equal(state.distance, 6.2);

  const clampedHigh = createCameraLookState(0, 5.0, 6.2);
  assert.equal(clampedHigh.pitch, MAX_CAMERA_PITCH);
  const clampedLow = createCameraLookState(0, -5.0, 6.2);
  assert.equal(clampedLow.pitch, MIN_CAMERA_PITCH);
}

// 2. Unconstrained 360-degree yaw, pitch bounds, spike clamping, and NaN guard
{
  let state = createCameraLookState(0, 0.25, 6.2);

  // Rotate continuously right across multiple full 360° revolutions
  for (let i = 0; i < 40; i++) {
    state = applyCameraLookDelta(state, 100, 0, 1.0, POINTER_LOCK_BASE_SENS);
  }
  const expectedYaw = -40 * 100 * POINTER_LOCK_BASE_SENS;
  assert.ok(Math.abs(state.targetYaw - expectedYaw) < 1e-9, 'Yaw should rotate freely across 360°+');
  assert.ok(Math.abs(state.targetYaw) > Math.PI * 3, 'Multiple full horizontal revolutions supported');

  // Extreme pitch up & down should clamp strictly
  let pitchDown = createCameraLookState(0, 0.3, 6.2);
  for (let i = 0; i < 30; i++) {
    pitchDown = applyCameraLookDelta(pitchDown, 0, 200, 1.5, POINTER_LOCK_BASE_SENS);
  }
  assert.equal(pitchDown.targetPitch, MAX_CAMERA_PITCH);

  let pitchUp = createCameraLookState(0, 0.3, 6.2);
  for (let i = 0; i < 30; i++) {
    pitchUp = applyCameraLookDelta(pitchUp, 0, -200, 1.5, POINTER_LOCK_BASE_SENS);
  }
  assert.equal(pitchUp.targetPitch, MIN_CAMERA_PITCH);

  // Pointer spike clamping (browser pointer-lock transition glitch protection)
  const spike = applyCameraLookDelta(createCameraLookState(0, 0.2, 6.2), 5000, -5000, 1.0);
  const maxStep = MAX_POINTER_DELTA_PX * POINTER_LOCK_BASE_SENS;
  assert.ok(Math.abs(spike.targetYaw - -maxStep) < 1e-9, 'Sudden huge movementX should clamp to MAX_POINTER_DELTA_PX');

  // NaN / Infinity safety
  const unchanged = applyCameraLookDelta(spike, Number.NaN, Number.POSITIVE_INFINITY, 1.0);
  assert.deepEqual(unchanged, spike, 'Non-finite pointer deltas must be safely ignored');
}

// 3. Sensitivity scaling for desktop pointer lock and mobile touch drag
{
  const base = createCameraLookState(0, 0.3, 6.2);
  const lowSens = applyCameraLookDelta(base, 80, 20, 0.5, POINTER_LOCK_BASE_SENS);
  const highSens = applyCameraLookDelta(base, 80, 20, 2.0, POINTER_LOCK_BASE_SENS);

  const lowDeltaYaw = Math.abs(lowSens.targetYaw - base.targetYaw);
  const highDeltaYaw = Math.abs(highSens.targetYaw - base.targetYaw);
  assert.ok(Math.abs(highDeltaYaw / lowDeltaYaw - 4.0) < 1e-9, '2.0x sensitivity should rotate 4x faster than 0.5x');

  const touchMoved = applyCameraLookDelta(base, 60, -15, 1.2, TOUCH_ORBIT_BASE_SENS);
  assert.ok(touchMoved.targetYaw < base.targetYaw);
  assert.ok(touchMoved.targetPitch < base.targetPitch);
}

// 4. Smooth exponential angular damping & instant snap
{
  let state = createCameraLookState(0, 0.3, 6.2);
  state = applyCameraLookDelta(state, 120, 40, 1.0);
  assert.equal(state.yaw, 0, 'Immediate frame before step retains current yaw for smoothing');

  const step1 = stepCameraLookDamping(state, 1 / 60);
  assert.ok(step1.yaw < 0 && step1.yaw > state.targetYaw, 'Single frame should smoothly interpolate without overshooting');
  assert.ok(step1.pitch > 0.3 && step1.pitch < state.targetPitch);

  let settled = step1;
  for (let i = 0; i < 30; i++) {
    settled = stepCameraLookDamping(settled, 1 / 60);
  }
  assert.ok(Math.abs(settled.yaw - state.targetYaw) < 1e-4, 'Camera yaw should converge cleanly to target');
  assert.ok(Math.abs(settled.pitch - state.targetPitch) < 1e-4, 'Camera pitch should converge cleanly to target');

  const snapped = snapCameraLook(applyCameraLookDelta(settled, 90, 20, 1.0));
  assert.equal(snapped.yaw, snapped.targetYaw);
  assert.equal(snapped.pitch, snapped.targetPitch);
}

// 5. Escape unlock vs Pause modal guard
{
  assert.equal(shouldSuppressEscapePause(true, 0, 1000), true, 'Escape while pointer-locked must unlock cursor without pausing');
  assert.equal(shouldSuppressEscapePause(false, 1000, 1080), true, 'Escape firing right after pointerlockchange unlock within grace window must not pause');
  assert.equal(shouldSuppressEscapePause(false, 1000, 1300), false, 'Subsequent Escape after grace window when unlocked should pause game');
  assert.equal(shouldSuppressEscapePause(false, 0, 5000), false, 'Escape when never locked pauses immediately');
}

// 6. Camera-relative WASD remains consistent after pointer-lock rotation
{
  let cam = createCameraLookState(0, 0.25, 6.2);
  // Rotate camera 90 degrees right (yaw becomes -PI/2)
  const pixelsFor90Deg = (Math.PI / 2) / POINTER_LOCK_BASE_SENS;
  const steps = Math.ceil(pixelsFor90Deg / MAX_POINTER_DELTA_PX);
  const perStep = pixelsFor90Deg / steps;
  for (let i = 0; i < steps; i++) {
    cam = applyCameraLookDelta(cam, perStep, 0, 1.0, POINTER_LOCK_BASE_SENS);
  }
  cam = snapCameraLook(cam);
  const moveForward = computeCameraRelativeMove(1, 0, cam.yaw);
  assert.ok(moveForward.dirX > 0.99 && Math.abs(moveForward.dirZ) < 1e-4, 'Pressing W after looking 90° right moves player +X');
}

console.log('ALL FITFORM MOUSE-LOOK, POINTER LOCK, DAMPING, SENSITIVITY & ESCAPE GUARD TESTS PASSED!');
