
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
      const nextHealth = Math.min(MAX_HEALTH, Math.max(0, (prev.health + (stats.health || 0))));
      const nextProgress = prev.progress + (stats.progress || 0);
      
      if (nextHealth <= 0) {
        handleGameOver('health');
      } else if (nextProgress >= GOAL_PROGRESS) {
        handleGameOver('success');
      }

      return {
        ...prev,
        score: prev.score + (stats.score || 0),
        health: nextHealth,
        progress: nextProgress,
        speed: prev.speed + (stats.speed || 0)
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
      {/* HUD: Progress Bar */}
      {gameState.status === GameStatus.PLAYING && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
          <div className="flex justify-between text-white text-xs mb-1 font-bold">
            <span>شروعات</span>
            <span>کامیابی (Success)</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 border border-slate-700 shadow-lg overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (gameState.progress / GOAL_PROGRESS) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-white">
            <div className="bg-slate-900/80 px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-2">
              <span className="text-xs">صحت:</span>
              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${gameState.health}%` }} />
              </div>
            </div>
            <div className="bg-slate-900/80 px-3 py-1 rounded-full border border-blue-500/30">
              <span className="text-xs">سکور: {gameState.score}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="relative shadow-2xl border-x-4 border-slate-800">
        <GameCanvas 
          status={gameState.status} 
          onUpdate={updateGameStats} 
        />

        {/* Overlays */}
        {gameState.status === GameStatus.START && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 animate-pulse">
              زندگی کی دوڑ
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-xs">
              برائیوں سے بچیں اور نیکیوں کو سمیٹتے ہوئے کامیابی کی منزل تک پہنچیں۔
            </p>
            <button 
              onClick={startGame}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-12 rounded-full text-2xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              کھیل شروع کریں
            </button>
            <div className="mt-12 text-slate-400 text-sm grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-2 rounded border border-red-500/20">
                <p className="text-red-400 font-bold">بچیں:</p>
                <p>سستی، جھوٹ، غصہ</p>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-emerald-500/20">
                <p className="text-emerald-400 font-bold">حاصل کریں:</p>
                <p>محنت، علم، سچائی</p>
              </div>
            </div>
          </div>
        )}

        {gameState.status === GameStatus.GAMEOVER && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
            <h2 className="text-4xl font-bold text-white mb-4">آپ ہمت ہار گئے!</h2>
            <div className="bg-white/10 p-6 rounded-2xl mb-8 border border-white/20 w-full">
              <p className="text-2xl text-yellow-300 mb-2">"{gameState.lastQuote}"</p>
              <p className="text-slate-200">کامیابی کے لیے دوبارہ کوشش کریں۔</p>
            </div>
            <div className="text-white mb-8">
              <p className="text-xl">سکور: {gameState.score}</p>
              <p className="text-sm opacity-60">بہترین سکور: {highScore}</p>
            </div>
            <button 
              onClick={startGame}
              className="bg-white text-red-900 font-bold py-3 px-10 rounded-full text-xl hover:bg-slate-100 transition-transform hover:scale-105"
            >
              دوبارہ کوشش کریں
            </button>
          </div>
        )}

        {gameState.status === GameStatus.SUCCESS && (
          <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-500">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-bold text-white mb-4">کامیابی!</h2>
            <div className="bg-white/10 p-6 rounded-2xl mb-8 border border-white/20 w-full">
              <p className="text-2xl text-yellow-300">"{gameState.lastQuote}"</p>
            </div>
            <div className="text-white mb-8">
              <p className="text-xl">فائنل سکور: {gameState.score}</p>
            </div>
            <button 
              onClick={startGame}
              className="bg-white text-emerald-900 font-bold py-3 px-10 rounded-full text-xl hover:bg-slate-100 transition-transform hover:scale-105"
            >
              دوبارہ کھیلیں
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 text-slate-500 text-xs text-center w-full">
        استعمال کریں: Arrow Keys یا Mouse/Touch
      </div>
    </div>
  );
};

export default App;
