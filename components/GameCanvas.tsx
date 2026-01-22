
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  CAR_WIDTH, 
  CAR_HEIGHT, 
  ROAD_SPEED_BASE, 
  OBSTACLES, 
  POWERUPS 
} from '../constants';
import { GameStatus, Entity, GameState } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  onUpdate: (stats: Partial<GameState>) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  // High-performance state tracked via refs for the animation loop
  const carXRef = useRef(CANVAS_WIDTH / 2 - CAR_WIDTH / 2);
  const entitiesRef = useRef<Entity[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const roadOffset = useRef(0);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current[e.key] = false;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const touchX = (touch.clientX - rect.left) * scaleX;
        carXRef.current = Math.min(Math.max(0, touchX - CAR_WIDTH / 2), CANVAS_WIDTH - CAR_WIDTH);
      }
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons > 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        carXRef.current = Math.min(Math.max(0, mouseX - CAR_WIDTH / 2), CANVAS_WIDTH - CAR_WIDTH);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const spawnEntity = useCallback(() => {
    const isPowerup = Math.random() > 0.6;
    const template = isPowerup 
      ? POWERUPS[Math.floor(Math.random() * POWERUPS.length)]
      : OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];

    if (!template) return;

    const newEntity: Entity = {
      x: Math.random() * (CANVAS_WIDTH - 80),
      y: -100,
      width: 80,
      height: 40,
      label: template.label,
      type: isPowerup ? 'powerup' : 'obstacle',
      color: template.color,
      speed: 4 + Math.random() * 4
    };

    entitiesRef.current.push(newEntity);
  }, []);

  const gameLoop = useCallback((time: number) => {
    if (status !== GameStatus.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- 1. UPDATE LOGIC ---
    const carSpeed = 9;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
      carXRef.current = Math.max(0, carXRef.current - carSpeed);
    }
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
      carXRef.current = Math.min(CANVAS_WIDTH - CAR_WIDTH, carXRef.current + carSpeed);
    }

    roadOffset.current = (roadOffset.current + ROAD_SPEED_BASE) % 100;

    const nextEntities: Entity[] = [];
    let statsUpdate: Partial<GameState> = { progress: 3 };

    for (const entity of entitiesRef.current) {
      entity.y += entity.speed;

      // Simple Rect Collision
      const carRect = { x: carXRef.current, y: CANVAS_HEIGHT - 120, w: CAR_WIDTH, h: CAR_HEIGHT };
      if (
        carRect.x < entity.x + entity.width &&
        carRect.x + carRect.w > entity.x &&
        carRect.y < entity.y + entity.height &&
        carRect.y + carRect.h > entity.y
      ) {
        if (entity.type === 'powerup') {
          const powerupDef = POWERUPS.find(p => p.label === entity.label);
          statsUpdate.score = (statsUpdate.score || 0) + 100;
          statsUpdate.health = (statsUpdate.health || 0) + (powerupDef?.impact || 5);
          statsUpdate.progress = (statsUpdate.progress || 0) + 100;
        } else {
          const obstacleDef = OBSTACLES.find(o => o.label === entity.label);
          statsUpdate.score = (statsUpdate.score || 0) - 50;
          statsUpdate.health = (statsUpdate.health || 0) + (obstacleDef?.impact || -10);
        }
        continue; // Impacted: remove entity
      }

      if (entity.y < CANVAS_HEIGHT) {
        nextEntities.push(entity);
      }
    }
    
    entitiesRef.current = nextEntities;
    onUpdate(statsUpdate);

    if (Math.random() < 0.02) {
      spawnEntity();
    }

    // --- 2. DRAWING ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Road dashed lines
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([40, 40]);
    ctx.lineWidth = 4;
    ctx.lineDashOffset = -roadOffset.current * 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();

    // Road borders
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 0, CANVAS_WIDTH - 10, CANVAS_HEIGHT);

    // Player Car
    const carY = CANVAS_HEIGHT - 120;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#60a5fa';
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(carXRef.current, carY, CAR_WIDTH, CAR_HEIGHT);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(carXRef.current + 5, carY + 10, CAR_WIDTH - 10, 25); // Windshield
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(carXRef.current + 5, carY + 2, 12, 6); // Left Headlight
    ctx.fillRect(carXRef.current + CAR_WIDTH - 17, carY + 2, 12, 6); // Right Headlight

    // Entities (Obstacles and Powerups)
    entitiesRef.current.forEach(entity => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = entity.color;
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(entity.x, entity.y, entity.width, entity.height, 8) : ctx.rect(entity.x, entity.y, entity.width, entity.height);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px "Noto Nastaliq Urdu", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(entity.label, entity.x + entity.width / 2, entity.y + entity.height / 2 + 10);
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status, onUpdate, spawnEntity]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      entitiesRef.current = [];
      carXRef.current = CANVAS_WIDTH / 2 - CAR_WIDTH / 2;
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, gameLoop]);

  return (
    <canvas
      id="gameCanvas"
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="bg-slate-900 rounded-lg shadow-2xl"
    />
  );
};

export default GameCanvas;
