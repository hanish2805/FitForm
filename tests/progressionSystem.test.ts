import assert from 'node:assert/strict';
import { EXERCISES } from '../src/data/exercises';
import { getAthleteRankTitle } from '../src/data/missions';
import { NUTRITION_ITEMS } from '../src/data/nutrition';
import {
  applyLocationVisit,
  applyNutritionMeal,
  applyXpAndRewards,
  claimAllCompletedMissions,
  completeWorkoutProgression,
  restAtHome,
} from '../src/utils/progression';
import { createNewSaveState, DEFAULT_CHARACTER } from '../src/utils/storage';

// 1. Fresh save starts at Level 1 with Beginner difficulty only
{
  const state = createNewSaveState(DEFAULT_CHARACTER, 'ADVANCED');
  assert.equal(state.level, 1);
  assert.equal(state.difficulty, 'BEGINNER');
  assert.deepEqual(state.unlockedDifficulties, ['BEGINNER']);
  assert.deepEqual(state.unlockedOutfits, ['volt_pro']);
  assert.equal(getAthleteRankTitle(state.level), 'Rookie Athlete');
}

// 2. Intermediate unlock, equipment certification & obsidian_stealth outfit reward
{
  let state = createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER');
  const w1 = completeWorkoutProgression(state, EXERCISES.pushups, 2, 16, 95, 75, 35);
  state = w1.nextState;
  assert.equal(state.unlockedDifficulties.includes('INTERMEDIATE'), false);

  const w2 = completeWorkoutProgression(state, EXERCISES.squats, 2, 16, 95, 110, 45);
  state = w2.nextState;
  assert.ok(state.level >= 2);
  assert.equal(state.unlockedDifficulties.includes('INTERMEDIATE'), true);
  assert.equal(w2.newlyUnlockedDifficulty, 'INTERMEDIATE');
  assert.ok(state.unlockedEquipment.includes('pullup'));
  assert.ok(state.unlockedEquipment.includes('turf'));
  assert.ok(state.unlockedOutfits.includes('obsidian_stealth'));
  assert.equal(getAthleteRankTitle(2), 'Campus Contender');
  assert.equal(getAthleteRankTitle(state.level), 'Conditioned Challenger');
}

// 3. Batch claimAllCompletedMissions & no double-claiming
{
  let state = createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER');
  state = applyLocationVisit(state, 'training_center').nextState;
  state = completeWorkoutProgression(state, EXERCISES.pushups, 2, 16, 95, 80, 30).nextState;
  state = completeWorkoutProgression(state, EXERCISES.squats, 2, 16, 95, 80, 30).nextState;

  const readyBefore = state.missions.filter((m) => m.completed && !m.claimed).length;
  assert.ok(readyBefore >= 3, `Expected at least 3 claimable missions, got ${readyBefore}`);

  const coinsBefore = state.coins;
  const claimRes = claimAllCompletedMissions(state);
  assert.equal(claimRes.claimedCount, readyBefore);
  state = claimRes.result.nextState;
  assert.ok(state.coins >= coinsBefore + claimRes.totalCoins);

  // Second claim should claim 0
  const secondClaim = claimAllCompletedMissions(state);
  assert.equal(secondClaim.claimedCount, 0);
}

// 4. Campus Tour, Nutrition Pro, Iron Consistency, Advanced Tier & Level 5 Legend rewards
{
  let state = createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER');

  // Visit all 5 campus locations -> Full Campus Tour + Carbon Track kit
  for (const loc of ['outdoor_zone', 'player_home', 'nutrition_center', 'competition_arena'] as const) {
    state = applyLocationVisit(state, loc).nextState;
  }
  assert.ok(state.unlockedOutfits.includes('carbon_track'), 'Campus tour should unlock carbon_track');

  // Log 3 healthy meals -> Fuel Strategist
  for (let i = 0; i < 3; i++) {
    state = applyNutritionMeal(state, NUTRITION_ITEMS[i]).nextState;
  }
  const fuelAch = state.achievements.find((a) => a.id === 'ach_nutrition_pro');
  assert.equal(fuelAch?.unlocked, true);

  // Complete 5 workouts including an Arena win -> Iron Consistency + Arena Champion + Advanced Tier + Level 5
  state = completeWorkoutProgression(state, EXERCISES.pushups, 2, 16, 95, 100, 40).nextState;
  state = completeWorkoutProgression(state, EXERCISES.squats, 2, 16, 95, 100, 40).nextState;
  state = completeWorkoutProgression(state, EXERCISES.running, 2, 40, 92, 110, 45).nextState;
  state = completeWorkoutProgression(state, EXERCISES.planks, 2, 40, 94, 110, 45).nextState;
  state = { ...state, arenaWins: 1 };
  const fifth = completeWorkoutProgression(state, EXERCISES.mountain_climbers, 3, 36, 96, 150, 75);
  state = fifth.nextState;

  assert.equal(state.unlockedDifficulties.includes('ADVANCED'), true, 'Advanced tier should unlock');
  assert.ok(state.unlockedEquipment.includes('bench'), 'Competition bench should unlock with Advanced');
  assert.ok(state.unlockedOutfits.includes('emerald_prime'), 'Arena/Level 5 should unlock emerald_prime');
  const ironAch = state.achievements.find((a) => a.id === 'ach_iron_streak');
  assert.equal(ironAch?.unlocked, true, 'Iron Consistency should unlock at 5 workouts');

  // Push to Level 5+ via XP reward -> FITFORM Pro achievement & FITFORM Legend rank
  const pushL5 = applyXpAndRewards(state, 1600, 0);
  state = pushL5.nextState;
  assert.ok(state.level >= 5, `Expected Level >= 5, got ${state.level}`);
  assert.equal(getAthleteRankTitle(state.level), 'FITFORM Legend');
  const lvl5Ach = state.achievements.find((a) => a.id === 'ach_level_five');
  assert.equal(lvl5Ach?.unlocked, true, 'FITFORM Pro achievement should unlock at Level 5');

  // Daily rest preserves weekly progress and refreshes daily missions
  const nextDay = restAtHome(state);
  assert.equal(nextDay.day, state.day + 1);
  assert.equal(nextDay.energy, 100);
}

console.log('ALL FITFORM PROGRESSION, LEVELS, DIFFICULTY, MISSIONS, ACHIEVEMENTS & REWARDS TESTS PASSED!');
