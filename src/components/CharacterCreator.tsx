import { useState } from 'react';
import { ArrowLeft, Check, Lock, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { OUTFIT_CATALOG } from '../data/missions';
import {
  AccessoryId,
  BodyModel,
  CharacterConfig,
  DifficultyLevel,
  FitnessGoal,
  Hairstyle,
  OutfitId,
} from '../types/game';
import { CharacterPreview3D } from './CharacterPreview3D';

interface CharacterCreatorProps {
  mode: 'new_game' | 'customize';
  initialConfig: CharacterConfig;
  unlockedOutfits: OutfitId[];
  unlockedDifficulties: DifficultyLevel[];
  currentDifficulty: DifficultyLevel;
  onConfirm: (config: CharacterConfig, difficulty: DifficultyLevel) => void;
  onCancel: () => void;
}

const BODY_MODELS: { id: BodyModel; label: string; desc: string }[] = [
  { id: 'athlete_lean', label: 'Athletic All-Rounder', desc: 'Balanced proportions & mobility' },
  { id: 'athlete_power', label: 'Power Frame', desc: 'Broad shoulders & strength stance' },
  { id: 'athlete_endurance', label: 'Runner Build', desc: 'Streamlined frame for speed' },
];

const HAIRSTYLES: { id: Hairstyle; label: string }[] = [
  { id: 'fade', label: 'High Fade' },
  { id: 'ponytail', label: 'Athletic Ponytail' },
  { id: 'waves', label: 'Textured Waves' },
  { id: 'buzz', label: 'Clean Buzz' },
];

const SKIN_TONES = ['#f2cbb0', '#d9a482', '#b97d56', '#8d5534', '#5a3522'];
const HAIR_COLORS = ['#1f1b18', '#4a3222', '#b57b3c', '#d8b46a', '#8c2f27', '#cbd5e1'];

const ACCESSORIES: { id: AccessoryId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'wristbands', label: 'Volt Wristbands' },
  { id: 'headband', label: 'Sport Headband' },
  { id: 'smart_visor', label: 'HUD Smart Visor' },
];

const FITNESS_GOALS: FitnessGoal[] = [
  'Muscle Gain',
  'Fat Loss',
  'Weight Maintenance',
  'Muscle Definition',
  'General Fitness',
];

