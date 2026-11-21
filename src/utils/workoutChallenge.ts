import { DifficultyLevel, ExerciseDefinition, PlayerAttributes } from '../types/game';

export type RepGrade = 'perfect' | 'good' | 'sloppy';

export interface RepEvaluation {
  grade: RepGrade;
  quality: number;
  feedback: string;
}

export function evaluateRepTiming(cursorPos: number, timingWindow: number): RepEvaluation {
  const dist = Math.abs(cursorPos - 0.5);
  if (dist <= timingWindow * 0.45) {
    return {
      grade: 'perfect',
      quality: 1.0,
      feedback: 'PERFECT FORM! Full depth & crisp lockout.',
    };
  }
  if (dist <= timingWindow) {
    return {
      grade: 'good',
      quality: 0.82,
      feedback: 'GOOD REP! Solid tempo & alignment.',
    };
  }
  return {
    grade: 'sloppy',
    quality: 0.58,
    feedback: 'EARLY / LATE — shallow depth! Aim inside the Volt zone.',
  };
}

export function getSetTimeLimitSeconds(
  exercise: ExerciseDefinition,
  difficulty: DifficultyLevel,
  targetCount: number,
): number {
  if (exercise.mode === 'hold') {
    const buffer = difficulty === 'BEGINNER' ? 18 : difficulty === 'INTERMEDIATE' ? 14 : 10;
    return Math.max(25, targetCount + buffer);
  }
  const secPerRep = difficulty === 'BEGINNER' ? 4.2 : difficulty === 'INTERMEDIATE' ? 3.2 : 2.5;
  return Math.max(30, Math.round(targetCount * secPerRep));
}

export interface WorkoutRewardInput {
  baseXpReward: number;
  baseCoinReward: number;
  exercise: ExerciseDefinition;
  plannedSets: number;
  plannedRepsPerSet: number;
  setsCompleted: number;
  totalRepsOrSeconds: number;
  samples: number[];
  bestStreak: number;
  isArena: boolean;
}

export interface WorkoutRewardOutput {
  accuracyPercent: number;
  streakBonusPct: number;
  xpEarned: number;
  coinsEarned: number;
  attributeDelta: Partial<PlayerAttributes>;
}

export function computeWorkoutRewards(input: WorkoutRewardInput): WorkoutRewardOutput {
  const {
    baseXpReward,
    baseCoinReward,
    exercise,
    plannedSets,
    plannedRepsPerSet,
    setsCompleted,
    totalRepsOrSeconds,
    samples,
    bestStreak,
    isArena,
  } = input;

  const accuracyPercent =
    samples.length > 0
      ? Math.round((samples.reduce((sum, s) => sum + s, 0) / samples.length) * 100)
      : 85;

  const totalPlanned = Math.max(1, plannedSets * plannedRepsPerSet);
  const completionRatio = Math.min(1, Math.max(0.15, totalRepsOrSeconds / totalPlanned));
  const streakBonusPct = Math.min(25, bestStreak * 3);
  const arenaBonus = isArena ? 1.45 : 1.0;

  const xpEarned = Math.max(
    10,
    Math.round(
      baseXpReward *
        completionRatio *
        (0.7 + (accuracyPercent / 100) * 0.45) *
        (1 + streakBonusPct / 100) *
        arenaBonus,
    ),
  );

  const coinsEarned = Math.max(
    5,
    Math.round(
      baseCoinReward *
        completionRatio *
        (0.75 + (accuracyPercent / 100) * 0.4) *
        arenaBonus,
    ),
  );

  const accuracyScale = (0.65 + (accuracyPercent / 100) * 0.5) * completionRatio;
  const roundAttr = (v?: number) => (v ? Math.round(v * accuracyScale * 10) / 10 : 0);

  const attributeDelta: Partial<PlayerAttributes> = {
    strength: roundAttr(exercise.attributeGains.strength),
    stamina: roundAttr(exercise.attributeGains.stamina),
    endurance: roundAttr(exercise.attributeGains.endurance),
    agility: roundAttr(exercise.attributeGains.agility),
    recovery: roundAttr(exercise.attributeGains.recovery ?? 0.4),
  };

  // Preserve setsCompleted usage for clarity
  void setsCompleted;

  return {
    accuracyPercent,
    streakBonusPct,
    xpEarned,
    coinsEarned,
    attributeDelta,
  };
}
