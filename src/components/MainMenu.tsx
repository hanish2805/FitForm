import { Award, Dumbbell, Play, RotateCcw, Settings, Target, User } from 'lucide-react';
import { GameSaveState } from '../types/game';

interface MainMenuProps {
  savedGame: GameSaveState | null;
  noSaveNotice: boolean;
  onPlayNew: () => void;
  onContinue: () => void;
  onOpenCharacter: () => void;
  onOpenTrainingCenter: () => void;
  onOpenMissions: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

export function MainMenu({
  savedGame,
  noSaveNotice,
  onPlayNew,
  onContinue,
  onOpenCharacter,
  onOpenTrainingCenter,
  onOpenMissions,
  onOpenAchievements,
  onOpenSettings,
}: MainMenuProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none">
      {/* Subtle dark left vignette so menu text stays ultra legible without hiding the live 3D world */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080B09]/92 via-[#080B09]/50 to-transparent pointer-events-none" />

      {/* Top Logo & Tagline */}
      <div className="relative z-10 max-w-xl pointer-events-auto">
        <div className="flex items-center gap-3 mb-3">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="38" height="38" rx="9" fill="#111713" stroke="#C7FF00" strokeWidth="2.2" />
            <path d="M12 29V13H28" stroke="#C7FF00" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 21H24" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="29" cy="27" r="3" fill="#C7FF00" />
          </svg>
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white leading-none">
              FIT<span className="text-[#C7FF00]">FORM</span>
            </h1>
            <p className="text-xs md:text-sm tracking-[0.22em] text-[#A5ACA6] font-semibold mt-1">
              YOUR WORLD. YOUR BODY. YOUR PROGRESS.
            </p>
          </div>
        </div>
      </div>

      {/* Main Vertical Command Stack */}
      <div className="relative z-10 w-full max-w-sm space-y-2.5 pointer-events-auto my-auto">
        <button
          onClick={onPlayNew}
          className="w-full flex items-center justify-between px-5 py-3.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-base tracking-wide hover:bg-[#d8ff4d] active:scale-[0.99] transition cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <Play className="w-5 h-5 fill-current" />
            PLAY GAME
          </span>
          <span className="text-xs font-mono-num uppercase opacity-80">New Journey</span>
        </button>

        <button
          onClick={onContinue}
          className={`w-full flex items-center justify-between px-5 py-3.5 rounded-lg border transition cursor-pointer ${
            savedGame
              ? 'bg-[#111713]/95 border-[#8DAF26]/60 text-white hover:border-[#C7FF00]'
              : 'bg-[#111713]/75 border-white/10 text-[#A5ACA6] hover:border-white/25'
          }`}
        >
          <span className="flex items-center gap-3 font-display font-semibold">
            <RotateCcw className="w-4 h-4 text-[#C7FF00]" />
            CONTINUE GAME
          </span>
          {savedGame ? (
            <span className="text-xs font-mono-num text-[#C7FF00]">
              LVL {savedGame.level} · {savedGame.character.name.split(' ')[0]}
            </span>
          ) : (
            <span className="text-xs text-[#A5ACA6]">No Save</span>
          )}
        </button>

        {noSaveNotice && (
          <div className="px-3.5 py-2 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs">
            No saved game exists yet. Press <strong className="text-white">PLAY GAME</strong> to create your athlete and begin!
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={onOpenCharacter}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[#111713]/95 border border-white/12 text-white hover:border-[#C7FF00]/70 transition text-sm font-medium cursor-pointer"
          >
            <User className="w-4 h-4 text-[#C7FF00]" />
            Character
          </button>
          <button
            onClick={onOpenTrainingCenter}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[#111713]/95 border border-white/12 text-white hover:border-[#C7FF00]/70 transition text-sm font-medium cursor-pointer"
          >
            <Dumbbell className="w-4 h-4 text-[#C7FF00]" />
            Training Center
          </button>
          <button
            onClick={onOpenMissions}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[#111713]/95 border border-white/12 text-white hover:border-[#C7FF00]/70 transition text-sm font-medium cursor-pointer"
          >
            <Target className="w-4 h-4 text-[#8DAF26]" />
            Missions
          </button>
          <button
            onClick={onOpenAchievements}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[#111713]/95 border border-white/12 text-white hover:border-[#C7FF00]/70 transition text-sm font-medium cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#8DAF26]" />
            Achievements
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#111713]/85 border border-white/10 text-[#A5ACA6] hover:text-white hover:border-white/25 transition text-sm cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Settings className="w-4 h-4" />
            Settings & Controls
          </span>
          <span className="text-xs">Graphics · Audio · Sensitivity</span>
        </button>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#A5ACA6] pointer-events-auto">
        <span>WASD Move · Mouse Look (Click) · Space Jump · Shift Sprint · E Interact · M Map · Esc Unlock / Pause</span>
        <span className="font-mono-num text-[#8DAF26]">3D OPEN-WORLD FITNESS SIMULATOR</span>
      </div>
    </div>
  );
}
