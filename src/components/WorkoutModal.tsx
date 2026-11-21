import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { EXERCISE_LIST, getScaledExerciseParams } from '../data/exercises';
import { soundEngine } from '../engine/audio';
import {
  DifficultyLevel,
  ExerciseDefinition,
  ExerciseId,
  InteractiveStation,
} from '../types/game';
import {
  computeWorkoutRewards,
  evaluateRepTiming,
  getSetTimeLimitSeconds,
  RepGrade,
  WorkoutRewardOutput,
} from '../utils/workoutChallenge';

export type WorkoutPhase = 'select' | 'active' | 'rest' | 'timeout' | 'summary';

interface WorkoutModalProps {
  station: InteractiveStation;
  difficulty: DifficultyLevel;
  unlockedDifficulties: DifficultyLevel[];
  energy: number;
  isArena?: boolean;
  onSelectDifficulty: (diff: DifficultyLevel) => void;
  onWorkoutStart: (exerciseId: ExerciseId) => void;
  onWorkoutEnd: () => void;
  onRepExecuted?: (quality: number) => void;
  onHoldStateChange?: (holding: boolean) => void;
  onPhaseChange?: (phase: WorkoutPhase, exerciseId: ExerciseId) => void;
  onComplete: (result: {
    exercise: ExerciseDefinition;
    setsCompleted: number;
    totalRepsOrSeconds: number;
    accuracyPercent: number;
    xpEarned: number;
    coinsEarned: number;
    isArenaWin: boolean;
  }) => void;
  onClose: () => void;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function WorkoutModal({
  station,
  difficulty,
  unlockedDifficulties,
  energy,
  isArena = false,
  onSelectDifficulty,
  onWorkoutStart,
  onWorkoutEnd,
  onRepExecuted,
  onHoldStateChange,
  onPhaseChange,
  onComplete,
  onClose,
}: WorkoutModalProps) {
  const availableExercises = useMemo(() => {
    const filtered = EXERCISE_LIST.filter((ex) => ex.stationTypes.includes(station.stationType));
    return filtered.length > 0 ? filtered : EXERCISE_LIST;
  }, [station.stationType]);

  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition>(() => {
    const firstUnlocked = availableExercises.find((ex) => unlockedDifficulties.includes(ex.difficultyTier));
    return firstUnlocked ?? availableExercises[0];
  });

  const [phase, setPhase] = useState<WorkoutPhase>('select');
  const [currentSet, setCurrentSet] = useState(1);
  const [repsDone, setRepsDone] = useState(0);
  const [totalRepsAccum, setTotalRepsAccum] = useState(0);
  const [setsFinished, setSetsFinished] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [setSecondsLeft, setSetSecondsLeft] = useState(40);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastGrade, setLastGrade] = useState<RepGrade | null>(null);
  const [feedback, setFeedback] = useState<string>('Press SPACE or click EXECUTE REP inside the Volt zone!');
  const [cursorPos, setCursorPos] = useState(0.5);
  const [holding, setHolding] = useState(false);
  const [holdFraction, setHoldFraction] = useState(0);
  const [summaryReward, setSummaryReward] = useState<WorkoutRewardOutput | null>(null);

  // Mutable loop refs keep 60fps animation & timers rock-solid without restarting RAF on every rep
  const cursorPosRef = useRef(0.5);
  const cursorDirRef = useRef(1);
  const holdProgressRef = useRef(0);
  const holdingRef = useRef(false);
  const currentSetRef = useRef(1);
  const repsRef = useRef(0);
  const totalRef = useRef(0);
  const setsFinishedRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const setSecondsLeftRef = useRef(40);

  const scaled = useMemo(
    () => getScaledExerciseParams(selectedExercise, difficulty),
    [selectedExercise, difficulty],
  );

  const setTimeLimit = useMemo(
    () => getSetTimeLimitSeconds(selectedExercise, difficulty, scaled.targetCount),
    [selectedExercise, difficulty, scaled.targetCount],
  );

