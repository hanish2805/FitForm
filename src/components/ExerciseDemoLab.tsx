import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { EXERCISE_LIST } from '../data/exercises';
import { CharacterConfig, ExerciseDefinition } from '../types/game';
import { CharacterPreview3D } from './CharacterPreview3D';

interface ExerciseDemoLabProps {
  character: CharacterConfig;
  onClose: () => void;
}

export function ExerciseDemoLab({ character, onClose }: ExerciseDemoLabProps) {
  const [selected, setSelected] = useState<ExerciseDefinition>(EXERCISE_LIST[0]);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [formMode, setFormMode] = useState<'correct' | 'mistake'>('correct');
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side' | 'three_quarter'>('three_quarter');
  const [zoom, setZoom] = useState(1);
  const [resetToken, setResetToken] = useState(0);

  return (
    <div className="fixed inset-0 z-30 bg-[#080B09] flex flex-col lg:flex-row">
      {/* Left Exercise Selector & Instructions */}
      <div className="w-full lg:w-[340px] border-b lg:border-b-0 lg:border-r border-white/10 bg-[#111713] flex flex-col max-h-[38vh] lg:max-h-full">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono-num text-[#C7FF00] uppercase">3D Form Academy</p>
            <h2 className="font-display text-lg font-bold text-white">Training Center Lab</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080B09] border border-white/15 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>

        <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
          {EXERCISE_LIST.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setSelected(ex);
                setResetToken((t) => t + 1);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition cursor-pointer ${
                selected.id === ex.id
                  ? 'bg-[#1a251d] border-[#C7FF00] text-white'
                  : 'bg-[#080B09]/70 border-white/8 text-[#A5ACA6] hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{ex.name}</span>
                <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-white/5 text-[#C7FF00]">
                  {ex.difficultyTier}
                </span>
              </div>
              <div className="text-[11px] text-[#A5ACA6] mt-0.5">{ex.targetMuscles.join(' · ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center 3D Demonstration Viewport */}
      <div className="relative flex-1 bg-[#0c120e] min-h-[320px]">
        <CharacterPreview3D
          character={character}
          animState={selected.id}
          playing={playing}
          speed={speed}
          formMode={formMode}
          showFormIndicators={true}
          cameraPreset={cameraPreset}
          zoomLevel={zoom}
          resetToken={resetToken}
        />

        {/* Top Form Mode Toggle */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-lg bg-[#111713]/95 border border-white/15">
            <button
              onClick={() => setFormMode('correct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                formMode === 'correct'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                  : 'text-[#A5ACA6] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Correct Form
            </button>
            <button
              onClick={() => setFormMode('mistake')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                formMode === 'mistake'
                  ? 'bg-red-500/25 text-red-300 border border-red-400/50'
                  : 'text-[#A5ACA6] hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Common Mistake
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-lg bg-[#111713]/95 border border-white/15">
            {(['front', 'side', 'three_quarter'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setCameraPreset(preset)}
                className={`px-2.5 py-1 rounded text-xs font-medium capitalize cursor-pointer ${
                  cameraPreset === preset ? 'bg-[#C7FF00] text-[#080B09] font-bold' : 'text-[#A5ACA6] hover:text-white'
                }`}
              >
                {preset === 'three_quarter' ? '3/4' : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Playback Dock */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl bg-[#111713]/95 border border-white/15">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-bold text-xs cursor-pointer"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={() => {
              setResetToken((t) => t + 1);
              setPlaying(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-white text-xs hover:bg-white/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replay
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {[0.5, 1, 1.5].map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeed(spd)}
              className={`px-2 py-1 rounded text-xs font-mono-num cursor-pointer ${
                speed === spd ? 'bg-[#8DAF26]/30 text-[#C7FF00] border border-[#C7FF00]/40' : 'text-[#A5ACA6]'
              }`}
            >
              {spd}x
            </button>
          ))}

          <div className="h-4 w-px bg-white/15 mx-1" />

          <button
            onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
            className="p-1.5 rounded hover:bg-white/10 text-[#A5ACA6] hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
            className="p-1.5 rounded hover:bg-white/10 text-[#A5ACA6] hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Coaching Panel */}
      <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#111713] p-5 overflow-y-auto space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold text-white">{selected.name}</h3>
          <p className="text-xs text-[#C7FF00] mt-0.5">{selected.targetMuscles.join(' · ')}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A5ACA6] mb-2">
            Step-by-Step Instructions
          </h4>
          <ol className="space-y-1.5 text-xs text-white/90 list-decimal list-inside">
            {selected.instructions.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            CORRECT FORM
          </div>
          <ul className="space-y-1 text-xs text-emerald-100/90">
            {selected.correctForm.map((c, idx) => (
              <li key={idx}>• {c}</li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/35">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-300 mb-1.5">
            <AlertTriangle className="w-4 h-4" />
            COMMON MISTAKES
          </div>
          <ul className="space-y-1 text-xs text-orange-100/90">
            {selected.commonMistakes.map((m, idx) => (
              <li key={idx}>• {m}</li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-lg bg-[#080B09] border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#C7FF00] mb-1">
            Technique Cue
          </p>
          <p className="text-xs text-[#A5ACA6] leading-relaxed">{selected.improvementTips}</p>
        </div>
      </div>
    </div>
  );
}
