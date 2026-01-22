
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  CAR_WIDTH, 
  CAR_HEIGHT, 
  ROAD_SPEED_BASE, 
  BAD_ITEMS, 
  GOOD_ITEMS,
  ASSETS
} from '../constants';
import { GameStatus, Entity, GameState } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  onUpdate: (stats: Partial<GameState>) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const carImgRef = useRef<HTMLImageElement | null>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  const carXRef = useRef(CANVAS_WIDTH / 2 - CAR_WIDTH / 2);
  const entitiesRef = useRef<Entity[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const roadOffset = useRef(0);

  // Asset Loading
  useEffect(() => {
    const img = new Image();
    img.src = ASSETS.CAR_IMAGE;
    img.onload = () => {
      carImgRef.current = img;
      setAssetsLoaded(true);
    };
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current[e.key] = false;
    
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const touchX = (touch.clientX - rect.left) * scaleX;
        carXRef.current = Math.min(Math.max(0, touchX - CAR_WIDTH / 2), CANVAS_WIDTH - CAR_WIDTH);
      }
      if (status === GameStatus.PLAYING) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouch, { passive: false });
    window.addEventListener('touchmove', handleTouch, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, [status]);

  const spawnEntity = useCallback(() => {
    const isGood = Math.random() > 0.4;
    const template = isGood 
      ? GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)]
      : BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];

    const newEntity: Entity = {
      x: 50 + Math.random() * (CANVAS_WIDTH - 150),
      y: -100,
      width: 100,
      height: 40,
      label: template.label,
      type: isGood ? 'powerup' : 'obstacle',
      color: template.color,
      speed: 6 + Math.random() * 5
    };

    entitiesRef.current.push(newEntity);
  }, []);

  const gameLoop = useCallback(() => {
    if (status !== GameStatus.PLAYING || !assetsLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Movement
    const speed = 10;
    if (keysPressed.current['ArrowLeft']) carXRef.current = Math.max(0, carXRef.current - speed);
    if (keysPressed.current['ArrowRight']) carXRef.current = Math.min(CANVAS_WIDTH - CAR_WIDTH, carXRef.current + speed);

    roadOffset.current = (roadOffset.current + ROAD_SPEED_BASE) % 100;

    const nextEntities: Entity[] = [];
    let stats: Partial<GameState> = { progress: 5 };

    const carRect = { x: carXRef.current + 10, y: CANVAS_HEIGHT - 160, w: CAR_WIDTH - 20, h: CAR_HEIGHT - 20 };

    for (const entity of entitiesRef.current) {
      entity.y += entity.speed;

      if (
        carRect.x < entity.x + entity.width - 20 &&
        carRect.x + carRect.w > entity.x + 20 &&
        carRect.y < entity.y + entity.height &&
        carRect.y + carRect.h > entity.y
      ) {
        if (entity.type === 'powerup') {
          stats.score = (stats.score || 0) + 10;
          stats.progress = (stats.progress || 0) + 100;
        } else {
          // Instant Game Over on Bad Item hit
          stats.health = -100;
        }
        continue;
      }

      if (entity.y < CANVAS_HEIGHT) {
        nextEntities.push(entity);
      }
    }
    
    entitiesRef.current = nextEntities;
    onUpdate(stats);

    if (Math.random() < 0.03) spawnEntity();

    // Drawing
    ctx.fillStyle = '#27272a'; // Road Dark Grey
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Lane Lines
    ctx.strokeStyle = 'white';
    ctx.setLineDash([60, 40]);
    ctx.lineWidth = 4;
    ctx.lineDashOffset = -roadOffset.current * 4;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();

    // Side Borders
    ctx.setLineDash([]);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, 0, 20, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 20, 0, 20, CANVAS_HEIGHT);

    // Items
    entitiesRef.current.forEach(item => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = item.color;
      ctx.fillStyle = item.color;
      ctx.font = 'bold 24px "Noto Nastaliq Urdu"';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height / 2);
      ctx.shadowBlur = 0;
    });

    // Player Car
    if (carImgRef.current) {
      ctx.save();
      // Apply subtle tilt on movement
      let tilt = 0;
      if (keysPressed.current['ArrowLeft']) tilt = -0.05;
      if (keysPressed.current['ArrowRight']) tilt = 0.05;
      
      ctx.translate(carXRef.current + CAR_WIDTH/2, CANVAS_HEIGHT - 160 + CAR_HEIGHT/2);
      ctx.rotate(tilt);
      
      // Car Shadow
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'black';
      
      ctx.drawImage(
        carImgRef.current, 
        -CAR_WIDTH/2, -CAR_HEIGHT/2, 
        CAR_WIDTH, CAR_HEIGHT
      );
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [status, assetsLoaded, onUpdate, spawnEntity]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && assetsLoaded) {
      entitiesRef.current = [];
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, assetsLoaded, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full"
    />
  );
};

export default GameCanvas;
