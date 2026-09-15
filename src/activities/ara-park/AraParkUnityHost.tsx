import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useActivity } from '../foundation/ActivityContext';

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
}

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;
const PLAYER_SPEED = 3;
const VOICE_RANGE = 150;
const VOICE_FADE_START = 100;

const BOT_NAMES = ['Luna', 'Max', 'Sofi', 'Leo', 'Maya', 'Kai', 'Nina', 'Ravi'];
const BOT_COLORS = ['#f472b6', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399', '#fb923c', '#f87171', '#2dd4bf'];

function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calculateVoiceVolume(dist: number): number {
  if (dist > VOICE_RANGE) return 0;
  if (dist < VOICE_FADE_START) return 1;
  return 1 - (dist - VOICE_FADE_START) / (VOICE_RANGE - VOICE_FADE_START);
}

export function AraParkUnityHost() {
  const { setStatus, sendBridgeEvent, updateMetrics, closeActivity } = useActivity();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<Position>({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  const playerDirectionRef = useRef<'left' | 'right' | 'up' | 'down'>('down');
  const botsRef = useRef<Player[]>([]);
  const frameRef = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const animFrameRef = useRef<number>(0);

  // Initialize bots
  useEffect(() => {
    const bots: Player[] = BOT_NAMES.slice(0, 5).map((name, i) => ({
      id: `bot-${i}`,
      name,
      position: {
        x: 200 + Math.random() * (MAP_WIDTH - 400),
        y: 200 + Math.random() * (MAP_HEIGHT - 400),
      },
      color: BOT_COLORS[i],
      speaking: Math.random() > 0.6,
      direction: (['left', 'right', 'up', 'down'] as const)[Math.floor(Math.random() * 4)],
      moving: true,
    }));
    botsRef.current = bots;
  }, []);

  // Simulate loading
  useEffect(() => {
    setStatus('loading');
    sendBridgeEvent({ type: 'UNITY_LOAD_START', source: 'unity' });

    const timer = setTimeout(() => {
      setLoaded(true);
      setStatus('ready');
      sendBridgeEvent({ type: 'UNITY_LOAD_COMPLETE', source: 'unity' });
      sendBridgeEvent({ type: 'WORLD_READY', source: 'unity', payload: { width: MAP_WIDTH, height: MAP_HEIGHT } });
    }, 1500);

    return () => clearTimeout(timer);
  }, [setStatus, sendBridgeEvent]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
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

    const keys = keysRef.current;
    const player = playerRef.current;
    let moving = false;

    // Movement
    if (keys.has('w') || keys.has('arrowup')) { player.y -= PLAYER_SPEED; playerDirectionRef.current = 'up'; moving = true; }
    if (keys.has('s') || keys.has('arrowdown')) { player.y += PLAYER_SPEED; playerDirectionRef.current = 'down'; moving = true; }
    if (keys.has('a') || keys.has('arrowleft')) { player.x -= PLAYER_SPEED; playerDirectionRef.current = 'left'; moving = true; }
    if (keys.has('d') || keys.has('arrowright')) { player.x += PLAYER_SPEED; playerDirectionRef.current = 'right'; moving = true; }

    // Clamp
    player.x = Math.max(20, Math.min(MAP_WIDTH - 20, player.x));
    player.y = Math.max(20, Math.min(MAP_HEIGHT - 20, player.y));

    // Move bots
    botsRef.current.forEach(bot => {
      if (Math.random() < 0.02) {
        bot.direction = (['left', 'right', 'up', 'down'] as const)[Math.floor(Math.random() * 4)];
      }
      if (Math.random() < 0.005) bot.moving = !bot.moving;
      if (Math.random() < 0.01) bot.speaking = !bot.speaking;

      if (bot.moving) {
        const speed = 1.2;
        switch (bot.direction) {
          case 'up': bot.position.y -= speed; break;
          case 'down': bot.position.y += speed; break;
          case 'left': bot.position.x -= speed; break;
          case 'right': bot.position.x += speed; break;
        }
        bot.position.x = Math.max(30, Math.min(MAP_WIDTH - 30, bot.position.x));
        bot.position.y = Math.max(30, Math.min(MAP_HEIGHT - 30, bot.position.y));
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
        messagesPerSecond: Math.round(20 + Math.random() * 10),
        rxBytes: Math.round(1024 + Math.random() * 512),
        txBytes: Math.round(256 + Math.random() * 128),
        ping: Math.round(20 + Math.random() * 30),
      });
    }

    // === RENDER ===
    // Background
    ctx.fillStyle = '#1a2e1a';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Grid
    ctx.strokeStyle = '#2a4a2a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < MAP_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < MAP_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_WIDTH, y);
      ctx.stroke();
    }

    // Decorative elements (trees, flowers)
    const decorations = [
      { x: 100, y: 100, type: 'tree' },
      { x: 300, y: 150, type: 'tree' },
      { x: 800, y: 200, type: 'tree' },
      { x: 1000, y: 600, type: 'tree' },
      { x: 150, y: 500, type: 'flower' },
      { x: 600, y: 400, type: 'flower' },
      { x: 900, y: 300, type: 'flower' },
      { x: 400, y: 650, type: 'bench' },
      { x: 700, y: 100, type: 'bench' },
    ];

    decorations.forEach(dec => {
      if (dec.type === 'tree') {
        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a3a1a';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'flower') {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'bench') {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(dec.x - 15, dec.y - 5, 30, 10);
        ctx.fillStyle = '#6b3a1b';
        ctx.fillRect(dec.x - 12, dec.y + 5, 4, 8);
        ctx.fillRect(dec.x + 8, dec.y + 5, 4, 8);
      }
    });

    // Voice range visualization
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, VOICE_RANGE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, VOICE_FADE_START, 0, Math.PI * 2);
    ctx.stroke();

    // Draw bots
    botsRef.current.forEach(bot => {
      const dist = distance(player, bot.position);
      const vol = calculateVoiceVolume(dist);
      const inRange = dist < VOICE_RANGE;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(bot.position.x, bot.position.y + 14, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = bot.color;
      ctx.beginPath();
      ctx.arc(bot.position.x, bot.position.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Face direction indicator
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      const eyeOffset = 4;
      switch (bot.direction) {
        case 'up': ctx.beginPath(); ctx.arc(bot.position.x - 3, bot.position.y - eyeOffset, 2, 0, Math.PI * 2); ctx.arc(bot.position.x + 3, bot.position.y - eyeOffset, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'down': ctx.beginPath(); ctx.arc(bot.position.x - 3, bot.position.y + eyeOffset, 2, 0, Math.PI * 2); ctx.arc(bot.position.x + 3, bot.position.y + eyeOffset, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'left': ctx.beginPath(); ctx.arc(bot.position.x - eyeOffset, bot.position.y - 2, 2, 0, Math.PI * 2); ctx.arc(bot.position.x - eyeOffset, bot.position.y + 2, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'right': ctx.beginPath(); ctx.arc(bot.position.x + eyeOffset, bot.position.y - 2, 2, 0, Math.PI * 2); ctx.arc(bot.position.x + eyeOffset, bot.position.y + 2, 2, 0, Math.PI * 2); ctx.fill(); break;
      }

      // Speaking indicator
      if (bot.speaking && inRange) {
        ctx.strokeStyle = `rgba(34, 197, 94, ${vol * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bot.position.x, bot.position.y, 16 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Name tag
      ctx.fillStyle = inRange ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bot.name, bot.position.x, bot.position.y - 18);

      // Volume bar
      if (inRange && bot.speaking) {
        const barWidth = 24;
        const barHeight = 3;
        const barX = bot.position.x - barWidth / 2;
        const barY = bot.position.y - 26;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = `rgba(34, 197, 94, ${vol})`;
        ctx.fillRect(barX, barY, barWidth * vol, barHeight);
      }
    });

    // Draw player
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 14, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Player outline
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Player face
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const pEyeOffset = 4;
    switch (playerDirectionRef.current) {
      case 'up':
        ctx.beginPath(); ctx.arc(player.x - 4, player.y - pEyeOffset, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + 4, player.y - pEyeOffset, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'down':
        ctx.beginPath(); ctx.arc(player.x - 4, player.y + pEyeOffset, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + 4, player.y + pEyeOffset, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'left':
        ctx.beginPath(); ctx.arc(player.x - pEyeOffset, player.y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x - pEyeOffset, player.y + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'right':
        ctx.beginPath(); ctx.arc(player.x + pEyeOffset, player.y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + pEyeOffset, player.y + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
    }

    // Mic indicator on player
    if (micActive) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(player.x + 12, player.y - 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎤', player.x + 12, player.y - 9);
    }

    // Player name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Você', player.x, player.y - 20);

    // Movement indicator
    if (moving) {
      sendBridgeEvent({
        type: 'PLAYER_MOVE',
        source: 'unity',
        payload: { x: Math.round(player.x), y: Math.round(player.y) },
      });
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [sendBridgeEvent, updateMetrics, micActive]);

  useEffect(() => {
    if (!loaded) return;
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [loaded, gameLoop]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full"
        />
        <p className="mt-4 text-green-400 text-sm">Carregando Unity WebGL...</p>
        <p className="text-gray-500 text-xs mt-1">Inicializando mundo</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-lg">🌳</span>
          <span className="text-white font-medium text-sm">Ara Park</span>
          <span className="text-gray-500 text-xs">|</span>
          <span className="text-gray-400 text-xs">
            Célula: {Math.floor(playerRef.current.x / 200)},{Math.floor(playerRef.current.y / 200)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMicActive(!micActive)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              micActive
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {micActive ? '🎤 Mic ON' : '🔇 Mic OFF'}
          </button>
          <span className="text-gray-500 text-xs">
            Voz: {voiceUsers} perto
          </span>
          <button
            onClick={closeActivity}
            className="px-3 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-950">
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="max-w-full max-h-full border border-gray-800 rounded-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Bottom info */}
      <div className="px-4 py-2 bg-gray-900/80 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>WASD para mover</span>
          <span>•</span>
          <span>VOI_RANGE: {VOICE_RANGE}px</span>
          <span>•</span>
          <span>FADE_START: {VOICE_FADE_START}px</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Unity WebGL (simulado)</span>
        </div>
      </div>
    </div>
  );
}
