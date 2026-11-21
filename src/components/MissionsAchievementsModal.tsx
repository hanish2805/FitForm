import { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Dumbbell,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  getAthleteRankTitle,
  LEVEL_MILESTONES,
  OUTFIT_CATALOG,
} from '../data/missions';
import {
  DifficultyLevel,
  GameSaveState,
  OutfitId,
} from '../types/game';

export type ProgressionModalTab = 'missions' | 'achievements' | 'rewards';

interface MissionsAchievementsModalProps {
  initialTab: ProgressionModalTab;
  saveState: GameSaveState;
  onClaimMission: (missionId: string) => void;
  onClaimAllMissions: () => void;
  onSelectDifficulty: (diff: DifficultyLevel) => void;
  onEquipOutfit: (outfitId: OutfitId) => void;
  onClose: () => void;
}

const EQUIPMENT_LABELS: Record<string, string> = {
  mat: 'Exercise Mats',
  rack: 'Olympic Squat Rack',
  treadmill: 'Smart Treadmills',
  track: 'Outdoor Sprint Track',
  pullup: 'Calisthenics Pull-Up Rig',
  turf: 'Turf & Plyo Lane',
  bench: 'Competition Bench & Free Weights',
};

const DIFFICULTY_CARDS: {
  id: DifficultyLevel;
  title: string;
  xpBonus: string;
  desc: string;
  unlockRequirement: string;
}[] = [
  {
    id: 'BEGINNER',
    title: 'Beginner',
    xpBonus: '1.0x Base XP',
    desc: 'Balanced reps, wider timing windows & generous set timers.',
    unlockRequirement: 'Unlocked from Level 1',
  },
  {
    id: 'INTERMEDIATE',
    title: 'Intermediate',
    xpBonus: '+45% XP · +40% Coins',
    desc: 'Higher set volume, unlocks Pull-Ups & Mountain Climbers.',
    unlockRequirement: 'Reach Level 2 or complete 2 workouts',
  },
  {
    id: 'ADVANCED',
    title: 'Advanced',
    xpBonus: '+110% XP · +100% Coins',
    desc: 'Elite training volume & strict pro timing windows.',
    unlockRequirement: 'Reach Level 4 or complete 5 workouts + Arena win',
  },
];

