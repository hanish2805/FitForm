import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Award, Compass, Dumbbell, Home, Play, Save, Settings, Sparkles, Target } from 'lucide-react';
import { GameHud } from './components/GameHud';
import { MainMenu } from './components/MainMenu';
import type { ProgressionModalTab } from './components/MissionsAchievementsModal';
import { OUTFIT_CATALOG } from './data/missions';
import { resolveLocationForPosition } from './data/worldLocations';
import { soundEngine } from './engine/audio';
import { GameEngine } from './engine/GameEngine';

const CharacterCreator = lazy(() =>
  import('./components/CharacterCreator').then((m) => ({ default: m.CharacterCreator })),
);
const ExerciseDemoLab = lazy(() =>
  import('./components/ExerciseDemoLab').then((m) => ({ default: m.ExerciseDemoLab })),
);
const HomeModal = lazy(() =>
  import('./components/HomeModal').then((m) => ({ default: m.HomeModal })),
);
const MissionsAchievementsModal = lazy(() =>
  import('./components/MissionsAchievementsModal').then((m) => ({
    default: m.MissionsAchievementsModal,
  })),
);
const NutritionModal = lazy(() =>
  import('./components/NutritionModal').then((m) => ({ default: m.NutritionModal })),
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal })),
);
const WorkoutModal = lazy(() =>
  import('./components/WorkoutModal').then((m) => ({ default: m.WorkoutModal })),
);
const WorldMapModal = lazy(() =>
  import('./components/WorldMapModal').then((m) => ({ default: m.WorldMapModal })),
);
import {
  ActiveModal,
  ActiveScreen,
  CharacterConfig,
  DifficultyLevel,
  ExerciseDefinition,
  ExerciseId,
  GameSaveState,
  GameSettings,
  InteractiveStation,
  LocationId,
  NutritionItem,
  OutfitId,
} from './types/game';
import {
  applyLocationVisit,
  applyNutritionMeal,
  applyXpAndRewards,
  claimAllCompletedMissions,
  completeWorkoutProgression,
  ProgressionResult,
  restAtHome,
} from './utils/progression';
import {
  clearSavedGame,
  createNewSaveState,
  DEFAULT_CHARACTER,
  loadSavedGame,
  loadSettings,
  saveGame,
  saveSettings,
} from './utils/storage';

interface ToastBanner {
  id: number;
  title: string;
  subtitle: string;
  accent: string;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [savedSnapshot, setSavedSnapshot] = useState<GameSaveState | null>(() => loadSavedGame());
  const [gameState, setGameState] = useState<GameSaveState>(() =>
    loadSavedGame() ?? createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER'),
  );
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

  const [screen, setScreen] = useState<ActiveScreen>('menu');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [missionTab, setMissionTab] = useState<ProgressionModalTab>('missions');
  const [noSaveNotice, setNoSaveNotice] = useState(false);

