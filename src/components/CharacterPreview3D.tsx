import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useEffect, useRef } from 'react';
import { CharacterAnimState, CharacterRig, createCharacterRig } from '../engine/characterRig';
import { isSoftwareWebGL } from '../engine/glUtils';
import { createContactShadowTexture } from '../engine/textures';
import { CharacterConfig } from '../types/game';

interface CharacterPreview3DProps {
  character: CharacterConfig;
  animState: CharacterAnimState;
  playing?: boolean;
  speed?: number;
  formMode?: 'correct' | 'mistake';
  showFormIndicators?: boolean;
  cameraPreset?: 'front' | 'side' | 'three_quarter';
  zoomLevel?: number;
  resetToken?: number;
  className?: string;
}

export function CharacterPreview3D({
  character,
  animState,
  playing = true,
  speed = 1,
  formMode = 'correct',
  showFormIndicators = false,
  cameraPreset = 'three_quarter',
  zoomLevel = 1,
  resetToken = 0,
  className = '',
}: CharacterPreview3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<CharacterRig | null>(null);

  const propsRef = useRef({
    animState,
    playing,
    speed,
    formMode,
    showFormIndicators,
    zoomLevel,
  });
  propsRef.current = { animState, playing, speed, formMode, showFormIndicators, zoomLevel };

  const orbitRef = useRef({
    yaw: 0.45,
    pitch: 0.16,
    dist: 3.3,
    targetYaw: 0.45,
    targetPitch: 0.16,
    dragging: false,
    lastX: 0,
    lastY: 0,
    animTime: 0,
  });

  useEffect(() => {
    if (cameraPreset === 'front') {
      orbitRef.current.targetYaw = 0;
      orbitRef.current.targetPitch = 0.12;
    } else if (cameraPreset === 'side') {
      orbitRef.current.targetYaw = Math.PI / 2;
      orbitRef.current.targetPitch = 0.12;
    } else {
      orbitRef.current.targetYaw = 0.45;
      orbitRef.current.targetPitch = 0.18;
    }
  }, [cameraPreset]);

  useEffect(() => {
    orbitRef.current.animTime = 0;
  }, [resetToken, animState]);

  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.updateAppearance(character);
    }
  }, [character]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);

    const isSoftwareGl = isSoftwareWebGL();

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c120e');

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 40);

    const hemi = new THREE.HemisphereLight('#b5dcff', '#1b261e', 0.8);
    const key = new THREE.DirectionalLight('#fff2db', 1.55);
    key.position.set(3, 5, 4);
    const rim = new THREE.DirectionalLight('#C7FF00', 0.55);
    rim.position.set(-4, 3, -3);
    scene.add(hemi, key, rim);

    // Pedestal Stage
    const platformGeo = new THREE.CylinderGeometry(1.15, 1.25, 0.14, 36);
    const platformMat = new THREE.MeshStandardMaterial({ color: '#171f1a', roughness: 0.45, metalness: 0.6 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.07;
    scene.add(platform);

    const ringGeo = new THREE.RingGeometry(1.13, 1.19, 36);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#C7FF00', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.006;
    scene.add(shadowPlane);

    const rig = createCharacterRig(character);
    rigRef.current = rig;
    scene.add(rig.group);

    let disposed = false;
    let frameId = 0;
    let lastTime = performance.now();

    const onDown = (e: PointerEvent) => {
      orbitRef.current.dragging = true;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!orbitRef.current.dragging) return;
      const dx = e.clientX - orbitRef.current.lastX;
      const dy = e.clientY - orbitRef.current.lastY;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
      orbitRef.current.targetYaw -= dx * 0.012;
      orbitRef.current.targetPitch = THREE.MathUtils.clamp(
        orbitRef.current.targetPitch + dy * 0.008,
        -0.15,
        0.85,
      );
    };
    const onUp = () => {
      orbitRef.current.dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.dist = THREE.MathUtils.clamp(orbitRef.current.dist + e.deltaY * 0.0025, 2.0, 5.4);
    };
    const onResize = () => {
      if (disposed || !container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    const renderFrame = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const p = propsRef.current;
      if (p.playing) {
        orbitRef.current.animTime += dt * p.speed;
      }

      rig.animate(p.animState, orbitRef.current.animTime, p.formMode, p.showFormIndicators);
      ringMat.color.set(
        p.showFormIndicators ? (p.formMode === 'correct' ? '#22c55e' : '#ef4444') : '#C7FF00',
      );

      const damp = 1 - Math.exp(-10 * dt);
      orbitRef.current.yaw += (orbitRef.current.targetYaw - orbitRef.current.yaw) * damp;
      orbitRef.current.pitch += (orbitRef.current.targetPitch - orbitRef.current.pitch) * damp;

      const d = orbitRef.current.dist / Math.max(0.5, p.zoomLevel);
      const horiz = Math.cos(orbitRef.current.pitch) * d;
      const vert = Math.sin(orbitRef.current.pitch) * d + 0.95;
      camera.position.set(
        Math.sin(orbitRef.current.yaw) * horiz,
        vert,
        Math.cos(orbitRef.current.yaw) * horiz,
      );
      camera.lookAt(0, 0.9, 0);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(renderFrame, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      rig.dispose();
      platformGeo.dispose();
      platformMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      shadowTex.dispose();
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      envTex.dispose();
      renderer.dispose();
      if (dom.parentElement) dom.parentElement.removeChild(dom);
    };
  }, []);

  return <div ref={mountRef} className={`relative w-full h-full cursor-grab active:cursor-grabbing ${className}`} />;
}
