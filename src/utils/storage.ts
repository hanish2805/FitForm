import { createInitialAchievements, createInitialMissions } from '../data/missions';
import {
  CharacterConfig,
  DifficultyLevel,
  GameSaveState,
  GameSettings,
} from '../types/game';

const SAVE_KEY = 'fitform_save_v1';
const SETTINGS_KEY = 'fitform_settings_v1';

export const DEFAULT_CHARACTER: CharacterConfig = {
  name: 'Alex Mercer',
  bodyModel: 'athlete_lean',
  hairstyle: 'fade',
  hairColor: '#1f1b18',
  skinTone: '#d9a482',
  outfit: 'volt_pro',
  accessory: 'wristbands',
  fitnessGoal: 'General Fitness',
  optionalProfile: {},
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'medium',
  soundVolume: 0.7,
  musicVolume: 0.35,
  muted: false,
  mouseSensitivity: 1.0,
  cameraSensitivity: 1.0,
  showHud: true,
  mobileControlsMode: 'auto',
};

export function createNewSaveState(
  character: CharacterConfig = DEFAULT_CHARACTER,
  startingDifficulty: DifficultyLevel = 'BEGINNER',
): GameSaveState {
  // Always enforce progression rules: Advanced cannot start unlocked on a brand-new save
  const safeDifficulty: DifficultyLevel =
    startingDifficulty === 'BEGINNER' ? 'BEGINNER' : 'BEGINNER';

  return {
    version: 1,
    day: 1,
    character,
    difficulty: safeDifficulty,
    unlockedDifficulties: ['BEGINNER'],
    level: 1,
    xp: 0,
    xpToNextLevel: 200,
    coins: 100,
    energy: 100,
    stamina: 100,
    nutritionBalance: 70,
    attributes: {
      strength: 15,
      stamina: 15,
      endurance: 15,
      agility: 15,
      recovery: 20,
    },
    visitedLocations: ['training_center'],
    unlockedOutfits: ['volt_pro'],
    unlockedEquipment: ['mat', 'rack', 'treadmill', 'track'],
    missions: createInitialMissions(),
    achievements: createInitialAchievements(),
    workoutHistory: [],
    mealsLoggedToday: [],
    arenaWins: 0,
    // Spawn right outside the Training Center entrance facing the gym & campus plaza
    playerPosition: { x: 0, y: 0, z: 3 },
    lastSavedAt: new Date().toISOString(),
  };
}

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val)
    ? Math.min(max, Math.max(min, val))
    : fallback;
}

