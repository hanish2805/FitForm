import { Achievement, Mission, OutfitId } from '../types/game';

export function createInitialMissions(): Mission[] {
  return [
    {
      id: 'daily_gym_visit',
      type: 'daily',
      title: 'First Step on the Floor',
      description: 'Visit the Training Center to start your daily session.',
      metric: 'gym_visited',
      target: 1,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 60,
      coinReward: 30,
    },
    {
      id: 'daily_pushups',
      type: 'daily',
      title: 'Upper-Body Ignition',
      description: 'Complete 16 Push-Ups at the Training Mat or Arena.',
      metric: 'pushups_reps',
      target: 16,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 95,
      coinReward: 45,
    },
    {
      id: 'daily_squats',
      type: 'daily',
      title: 'Leg Day Foundation',
      description: 'Complete 16 Squats at the Squat Rack or Training Mat.',
      metric: 'squats_reps',
      target: 16,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 100,
      coinReward: 50,
    },
    {
      id: 'daily_run',
      type: 'daily',
      title: 'Cadence Builder',
      description: 'Finish 1 Running workout on a Treadmill or Outdoor Track.',
      metric: 'running_sessions',
      target: 1,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 90,
      coinReward: 40,
    },
    {
      id: 'weekly_three_workouts',
      type: 'weekly',
      title: 'Consistent Athlete',
      description: 'Complete 3 full workouts anywhere across the campus.',
      metric: 'workouts_completed',
      target: 3,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 220,
      coinReward: 120,
    },
    {
      id: 'weekly_endurance',
      type: 'weekly',
      title: 'Engine Room',
      description: 'Complete 2 endurance workouts (Running, Planks, or Mountain Climbers).',
      metric: 'endurance_workouts',
      target: 2,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 200,
      coinReward: 100,
    },
    {
      id: 'weekly_explorer',
      type: 'weekly',
      title: 'Campus Explorer',
      description: 'Visit all 5 connected districts across the FITFORM world.',
      metric: 'locations_visited',
      target: 5,
      progress: 1,
      completed: false,
      claimed: false,
      xpReward: 240,
      coinReward: 140,
    },
    {
      id: 'weekly_xp_hunter',
      type: 'weekly',
      title: 'Peak Momentum',
      description: 'Earn 500 total XP through training, nutrition, and challenges.',
      metric: 'xp_earned',
      target: 500,
      progress: 0,
      completed: false,
      claimed: false,
      xpReward: 260,
      coinReward: 150,
    },
  ];
}

export function createInitialAchievements(): Achievement[] {
  return [
    {
      id: 'ach_first_workout',
      title: 'Day One Complete',
      description: 'Complete your very first interactive workout session.',
      unlocked: false,
      xpReward: 100,
      coinReward: 60,
    },
    {
      id: 'ach_world_tour',
      title: 'Full Campus Tour',
      description: 'Discover all 5 major FITFORM locations.',
      unlocked: false,
      xpReward: 150,
      coinReward: 80,
      unlockOutfit: 'carbon_track',
    },
    {
      id: 'ach_nutrition_pro',
      title: 'Fuel Strategist',
      description: 'Log 3 balanced meals at the Nutrition Center.',
      unlocked: false,
      xpReward: 120,
      coinReward: 70,
    },
    {
      id: 'ach_intermediate_tier',
      title: 'Intermediate Certified',
      description: 'Unlock Intermediate difficulty through dedicated training.',
      unlocked: false,
      xpReward: 180,
      coinReward: 100,
      unlockOutfit: 'obsidian_stealth',
    },
    {
      id: 'ach_arena_champion',
      title: 'Arena Contender',
      description: 'Win your first Competition Arena timed challenge.',
      unlocked: false,
      xpReward: 250,
      coinReward: 160,
      unlockOutfit: 'emerald_prime',
    },
    {
      id: 'ach_advanced_tier',
      title: 'Elite Form Master',
      description: 'Unlock Advanced difficulty and reach elite training readiness.',
      unlocked: false,
      xpReward: 350,
      coinReward: 250,
    },
    {
      id: 'ach_iron_streak',
      title: 'Iron Consistency',
      description: 'Complete 5 full workouts anywhere across the FITFORM campus.',
      unlocked: false,
      xpReward: 200,
      coinReward: 120,
    },
    {
      id: 'ach_level_five',
      title: 'FITFORM Pro',
      description: 'Reach Athlete Level 5 through training, nutrition, and challenges.',
      unlocked: false,
      xpReward: 400,
      coinReward: 250,
      unlockOutfit: 'emerald_prime',
    },
  ];
}

export interface LevelMilestone {
  level: number;
  rankTitle: string;
  rewardSummary: string;
  difficultyUnlock?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  outfitUnlock?: OutfitId;
  equipmentUnlocks?: string[];
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  {
    level: 1,
    rankTitle: 'Rookie Athlete',
    rewardSummary: 'Beginner Tier · Volt Pro Kit · Mats, Rack, Treadmill & Track',
    difficultyUnlock: 'BEGINNER',
    outfitUnlock: 'volt_pro',
    equipmentUnlocks: ['mat', 'rack', 'treadmill', 'track'],
  },
  {
    level: 2,
    rankTitle: 'Campus Contender',
    rewardSummary: 'Intermediate Difficulty (+45% XP) · Turf Lane & Pull-Up Certification',
    difficultyUnlock: 'INTERMEDIATE',
    equipmentUnlocks: ['pullup', 'turf'],
  },
  {
    level: 3,
    rankTitle: 'Conditioned Challenger',
    rewardSummary: 'Unlocks Carbon Track Kit (or +50 Bonus Coins if owned)',
    outfitUnlock: 'carbon_track',
  },
  {
    level: 4,
    rankTitle: 'Elite Form Master',
    rewardSummary: 'Advanced Difficulty (+110% XP) · Competition Bench Certification',
    difficultyUnlock: 'ADVANCED',
    equipmentUnlocks: ['bench'],
  },
  {
    level: 5,
    rankTitle: 'FITFORM Legend',
    rewardSummary: 'Emerald Prime Champion Kit (or +100 Bonus Coins) · Pro Rank Badge',
    outfitUnlock: 'emerald_prime',
  },
];

export function getAthleteRankTitle(level: number): string {
  const matched = [...LEVEL_MILESTONES].reverse().find((m) => level >= m.level);
  return matched ? matched.rankTitle : 'Rookie Athlete';
}

export const OUTFIT_CATALOG: Record<
  OutfitId,
  { name: string; primaryHex: string; secondaryHex: string; accentHex: string; unlockHint: string }
> = {
  volt_pro: {
    name: 'Volt Pro Kit',
    primaryHex: '#18211b',
    secondaryHex: '#253229',
    accentHex: '#C7FF00',
    unlockHint: 'Starter Kit',
  },
  carbon_track: {
    name: 'Carbon Track Edition',
    primaryHex: '#1c1f24',
    secondaryHex: '#2d333b',
    accentHex: '#38bdf8',
    unlockHint: 'Reach Level 3 or Full Campus Tour achievement',
  },
  obsidian_stealth: {
    name: 'Obsidian Stealth',
    primaryHex: '#0d0f10',
    secondaryHex: '#1b1f22',
    accentHex: '#f97316',
    unlockHint: 'Unlock Intermediate Certified achievement',
  },
  emerald_prime: {
    name: 'Emerald Prime Champion',
    primaryHex: '#0f291e',
    secondaryHex: '#1b4332',
    accentHex: '#C7FF00',
    unlockHint: 'Reach Level 5 or win Competition Arena',
  },
};
