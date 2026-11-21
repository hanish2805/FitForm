export type BodyModel = 'athlete_lean' | 'athlete_power' | 'athlete_endurance';
export type Hairstyle = 'fade' | 'ponytail' | 'buzz' | 'waves';
export type OutfitId = 'volt_pro' | 'obsidian_stealth' | 'carbon_track' | 'emerald_prime';
export type AccessoryId = 'none' | 'headband' | 'wristbands' | 'smart_visor';

export type FitnessGoal =
  | 'Muscle Gain'
  | 'Fat Loss'
  | 'Weight Maintenance'
  | 'Muscle Definition'
  | 'General Fitness';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type ExerciseId =
  | 'pushups'
  | 'squats'
  | 'lunges'
  | 'planks'
  | 'jumping_jacks'
  | 'mountain_climbers'
  | 'running'
  | 'pullups';

export type StationType =
  | 'mat'
  | 'turf'
  | 'rack'
  | 'bench'
  | 'treadmill'
  | 'pullup'
  | 'track'
  | 'home_bed'
  | 'home_wardrobe'
  | 'nutrition_bar'
  | 'arena_podium';

export type LocationId =
  | 'training_center'
  | 'outdoor_zone'
  | 'player_home'
  | 'nutrition_center'
  | 'competition_arena';

export interface OptionalProfile {
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'Light' | 'Moderate' | 'Active' | 'Athlete';
}

export interface CharacterConfig {
  name: string;
  bodyModel: BodyModel;
  hairstyle: Hairstyle;
  hairColor: string;
  skinTone: string;
  outfit: OutfitId;
  accessory: AccessoryId;
  fitnessGoal: FitnessGoal;
  optionalProfile: OptionalProfile;
}

export interface PlayerAttributes {
  strength: number;
  stamina: number;
  endurance: number;
  agility: number;
  recovery: number;
}

export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  targetMuscles: string[];
  difficultyTier: DifficultyLevel;
  stationTypes: StationType[];
  mode: 'reps' | 'hold';
  baseSets: number;
  baseRepsOrSeconds: number;
  restSeconds: number;
  energyCost: number;
  xpReward: number;
  coinReward: number;
  attributeGains: Partial<PlayerAttributes>;
  instructions: string[];
  correctForm: string[];
  commonMistakes: string[];
  improvementTips: string;
}

export interface NutritionItem {
  id: string;
  name: string;
  category: 'Meal Combo' | 'Protein-Rich' | 'Fruit' | 'Vegetable' | 'Hydration';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  costCoins: number;
  energyGain: number;
  recoveryGain: number;
  balanceGain: number;
  description: string;
  educationalNote: string;
}

export type MissionMetric =
  | 'pushups_reps'
  | 'squats_reps'
  | 'running_sessions'
  | 'gym_visited'
  | 'workouts_completed'
  | 'endurance_workouts'
  | 'locations_visited'
  | 'xp_earned'
  | 'meals_eaten'
  | 'arena_wins';

export interface Mission {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  metric: MissionMetric;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  xpReward: number;
  coinReward: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  coinReward: number;
  unlockOutfit?: OutfitId;
}

export interface WorkoutHistoryEntry {
  id: string;
  exerciseId: ExerciseId;
  exerciseName: string;
  difficulty: DifficultyLevel;
  setsCompleted: number;
  totalRepsOrSeconds: number;
  accuracyPercent: number;
  xpEarned: number;
  coinsEarned: number;
  timestamp: string;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  soundVolume: number;
  musicVolume: number;
  muted: boolean;
  mouseSensitivity: number;
  cameraSensitivity: number;
  showHud: boolean;
  mobileControlsMode: 'auto' | 'on' | 'off';
}

export interface GameSaveState {
  version: number;
  day: number;
  character: CharacterConfig;
  difficulty: DifficultyLevel;
  unlockedDifficulties: DifficultyLevel[];
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  energy: number;
  stamina: number;
  nutritionBalance: number;
  attributes: PlayerAttributes;
  visitedLocations: LocationId[];
  unlockedOutfits: OutfitId[];
  unlockedEquipment: string[];
  missions: Mission[];
  achievements: Achievement[];
  workoutHistory: WorkoutHistoryEntry[];
  mealsLoggedToday: string[];
  arenaWins: number;
  playerPosition: { x: number; y: number; z: number };
  lastSavedAt: string;
}

export interface InteractiveStation {
  id: string;
  label: string;
  subtitle: string;
  stationType: StationType;
  locationId: LocationId;
  x: number;
  y: number;
  z: number;
  radius: number;
  facingAngle: number;
}

export interface WorldLocationMeta {
  id: LocationId;
  name: string;
  shortName: string;
  description: string;
  x: number;
  z: number;
  radius: number;
  accentColor: string;
  spawnX?: number;
  spawnY?: number;
  spawnZ?: number;
}

export type ActiveScreen =
  | 'menu'
  | 'character_create'
  | 'playing'
  | 'demo_lab';

export type ActiveModal =
  | null
  | 'pause'
  | 'station_workout'
  | 'nutrition'
  | 'home'
  | 'arena'
  | 'map'
  | 'missions'
  | 'achievements'
  | 'settings'
  | 'character_edit';
