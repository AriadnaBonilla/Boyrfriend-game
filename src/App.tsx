import { useState, useCallback, useEffect } from 'react';
import Cover from './screens/Cover';
import GameHub, { LevelId } from './screens/GameHub';
import LevelScreen from './screens/LevelScreen';
import FeedingLevel from './screens/FeedingLevel';
import ArcadeLevel from './screens/ArcadeLevel';
import PuzzleLevel from './screens/PuzzleLevel';
import SurvivalLevel from './screens/SurvivalLevel';
import MatchingLevel from './screens/MatchingLevel';
import FinalSurprise from './screens/FinalSurprise';

type Screen = 'cover' | 'hub' | 'level' | 'surprise';

const STORAGE_KEY = 'novio-completed-levels';

export default function App() {
  const [screen, setScreen] = useState<Screen>('cover');
  const [activeLevel, setActiveLevel] = useState<LevelId | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<LevelId>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved) as LevelId[]);
    } catch {}
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedLevels]));
  }, [completedLevels]);

  const goToHub = useCallback(() => {
    setScreen('hub');
    setActiveLevel(null);
  }, []);

  const playLevel = useCallback((id: LevelId) => {
    setActiveLevel(id);
    setScreen('level');
  }, []);

  const completeLevel = useCallback((id: LevelId) => {
    setCompletedLevels((prev) => new Set([...prev, id]));
  }, []);

  const openSurprise = useCallback(() => {
    setScreen('surprise');
  }, []);

  const completedCount = completedLevels.size;

  return (
    <div className="relative">
      {screen === 'cover' && <Cover onStart={goToHub} />}

      {screen === 'hub' && (
        <GameHub
          completedLevels={completedLevels}
          onPlayLevel={playLevel}
          onOpenSurprise={openSurprise}
        />
      )}

      {screen === 'level' && activeLevel && (
        activeLevel === 'arcade' ? (
          <ArcadeLevel
            onBack={goToHub}
            onComplete={completeLevel}
            isCompleted={completedLevels.has('arcade')}
          />
        ) : activeLevel === 'puzzle' ? (
          <PuzzleLevel
            onBack={goToHub}
            onComplete={completeLevel}
            isCompleted={completedLevels.has('puzzle')}
          />
        ) : activeLevel === 'quiz' ? (
          <MatchingLevel
            onBack={goToHub}
            onComplete={completeLevel}
            isCompleted={completedLevels.has('quiz')}
          />
        ) : activeLevel === 'survival' ? (
          <SurvivalLevel
            onBack={goToHub}
            onComplete={completeLevel}
            isCompleted={completedLevels.has('survival')}
            totalCompleted={completedCount}
          />
        ) : activeLevel === 'citas' ? (
          <FeedingLevel
            onBack={goToHub}
            onComplete={completeLevel}
            isCompleted={completedLevels.has('citas')}
          />
        ) : (
          <LevelScreen
            levelId={activeLevel}
            onBack={goToHub}
            onComplete={completeLevel}
            isCompleted={completedLevels.has(activeLevel)}
          />
        )
      )}

      {screen === 'surprise' && <FinalSurprise onBack={goToHub} />}
    </div>
  );
}
