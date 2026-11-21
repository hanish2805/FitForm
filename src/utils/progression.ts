import { createInitialMissions } from '../data/missions';
import {
  DifficultyLevel,
  ExerciseDefinition,
  GameSaveState,
  LocationId,
  MissionMetric,
  NutritionItem,
  OutfitId,
} from '../types/game';

export interface ProgressionResult {
  nextState: GameSaveState;
  leveledUp: boolean;
  newLevel: number;
  newlyCompletedMissions: string[];
  newlyUnlockedAchievements: string[];
  newlyUnlockedDifficulty: DifficultyLevel | null;
  newlyUnlockedOutfits: OutfitId[];
  newlyUnlockedEquipment: string[];
}

export function applyXpAndRewards(
  state: GameSaveState,
  xpGain: number,
  coinGain: number,
  metrics: Partial<Record<MissionMetric, number>> = {},
): ProgressionResult {
  let xp = state.xp + xpGain;
  let level = state.level;
  let xpToNext = state.xpToNextLevel;
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = Math.round(xpToNext * 1.32);
    leveledUp = true;
  }

  // Update mission progress
  const allMetrics: Partial<Record<MissionMetric, number>> = {
    ...metrics,
    xp_earned: (metrics.xp_earned ?? 0) + xpGain,
  };

  const newlyCompletedMissions: string[] = [];
  const missions = state.missions.map((m) => {
    if (m.completed) return m;
    if (m.metric === 'locations_visited') {
      const progress = Math.min(m.target, state.visitedLocations.length);
      const completed = progress >= m.target;
      if (completed) newlyCompletedMissions.push(m.title);
      return { ...m, progress, completed };
    }
    const delta = allMetrics[m.metric] ?? 0;
    if (delta <= 0) return m;
    const progress = Math.min(m.target, m.progress + delta);
    const completed = progress >= m.target;
    if (completed) newlyCompletedMissions.push(m.title);
    return { ...m, progress, completed };
  });

  // Check difficulty & equipment certification unlocks via actual progression
  const unlockedDifficulties: DifficultyLevel[] = [...state.unlockedDifficulties];
  const unlockedEquipment: string[] = [...state.unlockedEquipment];
  const unlockedOutfits: OutfitId[] = [...state.unlockedOutfits];
  const newlyUnlockedOutfits: OutfitId[] = [];
  const newlyUnlockedEquipment: string[] = [];
  let newlyUnlockedDifficulty: DifficultyLevel | null = null;
  const totalWorkouts = state.workoutHistory.length;

  const grantEquipment = (eq: string) => {
    if (!unlockedEquipment.includes(eq)) {
      unlockedEquipment.push(eq);
      newlyUnlockedEquipment.push(eq);
    }
  };
  const grantOutfit = (outfit: OutfitId): boolean => {
    if (!unlockedOutfits.includes(outfit)) {
      unlockedOutfits.push(outfit);
      newlyUnlockedOutfits.push(outfit);
      return true;
    }
    return false;
  };

  if (!unlockedDifficulties.includes('INTERMEDIATE') && (level >= 2 || totalWorkouts >= 2)) {
    unlockedDifficulties.push('INTERMEDIATE');
    newlyUnlockedDifficulty = 'INTERMEDIATE';
  }
  if (unlockedDifficulties.includes('INTERMEDIATE')) {
    grantEquipment('pullup');
    grantEquipment('turf');
  }

  if (
    !unlockedDifficulties.includes('ADVANCED') &&
    (level >= 4 || (totalWorkouts >= 5 && state.arenaWins >= 1))
  ) {
    unlockedDifficulties.push('ADVANCED');
    newlyUnlockedDifficulty = 'ADVANCED';
  }
  if (unlockedDifficulties.includes('ADVANCED')) {
    grantEquipment('bench');
  }

  let bonusXp = 0;
  let bonusCoins = 0;

  // Level 3 milestone outfit (or bonus coins if already unlocked via exploration)
  if (level >= 3 && state.level < 3) {
    if (!grantOutfit('carbon_track')) {
      bonusCoins += 50;
    }
  }
  // Level 5 milestone outfit (or bonus coins if already unlocked via Arena)
  if (level >= 5 && state.level < 5) {
    if (!grantOutfit('emerald_prime')) {
      bonusCoins += 100;
    }
  }

  // Evaluate achievements (multi-pass so level-5 achievement can also unlock if bonus XP crosses level 5)
  const newlyUnlockedAchievements: string[] = [];
  const evaluateAchievements = (currLevel: number, list: typeof state.achievements) =>
    list.map((ach) => {
      if (ach.unlocked) return ach;
      let shouldUnlock = false;
      if (ach.id === 'ach_first_workout' && totalWorkouts >= 1) shouldUnlock = true;
      if (ach.id === 'ach_world_tour' && state.visitedLocations.length >= 5) shouldUnlock = true;
      if (ach.id === 'ach_nutrition_pro' && state.mealsLoggedToday.length >= 3) shouldUnlock = true;
      if (ach.id === 'ach_intermediate_tier' && unlockedDifficulties.includes('INTERMEDIATE')) shouldUnlock = true;
      if (ach.id === 'ach_arena_champion' && state.arenaWins >= 1) shouldUnlock = true;
      if (ach.id === 'ach_advanced_tier' && unlockedDifficulties.includes('ADVANCED')) shouldUnlock = true;
      if (ach.id === 'ach_iron_streak' && totalWorkouts >= 5) shouldUnlock = true;
      if (ach.id === 'ach_level_five' && currLevel >= 5) shouldUnlock = true;

      if (!shouldUnlock) return ach;
      newlyUnlockedAchievements.push(ach.title);
      bonusXp += ach.xpReward;
      bonusCoins += ach.coinReward;
      if (ach.unlockOutfit) {
        grantOutfit(ach.unlockOutfit);
      }
      return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
    });

  let achievements = evaluateAchievements(level, state.achievements);

  xp += bonusXp;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = Math.round(xpToNext * 1.32);
    leveledUp = true;
  }

  // Re-check level-gated unlocks if achievement bonus XP caused a level-up
  if (!unlockedDifficulties.includes('INTERMEDIATE') && level >= 2) {
    unlockedDifficulties.push('INTERMEDIATE');
    newlyUnlockedDifficulty = 'INTERMEDIATE';
    grantEquipment('pullup');
    grantEquipment('turf');
  }
  if (!unlockedDifficulties.includes('ADVANCED') && level >= 4) {
    unlockedDifficulties.push('ADVANCED');
    newlyUnlockedDifficulty = 'ADVANCED';
    grantEquipment('bench');
  }
  if (level >= 3 && !unlockedOutfits.includes('carbon_track')) {
    grantOutfit('carbon_track');
  }
  if (level >= 5 && !unlockedOutfits.includes('emerald_prime')) {
    grantOutfit('emerald_prime');
  }
  const secondPassAchievements = evaluateAchievements(level, achievements);
  achievements = secondPassAchievements;

  return {
    nextState: {
      ...state,
      level,
      xp,
      xpToNextLevel: xpToNext,
      coins: state.coins + coinGain + bonusCoins,
      unlockedDifficulties,
      unlockedOutfits,
      unlockedEquipment,
      missions,
      achievements,
    },
    leveledUp,
    newLevel: level,
    newlyCompletedMissions,
    newlyUnlockedAchievements,
    newlyUnlockedDifficulty,
    newlyUnlockedOutfits,
    newlyUnlockedEquipment,
  };
}