const VALID_DIFFICULTIES: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export function normalizeSaveState(raw: unknown): GameSaveState | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = raw as Partial<GameSaveState>;
  if (!parsed.character || typeof parsed.character !== 'object') return null;

  const base = createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER');
  const rawChar = parsed.character as Partial<CharacterConfig>;
  const character: CharacterConfig = {
    ...DEFAULT_CHARACTER,
    ...rawChar,
    name:
      typeof rawChar.name === 'string' && rawChar.name.trim().length > 0
        ? rawChar.name.slice(0, 32)
        : DEFAULT_CHARACTER.name,
    optionalProfile: {
      ...(rawChar.optionalProfile ?? {}),
    },
  };

  const unlockedDifficulties: DifficultyLevel[] = Array.isArray(parsed.unlockedDifficulties)
    ? Array.from(
        new Set<DifficultyLevel>([
          'BEGINNER',
          ...parsed.unlockedDifficulties.filter((d): d is DifficultyLevel =>
            VALID_DIFFICULTIES.includes(d as DifficultyLevel),
          ),
        ]),
      )
    : ['BEGINNER'];

  const difficulty: DifficultyLevel =
    parsed.difficulty && unlockedDifficulties.includes(parsed.difficulty)
      ? parsed.difficulty
      : 'BEGINNER';

  const visitedLocations = Array.isArray(parsed.visitedLocations)
    ? Array.from(new Set(['training_center' as const, ...parsed.visitedLocations]))
    : base.visitedLocations;

  const unlockedOutfits = Array.isArray(parsed.unlockedOutfits)
    ? Array.from(new Set(['volt_pro' as const, ...parsed.unlockedOutfits]))
    : base.unlockedOutfits;

  const unlockedEquipment = Array.isArray(parsed.unlockedEquipment)
    ? Array.from(new Set([...base.unlockedEquipment, ...parsed.unlockedEquipment]))
    : base.unlockedEquipment;

  const savedMissionMap = new Map(
    (Array.isArray(parsed.missions) ? parsed.missions : []).map((m) => [m.id, m]),
  );
  const missions = base.missions.map((def) => {
    const prev = savedMissionMap.get(def.id);
    if (!prev) return def;
    const progress = clampNum(prev.progress, 0, def.target, 0);
    const completed = Boolean(prev.completed || progress >= def.target);
    return {
      ...def,
      progress,
      completed,
      claimed: Boolean(prev.claimed && completed),
    };
  });

  const savedAchMap = new Map(
    (Array.isArray(parsed.achievements) ? parsed.achievements : []).map((a) => [a.id, a]),
  );
  const achievements = base.achievements.map((def) => {
    const prev = savedAchMap.get(def.id);
    if (!prev) return def;
    return {
      ...def,
      unlocked: Boolean(prev.unlocked),
      unlockedAt: prev.unlockedAt,
    };
  });

  const rawPos = parsed.playerPosition;
  const playerPosition = {
    x: clampNum(rawPos?.x, -61, 61, base.playerPosition.x),
    y: clampNum(rawPos?.y, 0, 10, base.playerPosition.y),
    z: clampNum(rawPos?.z, -61, 61, base.playerPosition.z),
  };

  return {
    ...base,
    ...parsed,
    version: 1,
    day: Math.max(1, Math.floor(clampNum(parsed.day, 1, 9999, 1))),
    character,
    difficulty,
    unlockedDifficulties,
    level: Math.max(1, Math.floor(clampNum(parsed.level, 1, 99, 1))),
    xp: Math.max(0, Math.floor(clampNum(parsed.xp, 0, 999999, 0))),
    xpToNextLevel: Math.max(100, Math.floor(clampNum(parsed.xpToNextLevel, 100, 999999, 200))),
    coins: Math.max(0, Math.floor(clampNum(parsed.coins, 0, 9999999, 100))),
    energy: clampNum(parsed.energy, 0, 100, 100),
    stamina: clampNum(parsed.stamina, 0, 100, 100),
    nutritionBalance: clampNum(parsed.nutritionBalance, 0, 100, 70),
    attributes: {
      ...base.attributes,
      ...(parsed.attributes ?? {}),
    },
    visitedLocations,
    unlockedOutfits,
    unlockedEquipment,
    missions,
    achievements,
    workoutHistory: Array.isArray(parsed.workoutHistory) ? parsed.workoutHistory.slice(0, 50) : [],
    mealsLoggedToday: Array.isArray(parsed.mealsLoggedToday) ? parsed.mealsLoggedToday : [],
    arenaWins: Math.max(0, Math.floor(clampNum(parsed.arenaWins, 0, 99999, 0))),
    playerPosition,
    lastSavedAt: typeof parsed.lastSavedAt === 'string' ? parsed.lastSavedAt : base.lastSavedAt,
  };
}

export function loadSavedGame(): GameSaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return normalizeSaveState(parsed);
  } catch {
    return null;
  }
}

export function saveGame(state: GameSaveState): GameSaveState {
  const updated: GameSaveState = {
    ...state,
    lastSavedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors gracefully
  }
  return updated;
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      soundVolume: clampNum(parsed.soundVolume, 0, 1, DEFAULT_SETTINGS.soundVolume),
      musicVolume: clampNum(parsed.musicVolume, 0, 1, DEFAULT_SETTINGS.musicVolume),
      mouseSensitivity: clampNum(parsed.mouseSensitivity, 0.4, 2.2, DEFAULT_SETTINGS.mouseSensitivity),
      cameraSensitivity: clampNum(parsed.cameraSensitivity, 0.4, 2.2, DEFAULT_SETTINGS.cameraSensitivity),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