export function MissionsAchievementsModal({
  initialTab,
  saveState,
  onClaimMission,
  onClaimAllMissions,
  onSelectDifficulty,
  onEquipOutfit,
  onClose,
}: MissionsAchievementsModalProps) {
  const [tab, setTab] = useState<ProgressionModalTab>(initialTab);

  const { missions, achievements } = saveState;
  const claimableMissions = missions.filter((m) => m.completed && !m.claimed);
  const unlockedAchCount = achievements.filter((a) => a.unlocked).length;
  const xpPct = Math.min(100, Math.round((saveState.xp / saveState.xpToNextLevel) * 100));
  const rankTitle = getAthleteRankTitle(saveState.level);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/72">
      <div className="w-full max-w-3xl max-h-[88vh] rounded-2xl bg-[#111713] border border-white/15 flex flex-col overflow-hidden">
        {/* Header Tabs */}
        <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#080B09]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTab('missions')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer ${
                tab === 'missions' ? 'bg-[#C7FF00] text-[#080B09]' : 'bg-white/5 text-[#A5ACA6] hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Missions
              {claimableMissions.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono-num ${
                    tab === 'missions'
                      ? 'bg-[#080B09] text-[#C7FF00]'
                      : 'bg-[#C7FF00] text-[#080B09]'
                  }`}
                >
                  {claimableMissions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('achievements')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer ${
                tab === 'achievements'
                  ? 'bg-[#C7FF00] text-[#080B09]'
                  : 'bg-white/5 text-[#A5ACA6] hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Achievements ({unlockedAchCount}/{achievements.length})
            </button>
            <button
              onClick={() => setTab('rewards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer ${
                tab === 'rewards'
                  ? 'bg-[#C7FF00] text-[#080B09]'
                  : 'bg-white/5 text-[#A5ACA6] hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Levels &amp; Rewards
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-[#A5ACA6] hover:text-white cursor-pointer"
            aria-label="Close progression modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {tab === 'missions' && (
            <>
              {claimableMissions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#18231a] border border-[#C7FF00]/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-white">
                    <strong className="text-[#C7FF00] font-mono-num">
                      {claimableMissions.length} Mission{claimableMissions.length > 1 ? 's' : ''} Ready
                    </strong>{' '}
                    — Claim rewards to advance your Athlete Level and unlock new tiers.
                  </div>
                  <button
                    onClick={onClaimAllMissions}
                    className="px-4 py-1.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-xs hover:bg-[#d8ff4d] cursor-pointer"
                  >
                    Claim All Ready
                  </button>
                </div>
              )}

              {(['daily', 'weekly'] as const).map((group) => (
                <div key={group} className="space-y-2.5">
                  <h4 className="text-xs font-mono-num uppercase tracking-wider text-[#C7FF00]">
                    {group} Missions
                  </h4>
                  {missions
                    .filter((m) => m.type === group)
                    .map((m) => {
                      const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl bg-[#080B09] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-sm text-white">
                                {m.title}
                              </span>
                              {m.claimed && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                                  CLAIMED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#A5ACA6] mt-0.5">{m.description}</p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex-1 h-1.5 rounded-full bg-[#111713] overflow-hidden">
                                <div
                                  className="h-full bg-[#C7FF00] transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono-num text-white">
                                {m.progress} / {m.target}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right font-mono-num text-xs">
                              <div className="text-[#C7FF00]">+{m.xpReward} XP</div>
                              <div className="text-amber-300">+{m.coinReward} Coins</div>
                            </div>
                            {m.completed && !m.claimed ? (
                              <button
                                onClick={() => onClaimMission(m.id)}
                                className="px-3.5 py-2 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-xs cursor-pointer"
                              >
                                Claim
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#A5ACA6] w-16 text-center">
                                {m.claimed ? 'Done' : 'Active'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </>
          )}

          {tab === 'achievements' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border ${
                    ach.unlocked
                      ? 'bg-[#172119] border-[#C7FF00]/60'
                      : 'bg-[#080B09] border-white/10 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">{ach.title}</h4>
                      <p className="text-xs text-[#A5ACA6] mt-1">{ach.description}</p>
                    </div>
                    {ach.unlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-[#C7FF00] shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#A5ACA6] shrink-0" />
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono-num">
                    <span className="text-[#C7FF00]">
                      +{ach.xpReward} XP · +{ach.coinReward} C
                    </span>
                    {ach.unlockOutfit && (
                      <span className="text-sky-300">
                        Unlocks: {OUTFIT_CATALOG[ach.unlockOutfit].name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'rewards' && (
            <div className="space-y-6">
              {/* Athlete Level & XP Summary */}
              <div className="p-4 rounded-xl bg-[#080B09] border border-[#C7FF00]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#C7FF00] text-[#080B09] font-display font-bold flex flex-col items-center justify-center leading-none shrink-0">
                    <span className="text-[10px] uppercase">LVL</span>
                    <span className="text-xl font-mono-num">{saveState.level}</span>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-white">
                        {rankTitle}
                      </span>
                      <span className="text-[11px] font-mono-num text-[#C7FF00]">
                        {saveState.xp} / {saveState.xpToNextLevel} XP
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#111713] mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-[#C7FF00] transition-all"
                        style={{ width: `${xpPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono-num">
                  <div className="text-center">
                    <div className="text-[#A5ACA6] text-[10px]">WORKOUTS</div>
                    <div className="text-white font-bold">{saveState.workoutHistory.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#A5ACA6] text-[10px]">ARENA WINS</div>
                    <div className="text-orange-300 font-bold">{saveState.arenaWins}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#A5ACA6] text-[10px]">COINS</div>
                    <div className="text-amber-300 font-bold flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {saveState.coins}
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Tiers */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono-num uppercase tracking-wider text-[#C7FF00]">
                  Training Difficulty Tiers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {DIFFICULTY_CARDS.map((tier) => {
                    const unlocked = saveState.unlockedDifficulties.includes(tier.id);
                    const active = saveState.difficulty === tier.id;
                    return (
                      <button
                        key={tier.id}
                        disabled={!unlocked}
                        onClick={() => unlocked && onSelectDifficulty(tier.id)}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          !unlocked
                            ? 'bg-[#080B09]/60 border-white/8 opacity-65 cursor-not-allowed'
                            : active
                              ? 'bg-[#172119] border-[#C7FF00] cursor-pointer'
                              : 'bg-[#080B09] border-white/12 hover:border-white/30 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-sm text-white">
                            {tier.title}
                          </span>
                          {!unlocked ? (
                            <Lock className="w-3.5 h-3.5 text-amber-300" />
                          ) : active ? (
                            <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-[#C7FF00] text-[#080B09] font-bold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono-num text-emerald-300">
                              UNLOCKED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono-num text-[#C7FF00] mt-1">
                          {tier.xpBonus}
                        </div>
                        <p className="text-[11px] text-[#A5ACA6] mt-1">{tier.desc}</p>
                        <p className="text-[10px] font-mono-num text-[#8DAF26] mt-2">
                          {tier.unlockRequirement}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unlockable Outfits */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono-num uppercase tracking-wider text-[#C7FF00]">
                  Unlockable Athlete Kits ({saveState.unlockedOutfits.length}/
                  {Object.keys(OUTFIT_CATALOG).length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(OUTFIT_CATALOG) as OutfitId[]).map((outfitId) => {
                    const kit = OUTFIT_CATALOG[outfitId];
                    const unlocked = saveState.unlockedOutfits.includes(outfitId);
                    const equipped = saveState.character.outfit === outfitId;
                    return (
                      <div
                        key={outfitId}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          equipped
                            ? 'bg-[#172119] border-[#C7FF00]'
                            : unlocked
                              ? 'bg-[#080B09] border-white/15'
                              : 'bg-[#080B09]/60 border-white/8 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: kit.primaryHex }}
                          >
                            <span
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: kit.accentHex }}
                            />
                          </div>
                          <div>
                            <div className="font-display font-bold text-xs text-white">
                              {kit.name}
                            </div>
                            <div className="text-[11px] text-[#A5ACA6]">{kit.unlockHint}</div>
                          </div>
                        </div>

                        {equipped ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono-num text-[#C7FF00] font-bold shrink-0">
                            <Check className="w-3.5 h-3.5" />
                            Equipped
                          </span>
                        ) : unlocked ? (
                          <button
                            onClick={() => onEquipOutfit(outfitId)}
                            className="px-3 py-1.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-[11px] cursor-pointer shrink-0"
                          >
                            Equip
                          </button>
                        ) : (
                          <Lock className="w-4 h-4 text-[#A5ACA6] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equipment Certifications & Level Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#080B09] border border-white/10 space-y-2.5">
                  <h4 className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-white">
                    <Dumbbell className="w-4 h-4 text-[#C7FF00]" />
                    Equipment Certifications ({saveState.unlockedEquipment.length}/
                    {Object.keys(EQUIPMENT_LABELS).length})
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => {
                      const unlocked = saveState.unlockedEquipment.includes(key);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0"
                        >
                          <span className={unlocked ? 'text-white' : 'text-[#A5ACA6]/60'}>
                            {label}
                          </span>
                          {unlocked ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-mono-num">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Certified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-[#A5ACA6]/60 font-mono-num">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#080B09] border border-white/10 space-y-2.5">
                  <h4 className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-white">
                    <Sparkles className="w-4 h-4 text-[#C7FF00]" />
                    Level Milestone Roadmap
                  </h4>
                  <div className="space-y-2">
                    {LEVEL_MILESTONES.map((ms) => {
                      const reached = saveState.level >= ms.level;
                      return (
                        <div
                          key={ms.level}
                          className={`p-2 rounded-lg border text-xs ${
                            reached
                              ? 'bg-[#172119] border-[#C7FF00]/45'
                              : 'bg-[#111713]/70 border-white/8 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono-num">
                            <span className={reached ? 'text-[#C7FF00] font-bold' : 'text-white'}>
                              LVL {ms.level} · {ms.rankTitle}
                            </span>
                            {reached && <CheckCircle2 className="w-3.5 h-3.5 text-[#C7FF00]" />}
                          </div>
                          <div className="text-[11px] text-[#A5ACA6] mt-0.5">
                            {ms.rewardSummary}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