  const restDuration = useMemo(
    () => Math.min(10, Math.max(6, Math.round(selectedExercise.restSeconds * 0.6))),
    [selectedExercise.restSeconds],
  );

  const canAffordEnergy = energy >= selectedExercise.energyCost;
  const isTierUnlocked = (tier: DifficultyLevel) => unlockedDifficulties.includes(tier);

  const updatePhase = useCallback(
    (nextPhase: WorkoutPhase) => {
      setPhase(nextPhase);
      onPhaseChange?.(nextPhase, selectedExercise.id);
    },
    [onPhaseChange, selectedExercise.id],
  );

  const finishWorkout = useCallback(
    (completedAllSets: boolean) => {
      holdingRef.current = false;
      setHolding(false);
      onHoldStateChange?.(false);
      onWorkoutEnd();

      const totalCompleted = totalRef.current;
      const setsCount = completedAllSets ? scaled.sets : Math.max(1, setsFinishedRef.current);
      const rewards = computeWorkoutRewards({
        baseXpReward: scaled.xpReward,
        baseCoinReward: scaled.coinReward,
        exercise: selectedExercise,
        plannedSets: scaled.sets,
        plannedRepsPerSet: scaled.targetCount,
        setsCompleted: setsCount,
        totalRepsOrSeconds: totalCompleted,
        samples: samplesRef.current,
        bestStreak: bestStreakRef.current,
        isArena,
      });

      soundEngine.playSetComplete();
      setSummaryReward(rewards);
      setSetsFinished(setsCount);
      updatePhase('summary');

      onComplete({
        exercise: selectedExercise,
        setsCompleted: setsCount,
        totalRepsOrSeconds: totalCompleted,
        accuracyPercent: rewards.accuracyPercent,
        xpEarned: rewards.xpEarned,
        coinsEarned: rewards.coinsEarned,
        isArenaWin: isArena && completedAllSets,
      });
    },
    [isArena, onComplete, onHoldStateChange, onWorkoutEnd, scaled, selectedExercise, updatePhase],
  );

  const startExercise = () => {
    if (!canAffordEnergy) return;
    soundEngine.playEquipmentClank();
    currentSetRef.current = 1;
    repsRef.current = 0;
    totalRef.current = 0;
    setsFinishedRef.current = 0;
    samplesRef.current = [];
    streakRef.current = 0;
    bestStreakRef.current = 0;
    cursorPosRef.current = 0.2;
    cursorDirRef.current = 1;
    holdProgressRef.current = 0;
    setSecondsLeftRef.current = setTimeLimit;

    setCurrentSet(1);
    setRepsDone(0);
    setTotalRepsAccum(0);
    setSetsFinished(0);
    setStreak(0);
    setBestStreak(0);
    setLastGrade(null);
    setElapsedSeconds(0);
    setSetSecondsLeft(setTimeLimit);
    setHoldFraction(0);
    setSummaryReward(null);
    setFeedback(
      selectedExercise.mode === 'reps'
        ? 'Hit SPACE or click EXECUTE REP when the marker crosses the Volt center!'
        : 'Hold SPACE or press & hold CADENCE button to maintain steady form!',
    );
    updatePhase('active');
    onWorkoutStart(selectedExercise.id);
  };

  const advanceSetOrFinish = useCallback(() => {
    setsFinishedRef.current += 1;
    setSetsFinished(setsFinishedRef.current);

    if (currentSetRef.current >= scaled.sets) {
      finishWorkout(true);
    } else {
      soundEngine.playSetComplete();
      holdingRef.current = false;
      setHolding(false);
      onHoldStateChange?.(false);
      setRestRemaining(restDuration);
      updatePhase('rest');
    }
  }, [finishWorkout, onHoldStateChange, restDuration, scaled.sets, updatePhase]);

