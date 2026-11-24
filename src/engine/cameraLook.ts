export interface CameraLookState {
  yaw: number;
  pitch: number;
  targetYaw: number;
  targetPitch: number;
  distance: number;
}

export const MIN_CAMERA_PITCH = -0.22;
export const MAX_CAMERA_PITCH = 1.25;
export const POINTER_LOCK_BASE_SENS = 0.0028;
export const TOUCH_ORBIT_BASE_SENS = 0.0045;
export const CAMERA_LOOK_DAMP_LAMBDA = 28;
export const MAX_POINTER_DELTA_PX = 220;

export function createCameraLookState(
  yaw = Math.PI,
  pitch = 0.28,
  distance = 6.2,
): CameraLookState {
  const clampedPitch = clampPitch(pitch);
  return {
    yaw,
    pitch: clampedPitch,
    targetYaw: yaw,
    targetPitch: clampedPitch,
    distance,
  };
}

export function clampPitch(pitch: number): number {
  return Math.min(MAX_CAMERA_PITCH, Math.max(MIN_CAMERA_PITCH, pitch));
}

export function applyCameraLookDelta(
  state: CameraLookState,
  dx: number,
  dy: number,
  sensitivity: number,
  baseSens = POINTER_LOCK_BASE_SENS,
): CameraLookState {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return state;
  const clampedDx = Math.min(MAX_POINTER_DELTA_PX, Math.max(-MAX_POINTER_DELTA_PX, dx));
  const clampedDy = Math.min(MAX_POINTER_DELTA_PX, Math.max(-MAX_POINTER_DELTA_PX, dy));
  const safeSens = Math.min(3.0, Math.max(0.1, sensitivity));
  const step = safeSens * baseSens;

  return {
    ...state,
    targetYaw: state.targetYaw - clampedDx * step,
    targetPitch: clampPitch(state.targetPitch + clampedDy * step),
  };
}

export function stepCameraLookDamping(state: CameraLookState, dt: number): CameraLookState {
  const safeDt = Math.min(Math.max(0, dt), 0.1);
  if (safeDt === 0) return state;
  const alpha = 1 - Math.exp(-CAMERA_LOOK_DAMP_LAMBDA * safeDt);
  const nextYaw = state.yaw + (state.targetYaw - state.yaw) * alpha;
  const nextPitch = clampPitch(state.pitch + (state.targetPitch - state.pitch) * alpha);
  return {
    ...state,
    yaw: nextYaw,
    pitch: nextPitch,
  };
}

export function snapCameraLook(state: CameraLookState): CameraLookState {
  return {
    ...state,
    yaw: state.targetYaw,
    pitch: clampPitch(state.targetPitch),
  };
}

export function shouldSuppressEscapePause(
  isCurrentlyLocked: boolean,
  lastPointerUnlockAtMs: number,
  nowMs: number,
  graceMs = 220,
): boolean {
  if (isCurrentlyLocked) return true;
  if (lastPointerUnlockAtMs > 0 && nowMs - lastPointerUnlockAtMs <= graceMs) {
    return true;
  }
  return false;
}