  const [nearbyStation, setNearbyStation] = useState<InteractiveStation | null>(null);
  const [activeStation, setActiveStation] = useState<InteractiveStation | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationId>('training_center');
  const [stamina, setStamina] = useState(100);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 3, yaw: Math.PI });
  const [activeWaypoint, setActiveWaypoint] = useState<LocationId | null>(null);
  const [toasts, setToasts] = useState<ToastBanner[]>([]);
  const [levelUpBanner, setLevelUpBanner] = useState<number | null>(null);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const activeModalRef = useRef(activeModal);
  activeModalRef.current = activeModal;

  const pushToast = useCallback((title: string, subtitle: string, accent = '#C7FF00') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, accent }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const handleProgressionFeedback = useCallback(
    (res: ProgressionResult) => {
      if (res.leveledUp) {
        soundEngine.playLevelUp();
        setLevelUpBanner(res.newLevel);
        window.setTimeout(() => setLevelUpBanner(null), 3500);
      }
      if (res.newlyUnlockedDifficulty) {
        pushToast(
          `${res.newlyUnlockedDifficulty} TIER UNLOCKED`,
          'Higher intensity drills & bonus XP now available!',
          '#38bdf8',
        );
      }
      res.newlyCompletedMissions.forEach((title) => {
        soundEngine.playMissionComplete();
        pushToast('MISSION COMPLETE', `${title} — Ready to claim!`, '#C7FF00');
      });
      res.newlyUnlockedAchievements.forEach((title) => {
        soundEngine.playMissionComplete();
        pushToast('ACHIEVEMENT UNLOCKED', title, '#f97316');
      });
      res.newlyUnlockedOutfits.forEach((outfitId) => {
        pushToast(
          'NEW KIT UNLOCKED',
          `${OUTFIT_CATALOG[outfitId].name} — Equip in Levels & Rewards!`,
          '#a78bfa',
        );
      });
    },
    [pushToast],
  );

  const persistState = useCallback((next: GameSaveState) => {
    const pos = engineRef.current?.playerPos;
    const withPos: GameSaveState = pos
      ? { ...next, playerPosition: { x: pos.x, y: pos.y, z: pos.z } }
      : next;
    const saved = saveGame(withPos);
    setGameState(saved);
    setSavedSnapshot(saved);
    return saved;
  }, []);

  // Initialize isolated 3D WebGL GameEngine once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    soundEngine.setSettings(settings.soundVolume, settings.musicVolume, settings.muted);

    const engine = new GameEngine(
      container,
      gameStateRef.current.character,
      settings,
      {
        onNearbyStationChange: (st) => setNearbyStation(st),
        onWaypointChange: (locId) => setActiveWaypoint(locId),
        onLocationChange: (locId) => {
          setCurrentLocation(locId);
          if (screenRef.current === 'playing') {
            const res = applyLocationVisit(gameStateRef.current, locId);
            if (res.nextState.visitedLocations.length > gameStateRef.current.visitedLocations.length) {
              pushToast('LOCATION DISCOVERED', 'Campus exploration +35 XP', '#34d399');
            }
            const pos = engineRef.current?.playerPos;
            const saved = saveGame(
              pos ? { ...res.nextState, playerPosition: { x: pos.x, y: pos.y, z: pos.z } } : res.nextState,
            );
            setGameState(saved);
            setSavedSnapshot(saved);
            handleProgressionFeedback(res);
          }
        },
        onInteract: (station) => {
          if (activeModalRef.current !== null || screenRef.current !== 'playing') return;
          soundEngine.playClick();
          setActiveStation(station);
          if (station.stationType === 'nutrition_bar') {
            setActiveModal('nutrition');
            engine.setMode('menu');
          } else if (station.stationType === 'home_bed' || station.stationType === 'home_wardrobe') {
            setActiveModal('home');
            engine.setMode('menu');
          } else if (station.stationType === 'arena_podium') {
            setActiveModal('arena');
            engine.setMode('workout');
          } else {
            setActiveModal('station_workout');
            engine.setMode('workout');
          }
        },
        onPauseToggle: () => {
          if (screenRef.current !== 'playing') return;
          soundEngine.playClick();
          if (activeModalRef.current === 'pause') {
            setActiveModal(null);
            engine.setMode('gameplay');
          } else if (activeModalRef.current === null) {
            setActiveModal('pause');
            engine.setMode('menu');
          } else {
            setActiveModal(null);
            engine.setWorkoutState(false, null);
            engine.setMode('gameplay');
          }
        },
        onMapToggle: () => {
          if (screenRef.current !== 'playing') return;
          soundEngine.playClick();
          if (activeModalRef.current === 'map') {
            setActiveModal(null);
            engine.setMode('gameplay');
          } else if (activeModalRef.current === null) {
            setActiveModal('map');
            engine.setMode('menu');
          }
        },
        onStaminaChange: (val) => setStamina(val),
        onPlayerMove: (x, z, yaw) => setPlayerPos({ x, z, yaw }),
      },
    );

    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleProgressionFeedback, pushToast]);

  // Unified Escape key handling across menus, modals, Form Lab, and gameplay pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      e.preventDefault();
      soundEngine.playClick();

      if (screenRef.current === 'demo_lab') {
        setScreen(activeModalRef.current === 'pause' ? 'playing' : 'menu');
        return;
      }

      if (screenRef.current === 'character_create') {
        setScreen('menu');
        return;
      }

      if (activeModalRef.current !== null) {
        if (activeModalRef.current === 'station_workout' || activeModalRef.current === 'arena') {
          engineRef.current?.setWorkoutState(false, null);
        }
        setActiveModal(null);
        if (screenRef.current === 'playing') {
          engineRef.current?.setMode('gameplay');
        }
        return;
      }

      if (screenRef.current === 'playing') {
        setActiveModal('pause');
        engineRef.current?.setMode('menu');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Periodic exploration position autosave & reload flush while playing
  useEffect(() => {
    const flushPositionSave = () => {
      if (screenRef.current !== 'playing' || !engineRef.current) return;
      const pos = engineRef.current.playerPos;
      const savedPos = gameStateRef.current.playerPosition;
      const moved = Math.hypot(pos.x - savedPos.x, pos.z - savedPos.z);
      if (moved > 0.35 || Math.abs(pos.y - savedPos.y) > 0.1) {
        saveGame({
          ...gameStateRef.current,
          playerPosition: { x: pos.x, y: pos.y, z: pos.z },
        });
      }
    };

    const intervalId = window.setInterval(flushPositionSave, 4000);
    window.addEventListener('pagehide', flushPositionSave);
    window.addEventListener('beforeunload', flushPositionSave);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pagehide', flushPositionSave);
      window.removeEventListener('beforeunload', flushPositionSave);
    };
  }, []);

  // Sync audio & graphics settings dynamically
  const handleUpdateSettings = (next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
    soundEngine.setSettings(next.soundVolume, next.musicVolume, next.muted);
    engineRef.current?.applyQualitySettings(next);
  };

  // Start a brand-new game from Character Creation
  const handleConfirmCharacter = (config: CharacterConfig, difficulty: DifficultyLevel) => {
    soundEngine.playClick();
    if (screen === 'character_create') {
      const fresh = createNewSaveState(config, difficulty);
      const saved = saveGame(fresh);
      setGameState(saved);
      setSavedSnapshot(saved);
      engineRef.current?.setCharacterConfig(config);
      engineRef.current?.setPlayerPosition(fresh.playerPosition.x, fresh.playerPosition.y, fresh.playerPosition.z);
      engineRef.current?.setMode('gameplay');
      setScreen('playing');
      setActiveModal(null);
      pushToast('WELCOME TO FITFORM', 'Walk into the Training Center and press E near equipment!', '#C7FF00');
    } else {
      // Editing existing athlete
      const updated = persistState({
        ...gameState,
        character: config,
        difficulty,
      });
      engineRef.current?.setCharacterConfig(updated.character);
      setActiveModal(null);
      if (screen === 'playing') {
        engineRef.current?.setMode('gameplay');
      }
      pushToast('ATHLETE UPDATED', 'Appearance & training profile saved.');
    }
  };

  const handleContinueGame = () => {
    soundEngine.playClick();
    const existing = loadSavedGame();
    if (!existing) {
      setNoSaveNotice(true);
      return;
    }
    setNoSaveNotice(false);
    setGameState(existing);
    setSavedSnapshot(existing);
    const resolvedLoc = resolveLocationForPosition(existing.playerPosition.x, existing.playerPosition.z);
    setCurrentLocation(resolvedLoc);
    setStamina(existing.stamina);
    setPlayerPos({ x: existing.playerPosition.x, z: existing.playerPosition.z, yaw: Math.PI });
    engineRef.current?.setCharacterConfig(existing.character);
    engineRef.current?.setPlayerPosition(
      existing.playerPosition.x,
      existing.playerPosition.y,
      existing.playerPosition.z,
    );
    engineRef.current?.setMode('gameplay');
    setScreen('playing');
    setActiveModal(null);
    pushToast('WELCOME BACK', `Resumed Day ${existing.day} · Level ${existing.level}`);
  };

  const handleWorkoutComplete = (result: {
    exercise: ExerciseDefinition;
    setsCompleted: number;
    totalRepsOrSeconds: number;
    accuracyPercent: number;
    xpEarned: number;
    coinsEarned: number;
    isArenaWin: boolean;
  }) => {
    const baseState: GameSaveState = result.isArenaWin
      ? { ...gameState, arenaWins: gameState.arenaWins + 1 }
      : gameState;

    const prog = completeWorkoutProgression(
      baseState,
      result.exercise,
      result.setsCompleted,
      result.totalRepsOrSeconds,
      result.accuracyPercent,
      result.xpEarned,
      result.coinsEarned,
    );
    const finalProg = result.isArenaWin
      ? applyXpAndRewards(prog.nextState, 0, 0, { arena_wins: 1 })
      : prog;

    persistState(finalProg.nextState);
    handleProgressionFeedback({
      ...finalProg,
      leveledUp: prog.leveledUp || finalProg.leveledUp,
      newlyCompletedMissions: [
        ...prog.newlyCompletedMissions,
        ...finalProg.newlyCompletedMissions,
      ],
      newlyUnlockedAchievements: [
        ...prog.newlyUnlockedAchievements,
        ...finalProg.newlyUnlockedAchievements,
      ],
      newlyUnlockedDifficulty:
        finalProg.newlyUnlockedDifficulty ?? prog.newlyUnlockedDifficulty,
    });
  };

  const handleSelectMeal = (item: NutritionItem) => {
    soundEngine.playMealBoost();
    const res = applyNutritionMeal(gameState, item);
    persistState(res.nextState);
    handleProgressionFeedback(res);
  };

  const handleRestAtHome = () => {
    soundEngine.playMealBoost();
    const rested = restAtHome(gameState);
    persistState(rested);
    setActiveModal(null);
    engineRef.current?.setMode('gameplay');
    pushToast(`DAY ${rested.day} BEGINS`, 'Energy 100% · Daily Missions Refreshed!', '#a78bfa');
  };

  const handleClaimMission = (missionId: string) => {
    const target = gameState.missions.find((m) => m.id === missionId);
    if (!target || !target.completed || target.claimed) return;
    soundEngine.playMissionComplete();
    const updatedMissions = gameState.missions.map((m) =>
      m.id === missionId ? { ...m, claimed: true } : m,
    );
    const res = applyXpAndRewards(
      { ...gameState, missions: updatedMissions },
      target.xpReward,
      target.coinReward,
    );
    persistState(res.nextState);
    handleProgressionFeedback(res);
    pushToast('REWARD CLAIMED', `+${target.xpReward} XP · +${target.coinReward} Coins`, '#C7FF00');
  };

  const handleClaimAllMissions = () => {
    const { result, claimedCount, totalXp, totalCoins } = claimAllCompletedMissions(gameState);
    if (claimedCount === 0) return;
    soundEngine.playMissionComplete();
    persistState(result.nextState);
    handleProgressionFeedback(result);
    pushToast(
      `CLAIMED ${claimedCount} MISSIONS`,
      `+${totalXp} XP · +${totalCoins} Coins`,
      '#C7FF00',
    );
  };

  const handleEquipOutfit = (outfitId: OutfitId) => {
    if (!gameState.unlockedOutfits.includes(outfitId)) return;
    soundEngine.playClick();
    const nextChar = { ...gameState.character, outfit: outfitId };
    const updated = persistState({ ...gameState, character: nextChar });
    engineRef.current?.setCharacterConfig(updated.character);
    pushToast('KIT EQUIPPED', OUTFIT_CATALOG[outfitId].name, '#C7FF00');
  };

  const handleResetProgress = () => {
    clearSavedGame();
    const fresh = createNewSaveState(DEFAULT_CHARACTER, 'BEGINNER');
    setSavedSnapshot(null);
    setGameState(fresh);
    engineRef.current?.setCharacterConfig(fresh.character);
    engineRef.current?.setPlayerPosition(fresh.playerPosition.x, fresh.playerPosition.y, fresh.playerPosition.z);
    engineRef.current?.setMode('menu');
    setActiveModal(null);
    setScreen('menu');
    pushToast('PROGRESS RESET', 'Saved data cleared.', '#ef4444');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080B09]">
      {/* Isolated Full-Viewport 3D WebGL Canvas Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* MAIN MENU */}
      {screen === 'menu' && (
        <MainMenu
          savedGame={savedSnapshot}
          noSaveNotice={noSaveNotice}
          onPlayNew={() => {
            soundEngine.playClick();
            setNoSaveNotice(false);
            setScreen('character_create');
          }}
          onContinue={handleContinueGame}
          onOpenCharacter={() => {
            soundEngine.playClick();
            setActiveModal('character_edit');
          }}
          onOpenTrainingCenter={() => {
            soundEngine.playClick();
            setScreen('demo_lab');
          }}
          onOpenMissions={() => {
            soundEngine.playClick();
            setMissionTab('missions');
            setActiveModal('missions');
          }}
          onOpenAchievements={() => {
            soundEngine.playClick();
            setMissionTab('achievements');
            setActiveModal('achievements');
          }}
          onOpenSettings={() => {
            soundEngine.playClick();
            setActiveModal('settings');
          }}
        />
      )}

      <Suspense fallback={null}>
        {/* CHARACTER CREATION */}
        {screen === 'character_create' && (
          <CharacterCreator
            mode="new_game"
            initialConfig={DEFAULT_CHARACTER}
            unlockedOutfits={['volt_pro']}
            unlockedDifficulties={['BEGINNER']}
            currentDifficulty="BEGINNER"
            onConfirm={handleConfirmCharacter}
            onCancel={() => {
              soundEngine.playClick();
              setScreen('menu');
            }}
          />
        )}

        {/* CHARACTER CUSTOMIZATION (FROM MENU OR HOME WARDROBE) */}
        {activeModal === 'character_edit' && (
          <CharacterCreator
            mode="customize"
            initialConfig={gameState.character}
            unlockedOutfits={gameState.unlockedOutfits}
            unlockedDifficulties={gameState.unlockedDifficulties}
            currentDifficulty={gameState.difficulty}
            onConfirm={handleConfirmCharacter}
            onCancel={() => {
              soundEngine.playClick();
              setActiveModal(null);
              if (screen === 'playing') engineRef.current?.setMode('gameplay');
            }}
          />
        )}

        {/* 3D EXERCISE DEMONSTRATION LAB */}
        {screen === 'demo_lab' && (
          <ExerciseDemoLab
            character={gameState.character}
            onClose={() => {
              soundEngine.playClick();
              setScreen(activeModal === 'pause' ? 'playing' : 'menu');
            }}
          />
        )}
      </Suspense>

      {/* ACTIVE GAMEPLAY HUD */}
      {screen === 'playing' && activeModal === null && (
        <GameHud
          saveState={gameState}
          stamina={stamina}
          currentLocation={currentLocation}
          nearbyStation={nearbyStation}
          playerPos={playerPos}
          activeWaypoint={activeWaypoint}
          showHud={settings.showHud}
          mobileControlsMode={settings.mobileControlsMode}
          onInteractClick={() => engineRef.current?.triggerInteract()}
          onOpenMap={() => {
            soundEngine.playClick();
            setActiveModal('map');
            engineRef.current?.setMode('menu');
          }}
          onOpenPause={() => {
            soundEngine.playClick();
            setActiveModal('pause');
            engineRef.current?.setMode('menu');
          }}
          onOpenMissions={() => {
            soundEngine.playClick();
            setMissionTab('missions');
            setActiveModal('missions');
            engineRef.current?.setMode('menu');
          }}
          onOpenProgression={() => {
            soundEngine.playClick();
            setMissionTab('rewards');
            setActiveModal('missions');
            engineRef.current?.setMode('menu');
          }}
          onMobileMove={(x, y) => engineRef.current?.setMobileMove(x, y)}
          onMobileSprint={(s) => engineRef.current?.setMobileSprint(s)}
          onMobileJump={() => engineRef.current?.triggerJump()}
        />
      )}

      <Suspense fallback={null}>
        {/* WORKOUT / ARENA MODAL */}
        {(activeModal === 'station_workout' || activeModal === 'arena') && activeStation && (
          <WorkoutModal
            station={activeStation}
            difficulty={gameState.difficulty}
            unlockedDifficulties={gameState.unlockedDifficulties}
            energy={gameState.energy}
            isArena={activeModal === 'arena'}
            onSelectDifficulty={(d) => persistState({ ...gameState, difficulty: d })}
            onWorkoutStart={(exId: ExerciseId) => {
              engineRef.current?.setWorkoutState(true, exId, activeStation.facingAngle);
            }}
            onWorkoutEnd={() => {
              engineRef.current?.setWorkoutState(false, null);
            }}
            onRepExecuted={(quality) => {
              engineRef.current?.triggerWorkoutRep(quality);
            }}
            onHoldStateChange={(holding) => {
              engineRef.current?.setWorkoutHoldActive(holding);
            }}
            onPhaseChange={(nextPhase, exId) => {
              if (nextPhase === 'active') {
                engineRef.current?.setWorkoutState(true, exId, activeStation.facingAngle);
              } else {
                engineRef.current?.setWorkoutState(false, null);
              }
            }}
            onComplete={handleWorkoutComplete}
            onClose={() => {
              engineRef.current?.setWorkoutState(false, null);
              engineRef.current?.setMode('gameplay');
              setActiveModal(null);
            }}
          />
        )}

        {/* NUTRITION MODAL */}
        {activeModal === 'nutrition' && (
          <NutritionModal
            coins={gameState.coins}
            energy={gameState.energy}
            nutritionBalance={gameState.nutritionBalance}
            recovery={gameState.attributes.recovery}
            onSelectMeal={handleSelectMeal}
            onClose={() => {
              setActiveModal(null);
              engineRef.current?.setMode('gameplay');
            }}
          />
        )}

        {/* PLAYER HOME MODAL */}
        {activeModal === 'home' && (
          <HomeModal
            saveState={gameState}
            onRest={handleRestAtHome}
            onOpenCustomize={() => setActiveModal('character_edit')}
            onClose={() => {
              setActiveModal(null);
              engineRef.current?.setMode('gameplay');
            }}
          />
        )}

        {/* WORLD MAP MODAL */}
        {activeModal === 'map' && (
          <WorldMapModal
            playerX={playerPos.x}
            playerZ={playerPos.z}
            visitedLocations={gameState.visitedLocations}
            activeWaypoint={activeWaypoint}
            onSelectWaypoint={(id) => {
              setActiveWaypoint(id);
              engineRef.current?.setWaypoint(id);
            }}
            onFastTravel={(x, y, z, id) => {
              engineRef.current?.setPlayerPosition(x, y, z);
              setCurrentLocation(id);
              if (activeWaypoint === id) {
                setActiveWaypoint(null);
                engineRef.current?.setWaypoint(null);
              }
              const res = applyLocationVisit(gameStateRef.current, id);
              persistState(res.nextState);
              handleProgressionFeedback(res);
              engineRef.current?.setMode('gameplay');
              setActiveModal(null);
            }}
            onClose={() => {
              setActiveModal(null);
              engineRef.current?.setMode('gameplay');
            }}
          />
        )}

        {/* MISSIONS, ACHIEVEMENTS & REWARDS */}
        {(activeModal === 'missions' || activeModal === 'achievements') && (
          <MissionsAchievementsModal
            initialTab={missionTab}
            saveState={gameState}
            onClaimMission={handleClaimMission}
            onClaimAllMissions={handleClaimAllMissions}
            onSelectDifficulty={(d) => {
              soundEngine.playClick();
              persistState({ ...gameState, difficulty: d });
              pushToast('DIFFICULTY UPDATED', `Active tier set to ${d}`, '#C7FF00');
            }}
            onEquipOutfit={handleEquipOutfit}
            onClose={() => {
              setActiveModal(null);
              if (screen === 'playing') engineRef.current?.setMode('gameplay');
            }}
          />
        )}

        {/* SETTINGS */}
        {activeModal === 'settings' && (
          <SettingsModal
            settings={settings}
            hasSavedGame={Boolean(savedSnapshot)}
            inGameplay={screen === 'playing'}
            onUpdateSettings={handleUpdateSettings}
            onSaveNow={() => {
              persistState(gameState);
              pushToast('GAME SAVED', 'Progress stored locally in browser.');
            }}
            onResetProgress={handleResetProgress}
            onClose={() => {
              setActiveModal(null);
              if (screen === 'playing') engineRef.current?.setMode('gameplay');
            }}
          />
        )}
      </Suspense>

      {/* PAUSE MENU */}
      {screen === 'playing' && activeModal === 'pause' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75">
          <div className="w-full max-w-sm rounded-2xl bg-[#111713] border border-white/15 p-6 space-y-2.5">
            <div className="text-center mb-3">
              <p className="text-xs font-mono-num uppercase text-[#C7FF00]">Session Paused</p>
              <h3 className="font-display text-2xl font-bold text-white">FITFORM</h3>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveModal(null);
                engineRef.current?.setMode('gameplay');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#C7FF00] text-[#080B09] font-display font-bold text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Game
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                persistState(gameState);
                pushToast('GAME SAVED', 'Reload anytime and Continue Game!');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#080B09] border border-white/15 text-white text-sm hover:border-[#C7FF00] cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#C7FF00]" />
              Save Game
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveModal('map')}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#080B09] border border-white/12 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#C7FF00]" />
                World Map
              </button>
              <button
                onClick={() => setScreen('demo_lab')}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#080B09] border border-white/12 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5 text-[#C7FF00]" />
                3D Form Lab
              </button>
              <button
                onClick={() => {
                  setMissionTab('missions');
                  setActiveModal('missions');
                }}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#080B09] border border-white/12 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-[#8DAF26]" />
                Missions
              </button>
              <button
                onClick={() => {
                  setMissionTab('achievements');
                  setActiveModal('achievements');
                }}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#080B09] border border-white/12 text-xs text-white hover:border-[#C7FF00] cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-[#8DAF26]" />
                Achievements
              </button>
            </div>

            <button
              onClick={() => {
                setMissionTab('rewards');
                setActiveModal('missions');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#080B09] border border-[#C7FF00]/35 text-xs text-[#C7FF00] hover:border-[#C7FF00] cursor-pointer font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Levels, Difficulty &amp; Unlockable Rewards
            </button>

            <button
              onClick={() => setActiveModal('settings')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#080B09] border border-white/12 text-xs text-white hover:border-white/30 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings & Controls
            </button>

            <button
              onClick={() => {
                persistState(gameState);
                setActiveModal(null);
                setScreen('menu');
                engineRef.current?.setMode('menu');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-xs text-[#A5ACA6] hover:text-white cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Save & Return to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* LEVEL-UP CELEBRATION BANNER */}
      {levelUpBanner !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-7 py-4 rounded-2xl bg-[#111713] border-2 border-[#C7FF00] shadow-2xl text-center pointer-events-none">
          <div className="flex items-center justify-center gap-2 text-xs font-mono-num uppercase text-[#C7FF00]">
            <Sparkles className="w-4 h-4" />
            Athlete Level Up!
          </div>
          <div className="font-display text-3xl font-bold text-white mt-0.5">
            LEVEL {levelUpBanner}
          </div>
        </div>
      )}

      {/* NON-INTRUSIVE TOASTS */}
      <div className="fixed bottom-16 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-xl bg-[#111713]/96 border border-white/15 shadow-lg min-w-[230px]"
            style={{ borderLeftWidth: '4px', borderLeftColor: t.accent }}
          >
            <div className="text-[11px] font-mono-num font-bold" style={{ color: t.accent }}>
              {t.title}
            </div>
            <div className="text-xs text-white mt-0.5">{t.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
