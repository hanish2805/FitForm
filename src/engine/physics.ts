export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  blocksCamera?: boolean;
  /** If true, player can walk/land on top of this box when playerY >= height - stepHeight */
  walkableTop?: boolean;
}

export interface CylinderPlatform {
  x: number;
  z: number;
  radius: number;
  height: number;
}

export interface WorldCollisionData {
  colliders: ColliderBox[];
  platforms: CylinderPlatform[];
  worldBounds: number;
}

export interface PlayerKinematicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  isGrounded: boolean;
  stamina: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  landingImpact: number;
  sprinting: boolean;
  horizontalSpeed: number;
}

export interface MovementInput {
  forward: number; // -1..1 (W positive, S negative)
  right: number;   // -1..1 (D positive, A negative)
  sprint: boolean;
  jumpPressed: boolean;
  camYaw: number;
}

export const PLAYER_RADIUS = 0.42;
export const WALK_SPEED = 4.9;
export const SPRINT_SPEED = 8.9;
export const JUMP_VELOCITY = 7.2;
export const GRAVITY = 20.0;
export const STEP_UP_HEIGHT = 0.36;

export function createInitialPlayerState(x = 0, y = 0, z = 3, yaw = Math.PI): PlayerKinematicsState {
  return {
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw,
    isGrounded: true,
    stamina: 100,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    landingImpact: 0,
    sprinting: false,
    horizontalSpeed: 0,
  };
}

/**
 * Computes camera-relative movement direction on the XZ plane.
 * Camera sits at player + (sin(camYaw), vert, cos(camYaw)), looking toward player.
 * Therefore camera forward is (-sin(camYaw), -cos(camYaw)),
 * and camera right (forward x up) is (+cos(camYaw), -sin(camYaw)).
 */
export function computeCameraRelativeMove(
  forwardInput: number,
  rightInput: number,
  camYaw: number,
): { dirX: number; dirZ: number; hasInput: boolean } {
  if (Math.abs(forwardInput) < 0.05 && Math.abs(rightInput) < 0.05) {
    return { dirX: 0, dirZ: 0, hasInput: false };
  }
  const sinY = Math.sin(camYaw);
  const cosY = Math.cos(camYaw);
  const fwdX = -sinY;
  const fwdZ = -cosY;
  const rightX = cosY;
  const rightZ = -sinY;

  let dx = fwdX * forwardInput + rightX * rightInput;
  let dz = fwdZ * forwardInput + rightZ * rightInput;
  const len = Math.hypot(dx, dz);
  if (len > 1e-5) {
    // Preserve analog magnitude up to 1.0 (for touch joysticks)
    const scale = Math.min(1, len) / len;
    dx *= scale;
    dz *= scale;
  }
  return { dirX: dx, dirZ: dz, hasInput: len > 0.01 };
}

export function getGroundHeightAt(
  x: number,
  z: number,
  currentY: number,
  world: WorldCollisionData,
): number {
  let groundY = 0;

  for (let i = 0; i < world.platforms.length; i++) {
    const p = world.platforms[i];
    const distSq = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
    if (distSq <= p.radius * p.radius && currentY + STEP_UP_HEIGHT >= p.height) {
      if (p.height > groundY) groundY = p.height;
    }
  }

  for (let i = 0; i < world.colliders.length; i++) {
    const b = world.colliders[i];
    if (!b.walkableTop) continue;
    if (
      x >= b.minX - PLAYER_RADIUS * 0.4 &&
      x <= b.maxX + PLAYER_RADIUS * 0.4 &&
      z >= b.minZ - PLAYER_RADIUS * 0.4 &&
      z <= b.maxZ + PLAYER_RADIUS * 0.4 &&
      currentY + STEP_UP_HEIGHT >= b.height
    ) {
      if (b.height > groundY) groundY = b.height;
    }
  }

  return groundY;
}

