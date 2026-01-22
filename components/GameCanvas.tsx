
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const requestRef = useRef<number>();
  const [carX, setCarX] = useState(CANVAS_WIDTH / 2 - CAR_WIDTH / 2);
  const [entities, setEntities] = useState<Entity[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const carXRef = useRef(CANVAS_WIDTH / 2 - CAR_WIDTH / 2);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const roadOffset = useRef(0);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current[e.key] = false;
    
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        carXRef.current = Math.min(Math.max(0, touchX - CAR_WIDTH / 2), CANVAS_WIDTH - CAR_WIDTH);
        setCarX(carXRef.current);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons > 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        carXRef.current = Math.min(Math.max(0, mouseX - CAR_WIDTH / 2), CANVAS_WIDTH - CAR_WIDTH);
        setCarX(carXRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('touchmove', handleTouch);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const spawnEntity = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;
    
    const isPowerup = Math.random() > 0.6;
    const template = isPowerup 
      ? POWERUPS[Math.floor(Math.random() * POWERUPS.length)]
      : OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];

    const newEntity: Entity = {
      x: Math.random() * (CANVAS_WIDTH - 80),
      y: -100,
      width: 80,
      height: 40,
      label: template.label,
      type: isPowerup ? 'powerup' : 'obstacle',
      color: template.color,
      speed: 3 + Math.random() * 4
    };

    entitiesRef.current.push(newEntity);
  }, [status]);

  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    // Move Car
    const carSpeed = 8;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
      carXRef.current = Math.max(0, carXRef.current - carSpeed);
    }
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
      carXRef.current = Math.min(CANVAS_WIDTH - CAR_WIDTH, carXRef.current + carSpeed);
    }
    setCarX(carXRef.current);

    // Scroll Road
    roadOffset.current = (roadOffset.current + ROAD_SPEED_BASE) % 100;

    // Update Entities
    const currentEntities = [...entitiesRef.current];
    const nextEntities: Entity[] = [];
    
    for (const entity of currentEntities) {
      entity.y += entity.speed;

      // Collision Detection
      const carRect = { x: carXRef.current, y: CANVAS_HEIGHT - 120, w: CAR_WIDTH, h: CAR_HEIGHT };
      const entityRect = { x: entity.x, y: entity.y, w: entity.width, h: entity.height };

      if (
        carRect.x < entityRect.x + entityRect.w &&
        carRect.x + carRect.w > entityRect.x &&
        carRect.y < entityRect.y + entityRect.h &&
        carRect.y + carRect.h > entityRect.y
      ) {
        // Impact
        if (entity.type === 'powerup') {
          const powerupDef = POWERUPS.find(p => p.label === entity.label);
          onUpdate({ score: 100, health: powerupDef?.impact || 5, progress: 50 });
        } else {
          const obstacleDef = OBSTACLES.find(o => o.label === entity.label);
          onUpdate({ score: -50, health: obstacleDef?.impact || -10, progress: 10 });
        }
        // Entity consumed
        continue;
      }

      if (entity.y < CANVAS_HEIGHT) {
        nextEntities.push(entity);
      }
    }
    
    entitiesRef.current = nextEntities;
    setEntities(nextEntities);

    // Progress naturally
    onUpdate({ progress: 2 });

    // Spawn new entities
    if (Math.random() < 0.02) {
      spawnEntity();
    }

    requestRef.current = requestAnimationFrame(update);
  }, [status, onUpdate, spawnEntity]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      entitiesRef.current = [];
      setEntities([]);
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, update]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Road Lines
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([40, 40]);
    ctx.lineWidth = 4;
    ctx.lineDashOffset = -roadOffset.current * 2;
    
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 0, CANVAS_WIDTH - 10, CANVAS_HEIGHT);

    // Draw Car
    const carY = CANVAS_HEIGHT - 120;
    ctx.fillStyle = '#ef4444';
    // Car body shadow
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    
    // Draw neon effect for player car
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(carX, carY, CAR_WIDTH, CAR_HEIGHT);
    
    // Car details
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(carX + 5, carY + 15, CAR_WIDTH - 10, 20); // Windshield
    ctx.fillStyle = '#facc15';
    ctx.fillRect(carX + 5, carY + 5, 10, 5); // Headlight L
    ctx.fillRect(carX + CAR_WIDTH - 15, carY + 5, 10, 5); // Headlight R
    
    ctx.shadowBlur = 0;

    // Draw Entities
    entitiesRef.current.forEach(entity => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = entity.color;
      
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.roundRect(entity.x, entity.y, entity.width, entity.height, 8);
      ctx.fill();

      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = '20px "Noto Nastaliq Urdu"';
      ctx.textAlign = 'center';
      ctx.fillText(entity.label, entity.x + entity.width / 2, entity.y + entity.height / 2 + 8);
    });

  }, [carX]);

  useEffect(() => {
    const render = () => {
      draw();
      if (status === GameStatus.PLAYING) {
        requestRef.current = requestAnimationFrame(render);
      }
    };
    render();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [draw, status]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="bg-slate-900 rounded shadow-inner"
    />
  );
};

export default GameCanvas;
