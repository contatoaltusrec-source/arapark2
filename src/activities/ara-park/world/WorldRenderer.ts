import { WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE, MAP_AREAS, type MapDecoration } from './MapData';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export function updateCamera(camera: Camera, targetX: number, targetY: number, viewport: Viewport): Camera {
  const targetCamX = targetX - viewport.width / 2 / camera.zoom;
  const targetCamY = targetY - viewport.height / 2 / camera.zoom;

  // Smooth follow
  const lerp = 0.08;
  const newX = camera.x + (targetCamX - camera.x) * lerp;
  const newY = camera.y + (targetCamY - camera.y) * lerp;

  // Clamp to world bounds
  const maxX = WORLD_WIDTH - viewport.width / camera.zoom;
  const maxY = WORLD_HEIGHT - viewport.height / camera.zoom;

  return {
    x: Math.max(0, Math.min(maxX, newX)),
    y: Math.max(0, Math.min(maxY, newY)),
    zoom: camera.zoom,
  };
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  viewport: Viewport,
  decorations: MapDecoration[],
  time: number,
) {
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Visible bounds
  const viewLeft = camera.x;
  const viewTop = camera.y;
  const viewRight = camera.x + viewport.width / camera.zoom;
  const viewBottom = camera.y + viewport.height / camera.zoom;
  const margin = 100;

  // Background - base grass
  drawGrassBackground(ctx, camera, viewport);

  // Area overlays
  drawAreaOverlays(ctx, viewLeft, viewTop, viewRight, viewBottom);

  // Paths
  drawPaths(ctx, viewLeft, viewTop, viewRight, viewBottom);

  // Sort decorations by Y for depth
  const visibleDecorations = decorations.filter(d =>
    d.x > viewLeft - margin && d.x < viewRight + margin &&
    d.y > viewTop - margin && d.y < viewBottom + margin
  );

  // Draw decorations
  visibleDecorations.forEach(dec => drawDecoration(ctx, dec, time));

  // Area labels
  drawAreaLabels(ctx, viewLeft, viewTop, viewRight, viewBottom);

  ctx.restore();
}

function drawGrassBackground(ctx: CanvasRenderingContext2D, camera: Camera, viewport: Viewport) {
  const startX = Math.floor(camera.x / TILE_SIZE) * TILE_SIZE;
  const startY = Math.floor(camera.y / TILE_SIZE) * TILE_SIZE;
  const endX = camera.x + viewport.width / camera.zoom + TILE_SIZE;
  const endY = camera.y + viewport.height / camera.zoom + TILE_SIZE;

  for (let x = startX; x < endX; x += TILE_SIZE) {
    for (let y = startY; y < endY; y += TILE_SIZE) {
      if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) continue;

      // Varied grass colors
      const hash = ((x * 73856093) ^ (y * 19349663)) & 0xff;
      const greenBase = 80 + (hash % 40);
      const r = 20 + (hash % 15);
      const g = greenBase;
      const b = 20 + (hash % 15);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // Grass detail
      if (hash % 7 === 0) {
        ctx.fillStyle = `rgba(50, ${greenBase + 30}, 40, 0.4)`;
        ctx.fillRect(x + (hash % 16), y + (hash % 12), 2, 4);
      }
      if (hash % 11 === 0) {
        ctx.fillStyle = `rgba(60, ${greenBase + 20}, 30, 0.3)`;
        ctx.fillRect(x + ((hash * 3) % 20), y + ((hash * 5) % 20), 3, 2);
      }
    }
  }

  // World border
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawAreaOverlays(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number) {
  MAP_AREAS.forEach(area => {
    const { x, y, w, h } = area.bounds;
    if (x + w < vl || x > vr || y + h < vt || y > vb) return;

    // Area background tint
    ctx.fillStyle = area.color + '08';
    ctx.fillRect(x, y, w, h);

    // Area border
    ctx.strokeStyle = area.color + '30';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  });
}