export function claimAllCompletedMissions(state: GameSaveState): {
  result: ProgressionResult;
  claimedCount: number;
  totalXp: number;
  totalCoins: number;
} {
  const ready = state.missions.filter((m) => m.completed && !m.claimed);
  if (ready.length === 0) {
    return {
      result: {
        nextState: state,
        leveledUp: false,
        newLevel: state.level,
        newlyCompletedMissions: [],
        newlyUnlockedAchievements: [],
        newlyUnlockedDifficulty: null,
        newlyUnlockedOutfits: [],
        newlyUnlockedEquipment: [],
      },
      claimedCount: 0,
      totalXp: 0,
      totalCoins: 0,
    };
  }
  const totalXp = ready.reduce((sum, m) => sum + m.xpReward, 0);
  const totalCoins = ready.reduce((sum, m) => sum + m.coinReward, 0);
  const updatedMissions = state.missions.map((m) =>
    m.completed && !m.claimed ? { ...m, claimed: true } : m,
  );
  const result = applyXpAndRewards(
    { ...state, missions: updatedMissions },
    totalXp,
    totalCoins,
  );
  return {
    result,
    claimedCount: ready.length,
    totalXp,
    totalCoins,
  };
}

export function completeWorkoutProgression(
  state: GameSaveState,
  exercise: ExerciseDefinition,
  setsCompleted: number,
  totalRepsOrSeconds: number,
  accuracyPercent: number,
  xpEarned: number,
  coinsEarned: number,
): ProgressionResult {
  const accuracyScale = 0.65 + (accuracyPercent / 100) * 0.5;
  const clampAttr = (v: number) => Math.min(100, Math.round((v + Number.EPSILON) * 10) / 10);

  const nextAttrs = {
    strength: clampAttr(state.attributes.strength + (exercise.attributeGains.strength ?? 0) * accuracyScale),
    stamina: clampAttr(state.attributes.stamina + (exercise.attributeGains.stamina ?? 0) * accuracyScale),
    endurance: clampAttr(state.attributes.endurance + (exercise.attributeGains.endurance ?? 0) * accuracyScale),
    agility: clampAttr(state.attributes.agility + (exercise.attributeGains.agility ?? 0) * accuracyScale),
    recovery: clampAttr(state.attributes.recovery + (exercise.attributeGains.recovery ?? 0.4) * accuracyScale),
  };

  const entry = {
    id: `w_${Date.now()}`,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    difficulty: state.difficulty,
    setsCompleted,
    totalRepsOrSeconds,
    accuracyPercent,
    xpEarned,
    coinsEarned,
    timestamp: new Date().toISOString(),
  };

  const updatedState: GameSaveState = {
    ...state,
    energy: Math.max(0, state.energy - exercise.energyCost),
    attributes: nextAttrs,
    workoutHistory: [entry, ...state.workoutHistory].slice(0, 50),
  };

  const metrics: Partial<Record<MissionMetric, number>> = {
    workouts_completed: 1,
  };
  if (exercise.id === 'pushups') metrics.pushups_reps = totalRepsOrSeconds;
  if (exercise.id === 'squats') metrics.squats_reps = totalRepsOrSeconds;
  if (exercise.id === 'running') metrics.running_sessions = 1;
  if (['running', 'planks', 'mountain_climbers'].includes(exercise.id)) {
    metrics.endurance_workouts = 1;
  }

  return applyXpAndRewards(updatedState, xpEarned, coinsEarned, metrics);
}

