
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { 
  LANE_X,
  LANE_WIDTH,
  ROAD_SPEED_BASE, 
  BAD_ITEMS, 
  GOOD_ITEMS,
  MOTIVATIONAL_QUOTE 
} from '../constants';
import { GameStatus, GameState } from '../types';

interface GameSceneProps {
  status: GameStatus;
  onUpdate: (stats: Partial<GameState>) => void;
}

const GameScene: React.FC<GameSceneProps> = ({ status, onUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef(status);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    car: THREE.Group;
    road: THREE.Mesh;
    items: THREE.Group[];
    laneMarkers: THREE.Group;
    targetLane: number;
    clock: THREE.Clock;
    speed: number;
  } | null>(null);

  // Sync status to ref for event listener access
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Helper to create Urdu text textures
  const createUrduTexture = (text: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.font = 'bold 64px "Noto Nastaliq Urdu"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.Fog(0x020205, 10, 80);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 1, -5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pointLight = new THREE.PointLight(0x3b82f6, 20, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Stylized 3D Car
    const car = new THREE.Group();
    const bodyGeom = new THREE.BoxGeometry(1.4, 0.6, 2.8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, shininess: 100 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5;
    car.add(body);

    const cabinGeom = new THREE.BoxGeometry(1.1, 0.5, 1.3);
    const cabinMat = new THREE.MeshPhongMaterial({ color: 0x0f172a });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.y = 1.0;
    cabin.position.z = -0.1;
    car.add(cabin);

    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 24);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    [[-0.8, 0.35, 0.9], [0.8, 0.35, 0.9], [-0.8, 0.35, -0.9], [0.8, 0.35, -0.9]].forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      car.add(wheel);
    });

    scene.add(car);

    // Road
    const roadGeom = new THREE.PlaneGeometry(15, 2000);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -500;
    scene.add(road);

    // Lane Markers
    const laneMarkers = new THREE.Group();
    for (let i = 0; i < 25; i++) {
      const markerGeom = new THREE.PlaneGeometry(0.15, 4);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach(x => {
        const m = new THREE.Mesh(markerGeom, markerMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, 0.01, -i * 12);
        laneMarkers.add(m);
      });
    }
    scene.add(laneMarkers);

    sceneRef.current = {
      scene, camera, renderer, car, road, laneMarkers,
      items: [], targetLane: 1, clock: new THREE.Clock(), speed: ROAD_SPEED_BASE
    };

    // Events
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key, 'Game Status:', statusRef.current);
      if (statusRef.current !== GameStatus.PLAYING) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        sceneRef.current!.targetLane = Math.max(0, sceneRef.current!.targetLane - 1);
        console.log('Target Lane:', sceneRef.current!.targetLane);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        sceneRef.current!.targetLane = Math.min(2, sceneRef.current!.targetLane + 1);
        console.log('Target Lane:', sceneRef.current!.targetLane);
      }
    };

    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (statusRef.current !== GameStatus.PLAYING) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 20) {
        if (diff > 0) sceneRef.current!.targetLane = Math.min(2, sceneRef.current!.targetLane + 1);
        else sceneRef.current!.targetLane = Math.max(0, sceneRef.current!.targetLane - 1);
        console.log('Swipe Target Lane:', sceneRef.current!.targetLane);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || status !== GameStatus.PLAYING) return;

    let frameId: number;
    let spawnTimer = 0;

    const animate = () => {
      const state = sceneRef.current;
      if (!state) return;
      const { scene, camera, renderer, car, laneMarkers, items, targetLane, clock, speed } = state;
      const delta = clock.getDelta();
      frameId = requestAnimationFrame(animate);

      // 1. Smooth Car Movement
      const targetX = LANE_X[targetLane];
      const lerpSpeed = 0.12;
      car.position.x += (targetX - car.position.x) * lerpSpeed;
      car.rotation.z = (car.position.x - targetX) * 0.15; // Body roll on turns
      car.rotation.y = (targetX - car.position.x) * 0.05; // Steering angle

      // 2. Road Animation
      laneMarkers.children.forEach(m => {
        m.position.z += speed * 80 * delta;
        if (m.position.z > 15) m.position.z -= 150;
      });

      // 3. Spawning
      spawnTimer += delta;
      if (spawnTimer > 1.0) {
        const isGood = Math.random() > 0.45;
        const template = isGood 
          ? GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)]
          : BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];

        const texture = createUrduTexture(template.label, template.color);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(5, 1.25, 1);
        
        const laneIdx = Math.floor(Math.random() * 3);
        sprite.position.set(LANE_X[laneIdx], 1.5, -120);
        (sprite as any).userData = { type: isGood ? 'good' : 'bad' };
        
        scene.add(sprite);
        items.push(sprite as any);
        spawnTimer = 0;
      }

      // 4. Collision & Cleanup
      const currentItems = [...items];
      currentItems.forEach((item, idx) => {
        item.position.z += speed * 90 * delta;

        // Collision Check (Bounding Box approach)
        const carBounds = new THREE.Box3().setFromObject(car);
        const itemBounds = new THREE.Box3().setFromObject(item);
        
        // Shrink item bounds slightly for fairer gameplay
        itemBounds.min.x += 0.5;
        itemBounds.max.x -= 0.5;

        if (carBounds.intersectsBox(itemBounds)) {
          if ((item as any).userData.type === 'good') {
            onUpdate({ score: 10, progress: 150 });
          } else {
            console.log('CRASH! Hit:', (item as any).userData.type);
            onUpdate({ health: -100 });
            car.position.y += 0.2; // Small bump
          }
          scene.remove(item);
          items.splice(items.indexOf(item), 1);
        } else if (item.position.z > 20) {
          scene.remove(item);
          items.splice(items.indexOf(item), 1);
        }
      });

      onUpdate({ progress: 15 });
      
      // Dynamic camera field of view based on lane position
      camera.position.x += (car.position.x * 0.2 - camera.position.x) * 0.05;
      camera.lookAt(car.position.x * 0.5, 1, -5);

      renderer.render(scene, camera);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, [status, onUpdate]);

  return <div ref={containerRef} className="w-full h-full touch-none" />;
};

export default GameScene;
