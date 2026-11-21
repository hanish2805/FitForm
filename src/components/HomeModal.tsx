import { Activity, BedDouble, Calendar, Shirt, X } from 'lucide-react';
import { GameSaveState } from '../types/game';

interface HomeModalProps {
  saveState: GameSaveState;
  onRest: () => void;
  onOpenCustomize: () => void;
  onClose: () => void;
}

export function HomeModal({
  saveState,
  onRest,
  onOpenCustomize,
  onClose,
}: HomeModalProps) {
  const attrs = [
    { label: 'Strength', val: saveState.attributes.strength, color: '#C7FF00' },
    { label: 'Stamina', val: saveState.attributes.stamina, color: '#38bdf8' },
    { label: 'Endurance', val: saveState.attributes.endurance, color: '#34d399' },
    { label: 'Agility', val: saveState.attributes.agility, color: '#f97316' },
    { label: 'Recovery', val: saveState.attributes.recovery, color: '#a78bfa' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65">
      <div className="w-full max-w-3xl max-h-[88vh] rounded-2xl bg-[#111713] border border-white/15 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080B09]">
          <div>
            <p className="text-xs font-mono-num text-violet-300 uppercase">
              Player Home · Day {saveState.day}
            </p>
            <h3 className="font-display text-xl font-bold text-white">
              {saveState.character.name}&apos;s Residence Pod
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-[#A5ACA6] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onRest}
              className="p-4 rounded-xl bg-[#18211b] border border-[#C7FF00]/50 hover:border-[#C7FF00] text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#C7FF00] font-display font-bold text-sm">
                <BedDouble className="w-5 h-5" />
                Rest & Recover (Advance to Day {saveState.day + 1})
              </div>
              <p className="text-xs text-[#A5ACA6] mt-1">
                Restores Energy to 100%, boosts Recovery attribute, and refreshes Daily Missions.
              </p>
            </button>

            <button
              onClick={onOpenCustomize}
              className="p-4 rounded-xl bg-[#080B09] border border-white/15 hover:border-violet-400 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-2 text-violet-300 font-display font-bold text-sm">
                <Shirt className="w-5 h-5" />
                Open Wardrobe & Athlete Profile
              </div>
              <p className="text-xs text-[#A5ACA6] mt-1">
                Equip unlocked outfits ({saveState.unlockedOutfits.length}/4), hairstyles, and accessories.
              </p>
            </button>
          </div>

          {/* Character Attributes */}
          <div className="p-4 rounded-xl bg-[#080B09] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-display font-bold text-sm text-white">
                <Activity className="w-4 h-4 text-[#C7FF00]" />
                Athlete Attributes
              </h4>
              <span className="text-xs font-mono-num text-[#A5ACA6]">
                Goal: {saveState.character.fitnessGoal}
              </span>
            </div>

            <div className="space-y-2.5">
              {attrs.map((a) => (
                <div key={a.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#A5ACA6]">{a.label}</span>
                    <span className="font-mono-num font-bold text-white">{a.val.toFixed(1)} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#111713] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, a.val)}%`, backgroundColor: a.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Schedule & Recent History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#080B09] border border-white/10">
              <h4 className="flex items-center gap-2 font-display font-bold text-sm text-white mb-2.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                Daily Training Schedule
              </h4>
              <ul className="space-y-2 text-xs text-[#A5ACA6]">
                <li className="flex justify-between">
                  <span>Morning Mobility & Strength</span>
                  <span className="text-[#C7FF00]">Training Center</span>
                </li>
                <li className="flex justify-between">
                  <span>Midday Balanced Fuel</span>
                  <span className="text-emerald-400">Nutrition Center</span>
                </li>
                <li className="flex justify-between">
                  <span>Afternoon Cardio Intervals</span>
                  <span className="text-sky-400">Outdoor Track</span>
                </li>
                <li className="flex justify-between">
                  <span>Evening Trial & Sleep</span>
                  <span className="text-orange-400">Arena / Home</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#080B09] border border-white/10">
              <h4 className="font-display font-bold text-sm text-white mb-2.5">
                Recent Workouts ({saveState.workoutHistory.length})
              </h4>
              {saveState.workoutHistory.length === 0 ? (
                <p className="text-xs text-[#A5ACA6]">
                  No completed workouts yet. Head to the Training Center to begin!
                </p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {saveState.workoutHistory.slice(0, 6).map((w) => (
                    <div key={w.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5">
                      <div>
                        <div className="text-white font-medium">{w.exerciseName}</div>
                        <div className="text-[10px] text-[#A5ACA6]">
                          {w.setsCompleted} sets · {w.accuracyPercent}% form
                        </div>
                      </div>
                      <span className="font-mono-num text-[#C7FF00]">+{w.xpEarned} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
