import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { INTERACTIVE_STATIONS, resolveLocationForPosition, WORLD_LOCATIONS } from '../data/worldLocations';
import {
  CharacterConfig,
  ExerciseId,
  GameSettings,
  InteractiveStation,
  LocationId,
} from '../types/game';
import { soundEngine } from './audio';
import {
  applyCameraLookDelta,
  CameraLookState,
  createCameraLookState,
  POINTER_LOCK_BASE_SENS,
  shouldSuppressEscapePause,
  snapCameraLook,
  stepCameraLookDamping,
  TOUCH_ORBIT_BASE_SENS,
} from './cameraLook';
import { CharacterAnimState, CharacterRig, createCharacterRig } from './characterRig';
import { isSoftwareWebGL } from './glUtils';
import {
  createInitialPlayerState,
  PlayerKinematicsState,
  resolveCameraOcclusion,
  stepPlayerPhysics,
  WALK_SPEED,
} from './physics';
import { buildFitnessWorld, WorldBuildResult } from './worldBuilder';

export type EngineCameraMode = 'menu' | 'gameplay' | 'workout';

export interface EngineCallbacks {
  onNearbyStationChange: (station: InteractiveStation | null) => void;
  onLocationChange: (locationId: LocationId) => void;
  onWaypointChange?: (locationId: LocationId | null) => void;
  onInteract: (station: InteractiveStation) => void;
  onPauseToggle: () => void;
  onMapToggle: () => void;
  onStaminaChange: (stamina: number) => void;
  onPlayerMove: (x: number, z: number, yaw: number) => void;
  onPointerLockChange?: (locked: boolean) => void;
}

