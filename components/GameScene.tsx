
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
  const touchXRef = useRef<number | null>(null);
  
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    car: THREE.Group;
    road: THREE.Mesh;
    items: THREE.Group[];
    laneMarkers: THREE.Group;
    targetLane: number;
    targetX: number; // For smooth drag positioning
    clock: THREE.Clock;
    speed: number;
  } | null>(null);

  // Sync status to ref for event listener access
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Helper to create readable Urdu text textures
  const createUrduTexture = (text: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 1. Background for readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect ? ctx.roundRect(10, 10, 492, 140, 30) : ctx.rect(10, 10, 492, 140);
    ctx.fill();
    
    // 2. Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();

    // 3. Glowing Text
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'white'; // White text for maximum contrast
    ctx.font = 'bold 70px "Noto Nastaliq Urdu"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.Fog(0x050508, 15, 100);

    // 3. Camera Position: Slightly higher and further back
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 1. Better Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 10, 5);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x3b82f6, 1, 20);
    rimLight.position.set(-5, 5, 2);
    scene.add(rimLight);

    // Stylized 3D Car
    const car = new THREE.Group();
    // 1. Car material: bright red StandardMaterial
    const carMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, 
      metalness: 0.6, 
      roughness: 0.2,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });

    const bodyGeom = new THREE.BoxGeometry(1.5, 0.6, 3.0);
    const body = new THREE.Mesh(bodyGeom, carMaterial);
    body.position.y = 0.5;
    car.add(body);

    const cabinGeom = new THREE.BoxGeometry(1.2, 0.6, 1.5);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.y = 1.0;
    cabin.position.z = -0.1;
    car.add(cabin);

    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 });
    [[-0.85, 0.35, 1.0], [0.85, 0.35, 1.0], [-0.85, 0.35, -1.0], [0.85, 0.35, -1.0]].forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      car.add(wheel);
    });

    scene.add(car);

    // Road
    const roadGeom = new THREE.PlaneGeometry(16, 2000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -500;
    scene.add(road);

    // Lane Markers
    const laneMarkers = new THREE.Group();
    for (let i = 0; i < 30; i++) {
      const markerGeom = new THREE.PlaneGeometry(0.2, 5);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [-LANE_WIDTH / 2, LANE_WIDTH / 2].forEach(x => {
        const m = new THREE.Mesh(markerGeom, markerMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, 0.01, -i * 15);
        laneMarkers.add(m);
      });
    }
    scene.add(laneMarkers);

    sceneRef.current = {
      scene, camera, renderer, car, road, laneMarkers,
      items: [], targetLane: 1, targetX: 0, clock: new THREE.Clock(), speed: ROAD_SPEED_BASE
    };

    // Events
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== GameStatus.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        sceneRef.current!.targetLane = Math.max(0, sceneRef.current!.targetLane - 1);
        sceneRef.current!.targetX = LANE_X[sceneRef.current!.targetLane];
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        sceneRef.current!.targetLane = Math.min(2, sceneRef.current!.targetLane + 1);
        sceneRef.current!.targetX = LANE_X[sceneRef.current!.targetLane];
      }
    };

    // 2. Touch Controls: Smooth drag system
    const handleTouchMove = (e: TouchEvent) => {
      if (statusRef.current !== GameStatus.PLAYING) return;
      const clientX = e.touches[0].clientX;
      const percent = clientX / window.innerWidth;
      // Map 0-1 range to lane boundary range (approx -5 to 5 for better playability)
      const worldX = (percent * 2 - 1) * (LANE_WIDTH * 1.5);
      sceneRef.current!.targetX = Math.max(-6, Math.min(6, worldX));
      e.preventDefault();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchmove', handleTouchMove);
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
      const { scene, camera, renderer, car, laneMarkers, items, targetX, clock, speed } = state;
      const delta = clock.getDelta();
      frameId = requestAnimationFrame(animate);

      // 1. Smooth Car Movement using targetX
      const lerpFactor = 0.15;
      car.position.x += (targetX - car.position.x) * lerpFactor;
      car.rotation.z = (car.position.x - targetX) * 0.2; // Body roll
      car.rotation.y = (targetX - car.position.x) * 0.1; // Slight steer look

      // 2. Road Animation
      laneMarkers.children.forEach(m => {
        m.position.z += speed * 90 * delta;
        if (m.position.z > 20) m.position.z -= 200;
      });

      // 3. Spawning
      spawnTimer += delta;
      if (spawnTimer > 1.0) {
        const isGood = Math.random() > 0.4;
        const template = isGood 
          ? GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)]
          : BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];

        const texture = createUrduTexture(template.label, template.color);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(6, 1.8, 1); // Larger labels
        
        const laneIdx = Math.floor(Math.random() * 3);
        sprite.position.set(LANE_X[laneIdx], 1.2, -150);
        (sprite as any).userData = { type: isGood ? 'good' : 'bad' };
        
        scene.add(sprite);
        items.push(sprite as any);
        spawnTimer = 0;
      }

      // 4. Collision & Cleanup
      const currentItems = [...items];
      currentItems.forEach((item) => {
        item.position.z += speed * 100 * delta;

        // Collision Check
        const carBox = new THREE.Box3().setFromObject(car);
        const itemBox = new THREE.Box3().setFromObject(item);
        
        // Fairer hitbox for items
        itemBox.min.x += 1.0;
        itemBox.max.x -= 1.0;
        itemBox.min.y += 0.5;

        if (carBox.intersectsBox(itemBox)) {
          if ((item as any).userData.type === 'good') {
            onUpdate({ score: 10, progress: 200 });
          } else {
            onUpdate({ health: -100 });
          }
          scene.remove(item);
          items.splice(items.indexOf(item), 1);
        } else if (item.position.z > 20) {
          scene.remove(item);
          items.splice(items.indexOf(item), 1);
        }
      });

      onUpdate({ progress: 20 });
      
      // 3. Camera LookAt Logic: Follow car but look ahead
      camera.lookAt(car.position.x * 0.3, 1, -10);
      
      renderer.render(scene, camera);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, [status, onUpdate]);

  return <div ref={containerRef} className="w-full h-full touch-none" />;
};

export default GameScene;
