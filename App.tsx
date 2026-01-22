
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, GameState } from './types';
import { 
  MAX_HEALTH, 
  GOAL_PROGRESS, 
  MOTIVATIONAL_QUOTE 
} from './constants';
import GameScene from './components/GameScene';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: MAX_HEALTH,
    progress: 0,
    speed: 1,
    status: GameStatus.START,
    lastQuote: MOTIVATIONAL_QUOTE
  });

  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('race_of_life_highscore_3d');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleGameOver = useCallback((reason: 'hit' | 'success') => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING) return prev;
      const newStatus = reason === 'success' ? GameStatus.SUCCESS : GameStatus.GAMEOVER;
      if (prev.score > highScore) {
        setHighScore(prev.score);
        localStorage.setItem('race_of_life_highscore_3d', prev.score.toString());
      }
      return { ...prev, status: newStatus };
    });
  }, [highScore]);

  const updateGameStats = useCallback((stats: Partial<GameState>) => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING) return prev;

      if (stats.health && stats.health < 0) {
        setTimeout(() => handleGameOver('hit'), 100);
        return { ...prev, health: 0 };
      }

      const nextProgress = prev.progress + (stats.progress || 0);
      if (nextProgress >= GOAL_PROGRESS) {
        setTimeout(() => handleGameOver('success'), 100);
      }

      return {
        ...prev,
        score: prev.score + (stats.score || 0),
        progress: nextProgress,
      };
    });
  }, [handleGameOver]);

  const startGame = () => {
    setGameState({
      score: 0,
      health: MAX_HEALTH,
      progress: 0,
      speed: 1,
      status: GameStatus.PLAYING,
      lastQuote: MOTIVATIONAL_QUOTE
    });
  };

  return (
    <div className="relative w-full h-screen bg-black text-white font-['Noto_Nastaliq_Urdu'] select-none">
      
      {/* 3D Scene Layer */}
      <GameScene status={gameState.status} onUpdate={updateGameStats} />

      {/* HUD UI Layer */}
      {gameState.status === GameStatus.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none">
          <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 shadow-2xl">
            <p className="text-[10px] opacity-60 uppercase tracking-widest">آپ کا سکور</p>
            <p className="text-4xl font-black">{gameState.score}</p>
          </div>
          <div className="w-64">
             <p className="text-right text-xs opacity-60 mb-2">منزل کی جانب پیش قدمی</p>
             <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 shadow-[0_0_20px_#10b981]" 
                  style={{ width: `${(gameState.progress / GOAL_PROGRESS) * 100}%` }}
                />
             </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState.status === GameStatus.START && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 bg-gradient-to-b from-transparent via-black/40 to-black/90 backdrop-blur-sm">
          <h1 className="text-8xl font-black mb-8 drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] tracking-tighter">
            زندگی کی دوڑ
          </h1>
          <p className="text-2xl text-emerald-400 mb-12 font-bold max-w-lg text-center leading-loose">
            اچھی عادات (محنت، سچائی) اپنائیں اور برائیوں سے بچ کر منزل مقصود حاصل کریں۔
          </p>
          <button 
            onClick={startGame}
            className="px-16 py-6 bg-blue-600 hover:bg-blue-500 text-3xl font-black rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all transform hover:scale-105"
          >
            آغاز کریں
          </button>
          <div className="mt-16 text-white/40 text-sm tracking-widest uppercase flex gap-8">
            <span>Arrow Keys to Switch Lanes</span>
            <span>|</span>
            <span>Swipe on Mobile</span>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center p-10 backdrop-blur-3xl animate-in zoom-in duration-300">
          <div className="text-9xl mb-10 animate-bounce">🚨</div>
          <h2 className="text-6xl font-black mb-8">رکاوٹ!</h2>
          <div className="max-w-xl w-full bg-white/5 p-10 rounded-[40px] border border-white/10 mb-12 shadow-2xl">
            <p className="text-4xl font-bold text-yellow-300 leading-normal mb-6">"{MOTIVATIONAL_QUOTE}"</p>
            <div className="flex justify-between items-center border-t border-white/10 pt-8">
              <div>
                 <p className="text-xs opacity-50 uppercase mb-1">سکور</p>
                 <p className="text-4xl font-black">{gameState.score}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs opacity-50 uppercase mb-1">بہترین سکور</p>
                 <p className="text-4xl font-black text-emerald-400">{highScore}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={startGame}
            className="px-16 py-6 bg-white text-red-950 text-3xl font-black rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all hover:bg-zinc-200 transform hover:scale-105"
          >
            دوبارہ کوشش کریں
          </button>
        </div>
      )}

      {/* Success Screen */}
      {gameState.status === GameStatus.SUCCESS && (
        <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center p-10 backdrop-blur-3xl animate-in zoom-in duration-500">
          <div className="text-9xl mb-10">🥇</div>
          <h2 className="text-7xl font-black mb-8 tracking-tighter">آپ فاتح ہیں!</h2>
          <div className="max-w-xl w-full bg-white/5 p-10 rounded-[40px] border border-white/10 mb-12 shadow-2xl text-center">
            <p className="text-3xl text-emerald-300 font-bold mb-4 leading-relaxed">آپ کی ثابت قدمی اور نیک عادات نے آپ کو کامیابی کی منزل تک پہنچا دیا۔</p>
            <p className="text-white/60 text-lg">فائنل سکور: {gameState.score}</p>
          </div>
          <button 
            onClick={startGame}
            className="px-16 py-6 bg-white text-emerald-950 text-3xl font-black rounded-full shadow-[0_0_50px_rgba(16,185,129,0.3)] transition-all hover:bg-zinc-200 transform hover:scale-105"
          >
            دوبارہ کھیلیں
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