// Pre-allocated math scratchpads (zero GC in render loop)
const _camGoal = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _playerCenter = new THREE.Vector3();

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;
  private pmremEnv: THREE.Texture | null = null;
  private world: WorldBuildResult;
  private characterRig: CharacterRig;
  private contactShadow: THREE.Mesh;

  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private elapsed = 0;

  // Player kinematics
  public playerPos = new THREE.Vector3(0, 0, 3);
  private kinematics: PlayerKinematicsState = createInitialPlayerState(0, 0, 3, Math.PI);
  private stepAccum = 0;

  // Camera orbit & pointer-lock state
  private cameraLook: CameraLookState = createCameraLookState(Math.PI, 0.28, 6.2);
  private currentCamPos = new THREE.Vector3(0, 3.5, 9.5);
  private pointerLocked = false;
  private pointerLockBlocked = false;
  private lastPointerUnlockAt = 0;
  private isDraggingCamera = false;
  private activePointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Input state
  private keys: Record<string, boolean> = {};
  private mobileMove = { x: 0, y: 0 };
  private mobileSprint = false;
  private jumpBuffered = false;

  // Mode & state
  private mode: EngineCameraMode = 'menu';
  private workoutExercise: ExerciseId | null = null;
  private workoutActive = false;
  private workoutTime = 0;
  private workoutRepActive = false;
  private workoutRepProgress = 0;
  private workoutRepDirection = 1;
  private workoutFormMode: 'correct' | 'mistake' = 'correct';
  private workoutFormFlashTimer = 0;
  private workoutHoldBoosting = false;
  private nearbyStation: InteractiveStation | null = null;
  private currentLocation: LocationId = 'training_center';
  private waypointLocation: LocationId | null = null;
  private settings: GameSettings;
  private callbacks: EngineCallbacks;
  private lastHudReport = 0;
  private lastReportedStamina = 100;
  private lastReportedX = 0;
  private lastReportedZ = 3;
  private lastReportedYaw = Math.PI;

  constructor(
    container: HTMLElement,
    initialCharacter: CharacterConfig,
    initialSettings: GameSettings,
    callbacks: EngineCallbacks,
  ) {
    this.container = container;
    this.settings = initialSettings;
    this.callbacks = callbacks;
    this.isSoftwareGl = isSoftwareWebGL();

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && initialSettings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && initialSettings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyQualitySettings(initialSettings);

    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    // Scene & horizon-matched fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0f1813');
    this.scene.fog = new THREE.FogExp2('#0f1813', 0.0085);

    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.15, 220);

    // Studio Reflection Environment (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremEnv = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.pmremEnv;
    pmremGenerator.dispose();

    // 3-point balanced warm/cool lighting rig
    const hemi = new THREE.HemisphereLight('#a8d5ff', '#1c2b1e', 0.72);
    this.scene.add(hemi);

    this.dirLight = new THREE.DirectionalLight('#fff2dc', 1.65);
    this.dirLight.position.set(22, 34, 18);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 95;
    const d = 32;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    const rimLight = new THREE.DirectionalLight('#C7FF00', 0.35);
    rimLight.position.set(-20, 12, -25);
    this.scene.add(rimLight);

    // Build World & Character
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.world = buildFitnessWorld(maxAniso);
    this.scene.add(this.world.group);

    this.characterRig = createCharacterRig(initialCharacter);
    this.characterRig.group.position.copy(this.playerPos);
    this.scene.add(this.characterRig.group);

    // Grounded Contact Shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.world.contactShadowTex,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(this.playerPos.x, 0.04, this.playerPos.z);
    this.scene.add(this.contactShadow);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.lastTime = performance.now();
    this.startLoop();
  }

  public applyQualitySettings(settings: GameSettings) {
    this.settings = settings;
    const targetRatio =
      this.isSoftwareGl
        ? 1
        : settings.graphicsQuality === 'low'
          ? 1
          : settings.graphicsQuality === 'medium'
            ? Math.min(window.devicePixelRatio, 1.5)
            : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(targetRatio);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.graphicsQuality !== 'low';
  }

  public setMode(mode: EngineCameraMode) {
    this.mode = mode;
    if (mode !== 'gameplay') {
      this.clearKeys();
      this.isDraggingCamera = false;
      this.activePointerId = null;
      this.releasePointerLock();
    }
  }

  public isPointerLocked(): boolean {
    return this.pointerLocked || document.pointerLockElement === this.renderer.domElement;
  }

  public shouldSuppressEscapePause(): boolean {
    return shouldSuppressEscapePause(
      this.isPointerLocked(),
      this.lastPointerUnlockAt,
      performance.now(),
    );
  }

  public requestPointerLock() {
    if (this.mode !== 'gameplay' || this.disposed) return;
    const dom = this.renderer.domElement;
    if (document.pointerLockElement === dom || !dom.requestPointerLock) return;
    try {
      const maybePromise = dom.requestPointerLock() as unknown as Promise<void> | undefined;
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {
          this.pointerLockBlocked = true;
        });
      }
    } catch {
      this.pointerLockBlocked = true;
    }
  }

  public releasePointerLock() {
    if (document.pointerLockElement === this.renderer.domElement) {
      try {
        document.exitPointerLock?.();
      } catch {
        // ignore exit errors
      }
    }
  }

  public handleMouseLookDelta(dx: number, dy: number) {
    this.cameraLook = applyCameraLookDelta(
      this.cameraLook,
      dx,
      dy,
      this.settings.mouseSensitivity,
      POINTER_LOCK_BASE_SENS,
    );
  }

  public setCharacterConfig(config: CharacterConfig) {
    this.characterRig.updateAppearance(config);
  }

  public setPlayerPosition(x: number, y: number, z: number, snapCamera = true) {
    this.playerPos.set(x, y, z);
    this.kinematics.x = x;
    this.kinematics.y = y;
    this.kinematics.z = z;
    this.kinematics.vx = 0;
    this.kinematics.vy = 0;
    this.kinematics.vz = 0;
    this.kinematics.isGrounded = true;
    this.characterRig.group.position.copy(this.playerPos);
    this.contactShadow.position.set(x, y + 0.04, z);
    this.currentLocation = resolveLocationForPosition(x, z, this.currentLocation);

    if (snapCamera) {
      this.cameraLook = snapCameraLook(this.cameraLook);
      const horiz = Math.cos(this.cameraLook.pitch) * this.cameraLook.distance;
      const vert = Math.sin(this.cameraLook.pitch) * this.cameraLook.distance + 1.48;
      _camLookTarget.set(x, y + 1.28, z);
      const safeCam = resolveCameraOcclusion(
        _camLookTarget.x,
        _camLookTarget.y,
        _camLookTarget.z,
        x + Math.sin(this.cameraLook.yaw) * horiz,
        Math.max(y + 0.35, y + vert),
        z + Math.cos(this.cameraLook.yaw) * horiz,
        this.world.collisionData.colliders,
      );
      this.currentCamPos.set(safeCam.x, safeCam.y, safeCam.z);
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(_camLookTarget);
      this.dirLight.position.set(x + 22, 34, z + 18);
      this.dirLight.target.position.copy(this.playerPos);
      this.dirLight.target.updateMatrixWorld();
    }

    this.lastReportedX = x;
    this.lastReportedZ = z;
    this.lastReportedYaw = this.cameraLook.yaw;
    this.callbacks.onPlayerMove(x, z, this.cameraLook.yaw);
  }

  public setWorkoutState(active: boolean, exerciseId: ExerciseId | null, facingAngle?: number) {
    this.workoutActive = active;
    this.workoutExercise = exerciseId;
    this.workoutTime = 0;
    this.workoutRepActive = false;
    this.workoutRepProgress = 0;
    this.workoutFormMode = 'correct';
    this.workoutFormFlashTimer = 0;
    this.workoutHoldBoosting = false;
    if (active && facingAngle !== undefined) {
      this.kinematics.yaw = facingAngle;
      this.characterRig.group.rotation.y = facingAngle;
    }
  }

  public triggerWorkoutRep(quality: number) {
    this.workoutRepActive = true;
    this.workoutRepProgress = 0;
    this.workoutRepDirection = -this.workoutRepDirection;
    this.workoutFormMode = quality >= 0.8 ? 'correct' : 'mistake';
    this.workoutFormFlashTimer = 0.65;
  }

  public setWorkoutHoldActive(holding: boolean) {
    this.workoutHoldBoosting = holding;
  }

  public setWaypoint(locationId: LocationId | null) {
    this.waypointLocation = locationId;
    if (!locationId) {
      this.world.waypointBeacon.visible = false;
      return;
    }
    const loc = WORLD_LOCATIONS.find((l) => l.id === locationId);
    if (loc) {
      this.world.waypointBeacon.position.set(loc.x, 0, loc.z);
      this.world.waypointBeacon.visible = true;
    }
  }

  public setMobileMove(x: number, y: number) {
    this.mobileMove.x = x;
    this.mobileMove.y = y;
  }

  public setMobileSprint(sprint: boolean) {
    this.mobileSprint = sprint;
  }

  public triggerJump() {
    this.jumpBuffered = true;
  }

  public triggerInteract() {
    if (this.nearbyStation && this.mode === 'gameplay') {
      this.callbacks.onInteract(this.nearbyStation);
    }
  }

  public rotateCameraBy(dx: number, dy: number) {
    this.cameraLook = applyCameraLookDelta(
      this.cameraLook,
      dx,
      dy,
      this.settings.cameraSensitivity,
      TOUCH_ORBIT_BASE_SENS,
    );
  }

  private clearKeys = () => {
    this.keys = {};
    this.mobileMove.x = 0;
    this.mobileMove.y = 0;
    this.mobileSprint = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    // Do not intercept typing inside inputs
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    this.keys[e.code] = true;

    if (e.code === 'Escape') {
      return;
    }

    if (this.mode !== 'gameplay') return;

    if (e.code === 'Space') {
      this.jumpBuffered = true;
    } else if (e.code === 'KeyE' && this.nearbyStation) {
      this.callbacks.onInteract(this.nearbyStation);
    } else if (e.code === 'KeyM') {
      this.callbacks.onMapToggle();
    } else if (e.code === 'KeyL') {
      if (this.isPointerLocked()) {
        this.releasePointerLock();
      } else {
        this.requestPointerLock();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onPointerLockChange = () => {
    const locked = document.pointerLockElement === this.renderer.domElement;
    const wasLocked = this.pointerLocked;
    this.pointerLocked = locked;
    if (locked) {
      this.pointerLockBlocked = false;
      this.isDraggingCamera = false;
      this.activePointerId = null;
    } else if (wasLocked && this.mode === 'gameplay') {
      this.lastPointerUnlockAt = performance.now();
    }
    this.callbacks.onPointerLockChange?.(locked);
  };

  private onPointerLockError = () => {
    this.pointerLockBlocked = true;
    this.pointerLocked = false;
    this.callbacks.onPointerLockChange?.(false);
  };

  private onLockedMouseMove = (e: MouseEvent) => {
    if (this.mode !== 'gameplay' || !this.isPointerLocked()) return;
    this.handleMouseLookDelta(e.movementX, e.movementY);
  };

  private onPointerDown = (e: PointerEvent) => {
    soundEngine.unlock();
    if (this.mode !== 'gameplay') return;

    if (e.pointerType === 'touch') {
      this.isDraggingCamera = true;
      this.activePointerId = e.pointerId;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      return;
    }

    if (this.isPointerLocked()) {
      if (e.button === 0 && this.nearbyStation) {
        this.callbacks.onInteract(this.nearbyStation);
      }
      return;
    }

    if (e.button === 0) {
      this.requestPointerLock();
    }

    if (this.pointerLockBlocked) {
      this.isDraggingCamera = true;
      this.activePointerId = e.pointerId;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.mode !== 'gameplay' || this.isPointerLocked()) return;
    if (e.pointerType !== 'touch' && !this.pointerLockBlocked) return;
    if (!this.isDraggingCamera || (this.activePointerId !== null && e.pointerId !== this.activePointerId)) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    if (e.pointerType === 'touch') {
      this.rotateCameraBy(dx, dy);
    } else {
      this.handleMouseLookDelta(dx, dy);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.activePointerId === null || e.pointerId === this.activePointerId) {
      this.isDraggingCamera = false;
      this.activePointerId = null;
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (this.mode !== 'gameplay') return;
    this.cameraLook = {
      ...this.cameraLook,
      distance: THREE.MathUtils.clamp(this.cameraLook.distance + e.deltaY * 0.004, 3.2, 11.5),
    };
  };

  private onResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearKeys);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
    document.addEventListener('mousemove', this.onLockedMouseMove);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    dom.addEventListener('wheel', this.onWheel, { passive: true });
  }

  private updateGameplay(dt: number) {
    // 1. Gather continuous held inputs & edge-triggered jump
    const forwardInput =
      (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
      (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) +
      this.mobileMove.y;
    const rightInput =
      (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
      (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) +
      this.mobileMove.x;
    const wantsSprint = Boolean(
      this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.mobileSprint,
    );
    const jumpPressed = this.jumpBuffered;
    this.jumpBuffered = false;

    // 1.5. Smooth angular camera look damping
    this.cameraLook = stepCameraLookDamping(this.cameraLook, dt);

    // 2. Step deterministic 3D third-person physics & collision solver
    const { next, jumped, landed } = stepPlayerPhysics(
      this.kinematics,
      {
        forward: forwardInput,
        right: rightInput,
        sprint: wantsSprint,
        jumpPressed,
        camYaw: this.cameraLook.yaw,
      },
      this.world.collisionData,
      dt,
    );
    this.kinematics = next;
    this.playerPos.set(next.x, next.y, next.z);

    if (jumped) {
      soundEngine.playJump();
    } else if (landed) {
      soundEngine.playFootstep(true);
    }

    const moving = next.horizontalSpeed > 0.25;
    if (moving && next.isGrounded) {
      this.stepAccum += dt * (next.sprinting ? 3.2 : 2.1);
      if (this.stepAccum >= 1) {
        this.stepAccum = 0;
        soundEngine.playFootstep(next.sprinting);
      }
    }

    // 3. Apply transform & smooth blended skeletal animation
    this.characterRig.group.position.copy(this.playerPos);
    this.characterRig.group.rotation.y = next.yaw;
    this.contactShadow.position.set(next.x, next.y + 0.04, next.z);
    const shadowScale = THREE.MathUtils.clamp(1 - Math.max(0, next.y) * 0.18, 0.45, 1);
    this.contactShadow.scale.set(shadowScale, shadowScale, 1);

    let animState: CharacterAnimState = 'idle';
    if (!next.isGrounded) {
      animState = 'jump';
    } else if (moving) {
      animState = next.sprinting ? 'run' : 'walk';
    }

    const speedRatio = next.sprinting
      ? next.horizontalSpeed / 8.9
      : next.horizontalSpeed / WALK_SPEED;

    this.characterRig.animate(animState, this.elapsed, 'correct', false, {
      dt,
      speedRatio,
      landingImpact: next.landingImpact,
      verticalVelocity: next.vy,
    });

    // 4. Keep shadow camera centered around player for crisp shadows everywhere
    this.dirLight.position.set(this.playerPos.x + 22, 34, this.playerPos.z + 18);
    this.dirLight.target.position.copy(this.playerPos);
    this.dirLight.target.updateMatrixWorld();

    // 5. Third-person damped camera follow with ray-AABB wall avoidance
    const horiz = Math.cos(this.cameraLook.pitch) * this.cameraLook.distance;
    const vert = Math.sin(this.cameraLook.pitch) * this.cameraLook.distance + 1.48;
    _camLookTarget.set(this.playerPos.x, this.playerPos.y + 1.28, this.playerPos.z);
    _camGoal.set(
      this.playerPos.x + Math.sin(this.cameraLook.yaw) * horiz,
      Math.max(this.playerPos.y + 0.35, this.playerPos.y + vert),
      this.playerPos.z + Math.cos(this.cameraLook.yaw) * horiz,
    );

    const safeCam = resolveCameraOcclusion(
      _camLookTarget.x,
      _camLookTarget.y,
      _camLookTarget.z,
      _camGoal.x,
      _camGoal.y,
      _camGoal.z,
      this.world.collisionData.colliders,
    );
    _camGoal.set(safeCam.x, safeCam.y, safeCam.z);

    // Pull in briskly if occluded, glide smoothly when clear
    const dampLambda = safeCam.clipped ? 18 : 11;
    const dampFactor = 1 - Math.exp(-dampLambda * dt);
    this.currentCamPos.lerp(_camGoal, dampFactor);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(_camLookTarget);

    // 6. Check nearby stations & location transitions
    let closest: InteractiveStation | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < INTERACTIVE_STATIONS.length; i++) {
      const st = INTERACTIVE_STATIONS[i];
      const dist = Math.hypot(this.playerPos.x - st.x, this.playerPos.z - st.z);
      if (dist <= st.radius && dist < bestDist) {
        bestDist = dist;
        closest = st;
      }
    }
    if (closest?.id !== this.nearbyStation?.id) {
      this.nearbyStation = closest;
      this.callbacks.onNearbyStationChange(closest);
    }

    for (let i = 0; i < WORLD_LOCATIONS.length; i++) {
      const loc = WORLD_LOCATIONS[i];
      const dist = Math.hypot(this.playerPos.x - loc.x, this.playerPos.z - loc.z);
      if (dist <= loc.radius) {
        if (this.currentLocation !== loc.id) {
          this.currentLocation = loc.id;
          this.callbacks.onLocationChange(loc.id);
        }
        if (this.waypointLocation === loc.id) {
          this.setWaypoint(null);
          this.callbacks.onWaypointChange?.(null);
        }
        break;
      }
    }

    if (this.elapsed - this.lastHudReport > 0.08) {
      this.lastHudReport = this.elapsed;
      const roundedStamina = Math.round(next.stamina);
      if (roundedStamina !== this.lastReportedStamina) {
        this.lastReportedStamina = roundedStamina;
        this.callbacks.onStaminaChange(roundedStamina);
      }
      if (
        Math.abs(this.playerPos.x - this.lastReportedX) > 0.04 ||
        Math.abs(this.playerPos.z - this.lastReportedZ) > 0.04 ||
        Math.abs(this.cameraLook.yaw - this.lastReportedYaw) > 0.02
      ) {
        this.lastReportedX = this.playerPos.x;
        this.lastReportedZ = this.playerPos.z;
        this.lastReportedYaw = this.cameraLook.yaw;
        this.callbacks.onPlayerMove(this.playerPos.x, this.playerPos.z, this.cameraLook.yaw);
      }
    }
  }

  private updateMenuCamera(dt: number) {
    this.characterRig.group.position.set(0, 0, 3);
    this.characterRig.group.rotation.y = Math.sin(this.elapsed * 0.45) * 0.25;
    this.contactShadow.position.set(0, 0.04, 3);
    this.characterRig.animate('idle', this.elapsed);

    const orbitAngle = this.elapsed * 0.16;
    _camGoal.set(
      Math.sin(orbitAngle) * 5.2,
      2.35 + Math.sin(this.elapsed * 0.3) * 0.25,
      3 + Math.cos(orbitAngle) * 5.2,
    );
    this.currentCamPos.lerp(_camGoal, 1 - Math.exp(-3 * dt));
    this.camera.position.copy(this.currentCamPos);
    _camLookTarget.set(0, 1.15, 2.2);
    this.camera.lookAt(_camLookTarget);
  }

  private updateWorkoutCamera(dt: number) {
    const isContinuousHold =
      this.workoutExercise === 'planks' || this.workoutExercise === 'running';
    const timeMult = isContinuousHold && this.workoutHoldBoosting ? 1.35 : 1.0;
    this.workoutTime += dt * timeMult;

    if (this.workoutFormFlashTimer > 0) {
      this.workoutFormFlashTimer = Math.max(0, this.workoutFormFlashTimer - dt);
      if (this.workoutFormFlashTimer === 0) {
        this.workoutFormMode = 'correct';
      }
    }

    let repPhase: number | undefined;
    if (this.workoutActive && this.workoutExercise && !isContinuousHold) {
      if (this.workoutRepActive) {
        this.workoutRepProgress += dt / 0.44;
        if (this.workoutRepProgress >= 1) {
          this.workoutRepProgress = 0;
          this.workoutRepActive = false;
          repPhase = 0;
        } else {
          const pulse = Math.sin(this.workoutRepProgress * Math.PI);
          // Alternating sign exercises (lunges, mountain_climbers) alternate legs on each rep
          const alternating =
            this.workoutExercise === 'lunges' || this.workoutExercise === 'mountain_climbers';
          repPhase = alternating ? pulse * this.workoutRepDirection : pulse;
        }
      } else {
        repPhase = 0;
      }
    }

    const anim: CharacterAnimState =
      this.workoutActive && this.workoutExercise ? this.workoutExercise : 'idle';
    this.characterRig.animate(anim, this.workoutTime, this.workoutFormMode, this.workoutActive, {
      repPhase,
    });

    const angle = this.kinematics.yaw + 0.65;
    _playerCenter.set(this.playerPos.x, this.playerPos.y + 0.85, this.playerPos.z);
    _camGoal.set(
      this.playerPos.x + Math.sin(angle) * 3.1,
      this.playerPos.y + 1.55,
      this.playerPos.z + Math.cos(angle) * 3.1,
    );
    const safeWorkoutCam = resolveCameraOcclusion(
      _playerCenter.x,
      _playerCenter.y,
      _playerCenter.z,
      _camGoal.x,
      _camGoal.y,
      _camGoal.z,
      this.world.collisionData.colliders,
    );
    _camGoal.set(safeWorkoutCam.x, safeWorkoutCam.y, safeWorkoutCam.z);
    this.currentCamPos.lerp(_camGoal, 1 - Math.exp(-6 * dt));
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(_playerCenter);
  }

  private animateBeacons() {
    this.world.beacons.forEach((beacon) => {
      const diamond = beacon.children[1];
      if (diamond) {
        diamond.rotation.y = this.elapsed * 1.6;
        diamond.position.y = 1.55 + Math.sin(this.elapsed * 2.6) * 0.14;
      }
    });
    if (this.world.waypointBeacon.visible) {
      this.world.waypointBeacon.rotation.y = this.elapsed * 0.9;
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;

    if (this.mode === 'menu') {
      this.updateMenuCamera(dt);
    } else if (this.mode === 'gameplay') {
      this.updateGameplay(dt);
    } else if (this.mode === 'workout') {
      this.updateWorkoutCamera(dt);
    }

    this.animateBeacons();
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private startLoop() {
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  public dispose() {
    this.disposed = true;
    this.releasePointerLock();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearKeys);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    document.removeEventListener('mousemove', this.onLockedMouseMove);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('wheel', this.onWheel);

    this.characterRig.dispose();
    this.world.dispose();
    this.contactShadow.geometry.dispose();
    (this.contactShadow.material as THREE.Material).dispose();
    if (this.pmremEnv) this.pmremEnv.dispose();
    this.renderer.dispose();
    if (dom.parentElement) {
      dom.parentElement.removeChild(dom);
    }
  }
}
