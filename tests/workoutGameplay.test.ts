import assert from 'node:assert/strict';
import { EXERCISES, getScaledExerciseParams } from '../src/data/exercises';
import { createCharacterRig } from '../src/engine/characterRig';
import { completeWorkoutProgression } from '../src/utils/progression';
import { createNewSaveState, DEFAULT_CHARACTER } from '../src/utils/storage';
import {
  computeWorkoutRewards,
  evaluateRepTiming,
  getSetTimeLimitSeconds,
} from '../src/utils/workoutChallenge';

// 1. Rep timing accuracy evaluation
{
  const perfect = evaluateRepTiming(0.5, 0.28);
  assert.equal(perfect.grade, 'perfect');
  assert.equal(perfect.quality, 1.0);

  const good = evaluateRepTiming(0.68, 0.28);
  assert.equal(good.grade, 'good');
  assert.equal(good.quality, 0.82);

  const sloppy = evaluateRepTiming(0.08, 0.28);
  assert.equal(sloppy.grade, 'sloppy');
  assert.equal(sloppy.quality, 0.58);
}

// 2. Push-up & Squat sets, reps, timers, and streak XP rewards
{
  const pushups = EXERCISES.pushups;
  const squats = EXERCISES.squats;

  const pushBeginner = getScaledExerciseParams(pushups, 'BEGINNER');
  const squatBeginner = getScaledExerciseParams(squats, 'BEGINNER');
  assert.equal(pushBeginner.sets, 2);
  assert.equal(pushBeginner.targetCount, 8);
  assert.equal(squatBeginner.sets, 2);
  assert.equal(squatBeginner.targetCount, 10);

  const pushTimer = getSetTimeLimitSeconds(pushups, 'BEGINNER', pushBeginner.targetCount);
  const squatTimer = getSetTimeLimitSeconds(squats, 'BEGINNER', squatBeginner.targetCount);
  assert.ok(pushTimer >= 30, `Push-up set timer should be >= 30s, got ${pushTimer}`);
  assert.ok(squatTimer >= 30, `Squat set timer should be >= 30s, got ${squatTimer}`);

  const fullReward = computeWorkoutRewards({
    baseXpReward: pushBeginner.xpReward,
    baseCoinReward: pushBeginner.coinReward,
    exercise: pushups,
    plannedSets: pushBeginner.sets,
    plannedRepsPerSet: pushBeginner.targetCount,
    setsCompleted: 2,
    totalRepsOrSeconds: 16,
    samples: Array(16).fill(1.0),
    bestStreak: 8,
    isArena: false,
  });
  assert.equal(fullReward.accuracyPercent, 100);
  assert.equal(fullReward.streakBonusPct, 24);
  assert.ok(fullReward.xpEarned > pushBeginner.xpReward, 'Perfect streak should boost XP above base');
  assert.ok((fullReward.attributeDelta.strength ?? 0) > 2.0, 'Push-ups should grant Strength gain');

  // Partial timeout claim (completed half the reps) should scale proportionally
  const partialReward = computeWorkoutRewards({
    baseXpReward: squatBeginner.xpReward,
    baseCoinReward: squatBeginner.coinReward,
    exercise: squats,
    plannedSets: squatBeginner.sets,
    plannedRepsPerSet: squatBeginner.targetCount,
    setsCompleted: 1,
    totalRepsOrSeconds: 10,
    samples: Array(10).fill(0.82),
    bestStreak: 4,
    isArena: false,
  });
  assert.ok(partialReward.xpEarned > 0 && partialReward.xpEarned < squatBeginner.xpReward);
}

// 3. Push-up & Squat progression, missions, attributes & XP leveling
{
  let state = createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER');
  const startEnergy = state.energy;
  const startStrength = state.attributes.strength;

  // Complete a full Push-Up challenge (16 reps)
  const pushProg = completeWorkoutProgression(
    state,
    EXERCISES.pushups,
    2,
    16,
    95,
    95,
    42,
  );
  state = pushProg.nextState;

  assert.equal(state.energy, startEnergy - EXERCISES.pushups.energyCost);
  assert.ok(state.attributes.strength > startStrength, 'Strength attribute should increase');
  assert.equal(state.workoutHistory.length, 1);
  assert.equal(state.workoutHistory[0].exerciseId, 'pushups');

  const pushMission = state.missions.find((m) => m.metric === 'pushups_reps');
  assert.ok(pushMission && pushMission.progress >= 16, 'Push-up mission should track 16 reps');

  // Complete a full Squat challenge (20 reps) -> unlocks First Sweat & Intermediate tier + Level Up!
  const squatProg = completeWorkoutProgression(
    state,
    EXERCISES.squats,
    2,
    20,
    98,
    110,
    48,
  );
  state = squatProg.nextState;

  const squatMission = state.missions.find((m) => m.metric === 'squats_reps');
  assert.ok(
    squatMission && squatMission.progress === 16 && squatMission.completed,
    'Squat mission should reach target 16 and mark completed',
  );
  assert.ok(state.level >= 2, `Expected athlete to reach Level 2+ after 2 workouts, got ${state.level}`);
  assert.ok(state.unlockedDifficulties.includes('INTERMEDIATE'), 'Intermediate tier should unlock');
  const firstSweat = state.achievements.find((a) => a.id === 'ach_first_workout');
  assert.equal(firstSweat?.unlocked, true, 'First Sweat achievement should unlock');
}

// 4. CharacterRig rep-phase skeletal animation (Push-ups & Squats top vs bottom depth)
{
  const rig = createCharacterRig(DEFAULT_CHARACTER);

  // Push-up top (repPhase = 0) vs bottom depth (repPhase = 1)
  rig.animate('pushups', 0.5, 'correct', true, { repPhase: 0 });
  const pushTopHipY = rig.joints.hips.position.y;
  const pushTopElbow = rig.joints.leftElbow.rotation.x;

  rig.animate('pushups', 0.5, 'correct', true, { repPhase: 1 });
  const pushBotHipY = rig.joints.hips.position.y;
  const pushBotElbow = rig.joints.leftElbow.rotation.x;

  assert.ok(pushBotHipY < pushTopHipY - 0.12, 'Push-up bottom should lower hips toward mat');
  assert.ok(pushBotElbow < pushTopElbow - 1.0, 'Push-up bottom should flex elbows deeply');

  // Squat top (repPhase = 0) vs bottom depth (repPhase = 1)
  rig.animate('squats', 0.5, 'correct', true, { repPhase: 0 });
  const squatTopHipY = rig.joints.hips.position.y;
  const squatTopKnee = rig.joints.leftKnee.rotation.x;

  rig.animate('squats', 0.5, 'correct', true, { repPhase: 1 });
  const squatBotHipY = rig.joints.hips.position.y;
  const squatBotKnee = rig.joints.leftKnee.rotation.x;

  assert.ok(squatBotHipY < squatTopHipY - 0.35, 'Squat bottom should lower hips significantly');
  assert.ok(squatBotKnee > squatTopKnee + 1.2, 'Squat bottom should bend knees deeply');

  rig.dispose();
}

console.log('ALL FITFORM WORKOUT GAMEPLAY, PUSH-UP, SQUAT, TIMERS & XP TESTS PASSED!');
