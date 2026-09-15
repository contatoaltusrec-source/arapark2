import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useActivity } from '../foundation/ActivityContext';
import { WORLD_WIDTH, WORLD_HEIGHT, generateDecorations, getCurrentArea, MAP_AREAS, type MapArea } from './world/MapData';
import { type Camera, type Viewport, updateCamera, renderWorld } from './world/WorldRenderer';

interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  name: string;
  position: Position;
  color: string;
  speaking: boolean;
  direction: 'left' | 'right' | 'up' | 'down';
  moving: boolean;
  targetX?: number;
  targetY?: number;
}

const PLAYER_SPEED = 4;
const VOICE_RANGE = 180;
const VOICE_FADE_START = 120;
const BOT_COUNT = 15;

const BOT_NAMES = ['Luna', 'Max', 'Sofi', 'Leo', 'Maya', 'Kai', 'Nina', 'Ravi', 'Zara', 'Finn', 'Iris', 'Theo', 'Cleo', 'Juno', 'Atlas'];
const BOT_COLORS = ['#f472b6', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399', '#fb923c', '#f87171', '#2dd4bf', '#e879f9', '#818cf8', '#facc15', '#4ade80', '#f97316', '#06b6d4', '#c084fc'];

function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calculateVoiceVolume(dist: number): number {
  if (dist > VOICE_RANGE) return 0;
  if (dist < VOICE_FADE_START) return 1;
  return 1 - (dist - VOICE_FADE_START) / (VOICE_RANGE - VOICE_FADE_START);
}

export function AraParkCanvas() {
  const { sendBridgeEvent, updateMetrics, closeActivity } = useActivity();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<Position>({ x: 1600, y: 1600 });
  const playerDirectionRef = useRef<'left' | 'right' | 'up' | 'down'>('down');
  const cameraRef = useRef<Camera>({ x: 1400, y: 1400, zoom: 1 });
  const viewportRef = useRef<Viewport>({ width: 900, height: 600 });
  const botsRef = useRef<Player[]>([]);
  const decorationsRef = useRef(generateDecorations());
  const frameRef = useRef(0);
  const [voiceUsers, setVoiceUsers] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [currentArea, setCurrentArea] = useState<MapArea | null>(null);
  const [playerCount] = useState(BOT_COUNT + 1);
  const [showMinimap, setShowMinimap] = useState(true);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Initialize bots
  useEffect(() => {
    const bots: Player[] = BOT_NAMES.slice(0, BOT_COUNT).map((name, i) => {
      const area = MAP_AREAS[i % MAP_AREAS.length];
      return {
        id: `bot-${i}`,
        name,
        position: {
          x: area.bounds.x + 50 + Math.random() * (area.bounds.w - 100),
          y: area.bounds.y + 50 + Math.random() * (area.bounds.h - 100),
        },
        color: BOT_COLORS[i],
        speaking: Math.random() > 0.5,
        direction: (['left', 'right', 'up', 'down'] as const)[Math.floor(Math.random() * 4)],
        moving: true,
      };
    });
    botsRef.current = bots;
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      viewportRef.current = { width: rect.width, height: rect.height };
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'm' || e.key === 'M') setShowMinimap(prev => !prev);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current = performance.now();
    const keys = keysRef.current;
    const player = playerRef.current;
    const viewport = viewportRef.current;
    let moving = false;

    // Player movement
    if (keys.has('w') || keys.has('arrowup')) { player.y -= PLAYER_SPEED; playerDirectionRef.current = 'up'; moving = true; }
    if (keys.has('s') || keys.has('arrowdown')) { player.y += PLAYER_SPEED; playerDirectionRef.current = 'down'; moving = true; }
    if (keys.has('a') || keys.has('arrowleft')) { player.x -= PLAYER_SPEED; playerDirectionRef.current = 'left'; moving = true; }
    if (keys.has('d') || keys.has('arrowright')) { player.x += PLAYER_SPEED; playerDirectionRef.current = 'right'; moving = true; }

    player.x = Math.max(20, Math.min(WORLD_WIDTH - 20, player.x));
    player.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, player.y));

    cameraRef.current = updateCamera(cameraRef.current, player.x, player.y, viewport);

    const area = getCurrentArea(player.x, player.y);
    setCurrentArea(area);

    // Move bots
    botsRef.current.forEach(bot => {
      if (Math.random() < 0.01) {
        bot.direction = (['left', 'right', 'up', 'down'] as const)[Math.floor(Math.random() * 4)];
      }
      if (Math.random() < 0.003) bot.moving = !bot.moving;
      if (Math.random() < 0.008) bot.speaking = !bot.speaking;

      if (Math.random() < 0.002 && !bot.targetX) {
        const botArea = getCurrentArea(bot.position.x, bot.position.y) || MAP_AREAS[0];
        bot.targetX = botArea.bounds.x + 50 + Math.random() * (botArea.bounds.w - 100);
        bot.targetY = botArea.bounds.y + 50 + Math.random() * (botArea.bounds.h - 100);
      }

      if (bot.moving) {
        const speed = 1.5;

        if (bot.targetX !== undefined && bot.targetY !== undefined) {
          const dx = bot.targetX - bot.position.x;
          const dy = bot.targetY - bot.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            bot.targetX = undefined;
            bot.targetY = undefined;
          } else {
            bot.position.x += (dx / dist) * speed;
            bot.position.y += (dy / dist) * speed;
            bot.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          }
        } else {
          switch (bot.direction) {
            case 'up': bot.position.y -= speed; break;
            case 'down': bot.position.y += speed; break;
            case 'left': bot.position.x -= speed; break;
            case 'right': bot.position.x += speed; break;
          }
        }

        bot.position.x = Math.max(30, Math.min(WORLD_WIDTH - 30, bot.position.x));
        bot.position.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, bot.position.y));
      }
    });

    // Calculate voice
    let inVoiceRange = 0;
    botsRef.current.forEach(bot => {
      const dist = distance(player, bot.position);
      if (dist < VOICE_RANGE) inVoiceRange++;
    });
    setVoiceUsers(inVoiceRange);

    // Update metrics
    frameRef.current++;
    if (frameRef.current % 30 === 0) {
      const cellX = Math.floor(player.x / 200);
      const cellY = Math.floor(player.y / 200);
      updateMetrics({
        entitiesRendered: botsRef.current.length + 1,
        entitiesKnown: botsRef.current.length + 1,
        voiceUsers: inVoiceRange,
        currentCell: `${cellX},${cellY}`,
        messagesPerSecond: Math.round(30 + Math.random() * 20),
        rxBytes: Math.round(2048 + Math.random() * 1024),
        txBytes: Math.round(512 + Math.random() * 256),
        ping: Math.round(15 + Math.random() * 25),
      });
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderWorld(ctx, cameraRef.current, viewport, decorationsRef.current, timeRef.current);

    // Render players
    ctx.save();
    ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    const cam = cameraRef.current;
    const viewLeft = cam.x;
    const viewTop = cam.y;
    const viewRight = cam.x + viewport.width / cam.zoom;
    const viewBottom = cam.y + viewport.height / cam.zoom;

    botsRef.current.forEach(bot => {
      if (bot.position.x < viewLeft - 50 || bot.position.x > viewRight + 50 ||
          bot.position.y < viewTop - 50 || bot.position.y > viewBottom + 50) return;

      const dist = distance(player, bot.position);
      const vol = calculateVoiceVolume(dist);
      const inRange = dist < VOICE_RANGE;

      drawPlayer(ctx, bot.position.x, bot.position.y, bot.color, bot.name, bot.direction, bot.speaking, inRange, vol, false, timeRef.current);
    });

    drawPlayer(ctx, player.x, player.y, '#22c55e', 'Você', playerDirectionRef.current, false, true, 1, true, timeRef.current);

    // Voice range
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, VOICE_RANGE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Minimap
    if (showMinimap) {
      drawMinimap(ctx, canvas.width, canvas.height, player, botsRef.current);
    }

    if (moving && frameRef.current % 5 === 0) {
      sendBridgeEvent({
        type: 'PLAYER_MOVE',
        source: 'unity',
        payload: { x: Math.round(player.x), y: Math.round(player.y) },
      });
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [sendBridgeEvent, updateMetrics, showMinimap]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 border-b border-gray-800 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg">🌳</span>
          <span className="text-white font-medium text-sm">Ara Park</span>
          {currentArea && (
            <>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: currentArea.color, borderColor: currentArea.color + '40', backgroundColor: currentArea.color + '10' }}>
                {currentArea.icon} {currentArea.name}
              </span>
            </>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Canvas 2D (Fallback)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs hidden md:inline">
            {playerCount} online
          </span>
          <button
            onClick={() => setMicActive(!micActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              micActive
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {micActive ? '🎤 ON' : '🔇 OFF'}
          </button>
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showMinimap
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            🗺️
          </button>
          <button
            onClick={closeActivity}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-950">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {currentArea && (
          <motion.div
            key={currentArea.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentArea.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{currentArea.name}</p>
                <p className="text-gray-400 text-xs">{currentArea.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {voiceUsers > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">
                {voiceUsers} {voiceUsers === 1 ? 'pessoa' : 'pessoas'} perto de você
              </span>
            </div>
          </motion.div>
        )}

        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-gray-900/70 px-3 py-2 rounded-lg backdrop-blur-sm">
          <p>WASD / Setas para mover</p>
          <p>M para minimap</p>
          <p>ESC para sair</p>
        </div>
      </div>
    </div>
  );
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  name: string,
  direction: 'left' | 'right' | 'up' | 'down',
  speaking: boolean,
  inRange: boolean,
  volume: number,
  isMainPlayer: boolean,
  time: number,
) {
  const bobY = isMainPlayer ? 0 : Math.sin(time / 400 + x) * 1.5;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + bobY, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isMainPlayer ? '#16a34a' : 'rgba(0,0,0,0.3)';
  ctx.lineWidth = isMainPlayer ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(x, y + bobY, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  const eyeOffset = 4;
  switch (direction) {
    case 'up':
      ctx.beginPath(); ctx.arc(x - 4, y - eyeOffset + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y - eyeOffset + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'down':
      ctx.beginPath(); ctx.arc(x - 4, y + eyeOffset + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y + eyeOffset + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'left':
      ctx.beginPath(); ctx.arc(x - eyeOffset, y - 2 + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x - eyeOffset, y + 3 + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    case 'right':
      ctx.beginPath(); ctx.arc(x + eyeOffset, y - 2 + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + eyeOffset, y + 3 + bobY, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
  }

  if (speaking && inRange && !isMainPlayer) {
    const pulseSize = 18 + Math.sin(time / 200) * 3;
    ctx.strokeStyle = `rgba(34, 197, 94, ${volume * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + bobY, pulseSize, 0, Math.PI * 2);
    ctx.stroke();

    const barWidth = 28;
    const barHeight = 3;
    const barX = x - barWidth / 2;
    const barY = y - 28 + bobY;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = `rgba(34, 197, 94, ${volume})`;
    ctx.fillRect(barX, barY, barWidth * volume, barHeight);
  }

  ctx.fillStyle = isMainPlayer ? '#fff' : inRange ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
  ctx.font = isMainPlayer ? 'bold 11px monospace' : '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y - 20 + bobY);
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  player: Position,
  bots: Player[],
) {
  const mapSize = 160;
  const mapX = canvasWidth - mapSize - 16;
  const mapY = 16;
  const scale = mapSize / WORLD_WIDTH;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mapX - 4, mapY - 4, mapSize + 8, mapSize + 8, 8);
  ctx.fill();
  ctx.stroke();

  MAP_AREAS.forEach(area => {
    ctx.fillStyle = area.color + '30';
    ctx.fillRect(
      mapX + area.bounds.x * scale,
      mapY + area.bounds.y * scale,
      area.bounds.w * scale,
      area.bounds.h * scale
    );
  });

  bots.forEach(bot => {
    ctx.fillStyle = bot.color;
    ctx.beginPath();
    ctx.arc(mapX + bot.position.x * scale, mapY + bot.position.y * scale, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(mapX + player.x * scale, mapY + player.y * scale, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MAPA', mapX + mapSize / 2, mapY + mapSize + 14);
}
