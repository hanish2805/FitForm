import assert from 'node:assert/strict';
import * as THREE from 'three';
import { INTERACTIVE_STATIONS, resolveLocationForPosition, WORLD_LOCATIONS } from '../src/data/worldLocations';
import { stepPlayerPhysics, createInitialPlayerState } from '../src/engine/physics';
import { createNewSaveState, DEFAULT_CHARACTER, loadSavedGame, loadSettings, normalizeSaveState, saveGame, saveSettings, DEFAULT_SETTINGS } from '../src/utils/storage';

// 1. Mock localStorage for Node test environment & verify save/reload persistence
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  get length() {
    return store.size;
  },
  clear() {
    store.clear();
  },
  getItem(k: string) {
    return store.get(k) ?? null;
  },
  key(index: number) {
    return Array.from(store.keys())[index] ?? null;
  },
  removeItem(k: string) {
    store.delete(k);
  },
  setItem(k: string, v: string) {
    store.set(k, String(v));
  },
};

{
  const customChar = {
    ...DEFAULT_CHARACTER,
    name: 'Kai Sterling',
    bodyModel: 'athlete_power' as const,
    outfit: 'carbon_track' as const,
    fitnessGoal: 'Muscle Gain' as const,
  };
  const created = createNewSaveState(customChar, 'BEGINNER');
  created.level = 3;
  created.xp = 145;
  created.coins = 390;
  created.day = 4;
  created.playerPosition = { x: 26, y: 0.5, z: 28 };
  created.unlockedDifficulties = ['BEGINNER', 'INTERMEDIATE'];
  created.unlockedOutfits = ['volt_pro', 'obsidian_stealth', 'carbon_track'];
  created.visitedLocations = ['training_center', 'outdoor_zone', 'competition_arena'];

  saveGame(created);
  const reloaded = loadSavedGame();
  assert.ok(reloaded !== null, 'Saved game should reload cleanly');
  assert.equal(reloaded.character.name, 'Kai Sterling');
  assert.equal(reloaded.level, 3);
  assert.equal(reloaded.xp, 145);
  assert.equal(reloaded.coins, 390);
  assert.equal(reloaded.day, 4);
  assert.deepEqual(reloaded.playerPosition, { x: 26, y: 0.5, z: 28 });
  assert.ok(reloaded.unlockedDifficulties.includes('INTERMEDIATE'));
  assert.ok(reloaded.unlockedOutfits.includes('carbon_track'));
  assert.equal(reloaded.visitedLocations.length, 3);
}

// 2. Partial / legacy save normalization & corruption protection
{
  const legacyPartial = {
    character: { name: 'Legacy Hero' },
    level: 2,
    difficulty: 'ADVANCED', // invalid if ADVANCED isn't unlocked -> must downgrade safely
    unlockedDifficulties: [],
    playerPosition: { x: 9999, y: -50, z: Number.NaN },
    energy: 150,
    missions: [{ id: 'daily_gym_visit', progress: 1, completed: true, claimed: true }],
  };
  const normalized = normalizeSaveState(legacyPartial);
  assert.ok(normalized !== null);
  assert.equal(normalized.character.name, 'Legacy Hero');
  assert.equal(normalized.difficulty, 'BEGINNER');
  assert.deepEqual(normalized.unlockedDifficulties, ['BEGINNER']);
  assert.equal(normalized.playerPosition.x, 61);
  assert.equal(normalized.playerPosition.y, 0);
  assert.equal(normalized.playerPosition.z, 3);
  assert.equal(normalized.energy, 100);
  assert.ok(normalized.missions.length >= 6);
  const firstMission = normalized.missions.find((m) => m.id === 'daily_gym_visit');
  assert.equal(firstMission?.claimed, true);

  // Corrupted JSON in localStorage returns null instead of throwing
  localStorage.setItem('fitform_save_v1', '{bad-json');
  assert.equal(loadSavedGame(), null);

  // Settings save & load with bounds clamping
  saveSettings({ ...DEFAULT_SETTINGS, soundVolume: 0.9, muted: true, graphicsQuality: 'high' });
  const loadedSettings = loadSettings();
  assert.equal(loadedSettings.soundVolume, 0.9);
  assert.equal(loadedSettings.muted, true);
  assert.equal(loadedSettings.graphicsQuality, 'high');
}

// 3. Location lookup & spawn safety across all 5 districts
{
  for (const loc of WORLD_LOCATIONS) {
    const sx = loc.spawnX ?? loc.x;
    const sz = loc.spawnZ ?? loc.z;
    const resolved = resolveLocationForPosition(sx, sz);
    assert.equal(
      resolved,
      loc.id,
      `Spawn point (${sx}, ${sz}) for ${loc.id} resolved to ${resolved}`,
    );
  }

  // Every interactive station lies within its district's location radius
  for (const st of INTERACTIVE_STATIONS) {
    const loc = WORLD_LOCATIONS.find((l) => l.id === st.locationId);
    assert.ok(loc, `Station ${st.id} must reference a valid location`);
    const dist = Math.hypot(st.x - loc.x, st.z - loc.z);
    assert.ok(
      dist <= loc.radius,
      `Station ${st.id} is ${dist.toFixed(1)}m from ${loc.id} center (radius ${loc.radius})`,
    );
  }

  // Test physics player boundary clamp at world bounds 62
  const state = createInitialPlayerState(60, 0, 0, 0);
  const res = stepPlayerPhysics(
    state,
    { forward: 1, right: 0, sprint: true, jumpPressed: false, camYaw: -Math.PI / 2 },
    { colliders: [], platforms: [], worldBounds: 62 },
    0.5,
  );
  assert.ok(res.next.x <= 62, 'Player should remain within worldBounds');
}

// Sanity check THREE vector availability
assert.equal(new THREE.Vector3(1, 2, 3).lengthSq(), 14);

console.log('ALL FITFORM STORAGE, RELOAD NORMALIZATION & WORLD LOCATION TESTS PASSED!');