export function applyLocationVisit(state: GameSaveState, locationId: LocationId): ProgressionResult {
  const visited = state.visitedLocations.includes(locationId)
    ? state.visitedLocations
    : [...state.visitedLocations, locationId];
  const isNew = visited.length > state.visitedLocations.length;
  const metrics: Partial<Record<MissionMetric, number>> = {};
  if (locationId === 'training_center') metrics.gym_visited = 1;

  const updated: GameSaveState = {
    ...state,
    visitedLocations: visited,
  };

  return applyXpAndRewards(updated, isNew ? 35 : 0, isNew ? 15 : 0, metrics);
}

export function applyNutritionMeal(state: GameSaveState, item: NutritionItem): ProgressionResult {
  const updated: GameSaveState = {
    ...state,
    coins: Math.max(0, state.coins - item.costCoins),
    energy: Math.min(100, state.energy + item.energyGain),
    nutritionBalance: Math.min(100, state.nutritionBalance + item.balanceGain),
    attributes: {
      ...state.attributes,
      recovery: Math.min(100, Math.round((state.attributes.recovery + item.recoveryGain * 0.08) * 10) / 10),
    },
    mealsLoggedToday: [...state.mealsLoggedToday, item.id],
  };

  return applyXpAndRewards(updated, 25, 0, { meals_eaten: 1 });
}

export function restAtHome(state: GameSaveState): GameSaveState {
  // Restore energy & recovery, advance day, refresh daily missions while keeping weekly progress
  const freshMissions = createInitialMissions();
  const mergedMissions = state.missions.map((m) => {
    if (m.type === 'weekly') return m;
    const template = freshMissions.find((f) => f.id === m.id);
    return template ?? { ...m, progress: 0, completed: false, claimed: false };
  });

  return {
    ...state,
    day: state.day + 1,
    energy: 100,
    stamina: 100,
    nutritionBalance: Math.max(55, state.nutritionBalance - 10),
    mealsLoggedToday: [],
    attributes: {
      ...state.attributes,
      recovery: Math.min(100, Math.round((state.attributes.recovery + 2.5) * 10) / 10),
    },
    missions: mergedMissions,
  };
}