  const startNextSet = useCallback(() => {
    currentSetRef.current += 1;
    repsRef.current = 0;
    holdProgressRef.current = 0;
    setSecondsLeftRef.current = setTimeLimit;

    setCurrentSet(currentSetRef.current);
    setRepsDone(0);
    setHoldFraction(0);
    setSetSecondsLeft(setTimeLimit);
    setLastGrade(null);
    setFeedback(
      selectedExercise.mode === 'reps'
        ? `Set ${currentSetRef.current}: Lock into rhythm and hit the Volt zone!`
        : `Set ${currentSetRef.current}: Hold cadence steady!`,
    );
    soundEngine.playEquipmentClank();
    updatePhase('active');
  }, [selectedExercise.mode, setTimeLimit, updatePhase]);

  const retryCurrentSet = () => {
    repsRef.current = 0;
    holdProgressRef.current = 0;
    setSecondsLeftRef.current = setTimeLimit;
    setRepsDone(0);
    setHoldFraction(0);
    setSetSecondsLeft(setTimeLimit);
    setFeedback('Set reset — stay sharp and beat the timer!');
    soundEngine.playEquipmentClank();
    updatePhase('active');
  };

  // Smooth 60fps timing cursor / hold cadence loop
  useEffect(() => {
    if (phase !== 'active') return;
    let last = performance.now();
    let raf = 0;

    const speed =
      difficulty === 'BEGINNER' ? 1.15 : difficulty === 'INTERMEDIATE' ? 1.48 : 1.85;

    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (selectedExercise.mode === 'reps') {
        let next = cursorPosRef.current + cursorDirRef.current * speed * dt;
        if (next >= 1) {
          next = 1;
          cursorDirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          cursorDirRef.current = 1;
        }
        cursorPosRef.current = next;
        setCursorPos(next);
      } else {
        const rate = holdingRef.current ? 1.45 : 0.35;
        holdProgressRef.current += dt * rate;
        if (holdProgressRef.current >= 1) {
          holdProgressRef.current = 0;
          const repQuality = holdingRef.current ? 0.96 : 0.68;
          if (repQuality >= 0.8) {
            streakRef.current += 1;
            if (streakRef.current > bestStreakRef.current) {
              bestStreakRef.current = streakRef.current;
              setBestStreak(bestStreakRef.current);
            }
          } else {
            streakRef.current = 0;
          }
          setStreak(streakRef.current);

          samplesRef.current.push(repQuality);
          repsRef.current += 1;
          totalRef.current += 1;

          soundEngine.playRep(repQuality, repsRef.current);
          onRepExecuted?.(repQuality);
          setRepsDone(repsRef.current);
          setTotalRepsAccum(totalRef.current);

          if (repsRef.current >= scaled.targetCount) {
            advanceSetOrFinish();
            return;
          }
        }
        setHoldFraction(holdProgressRef.current);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    phase,
    difficulty,
    selectedExercise.mode,
    scaled.targetCount,
    advanceSetOrFinish,
    onRepExecuted,
  ]);

  // Active set countdown + elapsed session clock
  useEffect(() => {
    if (phase !== 'active') return;
    const t = window.setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      setSecondsLeftRef.current = Math.max(0, setSecondsLeftRef.current - 1);
      setSetSecondsLeft(setSecondsLeftRef.current);
      if (setSecondsLeftRef.current <= 0) {
        holdingRef.current = false;
        setHolding(false);
        onHoldStateChange?.(false);
        updatePhase('timeout');
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, onHoldStateChange, updatePhase]);

  // Rest countdown timer between sets
  useEffect(() => {
    if (phase !== 'rest') return;
    const t = window.setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      setRestRemaining((r) => {
        if (r <= 1) {
          startNextSet();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, startNextSet]);

  const executeRep = useCallback(() => {
    if (phase !== 'active' || selectedExercise.mode !== 'reps') return;
    const evalRes = evaluateRepTiming(cursorPosRef.current, scaled.timingWindow);

    if (evalRes.grade === 'sloppy') {
      streakRef.current = 0;
    } else {
      streakRef.current += 1;
      if (streakRef.current > bestStreakRef.current) {
        bestStreakRef.current = streakRef.current;
        setBestStreak(bestStreakRef.current);
      }
    }

    samplesRef.current.push(evalRes.quality);
    repsRef.current += 1;
    totalRef.current += 1;

    soundEngine.playRep(evalRes.quality, repsRef.current);
    onRepExecuted?.(evalRes.quality);

    setLastGrade(evalRes.grade);
    setStreak(streakRef.current);
    setFeedback(evalRes.feedback);
    setRepsDone(repsRef.current);
    setTotalRepsAccum(totalRef.current);

    if (repsRef.current >= scaled.targetCount) {
      advanceSetOrFinish();
    }
  }, [phase, selectedExercise.mode, scaled.timingWindow, scaled.targetCount, onRepExecuted, advanceSetOrFinish]);

  // Keyboard Space handling during active workout & rest skip
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (phase === 'active') {
        e.preventDefault();
        if (selectedExercise.mode === 'reps') {
          if (!e.repeat) executeRep();
        } else {
          if (!holdingRef.current) {
            holdingRef.current = true;
            setHolding(true);
            onHoldStateChange?.(true);
          }
        }
      } else if (phase === 'rest' && !e.repeat) {
        e.preventDefault();
        startNextSet();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && holdingRef.current) {
        holdingRef.current = false;
        setHolding(false);
        onHoldStateChange?.(false);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [phase, selectedExercise.mode, executeRep, onHoldStateChange, startNextSet]);

  const liveAccuracyDisplay =
    samplesRef.current.length > 0
      ? Math.round(
          (samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length) * 100,
        )
      : 100;

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center p-4 pointer-events-none">
      {/* Keep top/center open during active sets so the 3D athlete animation remains clearly visible */}
      <div
        className={`pointer-events-auto w-full rounded-2xl bg-[#111713]/96 border border-white/15 shadow-2xl overflow-hidden ${
          phase === 'active' || phase === 'rest' || phase === 'timeout' ? 'max-w-lg mb-2' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#080B09]/75">
          <div>
            <div className="flex items-center gap-2">
              {isArena ? (
                <Trophy className="w-4 h-4 text-orange-400" />
              ) : (
                <Flame className="w-4 h-4 text-[#C7FF00]" />
              )}
              <span className="text-xs font-mono-num uppercase tracking-wider text-[#C7FF00]">
                {isArena ? 'Competition Arena Trial' : station.label}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              {phase === 'select' ? 'Select Workout Challenge' : selectedExercise.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {(phase === 'active' || phase === 'rest') && (
              <span className="px-2 py-1 rounded bg-[#080B09] border border-white/10 text-[11px] font-mono-num text-[#A5ACA6] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#C7FF00]" />
                {formatClock(elapsedSeconds)}
              </span>
            )}
            <button
              onClick={() => {
                onHoldStateChange?.(false);
                onWorkoutEnd();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-white/5 text-[#A5ACA6] hover:text-white cursor-pointer"
              aria-label="Close workout modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PHASE 1: SELECT EXERCISE */}
        {phase === 'select' && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-[#A5ACA6] font-semibold">
                Training Intensity Tier
              </span>
              <div className="flex gap-1.5">
                {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as DifficultyLevel[]).map((tier) => {
                  const unlocked = isTierUnlocked(tier);
                  return (
                    <button
                      key={tier}
                      disabled={!unlocked}
                      onClick={() => unlocked && onSelectDifficulty(tier)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono-num font-bold transition ${
                        !unlocked
                          ? 'bg-white/5 text-[#A5ACA6]/40 cursor-not-allowed'
                          : difficulty === tier
                            ? 'bg-[#C7FF00] text-[#080B09] cursor-pointer'
                            : 'bg-[#080B09] text-[#A5ACA6] border border-white/10 hover:text-white cursor-pointer'
                      }`}
                      title={!unlocked ? 'Unlock by leveling up and completing workouts' : ''}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableExercises.map((ex) => {
                const lockedByTier =
                  (ex.difficultyTier === 'INTERMEDIATE' && !unlockedDifficulties.includes('INTERMEDIATE')) ||
                  (ex.difficultyTier === 'ADVANCED' && !unlockedDifficulties.includes('ADVANCED'));
                return (
                  <button
                    key={ex.id}
                    disabled={lockedByTier}
                    onClick={() => setSelectedExercise(ex)}
                    className={`p-3 rounded-xl border text-left transition ${
                      lockedByTier
                        ? 'bg-[#080B09]/40 border-white/5 opacity-50 cursor-not-allowed'
                        : selectedExercise.id === ex.id
                          ? 'bg-[#19241b] border-[#C7FF00] cursor-pointer'
                          : 'bg-[#080B09]/80 border-white/10 hover:border-white/25 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">{ex.name}</span>
                      <span className="text-[10px] font-mono-num text-[#C7FF00]">{ex.difficultyTier}</span>
                    </div>
                    <p className="text-[11px] text-[#A5ACA6] mt-0.5">{ex.targetMuscles.join(', ')}</p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[#080B09] border border-white/10 space-y-3">
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[#111713]">
                  <div className="text-[10px] text-[#A5ACA6]">SETS</div>
                  <div className="font-mono-num font-bold text-white">{scaled.sets}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#111713]">
                  <div className="text-[10px] text-[#A5ACA6]">
                    {selectedExercise.mode === 'reps' ? 'REPS/SET' : 'SEC/SET'}
                  </div>
                  <div className="font-mono-num font-bold text-white">{scaled.targetCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#111713]">
                  <div className="text-[10px] text-[#A5ACA6]">SET TIMER</div>
                  <div className="font-mono-num font-bold text-sky-300">{setTimeLimit}s</div>
                </div>
                <div className="p-2 rounded-lg bg-[#111713]">
                  <div className="text-[10px] text-[#A5ACA6]">ENERGY</div>
                  <div className="font-mono-num font-bold text-amber-300">-{selectedExercise.energyCost}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#111713]">
                  <div className="text-[10px] text-[#A5ACA6]">BASE XP</div>
                  <div className="font-mono-num font-bold text-[#C7FF00]">
                    +{isArena ? Math.round(scaled.xpReward * 1.45) : scaled.xpReward}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#A5ACA6] leading-relaxed">{selectedExercise.improvementTips}</p>

              {!canAffordEnergy && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-200">
                  Low Energy ({energy}/{selectedExercise.energyCost} needed). Visit the{' '}
                  <strong>Nutrition Center</strong> to fuel up or rest at <strong>Player Home</strong>!
                </div>
              )}
            </div>

            <button
              disabled={!canAffordEnergy}
              onClick={startExercise}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm transition ${
                canAffordEnergy
                  ? 'bg-[#C7FF00] text-[#080B09] hover:bg-[#d8ff4d] cursor-pointer'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isArena ? 'START ARENA CHALLENGE' : 'BEGIN 3D WORKOUT'}
            </button>
          </div>
        )}

        {/* PHASE 2: ACTIVE WORKOUT */}
        {phase === 'active' && (
          <div className="p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#C7FF00]/15 text-[#C7FF00] font-bold">
                  SET {currentSet} / {scaled.sets}
                </span>
                {streak >= 2 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    STREAK x{streak}
                  </span>
                )}
              </div>

              <span
                className={`flex items-center gap-1 font-bold ${
                  setSecondsLeft <= 5
                    ? 'text-red-400'
                    : setSecondsLeft <= 10
                      ? 'text-amber-300'
                      : 'text-sky-300'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                {setSecondsLeft}s LEFT
              </span>

              <span className="text-white">
                {selectedExercise.mode === 'reps' ? 'REPS' : 'SECONDS'}:{' '}
                <strong className="text-[#C7FF00]">{repsDone}</strong> / {scaled.targetCount}
              </span>
            </div>

            {/* Segmented Rep / Cadence Progress Pips */}
            <div className="flex gap-1">
              {Array.from({ length: scaled.targetCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-sm transition-colors duration-150 ${
                    idx < repsDone ? 'bg-[#C7FF00]' : 'bg-[#080B09] border border-white/10'
                  }`}
                />
              ))}
            </div>

            {selectedExercise.mode === 'reps' ? (
              <div className="space-y-3">
                {/* Timing Sweet-Spot Meter */}
                <div className="relative h-10 rounded-lg bg-[#080B09] border border-white/15 overflow-hidden">
                  {/* Outer Good Zone */}
                  <div
                    className="absolute top-0 bottom-0 bg-[#C7FF00]/20 border-x border-[#C7FF00]/70"
                    style={{
                      left: `${(0.5 - scaled.timingWindow) * 100}%`,
                      width: `${scaled.timingWindow * 2 * 100}%`,
                    }}
                  />
                  {/* Inner Perfect Zone */}
                  <div
                    className="absolute top-0 bottom-0 bg-[#C7FF00]/40"
                    style={{
                      left: `${(0.5 - scaled.timingWindow * 0.45) * 100}%`,
                      width: `${scaled.timingWindow * 0.9 * 100}%`,
                    }}
                  />
                  {/* Moving Cursor */}
                  <div
                    className="absolute top-1 bottom-1 w-2.5 -ml-1.25 rounded bg-white shadow"
                    style={{ left: `${cursorPos * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`font-medium ${
                      lastGrade === 'perfect'
                        ? 'text-emerald-300'
                        : lastGrade === 'good'
                          ? 'text-[#C7FF00]'
                          : lastGrade === 'sloppy'
                            ? 'text-amber-300'
                            : 'text-[#A5ACA6]'
                    }`}
                  >
                    {feedback}
                  </span>
                  <span className="font-mono-num text-[11px] text-[#A5ACA6] shrink-0">
                    FORM {liveAccuracyDisplay}%
                  </span>
                </div>

                <button
                  onClick={executeRep}
                  className="w-full py-3 rounded-xl bg-[#C7FF00] text-[#080B09] font-display font-bold text-sm hover:bg-[#d8ff4d] active:scale-[0.98] transition cursor-pointer"
                >
                  EXECUTE REP [SPACE]
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative h-4 rounded-full bg-[#080B09] border border-white/15 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      holding ? 'bg-[#C7FF00]' : 'bg-[#8DAF26]/50'
                    }`}
                    style={{ width: `${holdFraction * 100}%` }}
                  />
                </div>
                <p className="text-xs text-center text-[#A5ACA6]">
                  {holding
                    ? 'CADENCE LOCKED — Keep holding steady!'
                    : 'Hold SPACE or press & hold below to accelerate cadence'}
                </p>
                <button
                  onPointerDown={() => {
                    holdingRef.current = true;
                    setHolding(true);
                    onHoldStateChange?.(true);
                  }}
                  onPointerUp={() => {
                    holdingRef.current = false;
                    setHolding(false);
                    onHoldStateChange?.(false);
                  }}
                  onPointerLeave={() => {
                    holdingRef.current = false;
                    setHolding(false);
                    onHoldStateChange?.(false);
                  }}
                  className={`w-full py-3 rounded-xl font-display font-bold text-sm transition cursor-pointer ${
                    holding
                      ? 'bg-[#C7FF00] text-[#080B09]'
                      : 'bg-[#1a251d] border border-[#C7FF00]/60 text-white'
                  }`}
                >
                  <Zap className="w-4 h-4 inline mr-1.5" />
                  HOLD CADENCE [SPACE]
                </button>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: REST INTERVAL */}
        {phase === 'rest' && (
          <div className="p-6 text-center space-y-4">
            <p className="text-xs font-mono-num uppercase text-[#8DAF26]">
              Set {currentSet} Complete · Recovery Interval
            </p>
            <div className="font-display text-4xl font-bold font-mono-num text-white">
              {restRemaining}s
            </div>
            <div className="h-1.5 rounded-full bg-[#080B09] overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-[#8DAF26] transition-all duration-500"
                style={{ width: `${(restRemaining / restDuration) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[#A5ACA6]">
              Catch your breath before Set {currentSet + 1} of {scaled.sets}. Form Score so far:{' '}
              <strong className="text-white">{liveAccuracyDisplay}%</strong>
            </p>
            <button
              onClick={startNextSet}
              className="px-5 py-2.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-xs cursor-pointer"
            >
              Skip Rest & Start Set {currentSet + 1} [SPACE]
            </button>
          </div>
        )}

        {/* PHASE 4: SET TIMER EXPIRED */}
        {phase === 'timeout' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h4 className="font-display text-xl font-bold text-white">Set Timer Expired</h4>
              <p className="text-xs text-[#A5ACA6] mt-1">
                Completed {repsDone} / {scaled.targetCount}{' '}
                {selectedExercise.mode === 'reps' ? 'reps' : 'seconds'} in Set {currentSet} ({totalRepsAccum}{' '}
                total).
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={retryCurrentSet}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#C7FF00] text-[#080B09] font-display font-bold text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Set {currentSet}
              </button>
              <button
                onClick={() => finishWorkout(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#080B09] border border-white/15 text-white font-display font-bold text-xs hover:border-[#C7FF00] cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-[#C7FF00]" />
                Finish & Claim Earned XP
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: WORKOUT SUMMARY */}
        {phase === 'summary' && summaryReward && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#C7FF00]/20 border border-[#C7FF00] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#C7FF00]" />
            </div>
            <div>
              <h4 className="font-display text-2xl font-bold text-white">
                {isArena ? 'Arena Challenge Cleared!' : 'Challenge Complete!'}
              </h4>
              <p className="text-xs text-[#A5ACA6] mt-1">
                {selectedExercise.name} · {setsFinished} Sets · {totalRepsAccum}{' '}
                {selectedExercise.mode === 'reps' ? 'Reps' : 'Seconds'} · Time{' '}
                {formatClock(elapsedSeconds)}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-[#080B09] border border-white/10">
                <div className="text-[10px] text-[#A5ACA6]">FORM SCORE</div>
                <div className="font-mono-num font-bold text-lg text-emerald-400">
                  {summaryReward.accuracyPercent}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080B09] border border-white/10">
                <div className="text-[10px] text-[#A5ACA6]">BEST STREAK</div>
                <div className="font-mono-num font-bold text-lg text-sky-300">
                  x{bestStreak}
                  {summaryReward.streakBonusPct > 0 ? ` (+${summaryReward.streakBonusPct}%)` : ''}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080B09] border border-white/10">
                <div className="text-[10px] text-[#A5ACA6]">XP EARNED</div>
                <div className="font-mono-num font-bold text-lg text-[#C7FF00]">
                  +{summaryReward.xpEarned}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080B09] border border-white/10">
                <div className="text-[10px] text-[#A5ACA6]">COINS</div>
                <div className="font-mono-num font-bold text-lg text-amber-300">
                  +{summaryReward.coinsEarned}
                </div>
              </div>
            </div>

            {/* Attribute Gains Breakdown */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono-num">
              {Object.entries(summaryReward.attributeDelta)
                .filter(([, val]) => (val ?? 0) > 0)
                .map(([attr, val]) => (
                  <span
                    key={attr}
                    className="px-2.5 py-1 rounded-lg bg-[#080B09] border border-white/10 text-[#A5ACA6] uppercase"
                  >
                    {attr} <strong className="text-[#C7FF00]">+{val}</strong>
                  </span>
                ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#C7FF00] text-[#080B09] font-display font-bold text-sm hover:bg-[#d8ff4d] cursor-pointer"
            >
              <Award className="w-4 h-4 inline mr-1.5" />
              RETURN TO CAMPUS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
