import { DifficultyLevel, ExerciseDefinition, ExerciseId } from '../types/game';

export const EXERCISES: Record<ExerciseId, ExerciseDefinition> = {
  pushups: {
    id: 'pushups',
    name: 'Push-Ups',
    targetMuscles: ['Chest', 'Anterior Deltoids', 'Triceps', 'Core'],
    difficultyTier: 'BEGINNER',
    stationTypes: ['mat', 'bench', 'pullup', 'arena_podium'],
    mode: 'reps',
    baseSets: 2,
    baseRepsOrSeconds: 8,
    restSeconds: 15,
    energyCost: 10,
    xpReward: 75,
    coinReward: 35,
    attributeGains: { strength: 2.2, endurance: 0.8, stamina: 0.8 },
    instructions: [
      'Place hands slightly wider than shoulder-width apart on the exercise mat.',
      'Extend your legs back and brace your glutes and core to form a straight line.',
      'Lower your chest smoothly toward the floor with elbows angled around 45 degrees.',
      'Press explosively back up to full arm extension while maintaining spinal alignment.',
    ],
    correctForm: [
      'Neutral spine from head to heels with core braced',
      'Elbows tucked at a controlled 45-degree angle',
      'Full range of motion with steady tempo',
    ],
    commonMistakes: [
      'Hips sagging toward the floor or piking upward',
      'Elbows flaring out to 90 degrees',
      'Cutting depth short before chest approaches floor',
    ],
    improvementTips:
      'Focus on squeezing your glutes and ribs down before bending your elbows so your torso moves as one rigid plank.',
  },
  squats: {
    id: 'squats',
    name: 'Barbell & Bodyweight Squats',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    difficultyTier: 'BEGINNER',
    stationTypes: ['rack', 'bench', 'mat', 'arena_podium'],
    mode: 'reps',
    baseSets: 2,
    baseRepsOrSeconds: 10,
    restSeconds: 18,
    energyCost: 12,
    xpReward: 85,
    coinReward: 40,
    attributeGains: { strength: 2.5, agility: 1.0, stamina: 1.0 },
    instructions: [
      'Stand with feet shoulder-width apart and toes turned slightly outward.',
      'Keep chest proud and brace your midsection before initiating the descent.',
      'Sit hips back and down until thighs are at least parallel to the floor.',
      'Drive through your midfoot and heels to stand tall and lock hips cleanly.',
    ],
    correctForm: [
      'Knees track cleanly in line with toes',
      'Chest stays upright with neutral lumbar curve',
      'Heels remain planted firmly on the floor',
    ],
    commonMistakes: [
      'Knees collapsing inward (valgus) during ascent',
      'Heels lifting off the ground at the bottom',
      'Rounding the lower back under depth',
    ],
    improvementTips:
      'Think about spreading the floor apart with your feet and keeping your ribcage stacked directly over your pelvis.',
  },
  lunges: {
    id: 'lunges',
    name: 'Forward Lunges',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hip Flexors', 'Balance'],
    difficultyTier: 'BEGINNER',
    stationTypes: ['mat', 'turf', 'bench', 'track'],
    mode: 'reps',
    baseSets: 2,
    baseRepsOrSeconds: 10,
    restSeconds: 15,
    energyCost: 11,
    xpReward: 80,
    coinReward: 38,
    attributeGains: { agility: 2.0, strength: 1.4, endurance: 1.0 },
    instructions: [
      'Stand tall with feet hip-width apart and hands braced on hips or sides.',
      'Take a controlled step forward with one leg, landing midfoot first.',
      'Lower both knees toward 90-degree angles while keeping torso upright.',
      'Push powerfully off the front heel to return to the starting stance.',
    ],
    correctForm: [
      'Torso remains upright throughout the split stance',
      'Front shin stays vertical with knee over ankle',
      'Smooth alternating cadence with controlled balance',
    ],
    commonMistakes: [
      'Stepping too narrow like walking a tightrope',
      'Leaning torso excessively over the front thigh',
      'Front knee shooting far past the toes',
    ],
    improvementTips:
      'Step slightly outward on train-track lanes rather than in a single line to keep your hips square and stable.',
  },
  planks: {
    id: 'planks',
    name: 'Forearm Planks',
    targetMuscles: ['Transverse Abdominis', 'Obliques', 'Shoulders', 'Glutes'],
    difficultyTier: 'BEGINNER',
    stationTypes: ['mat'],
    mode: 'hold',
    baseSets: 2,
    baseRepsOrSeconds: 20,
    restSeconds: 15,
    energyCost: 9,
    xpReward: 70,
    coinReward: 32,
    attributeGains: { endurance: 2.2, recovery: 1.0, strength: 1.0 },
    instructions: [
      'Position forearms flat on the mat with elbows directly beneath your shoulders.',
      'Step feet back to hip-width apart and press through the balls of your feet.',
      'Tuck your pelvis slightly and draw your ribs toward your hips.',
      'Hold steady breathing while resisting any hip drop or shoulder shrug.',
    ],
    correctForm: [
      'Straight line from ears through shoulders, hips, and ankles',
      'Active scapular push keeping upper back broad',
      'Steady rhythmic breathing under core tension',
    ],
    commonMistakes: [
      'Lower back arching and hips dropping toward the mat',
      'Raising hips high into a pike position',
      'Cranking the neck upward instead of looking at the mat',
    ],
    improvementTips:
      'Press your elbows gently downward toward your toes without moving them to engage deep core tension immediately.',
  },
  jumping_jacks: {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    targetMuscles: ['Calves', 'Shoulders', 'Cardiovascular System'],
    difficultyTier: 'BEGINNER',
    stationTypes: ['mat', 'turf', 'track'],
    mode: 'reps',
    baseSets: 2,
    baseRepsOrSeconds: 14,
    restSeconds: 12,
    energyCost: 10,
    xpReward: 72,
    coinReward: 34,
    attributeGains: { stamina: 2.2, agility: 1.6, endurance: 0.8 },
    instructions: [
      'Start upright with feet together and arms resting at your sides.',
      'Spring off the balls of your feet, spreading legs shoulder-width apart.',
      'Simultaneously sweep arms cleanly overhead until hands nearly meet.',
      'Rebound softly onto the balls of your feet back to the starting position.',
    ],
    correctForm: [
      'Soft, quiet landings on the balls of the feet',
      'Full overhead arm extension without shrugging traps',
      'Consistent athletic rhythm',
    ],
    commonMistakes: [
      'Flat-footed heavy landings jarring the knees',
      'Half-hearted bent arm swings',
      'Knees caving inward on wide stance landing',
    ],
    improvementTips:
      'Keep a slight athletic bend in your knees throughout so your calves act like springs on every bounce.',
  },
  mountain_climbers: {
    id: 'mountain_climbers',
    name: 'Mountain Climbers',
    targetMuscles: ['Core', 'Hip Flexors', 'Shoulders', 'Cardio'],
    difficultyTier: 'INTERMEDIATE',
    stationTypes: ['mat', 'turf', 'arena_podium'],
    mode: 'reps',
    baseSets: 3,
    baseRepsOrSeconds: 12,
    restSeconds: 15,
    energyCost: 14,
    xpReward: 110,
    coinReward: 52,
    attributeGains: { agility: 2.4, stamina: 2.0, endurance: 1.2 },
    instructions: [
      'Establish a strong high-plank position with wrists stacked under shoulders.',
      'Drive your right knee toward your chest without letting hips lift.',
      'Quickly switch legs mid-air, extending the right leg back as left knee drives forward.',
      'Maintain level shoulders and steady breathing across rapid alternations.',
    ],
    correctForm: [
      'Hips remain low and level like a high plank',
      'Shoulders stay directly over wrists',
      'Crisp knee drive toward torso',
    ],
    commonMistakes: [
      'Bouncing hips high into the air with every switch',
      'Drifting shoulders backward behind the wrists',
      'Letting toes slam heavily onto the floor',
    ],
    improvementTips:
      'Lock your gaze slightly ahead of your fingertips and keep your hands pushing firmly into the floor.',
  },
  running: {
    id: 'running',
    name: 'Track & Treadmill Intervals',
    targetMuscles: ['Cardiovascular System', 'Legs', 'Core', 'Stamina'],
    difficultyTier: 'BEGINNER',
    stationTypes: ['treadmill', 'turf', 'track', 'arena_podium'],
    mode: 'hold',
    baseSets: 2,
    baseRepsOrSeconds: 22,
    restSeconds: 15,
    energyCost: 13,
    xpReward: 95,
    coinReward: 46,
    attributeGains: { stamina: 2.5, endurance: 2.2, agility: 1.0 },
    instructions: [
      'Stand tall with a slight forward lean originating from your ankles, not your waist.',
      'Bend elbows near 90 degrees and drive arms straight forward and back.',
      'Land softly beneath your center of mass with high-cadence strides.',
      'Maintain relaxed shoulders and rhythmic breathing through the interval.',
    ],
    correctForm: [
      'Tall posture with subtle forward ankle lean',
      'Compact 90-degree arm swing without crossing midline',
      'Midfoot strike directly beneath hips',
    ],
    commonMistakes: [
      'Overstriding with heel slamming far in front of hips',
      'Arms swinging across the torso wasting rotation energy',
      'Hunching shoulders upward toward ears under fatigue',
    ],
    improvementTips:
      'Focus on pulling your heel quickly beneath your glutes rather than reaching forward with your foot.',
  },
  pullups: {
    id: 'pullups',
    name: 'Strict Pull-Ups',
    targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Upper Back', 'Forearms'],
    difficultyTier: 'INTERMEDIATE',
    stationTypes: ['pullup', 'bench', 'arena_podium'],
    mode: 'reps',
    baseSets: 3,
    baseRepsOrSeconds: 6,
    restSeconds: 20,
    energyCost: 15,
    xpReward: 125,
    coinReward: 60,
    attributeGains: { strength: 2.8, endurance: 1.5, stamina: 1.0 },
    instructions: [
      'Grip the overhead bar slightly wider than shoulder-width with palms facing away.',
      'Engage your lats by drawing shoulder blades down before bending your elbows.',
      'Pull your chest smoothly toward the bar until your chin clears above it.',
      'Lower under complete control back to a full dead-hang extension.',
    ],
    correctForm: [
      'Full range of motion from dead hang to chin over bar',
      'Controlled legs with slight hollow-body core tension',
      'Shoulders depressed away from ears at the top',
    ],
    commonMistakes: [
      'Kipping or swinging legs aggressively for momentum',
      'Half reps that never lower to full arm extension',
      'Rounding shoulders forward at the top position',
    ],
    improvementTips:
      'Imagine driving your elbows down into your back pockets rather than pulling with just your forearms.',
  },
};

export const EXERCISE_LIST: ExerciseDefinition[] = Object.values(EXERCISES);

export function getScaledExerciseParams(
  exercise: ExerciseDefinition,
  difficulty: DifficultyLevel,
) {
  const mult =
    difficulty === 'BEGINNER'
      ? { sets: 1, reps: 1, xp: 1, coins: 1, timingWindow: 0.28 }
      : difficulty === 'INTERMEDIATE'
        ? { sets: 1.35, reps: 1.35, xp: 1.45, coins: 1.4, timingWindow: 0.22 }
        : { sets: 1.75, reps: 1.75, xp: 2.1, coins: 2.0, timingWindow: 0.16 };

  return {
    sets: Math.max(2, Math.round(exercise.baseSets * mult.sets)),
    targetCount: Math.max(5, Math.round(exercise.baseRepsOrSeconds * mult.reps)),
    xpReward: Math.round(exercise.xpReward * mult.xp),
    coinReward: Math.round(exercise.coinReward * mult.coins),
    timingWindow: mult.timingWindow,
  };
}
