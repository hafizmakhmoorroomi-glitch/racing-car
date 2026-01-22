
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, GameState } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MAX_HEALTH, 
  GOAL_PROGRESS, 
  MOTIVATIONAL_QUOTES,
  SUCCESS_MESSAGES 
} from './constants';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: MAX_HEALTH,
    progress: 0,
    speed: 1,
    status: GameStatus.START,
    lastQuote: MOTIVATIONAL_QUOTES[0]
  });

  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('race_of_life_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleGameOver = useCallback((reason: 'health' | 'success') => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING) return prev;

      const newStatus = reason === 'success' ? GameStatus.SUCCESS : GameStatus.GAMEOVER;
      const quotes = reason === 'success' ? SUCCESS_MESSAGES : MOTIVATIONAL_QUOTES;
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      if (prev.score > highScore) {
        setHighScore(prev.score);
        localStorage.setItem('race_of_life_highscore', prev.score.toString());
      }

      return { ...prev, status: newStatus, lastQuote: randomQuote };
    });
  }, [highScore]);

  const updateGameStats = useCallback((stats: Partial<GameState>) => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING) return prev;

      const nextHealth = Math.min(MAX_HEALTH, Math.max(0, (prev.health + (stats.health || 0))));
      const nextProgress = prev.progress + (stats.progress || 0);
      
      if (nextHealth <= 0) {
        setTimeout(() => handleGameOver('health'), 0);
      } else if (nextProgress >= GOAL_PROGRESS) {
        setTimeout(() => handleGameOver('success'), 0);
      }

      return {
        ...prev,
        score: prev.score + (stats.score || 0),
        health: nextHealth,
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
      lastQuote: MOTIVATIONAL_QUOTES[0]
    });
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      {/* HUD Overlay */}
      {gameState.status === GameStatus.PLAYING && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between text-white text-xs mb-1 font-bold">
            <span className="bg-blue-600 px-2 py-0.5 rounded">شروعات</span>
            <span className="bg-emerald-600 px-2 py-0.5 rounded">منزل</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 shadow-xl overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300 shadow-[0_0_10px_#10b981]"
              style={{ width: `${Math.min(100, (gameState.progress / GOAL_PROGRESS) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-white">
            <div className="bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-red-500/30 flex items-center gap-3 shadow-lg">
              <span className="text-[10px] uppercase tracking-wider opacity-60">صحت</span>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${gameState.health}%` }} />
              </div>
            </div>
            <div className="bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-blue-500/30 shadow-lg">
              <span className="text-xs font-bold">سکور: {gameState.score}</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative border-x-8 border-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <GameCanvas 
          status={gameState.status} 
          onUpdate={updateGameStats} 
        />

        {/* Start Screen */}
        {gameState.status === GameStatus.START && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-10 backdrop-blur-md">
            <div className="mb-6 animate-bounce">🏎️</div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 mb-6">
              زندگی کی دوڑ
            </h1>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xs font-light">
              منفی رویوں سے بچیں اور مثبت اقدار سمیٹ کر کامیابی کی منزل حاصل کریں۔
            </p>
            <button 
              onClick={startGame}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 px-14 rounded-2xl text-2xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            >
              کھیل شروع کریں
            </button>
            <div className="mt-14 text-slate-500 text-sm grid grid-cols-2 gap-6 w-full max-w-xs">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-red-500/10">
                <p className="text-red-400 font-bold mb-1">بچیں:</p>
                <p className="text-xs">جھوٹ، سستی، غصہ</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-emerald-500/10">
                <p className="text-emerald-400 font-bold mb-1">حاصل کریں:</p>
                <p className="text-xs">محنت، سچائی، علم</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Over / Success Overlays */}
        {(gameState.status === GameStatus.GAMEOVER || gameState.status === GameStatus.SUCCESS) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-10 backdrop-blur-xl animate-in zoom-in duration-500 ${gameState.status === GameStatus.GAMEOVER ? 'bg-red-950/95' : 'bg-emerald-950/95'}`}>
            <div className="text-7xl mb-6">{gameState.status === GameStatus.SUCCESS ? '🏆' : '💔'}</div>
            <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">
              {gameState.status === GameStatus.GAMEOVER ? 'کھیل ختم!' : 'فاتح!'}
            </h2>
            <div className="bg-white/5 p-8 rounded-3xl mb-10 border border-white/10 w-full shadow-inner">
              <p className="text-2xl text-yellow-300 font-bold mb-4 leading-normal">"{gameState.lastQuote}"</p>
              <p className="text-slate-300 text-sm italic opacity-60">
                {gameState.status === GameStatus.GAMEOVER ? 'ناامید نہ ہوں، ہر مشکل کے بعد آسانی ہے۔' : 'آپ کی محنت اور اخلاق نے آپ کو کامیاب بنایا۔'}
              </p>
            </div>
            <div className="text-white mb-10 flex gap-10">
              <div className="text-center">
                <p className="text-xs uppercase opacity-40">سکور</p>
                <p className="text-3xl font-mono font-bold">{gameState.score}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase opacity-40">بہترین</p>
                <p className="text-3xl font-mono font-bold">{highScore}</p>
              </div>
            </div>
            <button 
              onClick={startGame}
              className="bg-white text-slate-900 font-black py-4 px-12 rounded-2xl text-xl hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            >
              دوبارہ کھیلیں
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 text-slate-600 text-[10px] tracking-[0.2em] uppercase font-bold w-full text-center">
        استعمال کریں: ARROWS یا TOUCH
      </div>
    </div>
  );
};

export default App;