function drawPaths(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number) {
  // Main horizontal path
  const pathY = 1550;
  if (pathY > vt - 60 && pathY < vb + 60) {
    ctx.fillStyle = '#5c4a32';
    ctx.fillRect(Math.max(vl, 0), pathY, Math.min(vr, WORLD_WIDTH) - Math.max(vl, 0), 60);

    // Cobblestone pattern
    for (let px = Math.max(vl, 0); px < Math.min(vr, WORLD_WIDTH); px += 20) {
      const hash = (px * 73) & 0xff;
      ctx.fillStyle = `rgba(80, 65, 45, ${0.3 + (hash % 30) / 100})`;
      ctx.fillRect(px, pathY + (hash % 40), 8, 8);
    }
  }

  // Main vertical path
  const pathX = 1570;
  if (pathX > vl - 60 && pathX < vr + 60) {
    ctx.fillStyle = '#5c4a32';
    ctx.fillRect(pathX, Math.max(vt, 0), 60, Math.min(vb, WORLD_HEIGHT) - Math.max(vt, 0));

    for (let py = Math.max(vt, 0); py < Math.min(vb, WORLD_HEIGHT); py += 20) {
      const hash = (py * 91) & 0xff;
      ctx.fillStyle = `rgba(80, 65, 45, ${0.3 + (hash % 30) / 100})`;
      ctx.fillRect(pathX + (hash % 40), py, 8, 8);
    }
  }

  // Diagonal paths to zones
  drawDiagonalPath(ctx, 1600, 1600, 500, 500, vl, vt, vr, vb);
  drawDiagonalPath(ctx, 1600, 1600, 2700, 500, vl, vt, vr, vb);
  drawDiagonalPath(ctx, 1600, 1600, 500, 2700, vl, vt, vr, vb);
  drawDiagonalPath(ctx, 1600, 1600, 2700, 2700, vl, vt, vr, vb);
}