export function resolveHorizontalCollisions(
  nx: number,
  nz: number,
  playerY: number,
  world: WorldCollisionData,
  radius = PLAYER_RADIUS,
): { x: number; z: number } {
  const bound = world.worldBounds;
  let rx = Math.max(-bound, Math.min(bound, nx));
  let rz = Math.max(-bound, Math.min(bound, nz));

  // Two solver passes ensure smooth corner sliding between adjacent walls
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < world.colliders.length; i++) {
      const box = world.colliders[i];
      // If player is above or stepping cleanly onto a walkable box, skip horizontal block
      if (playerY + (box.walkableTop ? STEP_UP_HEIGHT : 0.05) >= box.height) {
        continue;
      }

      const closestX = Math.max(box.minX, Math.min(box.maxX, rx));
      const closestZ = Math.max(box.minZ, Math.min(box.maxZ, rz));
      const dx = rx - closestX;
      const dz = rz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 1e-4) {
          const push = radius - dist;
          rx += (dx / dist) * push;
          rz += (dz / dist) * push;
        } else {
          // Center inside box fallback: push out along shallowest edge
          const leftPen = Math.abs(rx - box.minX);
          const rightPen = Math.abs(box.maxX - rx);
          const topPen = Math.abs(rz - box.minZ);
          const botPen = Math.abs(box.maxZ - rz);
          const minPen = Math.min(leftPen, rightPen, topPen, botPen);
          if (minPen === leftPen) rx = box.minX - radius;
          else if (minPen === rightPen) rx = box.maxX + radius;
          else if (minPen === topPen) rz = box.minZ - radius;
          else rz = box.maxZ + radius;
        }
      }
    }
  }

  return { x: rx, z: rz };
}

export function stepPlayerPhysics(
  state: PlayerKinematicsState,
  input: MovementInput,
  world: WorldCollisionData,
  rawDt: number,
): { next: PlayerKinematicsState; jumped: boolean; landed: boolean } {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  const next: PlayerKinematicsState = { ...state };
  next.landingImpact = Math.max(0, next.landingImpact - dt * 5.5);

  const { dirX, dirZ, hasInput } = computeCameraRelativeMove(
    input.forward,
    input.right,
    input.camYaw,
  );

  // Stamina & sprint management with hysteresis to prevent stutter at 0 stamina
  const wantsSprint = input.sprint && hasInput;
  const canSprint = next.sprinting ? next.stamina > 0.5 : next.stamina >= 18;
  next.sprinting = wantsSprint && canSprint;

  if (next.sprinting) {
    next.stamina = Math.max(0, next.stamina - dt * 16);
  } else {
    next.stamina = Math.min(100, next.stamina + dt * 14);
  }

  const targetSpeed = next.sprinting ? SPRINT_SPEED : WALK_SPEED;
  const targetVx = hasInput ? dirX * targetSpeed : 0;
  const targetVz = hasInput ? dirZ * targetSpeed : 0;

  // Smooth acceleration & friction
  const accel = next.isGrounded ? (hasInput ? 26 : 22) : (hasInput ? 10 : 3);
  const blend = 1 - Math.exp(-accel * dt);
  next.vx += (targetVx - next.vx) * blend;
  next.vz += (targetVz - next.vz) * blend;

  if (!hasInput && Math.hypot(next.vx, next.vz) < 0.05) {
    next.vx = 0;
    next.vz = 0;
  }

  // Horizontal integration & collision
  const prevX = next.x;
  const prevZ = next.z;
  const desiredX = next.x + next.vx * dt;
  const desiredZ = next.z + next.vz * dt;
  const resolved = resolveHorizontalCollisions(desiredX, desiredZ, next.y, world);
  next.x = resolved.x;
  next.z = resolved.z;

  // Zero out blocked velocity component so player doesn't build momentum into walls
  if (dt > 1e-5) {
    next.vx = (next.x - prevX) / dt;
    next.vz = (next.z - prevZ) / dt;
  }
  next.horizontalSpeed = Math.hypot(next.vx, next.vz);

  // Smooth character facing toward movement input
  if (hasInput) {
    const targetYaw = Math.atan2(dirX, dirZ);
    let diff = targetYaw - next.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    next.yaw += diff * Math.min(1, dt * 13);
  }

  // Coyote time & jump input buffering
  if (next.isGrounded) {
    next.coyoteTimer = 0.12;
  } else {
    next.coyoteTimer = Math.max(0, next.coyoteTimer - dt);
  }

  if (input.jumpPressed) {
    next.jumpBufferTimer = 0.14;
  } else {
    next.jumpBufferTimer = Math.max(0, next.jumpBufferTimer - dt);
  }

  let jumped = false;
  if (next.jumpBufferTimer > 0 && next.coyoteTimer > 0) {
    next.vy = JUMP_VELOCITY;
    next.isGrounded = false;
    next.coyoteTimer = 0;
    next.jumpBufferTimer = 0;
    jumped = true;
  }

  // Vertical integration & ground/platform landing
  next.vy -= GRAVITY * dt;
  next.y += next.vy * dt;

  const groundY = getGroundHeightAt(next.x, next.z, next.y, world);
  let landed = false;
  if (next.y <= groundY) {
    if (!state.isGrounded && next.vy < -3.5) {
      landed = true;
      next.landingImpact = Math.min(1, Math.abs(next.vy) / 10);
    }
    next.y = groundY;
    next.vy = 0;
    next.isGrounded = true;
  } else if (next.y > groundY + 0.05) {
    next.isGrounded = false;
  }

  return { next, jumped, landed };
}

