import { useEffect, useRef, useState } from 'react';
import { Maximize, Save, Settings, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { GameSettings, GraphicsQuality } from '../types/game';

interface SettingsModalProps {
  settings: GameSettings;
  hasSavedGame: boolean;
  inGameplay: boolean;
  onUpdateSettings: (next: GameSettings) => void;
  onSaveNow?: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  hasSavedGame,
  inGameplay,
  onUpdateSettings,
  onSaveNow,
  onResetProgress,
  onClose,
}: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-2xl max-h-[88vh] rounded-2xl bg-[#111713] border border-white/15 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080B09]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#C7FF00]" />
            <h3 className="font-display text-lg font-bold text-white">Settings & Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-[#A5ACA6] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Graphics Quality */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#A5ACA6] mb-2">
              Graphics Quality Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q })}
                  className={`py-2 rounded-lg border text-xs font-display font-bold uppercase cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-[#C7FF00] border-[#C7FF00] text-[#080B09]'
                      : 'bg-[#080B09] border-white/10 text-[#A5ACA6] hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <div className="p-4 rounded-xl bg-[#080B09] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Audio & Volume</span>
              <button
                onClick={() => onUpdateSettings({ ...settings, muted: !settings.muted })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  settings.muted
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-[#18211b] text-[#C7FF00] border border-[#C7FF00]/40'
                }`}
              >
                {settings.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {settings.muted ? 'Muted' : 'Sound On'}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A5ACA6] mb-1">
                <span>Sound Effects</span>
                <span className="font-mono-num">{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.soundVolume}
                onChange={(e) => onUpdateSettings({ ...settings, soundVolume: Number(e.target.value) })}
                className="w-full accent-[#C7FF00]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A5ACA6] mb-1">
                <span>Ambient Music</span>
                <span className="font-mono-num">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ ...settings, musicVolume: Number(e.target.value) })}
                className="w-full accent-[#C7FF00]"
              />
            </div>
          </div>

          {/* Sensitivity & HUD */}
          <div className="p-4 rounded-xl bg-[#080B09] border border-white/10 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-[#A5ACA6] mb-1">
                <span>Mouse Look Sensitivity</span>
                <span className="font-mono-num">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.2}
                step={0.1}
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ ...settings, mouseSensitivity: Number(e.target.value) })}
                className="w-full accent-[#C7FF00]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A5ACA6] mb-1">
                <span>Touch / Orbit Camera Sensitivity</span>
                <span className="font-mono-num">{settings.cameraSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.2}
                step={0.1}
                value={settings.cameraSensitivity}
                onChange={(e) => onUpdateSettings({ ...settings, cameraSensitivity: Number(e.target.value) })}
                className="w-full accent-[#C7FF00]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showHud}
                  onChange={(e) => onUpdateSettings({ ...settings, showHud: e.target.checked })}
                  className="accent-[#C7FF00]"
                />
                Show Gameplay HUD Overlay
              </label>

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111713] border border-white/15 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
              >
                <Maximize className="w-3.5 h-3.5" />
                Toggle Fullscreen
              </button>
            </div>
          </div>

          {/* Controls Guide */}
          <div className="p-4 rounded-xl bg-[#080B09] border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C7FF00] mb-2">
              Controls Reference
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><strong className="text-white">WASD</strong> <span className="text-[#A5ACA6]">Move</span></div>
              <div><strong className="text-white">Click + Move</strong> <span className="text-[#A5ACA6]">Mouse Look</span></div>
              <div><strong className="text-white">Space</strong> <span className="text-[#A5ACA6]">Jump / Rep</span></div>
              <div><strong className="text-white">Shift</strong> <span className="text-[#A5ACA6]">Sprint</span></div>
              <div><strong className="text-white">LMB / E</strong> <span className="text-[#A5ACA6]">Interact</span></div>
              <div><strong className="text-white">M</strong> <span className="text-[#A5ACA6]">World Map</span></div>
              <div><strong className="text-white">Scroll</strong> <span className="text-[#A5ACA6]">Zoom</span></div>
              <div><strong className="text-white">Esc</strong> <span className="text-[#A5ACA6]">Unlock / Pause</span></div>
            </div>
          </div>

          {/* Save & Reset Progress */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {inGameplay && onSaveNow ? (
              <button
                onClick={() => {
                  onSaveNow();
                  setSaveFeedback(true);
                  if (feedbackTimerRef.current !== null) {
                    window.clearTimeout(feedbackTimerRef.current);
                  }
                  feedbackTimerRef.current = window.setTimeout(() => setSaveFeedback(false), 2000);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saveFeedback ? 'Progress Saved!' : 'Save Game Now'}
              </button>
            ) : <div />}

            {hasSavedGame && !confirmReset && (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-300 hover:bg-red-500/25 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Progress
              </button>
            )}

            {confirmReset && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/15 border border-red-500/50">
                <span className="text-xs text-red-200">Delete saved progress?</span>
                <button
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 rounded bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded bg-white/10 text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