function drawDiagonalPath(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, vl: number, vt: number, vr: number, vb: number) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  if (maxX < vl || minX > vr || maxY < vt || minY > vb) return;

  ctx.strokeStyle = '#5c4a32';
  ctx.lineWidth = 40;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawDecoration(ctx: CanvasRenderingContext2D, dec: MapDecoration, time: number) {
  ctx.save();
  ctx.translate(dec.x, dec.y);

  switch (dec.type) {
    case 'tree':
      drawTree(ctx, dec.variant || 0, time);
      break;
    case 'flower':
      drawFlower(ctx, dec.variant || 0, time);
      break;
    case 'bush':
      drawBush(ctx, dec.variant || 0);
      break;
    case 'rock':
      drawRock(ctx, dec.variant || 0);
      break;
    case 'bench':
      drawBench(ctx, dec.variant || 0);
      break;
    case 'lamp':
      drawLamp(ctx, time);
      break;
    case 'fountain':
      drawFountain(ctx, time);
      break;
    case 'stage':
      drawStage(ctx);
      break;
    case 'tent':
      drawTent(ctx, dec.variant || 0);
      break;
    case 'house':
      drawHouse(ctx, dec.variant || 0);
      break;
    case 'pond':
      drawPond(ctx, time);
      break;
    case 'crystal':
      drawCrystal(ctx, dec.variant || 0, time);
      break;
    case 'mushroom':
      drawMushroom(ctx, dec.variant || 0);
      break;
    case 'sign':
      drawSign(ctx, dec.variant || 0);
      break;
    case 'bridge':
      drawBridge(ctx);
      break;
  }

  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const sway = Math.sin(time / 1000 + variant) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#5c3a1a';
  ctx.fillRect(-4, -5, 8, 22);

  // Canopy
  ctx.save();
  ctx.translate(sway, 0);

  if (variant === 0) {
    // Oak
    ctx.fillStyle = '#2d6b2d';
    ctx.beginPath();
    ctx.arc(0, -18, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a5a1a';
    ctx.beginPath();
    ctx.arc(-5, -22, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d8b3d';
    ctx.beginPath();
    ctx.arc(6, -15, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 1) {
    // Pine
    ctx.fillStyle = '#1a5a2a';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(-16, -5);
    ctx.lineTo(16, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a7a3a';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-12, -10);
    ctx.lineTo(12, -10);
    ctx.closePath();
    ctx.fill();
  } else if (variant === 2) {
    // Round tree
    ctx.fillStyle = '#3d7b3d';
    ctx.beginPath();
    ctx.arc(0, -15, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d9b5d';
    ctx.beginPath();
    ctx.arc(4, -20, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Palm-like
    ctx.fillStyle = '#2d8b3d';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 12, -20 + Math.sin(angle) * 8, 14, 6, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawFlower(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const bob = Math.sin(time / 800 + variant * 2) * 1;

  const colors = ['#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#f87171'];
  const color = colors[variant % colors.length];

  // Stem
  ctx.strokeStyle = '#2d6b2d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -4 + bob);
  ctx.stroke();

  // Petals
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -6 + bob, 4, 0, Math.PI * 2);
  ctx.fill();

  // Center
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -6 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(ctx: CanvasRenderingContext2D, variant: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const greens = ['#2d6b2d', '#3d7b3d', '#1a5a1a'];
  ctx.fillStyle = greens[variant % 3];
  ctx.beginPath();
  ctx.arc(-6, -2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4d8b4d';
  ctx.beginPath();
  ctx.arc(0, -6, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, variant: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const grays = ['#6b7280', '#4b5563', '#9ca3af'];
  ctx.fillStyle = grays[variant % 3];
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-8, -6);
  ctx.lineTo(0, -10);
  ctx.lineTo(8, -6);
  ctx.lineTo(10, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(0, -8);
  ctx.lineTo(4, -6);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
}

function drawBench(ctx: CanvasRenderingContext2D, variant: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-18, 6, 36, 6);

  // Seat
  ctx.fillStyle = variant === 0 ? '#8b5a2b' : '#6b4a1b';
  ctx.fillRect(-16, -2, 32, 8);

  // Legs
  ctx.fillStyle = '#4a3a1a';
  ctx.fillRect(-14, 6, 4, 8);
  ctx.fillRect(10, 6, 4, 8);

  // Back
  ctx.fillStyle = variant === 0 ? '#7b4a1b' : '#5b3a0b';
  ctx.fillRect(-16, -8, 32, 6);
}

function drawLamp(ctx: CanvasRenderingContext2D, time: number) {
  // Post
  ctx.fillStyle = '#374151';
  ctx.fillRect(-2, -20, 4, 30);

  // Light glow
  const glowIntensity = 0.3 + Math.sin(time / 2000) * 0.1;
  const gradient = ctx.createRadialGradient(0, -22, 2, 0, -22, 30);
  gradient.addColorStop(0, `rgba(251, 191, 36, ${glowIntensity})`);
  gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, -22, 30, 0, Math.PI * 2);
  ctx.fill();

  // Lamp head
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -22, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFountain(ctx: CanvasRenderingContext2D, time: number) {
  // Base shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 50, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base pool
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.ellipse(0, 10, 45, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water surface
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.ellipse(0, 8, 40, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water ripples
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)';
  ctx.lineWidth = 1;
  const ripple = (time / 500) % 3;
  for (let i = 0; i < 3; i++) {
    const r = 10 + ((ripple + i) % 3) * 12;
    ctx.beginPath();
    ctx.ellipse(0, 8, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center column
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(-6, -20, 12, 30);

  // Top basin
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.ellipse(0, -20, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water spray
  ctx.fillStyle = 'rgba(147, 197, 253, 0.6)';
  const spray = Math.sin(time / 300) * 3;
  ctx.beginPath();
  ctx.arc(0, -28 + spray, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3, -24 + spray, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -24 + spray, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawStage(ctx: CanvasRenderingContext2D) {
  // Platform
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(-80, -10, 160, 60);

  // Stage floor
  ctx.fillStyle = '#6b5a3a';
  ctx.fillRect(-75, -5, 150, 50);

  // Back wall
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-80, -40, 160, 30);

  // Curtains
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-80, -40, 20, 50);
  ctx.fillRect(60, -40, 20, 50);

  // Spotlights
  ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.beginPath();
  ctx.moveTo(-40, -40);
  ctx.lineTo(-60, 30);
  ctx.lineTo(-20, 30);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(40, -40);
  ctx.lineTo(20, 30);
  ctx.lineTo(60, 30);
  ctx.closePath();
  ctx.fill();
}

function drawTent(ctx: CanvasRenderingContext2D, variant: number) {
  const colors = ['#dc2626', '#2563eb', '#16a34a'];
  const color = colors[variant % 3];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 35, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tent body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(-30, 15);
  ctx.lineTo(30, 15);
  ctx.closePath();
  ctx.fill();

  // Stripes
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(-10, -15);
  ctx.lineTo(-20, 15);
  ctx.lineTo(-10, 15);
  ctx.lineTo(0, -15);
  ctx.closePath();
  ctx.fill();

  // Opening
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.moveTo(-8, 15);
  ctx.lineTo(0, -5);
  ctx.lineTo(8, 15);
  ctx.closePath();
  ctx.fill();
}

function drawHouse(ctx: CanvasRenderingContext2D, variant: number) {
  const wallColors = ['#d4a574', '#b8956a', '#c4956a'];
  const roofColors = ['#8b2500', '#2d5a27', '#1a3a5a'];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-28, 20, 56, 12);

  // Walls
  ctx.fillStyle = wallColors[variant % 3];
  ctx.fillRect(-25, -10, 50, 35);

  // Roof
  ctx.fillStyle = roofColors[variant % 3];
  ctx.beginPath();
  ctx.moveTo(-30, -10);
  ctx.lineTo(0, -35);
  ctx.lineTo(30, -10);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#4a2a0a';
  ctx.fillRect(-6, 5, 12, 20);

  // Windows
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-20, -2, 10, 10);
  ctx.fillRect(10, -2, 10, 10);

  // Window frames
  ctx.strokeStyle = '#4a2a0a';
  ctx.lineWidth = 1;
  ctx.strokeRect(-20, -2, 10, 10);
  ctx.strokeRect(10, -2, 10, 10);
}

function drawPond(ctx: CanvasRenderingContext2D, time: number) {
  // Water
  ctx.fillStyle = '#1e40af';
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Surface
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.ellipse(0, -2, 45, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ripples
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
  ctx.lineWidth = 1;
  const ripple = (time / 600) % 2;
  for (let i = 0; i < 2; i++) {
    const r = 10 + ((ripple + i) % 2) * 15;
    ctx.beginPath();
    ctx.ellipse(0, -2, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lily pads
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(-15, 5, 8, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(20, -5, 6, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrystal(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const colors = ['#06b6d4', '#8b5cf6', '#ec4899'];
  const color = colors[variant % 3];

  const glow = 0.3 + Math.sin(time / 1000 + variant) * 0.2;

  // Glow
  const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
  gradient.addColorStop(0, color + Math.round(glow * 255).toString(16).padStart(2, '0'));
  gradient.addColorStop(1, color + '00');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();

  // Crystal shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-4, 10);
  ctx.lineTo(4, 10);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-2, 5);
  ctx.lineTo(0, -5);
  ctx.closePath();
  ctx.fill();
}

function drawMushroom(ctx: CanvasRenderingContext2D, variant: number) {
  const capColors = ['#dc2626', '#f59e0b', '#8b5cf6'];
  const capColor = capColors[variant % 3];

  // Stem
  ctx.fillStyle = '#f5f5dc';
  ctx.fillRect(-3, 0, 6, 10);

  // Cap
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.arc(0, 0, 10, Math.PI, 0);
  ctx.fill();

  // Spots
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(-4, -4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -3, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSign(ctx: CanvasRenderingContext2D, variant: number) {
  const labels = ['🌳 Praça', '🎵 Música', '🎮 Jogos', '🎨 Arte', '💻 Tech'];
  const label = labels[variant % 5];

  // Post
  ctx.fillStyle = '#5c3a1a';
  ctx.fillRect(-2, -15, 4, 25);

  // Sign board
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(-25, -25, 50, 16);

  // Border
  ctx.strokeStyle = '#5c3a1a';
  ctx.lineWidth = 1;
  ctx.strokeRect(-25, -25, 50, 16);

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -14);
}

function drawBridge(ctx: CanvasRenderingContext2D) {
  // Bridge planks
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(-25, -8, 50, 16);

  // Plank lines
  ctx.strokeStyle = '#5c3a1a';
  ctx.lineWidth = 1;
  for (let i = -20; i < 25; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, -8);
    ctx.lineTo(i, 8);
    ctx.stroke();
  }

  // Rails
  ctx.fillStyle = '#5c3a1a';
  ctx.fillRect(-25, -12, 4, 24);
  ctx.fillRect(21, -12, 4, 24);
}

function drawAreaLabels(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number) {
  MAP_AREAS.forEach(area => {
    const cx = area.bounds.x + area.bounds.w / 2;
    const cy = area.bounds.y + 40;

    if (cx < vl - 100 || cx > vr + 100 || cy < vt - 50 || cy > vb + 50) return;

    ctx.save();
    ctx.fillStyle = area.color + '80';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${area.icon} ${area.name}`, cx, cy);
    ctx.restore();
  });
}