export function CharacterCreator({
  mode,
  initialConfig,
  unlockedOutfits,
  unlockedDifficulties,
  currentDifficulty,
  onConfirm,
  onCancel,
}: CharacterCreatorProps) {
  const [config, setConfig] = useState<CharacterConfig>(initialConfig);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(currentDifficulty);
  const [zoom, setZoom] = useState(1.0);
  const [showOptional, setShowOptional] = useState(false);

  const update = <K extends keyof CharacterConfig>(key: K, val: CharacterConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-30 bg-[#080B09] flex flex-col lg:flex-row">
      {/* Left 3D Preview Stage */}
      <div className="relative w-full lg:w-[46%] h-[42vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0c120e]">
        <CharacterPreview3D
          character={config}
          animState="idle"
          zoomLevel={zoom}
        />

        {/* Top Bar inside 3D Viewport */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <button
            onClick={onCancel}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111713]/95 border border-white/15 text-sm text-white hover:border-[#C7FF00] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="pointer-events-auto flex items-center gap-1.5 bg-[#111713]/95 border border-white/15 rounded-lg p-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.15).toFixed(2)))}
              className="p-1.5 rounded hover:bg-white/10 text-[#A5ACA6] hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-num px-1.5 text-white">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
              className="p-1.5 rounded hover:bg-white/10 text-[#A5ACA6] hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-[#111713]/90 border border-white/10 text-xs text-[#A5ACA6] pointer-events-none">
          Drag to rotate 3D athlete · Scroll or +/- to zoom
        </div>
      </div>

      {/* Right Customization Form */}
      <div className="flex-1 h-[58vh] lg:h-full overflow-y-auto p-6 md:p-8 bg-[#080B09]">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-xs font-mono-num tracking-widest text-[#C7FF00] uppercase">
              {mode === 'new_game' ? 'Stage 01 · Athlete Setup' : 'Wardrobe & Profile'}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
              {mode === 'new_game' ? 'Create Your FITFORM Athlete' : 'Customize Athlete'}
            </h2>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
              Athlete Name
            </label>
            <input
              type="text"
              maxLength={24}
              value={config.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Enter athlete name"
              className="w-full px-4 py-2.5 rounded-lg bg-[#111713] border border-white/15 text-white focus:outline-none focus:border-[#C7FF00]"
            />
          </div>

          {/* Body Model */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
              Character Frame
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BODY_MODELS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => update('bodyModel', b.id)}
                  className={`text-left p-3 rounded-lg border transition cursor-pointer ${
                    config.bodyModel === b.id
                      ? 'bg-[#172119] border-[#C7FF00] text-white'
                      : 'bg-[#111713] border-white/10 text-[#A5ACA6] hover:border-white/25'
                  }`}
                >
                  <div className="font-semibold text-sm text-white">{b.label}</div>
                  <div className="text-xs mt-0.5">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hair & Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
                Hairstyle
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HAIRSTYLES.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => update('hairstyle', h.id)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      config.hairstyle === h.id
                        ? 'bg-[#172119] border-[#C7FF00] text-white'
                        : 'bg-[#111713] border-white/10 text-[#A5ACA6]'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-1.5">
                  Skin Tone
                </label>
                <div className="flex gap-2">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => update('skinTone', tone)}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                        config.skinTone === tone ? 'border-[#C7FF00] scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: tone }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-1.5">
                  Hair Color
                </label>
                <div className="flex gap-2">
                  {HAIR_COLORS.map((col) => (
                    <button
                      key={col}
                      onClick={() => update('hairColor', col)}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                        config.hairColor === col ? 'border-[#C7FF00] scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Outfits & Accessories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
                Athletic Outfit
              </label>
              <div className="space-y-2">
                {(Object.keys(OUTFIT_CATALOG) as OutfitId[]).map((id) => {
                  const item = OUTFIT_CATALOG[id];
                  const unlocked = unlockedOutfits.includes(id);
                  return (
                    <button
                      key={id}
                      disabled={!unlocked}
                      onClick={() => unlocked && update('outfit', id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition ${
                        !unlocked
                          ? 'bg-[#111713]/50 border-white/5 text-[#A5ACA6]/50 cursor-not-allowed'
                          : config.outfit === id
                            ? 'bg-[#172119] border-[#C7FF00] text-white cursor-pointer'
                            : 'bg-[#111713] border-white/10 text-white hover:border-white/25 cursor-pointer'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-xs font-medium">
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-white/20"
                          style={{ backgroundColor: item.accentHex }}
                        />
                        {item.name}
                      </span>
                      {unlocked ? (
                        config.outfit === id && <Check className="w-3.5 h-3.5 text-[#C7FF00]" />
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
                Accessories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => update('accessory', acc.id)}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      config.accessory === acc.id
                        ? 'bg-[#172119] border-[#C7FF00] text-white'
                        : 'bg-[#111713] border-white/10 text-[#A5ACA6]'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fitness Goal */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
              Training Goal
            </label>
            <div className="flex flex-wrap gap-2">
              {FITNESS_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => update('fitnessGoal', goal)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    config.fitnessGoal === goal
                      ? 'bg-[#C7FF00] border-[#C7FF00] text-[#080B09]'
                      : 'bg-[#111713] border-white/10 text-[#A5ACA6] hover:text-white'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Tier Selection (Progression-gated!) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5ACA6] mb-2">
              Training Difficulty Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'BEGINNER' as DifficultyLevel,
                    title: 'Beginner',
                    detail: 'Introductory volume & wide timing windows',
                    unlockNote: 'Always Available',
                  },
                  {
                    id: 'INTERMEDIATE' as DifficultyLevel,
                    title: 'Intermediate',
                    detail: 'Higher reps, new drills & +45% XP',
                    unlockNote: 'Unlock at Level 2 or 2 Workouts',
                  },
                  {
                    id: 'ADVANCED' as DifficultyLevel,
                    title: 'Advanced',
                    detail: 'High intensity, strict timing & +110% XP',
                    unlockNote: 'Unlock at Level 4 or Arena Win',
                  },
                ]
              ).map((tier) => {
                const isUnlocked = unlockedDifficulties.includes(tier.id);
                return (
                  <button
                    key={tier.id}
                    disabled={!isUnlocked}
                    onClick={() => isUnlocked && setDifficulty(tier.id)}
                    className={`p-3 rounded-lg border text-left transition ${
                      !isUnlocked
                        ? 'bg-[#111713]/50 border-white/5 text-[#A5ACA6]/55 cursor-not-allowed'
                        : difficulty === tier.id
                          ? 'bg-[#172119] border-[#C7FF00] text-white cursor-pointer'
                          : 'bg-[#111713] border-white/10 text-[#A5ACA6] hover:border-white/25 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-white">{tier.title}</span>
                      {!isUnlocked && <Lock className="w-3.5 h-3.5 text-amber-400/80" />}
                    </div>
                    <p className="text-[11px] mt-1">{tier.detail}</p>
                    <p className="text-[10px] text-[#8DAF26] mt-1 font-mono-num">{tier.unlockNote}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Game-Profile Details */}
          <div className="rounded-lg border border-white/10 bg-[#111713] p-4">
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-white cursor-pointer"
            >
              <span>Optional Game-Profile Details</span>
              <span className="text-xs text-[#C7FF00]">{showOptional ? 'Hide' : 'Expand'}</span>
            </button>
            <p className="text-xs text-[#A5ACA6] mt-1">
              Optional game-profile inputs for personalization only — not medical measurements.
            </p>

            {showOptional && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div>
                  <label className="block text-[11px] text-[#A5ACA6] mb-1">Age</label>
                  <input
                    type="number"
                    min={13}
                    max={99}
                    value={config.optionalProfile.age ?? ''}
                    onChange={(e) =>
                      update('optionalProfile', {
                        ...config.optionalProfile,
                        age: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-2.5 py-1.5 rounded bg-[#080B09] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A5ACA6] mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min={120}
                    max={230}
                    value={config.optionalProfile.heightCm ?? ''}
                    onChange={(e) =>
                      update('optionalProfile', {
                        ...config.optionalProfile,
                        heightCm: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-2.5 py-1.5 rounded bg-[#080B09] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A5ACA6] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min={35}
                    max={200}
                    value={config.optionalProfile.weightKg ?? ''}
                    onChange={(e) =>
                      update('optionalProfile', {
                        ...config.optionalProfile,
                        weightKg: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-2.5 py-1.5 rounded bg-[#080B09] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A5ACA6] mb-1">Activity Level</label>
                  <select
                    value={config.optionalProfile.activityLevel ?? ''}
                    onChange={(e) =>
                      update('optionalProfile', {
                        ...config.optionalProfile,
                        activityLevel: (e.target.value || undefined) as
                          | 'Light'
                          | 'Moderate'
                          | 'Active'
                          | 'Athlete'
                          | undefined,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-[#080B09] border border-white/15 text-xs text-white"
                  >
                    <option value="">Select</option>
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Active">Active</option>
                    <option value="Athlete">Athlete</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg border border-white/15 text-sm text-[#A5ACA6] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onConfirm(
                  { ...config, name: config.name.trim() || 'Alex Mercer' },
                  difficulty,
                )
              }
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-sm hover:bg-[#d8ff4d] transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {mode === 'new_game' ? 'ENTER 3D CAMPUS' : 'SAVE ATHLETE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
