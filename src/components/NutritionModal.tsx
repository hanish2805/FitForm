import { useState } from 'react';
import { Apple, BatteryCharging, Coins, Info, X } from 'lucide-react';
import { NUTRITION_ITEMS } from '../data/nutrition';
import { NutritionItem } from '../types/game';

interface NutritionModalProps {
  coins: number;
  energy: number;
  nutritionBalance: number;
  recovery: number;
  onSelectMeal: (item: NutritionItem) => void;
  onClose: () => void;
}

const CATEGORIES = ['All', 'Meal Combo', 'Protein-Rich', 'Fruit', 'Vegetable', 'Hydration'] as const;

export function NutritionModal({
  coins,
  energy,
  nutritionBalance,
  recovery,
  onSelectMeal,
  onClose,
}: NutritionModalProps) {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>('All');
  const [lastEaten, setLastEaten] = useState<string | null>(null);

  const items = filter === 'All' ? NUTRITION_ITEMS : NUTRITION_ITEMS.filter((i) => i.category === filter);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65">
      <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-[#111713] border border-white/15 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#080B09]">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono-num uppercase">
              <Apple className="w-4 h-4" />
              Fuel & Nutrition Pavilion
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              Select Meals & Game Energy Fuel
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right font-mono-num text-xs">
              <div className="text-[#A5ACA6]">ENERGY · BALANCE · COINS</div>
              <div className="text-white font-bold">
                <span className="text-[#C7FF00]">{energy}%</span> ·{' '}
                <span className="text-emerald-400">{nutritionBalance}%</span> ·{' '}
                <span className="text-amber-300">{coins} C</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-[#A5ACA6] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Educational Disclaimer & Category Filter */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#0d120f]">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
                  filter === cat
                    ? 'bg-[#C7FF00] text-[#080B09] font-bold'
                    : 'bg-[#111713] text-[#A5ACA6] border border-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#A5ACA6] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            Educational nutrition data · Fictional game energy mechanics
          </span>
        </div>

        {lastEaten && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-xs text-emerald-200 flex items-center justify-between">
            <span>
              Consumed <strong>{lastEaten}</strong>! In-game Energy, Recovery ({recovery.toFixed(1)}), and +25 XP updated.
            </span>
            <BatteryCharging className="w-4 h-4 text-emerald-300" />
          </div>
        )}

        {/* Food Cards */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const affordable = coins >= item.costCoins;
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#080B09] border border-white/10 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono-num uppercase text-emerald-400">
                        {item.category}
                      </span>
                      <h4 className="font-display font-bold text-base text-white">{item.name}</h4>
                    </div>
                    <span className="flex items-center gap-1 font-mono-num text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded">
                      <Coins className="w-3.5 h-3.5" />
                      {item.costCoins === 0 ? 'FREE' : item.costCoins}
                    </span>
                  </div>
                  <p className="text-xs text-[#A5ACA6] mt-1.5">{item.description}</p>

                  {/* Macro Breakdown */}
                  <div className="grid grid-cols-5 gap-1.5 mt-3 text-center">
                    <div className="p-1.5 rounded bg-[#111713]">
                      <div className="text-[9px] text-[#A5ACA6]">KCAL</div>
                      <div className="font-mono-num text-xs font-bold text-white">{item.calories}</div>
                    </div>
                    <div className="p-1.5 rounded bg-[#111713]">
                      <div className="text-[9px] text-[#A5ACA6]">PROT</div>
                      <div className="font-mono-num text-xs font-bold text-[#C7FF00]">{item.protein}g</div>
                    </div>
                    <div className="p-1.5 rounded bg-[#111713]">
                      <div className="text-[9px] text-[#A5ACA6]">CARB</div>
                      <div className="font-mono-num text-xs font-bold text-sky-300">{item.carbs}g</div>
                    </div>
                    <div className="p-1.5 rounded bg-[#111713]">
                      <div className="text-[9px] text-[#A5ACA6]">FAT</div>
                      <div className="font-mono-num text-xs font-bold text-amber-200">{item.fat}g</div>
                    </div>
                    <div className="p-1.5 rounded bg-[#111713]">
                      <div className="text-[9px] text-[#A5ACA6]">FIBRE</div>
                      <div className="font-mono-num text-xs font-bold text-emerald-300">{item.fibre}g</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8DAF26] mt-2.5 leading-snug">{item.educationalNote}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] font-mono-num text-[#A5ACA6]">
                    +{item.energyGain} Energy · +{item.balanceGain} Balance
                  </span>
                  <button
                    disabled={!affordable}
                    onClick={() => {
                      onSelectMeal(item);
                      setLastEaten(item.name);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition ${
                      affordable
                        ? 'bg-[#C7FF00] text-[#080B09] hover:bg-[#d8ff4d] cursor-pointer'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    Select Meal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
