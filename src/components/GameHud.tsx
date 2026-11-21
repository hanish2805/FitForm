import { useEffect, useRef, useState } from 'react';
import { Coins, Map as MapIcon, Pause, Target } from 'lucide-react';
import { WORLD_LOCATIONS } from '../data/worldLocations';
import { GameSaveState, InteractiveStation, LocationId } from '../types/game';

interface GameHudProps {
  saveState: GameSaveState;
  stamina: number;
  currentLocation: LocationId;
  nearbyStation: InteractiveStation | null;
  playerPos: { x: number; z: number; yaw: number };
  activeWaypoint: LocationId | null;
  showHud: boolean;
  mobileControlsMode: 'auto' | 'on' | 'off';
  onInteractClick: () => void;
  onOpenMap: () => void;
  onOpenPause: () => void;
  onOpenMissions: () => void;
  onOpenProgression: () => void;
  onMobileMove: (x: number, y: number) => void;
  onMobileSprint: (sprint: boolean) => void;
  onMobileJump: () => void;
}

export function GameHud({
  saveState,
  stamina,
  currentLocation,
  nearbyStation,
  playerPos,
  activeWaypoint,
  showHud,
  mobileControlsMode,
  onInteractClick,
  onOpenMap,
  onOpenPause,
  onOpenMissions,
  onOpenProgression,
  onMobileMove,
  onMobileSprint,
  onMobileJump,
}: GameHudProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touch);
  }, []);

  const showTouch =
    mobileControlsMode === 'on' || (mobileControlsMode === 'auto' && isTouchDevice);

  const locationMeta = WORLD_LOCATIONS.find((l) => l.id === currentLocation);
  const claimableCount = saveState.missions.filter((m) => m.completed && !m.claimed).length;
  const activeMission =
    saveState.missions.find((m) => m.completed && !m.claimed) ??
    saveState.missions.find((m) => !m.claimed);

  const xpPct = Math.min(100, Math.round((saveState.xp / saveState.xpToNextLevel) * 100));
  const toMini = (v: number) => ((v + 64) / 128) * 100;

  const handleStickMove = (clientX: number, clientY: number) => {
    const el = joystickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 12;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnob({ x: dx, y: dy });
    onMobileMove(dx / maxR, -dy / maxR);
  };

  if (!showHud) {
    return (
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={onOpenPause}
          className="px-3 py-1.5 rounded-lg bg-[#111713]/90 border border-white/15 text-xs text-white cursor-pointer"
        >
          Pause [Esc]
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Level, XP, Coins & Location */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            onClick={onOpenProgression}
            className="px-3.5 py-2.5 rounded-xl bg-[#080B09]/92 border border-white/12 hover:border-[#C7FF00]/60 transition flex items-center gap-3.5 text-left cursor-pointer"
            title="View Athlete Level, Difficulty Tiers & Unlockable Rewards"
          >
            <div className="w-9 h-9 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold flex flex-col items-center justify-center leading-none">
              <span className="text-[9px] uppercase">LVL</span>
              <span className="text-base font-mono-num">{saveState.level}</span>
            </div>
            <div className="min-w-[130px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-display font-bold text-white">{saveState.character.name}</span>
                <span className="font-mono-num text-[11px] text-[#C7FF00]">
                  {saveState.xp}/{saveState.xpToNextLevel} XP
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#111713] mt-1.5 overflow-hidden">
                <div className="h-full bg-[#C7FF00] transition-all" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 font-mono-num text-sm font-bold text-amber-300">
              <Coins className="w-4 h-4" />
              {saveState.coins}
            </div>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#080B09]/88 border border-white/10 text-[11px] font-medium text-[#A5ACA6]">
              Zone: <strong className="text-white">{locationMeta?.name ?? 'Campus'}</strong>
            </span>
            <button
              onClick={onOpenProgression}
              className="px-2 py-1 rounded-md bg-[#080B09]/88 border border-white/10 hover:border-[#C7FF00]/60 text-[10px] font-mono-num text-[#C7FF00] cursor-pointer"
            >
              {saveState.difficulty}
            </button>
          </div>

          {/* Left Side Panel: Active Mission */}
          {activeMission && (
            <button
              onClick={onOpenMissions}
              className="text-left max-w-[250px] px-3 py-2 rounded-xl bg-[#080B09]/88 border border-white/10 hover:border-[#C7FF00]/50 transition cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono-num uppercase text-[#C7FF00]">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  {activeMission.type} Mission
                </span>
                {claimableCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-[#C7FF00] text-[#080B09] font-bold">
                    {claimableCount} READY
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-white mt-0.5 truncate">
                {activeMission.title}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 rounded-full bg-[#111713] overflow-hidden">
                  <div
                    className="h-full bg-[#8DAF26]"
                    style={{ width: `${Math.min(100, (activeMission.progress / activeMission.target) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono-num text-[#A5ACA6]">
                  {activeMission.progress}/{activeMission.target}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Top-Right: Live Minimap & Pause */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080B09]/92 border border-white/12 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
            >
              <MapIcon className="w-3.5 h-3.5 text-[#C7FF00]" />
              Map [M]
            </button>
            <button
              onClick={onOpenPause}
              className="p-2 rounded-lg bg-[#080B09]/92 border border-white/12 text-white hover:border-[#C7FF00] cursor-pointer"
              title="Pause [Esc]"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Minimap Radar */}
          <button
            onClick={onOpenMap}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-[#080B09]/92 border border-white/15 overflow-hidden cursor-pointer"
            title="Click to open World Map"
          >
            {WORLD_LOCATIONS.map((loc) => (
              <span
                key={loc.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  activeWaypoint === loc.id ? 'w-3 h-3 ring-2 ring-white' : 'w-2 h-2'
                }`}
                style={{
                  left: `${toMini(loc.x)}%`,
                  top: `${toMini(loc.z)}%`,
                  backgroundColor: loc.accentColor,
                }}
              />
            ))}
            {/* Player Marker */}
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-[#C7FF00]"
              style={{
                left: `${toMini(playerPos.x)}%`,
                top: `${toMini(playerPos.z)}%`,
              }}
            />
            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono-num text-[#A5ACA6]">
              CAMPUS
            </span>
          </button>
        </div>
      </div>

      {/* CENTER-LOWER: Contextual Interaction Prompt */}
      <div className="flex flex-col items-center gap-3">
        {nearbyStation && (
          <button
            onClick={onInteractClick}
            className="pointer-events-auto px-5 py-2.5 rounded-xl bg-[#111713]/96 border-2 border-[#C7FF00] text-center shadow-xl hover:bg-[#19231c] transition cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-mono-num font-bold text-[#C7FF00]">
              <span className="px-1.5 py-0.5 rounded bg-[#C7FF00] text-[#080B09]">E</span>
              INTERACT · {nearbyStation.label.toUpperCase()}
            </div>
            <div className="text-[11px] text-[#A5ACA6] mt-0.5">{nearbyStation.subtitle}</div>
          </button>
        )}

        {/* Mobile Virtual Joystick & Action Buttons */}
        {showTouch && (
          <div className="w-full flex items-end justify-between px-2 pointer-events-auto">
            <div
              ref={joystickRef}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                handleStickMove(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (e.buttons > 0) handleStickMove(e.clientX, e.clientY);
              }}
              onPointerUp={() => {
                setKnob({ x: 0, y: 0 });
                onMobileMove(0, 0);
              }}
              className="relative w-24 h-24 rounded-full bg-[#080B09]/80 border border-white/20 touch-none"
            >
              <div
                className="absolute w-9 h-9 rounded-full bg-[#C7FF00] left-1/2 top-1/2 -ml-4.5 -mt-4.5"
                style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onPointerDown={() => onMobileSprint(true)}
                onPointerUp={() => onMobileSprint(false)}
                onPointerLeave={() => onMobileSprint(false)}
                className="px-3.5 py-3 rounded-xl bg-[#111713]/90 border border-white/20 text-xs font-bold text-white"
              >
                SPRINT
              </button>
              <button
                onClick={onMobileJump}
                className="px-3.5 py-3 rounded-xl bg-[#111713]/90 border border-white/20 text-xs font-bold text-white"
              >
                JUMP
              </button>
              {nearbyStation && (
                <button
                  onClick={onInteractClick}
                  className="px-4 py-3 rounded-xl bg-[#C7FF00] text-[#080B09] text-xs font-bold"
                >
                  USE
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lower Status Bars & Flat Control Hint */}
        <div className="w-full flex flex-wrap items-end justify-between gap-3">
          <div className="pointer-events-auto px-3.5 py-2 rounded-xl bg-[#080B09]/92 border border-white/12 flex items-center gap-4">
            <div className="w-28">
              <div className="flex justify-between text-[10px] font-mono-num">
                <span className="text-[#A5ACA6]">ENERGY</span>
                <span className="text-[#C7FF00] font-bold">{saveState.energy}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#111713] mt-1 overflow-hidden">
                <div className="h-full bg-[#C7FF00]" style={{ width: `${saveState.energy}%` }} />
              </div>
            </div>
            <div className="w-28">
              <div className="flex justify-between text-[10px] font-mono-num">
                <span className="text-[#A5ACA6]">STAMINA</span>
                <span className="text-sky-300 font-bold">{stamina}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#111713] mt-1 overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `${stamina}%` }} />
              </div>
            </div>
          </div>

          <div className="hidden md:block px-3 py-1.5 rounded-lg bg-[#080B09]/85 border border-white/10 text-[11px] text-[#A5ACA6]">
            WASD Move · Drag Mouse / L Lock Camera · Space Jump · Shift Sprint · E Interact · M Map · Esc Pause
          </div>
        </div>
      </div>
    </div>
  );
}