/**
 * Ray-AABB intersection test from camera look target to desired camera position.
 * Pulls camera smoothly in front of any wall/pillar collider so it never passes through walls.
 */
export function resolveCameraOcclusion(
  targetX: number,
  targetY: number,
  targetZ: number,
  goalX: number,
  goalY: number,
  goalZ: number,
  colliders: ColliderBox[],
): { x: number; y: number; z: number; clipped: boolean } {
  const dx = goalX - targetX;
  const dy = goalY - targetY;
  const dz = goalZ - targetZ;
  let closestT = 1.0;

  for (let i = 0; i < colliders.length; i++) {
    const b = colliders[i];
    if (!b.blocksCamera) continue;

    // Expand box slightly for camera near-plane margin
    const minX = b.minX - 0.28;
    const maxX = b.maxX + 0.28;
    const minY = -0.1;
    const maxY = b.height + 0.25;
    const minZ = b.minZ - 0.28;
    const maxZ = b.maxZ + 0.28;

    let tmin = 0;
    let tmax = 1;

    // X slab
    if (Math.abs(dx) < 1e-6) {
      if (targetX < minX || targetX > maxX) continue;
    } else {
      const inv = 1 / dx;
      let t1 = (minX - targetX) * inv;
      let t2 = (maxX - targetX) * inv;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    // Y slab
    if (Math.abs(dy) < 1e-6) {
      if (targetY < minY || targetY > maxY) continue;
    } else {
      const inv = 1 / dy;
      let t1 = (minY - targetY) * inv;
      let t2 = (maxY - targetY) * inv;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    // Z slab
    if (Math.abs(dz) < 1e-6) {
      if (targetZ < minZ || targetZ > maxZ) continue;
    } else {
      const inv = 1 / dz;
      let t1 = (minZ - targetZ) * inv;
      let t2 = (maxZ - targetZ) * inv;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    if (tmin > 0.05 && tmin < closestT) {
      closestT = tmin;
    }
  }

  const clipped = closestT < 1.0;
  const safeT = clipped ? Math.max(0.06, closestT * 0.88) : 1.0;
  return {
    x: targetX + dx * safeT,
    y: Math.max(0.45, targetY + dy * safeT),
    z: targetZ + dz * safeT,
    clipped,
  };
}
