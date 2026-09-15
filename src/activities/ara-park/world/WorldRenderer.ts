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

// Stardew Valley-inspired palette
const PALETTE = {
  grassLight: '#7ec850',
  grassMid: '#6ab04c',
  grassDark: '#4a8a3c',
  grassShadow: '#3a6a2c',
  dirt: '#b08968',
  dirtDark: '#8b6f47',
  dirtLight: '#c9a882',
  stone: '#8a8a8a',
  stoneDark: '#5a5a5a',
  stoneLight: '#b0b0b0',
  wood: '#8b5a2b',
  woodDark: '#5c3a1a',
  woodLight: '#a67c52',
  water: '#4a90e2',
  waterDeep: '#2d5fa0',
  waterLight: '#7ab8ff',
  waterFoam: '#cfe8ff',
  leafGreen: '#4a8a3c',
  leafDark: '#2d5a1a',
  leafLight: '#6ab04c',
  flowerPink: '#ff8fb1',
  flowerYellow: '#ffd93d',
  flowerPurple: '#b088f9',
  flowerRed: '#ff6b6b',
  flowerWhite: '#fff5e6',
  roof: '#c44536',
  roofDark: '#8b2e1f',
  wall: '#e8d5b7',
  wallDark: '#b8a080',
  window: '#7ab8ff',
  door: '#5c3a1a',
};

export function updateCamera(camera: Camera, targetX: number, targetY: number, viewport: Viewport): Camera {
  const targetCamX = targetX - viewport.width / 2 / camera.zoom;
  const targetCamY = targetY - viewport.height / 2 / camera.zoom;

  const lerp = 0.08;
  const newX = camera.x + (targetCamX - camera.x) * lerp;
  const newY = camera.y + (targetCamY - camera.y) * lerp;

  const maxX = WORLD_WIDTH - viewport.width / camera.zoom;
  const maxY = WORLD_HEIGHT - viewport.height / camera.zoom;

  return {
    x: Math.max(0, Math.min(maxX, newX)),
    y: Math.max(0, Math.min(maxY, newY)),
    zoom: camera.zoom,
  };
}

// Seeded random for consistent tile patterns
function hash(x: number, y: number, seed: number = 0): number {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
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

  const viewLeft = camera.x;
  const viewTop = camera.y;
  const viewRight = camera.x + viewport.width / camera.zoom;
  const viewBottom = camera.y + viewport.height / camera.zoom;

  // Draw base terrain
  drawTerrain(ctx, viewLeft, viewTop, viewRight, viewBottom, time);

  // Draw paths (dirt roads)
  drawPaths(ctx, viewLeft, viewTop, viewRight, viewBottom);

  // Draw water bodies
  drawWater(ctx, viewLeft, viewTop, viewRight, viewBottom, time);

  // Area subtle tint
  drawAreaOverlays(ctx, viewLeft, viewTop, viewRight, viewBottom);

  // Sort decorations by Y for depth
  const margin = 150;
  const visibleDecorations = decorations.filter(d =>
    d.x > viewLeft - margin && d.x < viewRight + margin &&
    d.y > viewTop - margin && d.y < viewBottom + margin
  );

  // Ground decorations (flowers, small items)
  visibleDecorations
    .filter(d => d.type === 'flower' || d.type === 'mushroom' || d.type === 'rock')
    .forEach(dec => drawDecoration(ctx, dec, time));

  // Mid decorations (bushes, benches, signs)
  visibleDecorations
    .filter(d => d.type === 'bush' || d.type === 'bench' || d.type === 'sign' || d.type === 'lamp')
    .forEach(dec => drawDecoration(ctx, dec, time));

  // Tall decorations (trees, houses, structures) - drawn last for depth
  visibleDecorations
    .filter(d => ['tree', 'house', 'tent', 'stage', 'fountain', 'bridge', 'pond', 'crystal'].includes(d.type))
    .forEach(dec => drawDecoration(ctx, dec, time));

  // Area labels
  drawAreaLabels(ctx, viewLeft, viewTop, viewRight, viewBottom);

  ctx.restore();
}

function drawTerrain(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number, time: number) {
  const startX = Math.floor(vl / TILE_SIZE) * TILE_SIZE;
  const startY = Math.floor(vt / TILE_SIZE) * TILE_SIZE;
  const endX = Math.ceil(vr / TILE_SIZE) * TILE_SIZE;
  const endY = Math.ceil(vb / TILE_SIZE) * TILE_SIZE;

  for (let x = startX; x < endX; x += TILE_SIZE) {
    for (let y = startY; y < endY; y += TILE_SIZE) {
      if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) continue;

      const h = hash(x, y);
      const h2 = hash(x, y, 1);
      const h3 = hash(x, y, 2);

      // Base grass color with variation
      let baseColor: string;
      if (h < 0.3) baseColor = PALETTE.grassLight;
      else if (h < 0.7) baseColor = PALETTE.grassMid;
      else baseColor = PALETTE.grassDark;

      ctx.fillStyle = baseColor;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // Grass blades
      const bladeCount = Math.floor(h2 * 6);
      for (let i = 0; i < bladeCount; i++) {
        const bx = x + hash(x + i, y, 3) * TILE_SIZE;
        const by = y + hash(x, y + i, 4) * TILE_SIZE;
        const sway = Math.sin(time / 1500 + bx * 0.01) * 1;

        ctx.strokeStyle = h3 > 0.5 ? PALETTE.leafLight : PALETTE.grassShadow;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + sway, by - 3 - h2 * 2);
        ctx.stroke();
      }

      // Small pebbles/details
      if (h > 0.92) {
        ctx.fillStyle = PALETTE.stoneLight;
        ctx.beginPath();
        ctx.arc(x + h2 * TILE_SIZE, y + h3 * TILE_SIZE, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tiny flowers (persistent, not animated)
      if (h2 > 0.95) {
        const colors = [PALETTE.flowerPink, PALETTE.flowerYellow, PALETTE.flowerWhite, PALETTE.flowerPurple];
        ctx.fillStyle = colors[Math.floor(h3 * colors.length)];
        ctx.beginPath();
        ctx.arc(x + h * TILE_SIZE, y + h2 * TILE_SIZE, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // World border - wooden fence style
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.strokeStyle = PALETTE.wood;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawPaths(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number) {
  // Main horizontal path
  const pathY = 1550;
  if (pathY > vt - 80 && pathY < vb + 80) {
    drawDirtPath(ctx, Math.max(vl, 0), pathY, Math.min(vr, WORLD_WIDTH) - Math.max(vl, 0), 80);
  }

  // Main vertical path
  const pathX = 1570;
  if (pathX > vl - 80 && pathX < vr + 80) {
    drawDirtPathVertical(ctx, pathX, Math.max(vt, 0), 80, Math.min(vb, WORLD_HEIGHT) - Math.max(vt, 0));
  }

  // Diagonal paths
  drawDiagonalPath(ctx, 1600, 1600, 500, 500, vl, vt, vr, vb);
  drawDiagonalPath(ctx, 1600, 1600, 2700, 500, vl, vt, vr, vb);
  drawDiagonalPath(ctx, 1600, 1600, 500, 2700, vl, vt, vr, vb);
  drawDiagonalPath(ctx, 1600, 1600, 2700, 2700, vl, vt, vr, vb);
}

function drawDirtPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Base dirt
  ctx.fillStyle = PALETTE.dirt;
  ctx.fillRect(x, y, w, h);

  // Darker edges
  ctx.fillStyle = PALETTE.dirtDark;
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);

  // Cobblestones
  for (let px = x; px < x + w; px += 16) {
    for (let py = y; py < y + h; py += 16) {
      const h1 = hash(px, py, 10);
      const h2 = hash(px, py, 11);

      if (h1 > 0.3) {
        ctx.fillStyle = h2 > 0.5 ? PALETTE.stoneLight : PALETTE.stone;
        const size = 8 + h1 * 6;
        const ox = h2 * 4;
        const oy = hash(px, py, 12) * 4;
        ctx.fillRect(px + ox, py + oy, size, size);

        // Stone highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + ox, py + oy, size, 2);
      }
    }
  }

  // Grass tufts on edges
  for (let px = x; px < x + w; px += 12) {
    const h1 = hash(px, 0, 20);
    if (h1 > 0.6) {
      ctx.fillStyle = PALETTE.grassDark;
      ctx.fillRect(px, y - 2, 2, 3);
      ctx.fillRect(px + 4, y + h - 1, 2, 3);
    }
  }
}

function drawDirtPathVertical(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = PALETTE.dirt;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = PALETTE.dirtDark;
  ctx.fillRect(x, y, 4, h);
  ctx.fillRect(x + w - 4, y, 4, h);

  for (let px = x; px < x + w; px += 16) {
    for (let py = y; py < y + h; py += 16) {
      const h1 = hash(px, py, 10);
      const h2 = hash(px, py, 11);

      if (h1 > 0.3) {
        ctx.fillStyle = h2 > 0.5 ? PALETTE.stoneLight : PALETTE.stone;
        const size = 8 + h1 * 6;
        const ox = h2 * 4;
        const oy = hash(px, py, 12) * 4;
        ctx.fillRect(px + ox, py + oy, size, size);

        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + ox, py + oy, size, 2);
      }
    }
  }
}

function drawDiagonalPath(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, vl: number, vt: number, vr: number, vb: number) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  if (maxX < vl - 50 || minX > vr + 50 || maxY < vt - 50 || minY > vb + 50) return;

  // Path shadow
  ctx.strokeStyle = PALETTE.dirtDark;
  ctx.lineWidth = 44;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Path base
  ctx.strokeStyle = PALETTE.dirt;
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Path highlight
  ctx.strokeStyle = PALETTE.dirtLight;
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Stones along path
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    const h = hash(px, py, 30);
    if (h > 0.6) {
      ctx.fillStyle = h > 0.8 ? PALETTE.stoneLight : PALETTE.stone;
      ctx.beginPath();
      ctx.arc(px + (h - 0.5) * 20, py + (hash(px, py, 31) - 0.5) * 20, 2 + h * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWater(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number, time: number) {
  // Pond at (1400, 300)
  drawPondBody(ctx, 1400, 300, 80, 50, time, vl, vt, vr, vb);
  // Pond at (500, 1500)
  drawPondBody(ctx, 500, 1500, 60, 40, time, vl, vt, vr, vb);
}

function drawPondBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, time: number, vl: number, vt: number, vr: number, vb: number) {
  if (cx + rx < vl || cx - rx > vr || cy + ry < vt || cy - ry > vb) return;

  // Shore (sand/dirt around water)
  ctx.fillStyle = PALETTE.dirtLight;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 10, ry + 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water base
  ctx.fillStyle = PALETTE.waterDeep;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water surface
  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, rx - 4, ry - 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated ripples
  ctx.strokeStyle = PALETTE.waterLight;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const phase = ((time / 800) + i * 0.33) % 1;
    const r = phase * rx * 0.8;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sparkles
  for (let i = 0; i < 5; i++) {
    const sx = cx + Math.cos(time / 1000 + i) * rx * 0.5;
    const sy = cy + Math.sin(time / 1200 + i * 1.5) * ry * 0.4;
    const sparkle = (Math.sin(time / 300 + i * 2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.6})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lily pads
  drawLilyPad(ctx, cx - rx * 0.4, cy + ry * 0.2, time, 0);
  drawLilyPad(ctx, cx + rx * 0.3, cy - ry * 0.3, time, 1);
}

function drawLilyPad(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, seed: number) {
  const bob = Math.sin(time / 1000 + seed) * 1;

  // Pad
  ctx.fillStyle = PALETTE.leafGreen;
  ctx.beginPath();
  ctx.ellipse(x, y + bob, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Notch
  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.moveTo(x, y + bob);
  ctx.lineTo(x + 6, y - 2 + bob);
  ctx.lineTo(x + 6, y + 2 + bob);
  ctx.closePath();
  ctx.fill();

  // Flower on some
  if (seed === 0) {
    ctx.fillStyle = PALETTE.flowerPink;
    ctx.beginPath();
    ctx.arc(x - 2, y - 4 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.flowerYellow;
    ctx.beginPath();
    ctx.arc(x - 2, y - 4 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAreaOverlays(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number) {
  MAP_AREAS.forEach(area => {
    const { x, y, w, h } = area.bounds;
    if (x + w < vl || x > vr || y + h < vt || y > vb) return;

    // Very subtle tint
    ctx.fillStyle = area.color + '05';
    ctx.fillRect(x, y, w, h);
  });
}

function drawDecoration(ctx: CanvasRenderingContext2D, dec: MapDecoration, time: number) {
  ctx.save();
  ctx.translate(dec.x, dec.y);

  switch (dec.type) {
    case 'tree': drawTree(ctx, dec.variant || 0, time); break;
    case 'flower': drawFlower(ctx, dec.variant || 0, time); break;
    case 'bush': drawBush(ctx, dec.variant || 0, time); break;
    case 'rock': drawRock(ctx, dec.variant || 0); break;
    case 'bench': drawBench(ctx, dec.variant || 0); break;
    case 'lamp': drawLamp(ctx, time); break;
    case 'fountain': drawFountain(ctx, time); break;
    case 'stage': drawStage(ctx); break;
    case 'tent': drawTent(ctx, dec.variant || 0); break;
    case 'house': drawHouse(ctx, dec.variant || 0, time); break;
    case 'pond': break; // Drawn separately
    case 'crystal': drawCrystal(ctx, dec.variant || 0, time); break;
    case 'mushroom': drawMushroom(ctx, dec.variant || 0); break;
    case 'sign': drawSign(ctx, dec.variant || 0); break;
    case 'bridge': drawBridge(ctx); break;
  }

  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const sway = Math.sin(time / 1200 + variant * 3) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(4, 20, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === 0) {
    // Oak tree - big and round
    // Trunk
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(-5, -5, 10, 25);
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(-4, -5, 3, 25);

    // Canopy layers (back to front for depth)
    ctx.save();
    ctx.translate(sway, 0);

    ctx.fillStyle = PALETTE.leafDark;
    ctx.beginPath();
    ctx.arc(-8, -18, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, -15, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.leafGreen;
    ctx.beginPath();
    ctx.arc(0, -22, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.leafLight;
    ctx.beginPath();
    ctx.arc(-5, -26, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -20, 10, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(-8, -30, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else if (variant === 1) {
    // Pine tree
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(-4, -5, 8, 25);
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(-3, -5, 2, 25);

    ctx.save();
    ctx.translate(sway * 0.5, 0);

    // Pine layers
    for (let i = 0; i < 4; i++) {
      const layerY = -10 - i * 10;
      const layerW = 22 - i * 3;
      ctx.fillStyle = i % 2 === 0 ? PALETTE.leafDark : PALETTE.leafGreen;
      ctx.beginPath();
      ctx.moveTo(0, layerY - 10);
      ctx.lineTo(-layerW / 2, layerY + 5);
      ctx.lineTo(layerW / 2, layerY + 5);
      ctx.closePath();
      ctx.fill();
    }

    // Snow/highlight on top
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(-4, -40);
    ctx.lineTo(4, -40);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  } else if (variant === 2) {
    // Round fruit tree
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(-4, -5, 8, 22);
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(-3, -5, 2, 22);

    ctx.save();
    ctx.translate(sway, 0);

    ctx.fillStyle = PALETTE.leafGreen;
    ctx.beginPath();
    ctx.arc(0, -18, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.leafLight;
    ctx.beginPath();
    ctx.arc(-6, -22, 14, 0, Math.PI * 2);
    ctx.fill();

    // Fruits
    const fruitColors = [PALETTE.flowerRed, PALETTE.flowerYellow, PALETTE.flowerPink];
    for (let i = 0; i < 5; i++) {
      const fx = Math.cos(i * 1.3) * 14;
      const fy = -18 + Math.sin(i * 1.7) * 12;
      ctx.fillStyle = fruitColors[i % 3];
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(fx - 1, fy - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  } else {
    // Willow / palm
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(-4, -5, 8, 25);
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(-3, -5, 2, 25);

    ctx.save();
    ctx.translate(sway * 1.5, 0);

    // Drooping leaves
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leafSway = Math.sin(time / 800 + i) * 2;
      ctx.strokeStyle = PALETTE.leafGreen;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.quadraticCurveTo(
        Math.cos(angle) * 20 + leafSway,
        -15 + Math.sin(angle) * 10,
        Math.cos(angle) * 25 + leafSway * 2,
        -5 + Math.sin(angle) * 15
      );
      ctx.stroke();
    }

    ctx.fillStyle = PALETTE.leafLight;
    ctx.beginPath();
    ctx.arc(0, -22, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const bob = Math.sin(time / 800 + variant * 2) * 1.5;
  const sway = Math.sin(time / 1000 + variant) * 1;

  // Stem
  ctx.strokeStyle = PALETTE.leafDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.quadraticCurveTo(sway, 0, sway * 0.5, -5 + bob);
  ctx.stroke();

  // Leaf
  ctx.fillStyle = PALETTE.leafGreen;
  ctx.beginPath();
  ctx.ellipse(sway * 0.5, 0, 3, 1.5, 0.5, 0, Math.PI * 2);
  ctx.fill();

  const colors = [PALETTE.flowerPink, PALETTE.flowerYellow, PALETTE.flowerPurple, PALETTE.flowerRed, PALETTE.flowerWhite];
  const color = colors[variant % colors.length];

  // Petals
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      sway * 0.5 + Math.cos(angle) * 3,
      -6 + bob + Math.sin(angle) * 3,
      2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Center
  ctx.fillStyle = PALETTE.flowerYellow;
  ctx.beginPath();
  ctx.arc(sway * 0.5, -6 + bob, 2, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(sway * 0.5 - 0.5, -6.5 + bob, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const sway = Math.sin(time / 1500 + variant) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(2, 8, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(sway, 0);

  // Back leaves
  ctx.fillStyle = PALETTE.leafDark;
  ctx.beginPath();
  ctx.arc(-8, -2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -2, 11, 0, Math.PI * 2);
  ctx.fill();

  // Front leaves
  ctx.fillStyle = PALETTE.leafGreen;
  ctx.beginPath();
  ctx.arc(0, -4, 12, 0, Math.PI * 2);
  ctx.fill();

  // Highlights
  ctx.fillStyle = PALETTE.leafLight;
  ctx.beginPath();
  ctx.arc(-4, -8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, -6, 5, 0, Math.PI * 2);
  ctx.fill();

  // Berries on some
  if (variant === 1) {
    ctx.fillStyle = PALETTE.flowerRed;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-6 + i * 4, -2 + (i % 2) * 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, variant: number) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(2, 8, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const sizes = [14, 10, 16];
  const size = sizes[variant % 3];

  // Main rock
  ctx.fillStyle = PALETTE.stone;
  ctx.beginPath();
  ctx.moveTo(-size * 0.7, 5);
  ctx.lineTo(-size * 0.5, -size * 0.4);
  ctx.lineTo(-size * 0.1, -size * 0.6);
  ctx.lineTo(size * 0.3, -size * 0.5);
  ctx.lineTo(size * 0.7, -size * 0.2);
  ctx.lineTo(size * 0.6, 5);
  ctx.closePath();
  ctx.fill();

  // Dark side
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.moveTo(size * 0.3, -size * 0.5);
  ctx.lineTo(size * 0.7, -size * 0.2);
  ctx.lineTo(size * 0.6, 5);
  ctx.lineTo(size * 0.2, 5);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = PALETTE.stoneLight;
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.4);
  ctx.lineTo(-size * 0.1, -size * 0.6);
  ctx.lineTo(size * 0.1, -size * 0.4);
  ctx.lineTo(-size * 0.2, -size * 0.2);
  ctx.closePath();
  ctx.fill();

  // Moss on some
  if (variant === 2) {
    ctx.fillStyle = PALETTE.leafDark;
    ctx.beginPath();
    ctx.arc(-size * 0.3, -size * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBench(ctx: CanvasRenderingContext2D, variant: number) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(-20, 8, 40, 6);

  // Legs
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-16, 4, 4, 10);
  ctx.fillRect(12, 4, 4, 10);

  // Seat
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(-18, -2, 36, 8);
  ctx.fillStyle = PALETTE.woodLight;
  ctx.fillRect(-18, -2, 36, 2);

  // Planks
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 0.5;
  for (let i = -14; i < 18; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -2);
    ctx.lineTo(i, 6);
    ctx.stroke();
  }

  // Back
  if (variant === 0) {
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(-18, -10, 36, 8);
    ctx.fillStyle = PALETTE.woodLight;
    ctx.fillRect(-18, -10, 36, 2);

    // Back supports
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(-16, -10, 3, 12);
    ctx.fillRect(13, -10, 3, 12);
  }
}

function drawLamp(ctx: CanvasRenderingContext2D, time: number) {
  // Base
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(-5, 10, 10, 4);

  // Post
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(-2, -20, 4, 30);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(-1, -20, 1, 30);

  // Glow (large soft)
  const glowIntensity = 0.3 + Math.sin(time / 2000) * 0.1;
  const gradient = ctx.createRadialGradient(0, -22, 2, 0, -22, 50);
  gradient.addColorStop(0, `rgba(255, 220, 100, ${glowIntensity})`);
  gradient.addColorStop(0.5, `rgba(255, 200, 80, ${glowIntensity * 0.3})`);
  gradient.addColorStop(1, 'rgba(255, 200, 80, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, -22, 50, 0, Math.PI * 2);
  ctx.fill();

  // Lamp head
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.moveTo(-6, -22);
  ctx.lineTo(-4, -28);
  ctx.lineTo(4, -28);
  ctx.lineTo(6, -22);
  ctx.closePath();
  ctx.fill();

  // Light
  ctx.fillStyle = '#ffdc64';
  ctx.beginPath();
  ctx.arc(0, -24, 3, 0, Math.PI * 2);
  ctx.fill();

  // Bright core
  ctx.fillStyle = '#fff5cc';
  ctx.beginPath();
  ctx.arc(0, -24, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFountain(ctx: CanvasRenderingContext2D, time: number) {
  // Large shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 60, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base pool (stone)
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.ellipse(0, 15, 55, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.stone;
  ctx.beginPath();
  ctx.ellipse(0, 12, 50, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water
  ctx.fillStyle = PALETTE.waterDeep;
  ctx.beginPath();
  ctx.ellipse(0, 10, 45, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.ellipse(0, 8, 42, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ripples
  ctx.strokeStyle = PALETTE.waterLight;
  ctx.lineWidth = 1;
  const ripple = (time / 500) % 3;
  for (let i = 0; i < 3; i++) {
    const r = 8 + ((ripple + i) % 3) * 12;
    ctx.globalAlpha = 1 - ((ripple + i) % 3) / 3;
    ctx.beginPath();
    ctx.ellipse(0, 8, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Center column
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(-8, -25, 16, 35);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(-6, -25, 4, 35);

  // Top basin
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.ellipse(0, -25, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.stone;
  ctx.beginPath();
  ctx.ellipse(0, -27, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water in top
  ctx.fillStyle = PALETTE.water;
  ctx.beginPath();
  ctx.ellipse(0, -27, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water spray
  ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';
  const spray = Math.sin(time / 300) * 3;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + time / 500;
    const r = 3 + Math.sin(time / 200 + i) * 2;
    ctx.beginPath();
    ctx.arc(
      Math.cos(angle) * r,
      -35 + spray + Math.sin(angle) * r * 0.5,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Falling water streams
  ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const x1 = Math.cos(angle) * 14;
    const y1 = -25;
    const x2 = Math.cos(angle) * 35;
    const y2 = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(x1 * 1.5, (y1 + y2) / 2, x2, y2);
    ctx.stroke();
  }
}

function drawStage(ctx: CanvasRenderingContext2D) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-85, 25, 170, 15);

  // Platform base
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-85, -5, 170, 35);

  // Platform top
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(-80, -10, 160, 30);

  // Planks
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 0.5;
  for (let i = -75; i < 80; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, -10);
    ctx.lineTo(i, 20);
    ctx.stroke();
  }

  // Back wall
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(-85, -50, 170, 40);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(-80, -48, 160, 36);

  // Curtains
  ctx.fillStyle = PALETTE.roof;
  ctx.fillRect(-85, -50, 25, 60);
  ctx.fillRect(60, -50, 25, 60);

  // Curtain folds
  ctx.fillStyle = PALETTE.roofDark;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-85 + i * 8, -50, 2, 60);
    ctx.fillRect(60 + i * 8, -50, 2, 60);
  }

  // Spotlights
  ctx.fillStyle = 'rgba(255, 220, 100, 0.25)';
  ctx.beginPath();
  ctx.moveTo(-40, -50);
  ctx.lineTo(-70, 20);
  ctx.lineTo(-10, 20);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(40, -50);
  ctx.lineTo(10, 20);
  ctx.lineTo(70, 20);
  ctx.closePath();
  ctx.fill();

  // Stars/decoration
  ctx.fillStyle = PALETTE.flowerYellow;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-60 + i * 30, -40, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTent(ctx: CanvasRenderingContext2D, variant: number) {
  const colors = [PALETTE.roof, '#2563eb', PALETTE.leafGreen];
  const color = colors[variant % 3];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 40, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tent body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(-35, 18);
  ctx.lineTo(35, 18);
  ctx.closePath();
  ctx.fill();

  // Stripes
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-10 + i * 10, -20);
    ctx.lineTo(-20 + i * 10, 18);
    ctx.lineTo(-10 + i * 10, 18);
    ctx.lineTo(0 + i * 10, -20);
    ctx.closePath();
    ctx.fill();
  }

  // Dark side
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(35, 18);
  ctx.lineTo(15, 18);
  ctx.closePath();
  ctx.fill();

  // Opening
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(-10, 18);
  ctx.lineTo(0, -5);
  ctx.lineTo(10, 18);
  ctx.closePath();
  ctx.fill();

  // Flag on top
  ctx.fillStyle = PALETTE.flowerYellow;
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(8, -38);
  ctx.lineTo(0, -41);
  ctx.closePath();
  ctx.fill();
}

function drawHouse(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const wallColors = [PALETTE.wall, '#d4b896', '#c9a882'];
  const roofColors = [PALETTE.roof, '#2d5a27', '#1a3a5a'];
  const wallColor = wallColors[variant % 3];
  const roofColor = roofColors[variant % 3];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-32, 22, 64, 12);

  // Walls
  ctx.fillStyle = wallColor;
  ctx.fillRect(-28, -12, 56, 38);

  // Wall texture (bricks/boards)
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  for (let y = -10; y < 25; y += 6) {
    ctx.beginPath();
    ctx.moveTo(-28, y);
    ctx.lineTo(28, y);
    ctx.stroke();
  }

  // Dark side
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(15, -12, 13, 38);

  // Roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(-35, -12);
  ctx.lineTo(0, -40);
  ctx.lineTo(35, -12);
  ctx.closePath();
  ctx.fill();

  // Roof highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(-30, -14);
  ctx.lineTo(0, -38);
  ctx.lineTo(-5, -38);
  ctx.lineTo(-32, -14);
  ctx.closePath();
  ctx.fill();

  // Roof tiles
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const y = -12 - i * 7;
    const w = 35 - i * 8;
    ctx.beginPath();
    ctx.moveTo(-w, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Door
  ctx.fillStyle = PALETTE.door;
  ctx.fillRect(-7, 5, 14, 21);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-7, 5, 14, 2);
  // Doorknob
  ctx.fillStyle = PALETTE.flowerYellow;
  ctx.beginPath();
  ctx.arc(4, 16, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Windows (with warm light at night)
  const windowLit = Math.sin(time / 5000) > 0;
  ctx.fillStyle = windowLit ? '#ffdc64' : PALETTE.window;
  ctx.fillRect(-22, -4, 11, 11);
  ctx.fillRect(11, -4, 11, 11);

  // Window frames
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-22, -4, 11, 11);
  ctx.strokeRect(11, -4, 11, 11);
  // Cross
  ctx.beginPath();
  ctx.moveTo(-16.5, -4);
  ctx.lineTo(-16.5, 7);
  ctx.moveTo(-22, 1.5);
  ctx.lineTo(-11, 1.5);
  ctx.moveTo(16.5, -4);
  ctx.lineTo(16.5, 7);
  ctx.moveTo(11, 1.5);
  ctx.lineTo(22, 1.5);
  ctx.stroke();

  // Chimney
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(15, -35, 8, 12);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(15, -35, 2, 12);

  // Smoke
  if (windowLit) {
    ctx.fillStyle = 'rgba(200,200,200,0.3)';
    for (let i = 0; i < 3; i++) {
      const smokeY = -40 - i * 8 - (time / 100 % 8);
      const smokeX = 19 + Math.sin(time / 500 + i) * 3;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, 3 + i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCrystal(ctx: CanvasRenderingContext2D, variant: number, time: number) {
  const colors = ['#06b6d4', '#8b5cf6', '#ec4899'];
  const color = colors[variant % 3];

  const glow = 0.4 + Math.sin(time / 1000 + variant) * 0.2;

  // Glow
  const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
  gradient.addColorStop(0, color + Math.round(glow * 200).toString(16).padStart(2, '0'));
  gradient.addColorStop(1, color + '00');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();

  // Main crystal
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(-9, -2);
  ctx.lineTo(-5, 12);
  ctx.lineTo(5, 12);
  ctx.lineTo(9, -2);
  ctx.closePath();
  ctx.fill();

  // Side crystal
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(8, -8);
  ctx.lineTo(14, 0);
  ctx.lineTo(12, 8);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(-3, -14);
  ctx.lineTo(-7, -2);
  ctx.lineTo(-4, 6);
  ctx.lineTo(-1, -4);
  ctx.closePath();
  ctx.fill();

  // Sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 3; i++) {
    const sparkle = (Math.sin(time / 300 + i * 2) + 1) / 2;
    if (sparkle > 0.7) {
      const sx = Math.cos(i * 2) * 10;
      const sy = Math.sin(i * 2) * 10 - 5;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMushroom(ctx: CanvasRenderingContext2D, variant: number) {
  const capColors = [PALETTE.flowerRed, PALETTE.flowerYellow, PALETTE.flowerPurple];
  const capColor = capColors[variant % 3];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.fillStyle = '#f5f5dc';
  ctx.fillRect(-3, 0, 6, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(1, 0, 2, 10);

  // Cap
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.arc(0, 0, 11, Math.PI, 0);
  ctx.fill();

  // Cap bottom
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-11, 0, 22, 2);

  // Spots
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(-5, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-1, -8, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(-6, -7, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSign(ctx: CanvasRenderingContext2D, variant: number) {
  const labels = ['Praça', 'Música', 'Jogos', 'Arte', 'Tech'];
  const icons = ['⛲', '🎵', '🎮', '🎨', '💻'];
  const label = labels[variant % 5];
  const icon = icons[variant % 5];

  // Post
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-2, -15, 4, 28);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(-1, -15, 1, 28);

  // Sign board
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(-28, -28, 56, 18);

  // Border
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-28, -28, 56, 18);

  // Nails
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.beginPath();
  ctx.arc(-25, -25, 1, 0, Math.PI * 2);
  ctx.arc(25, -25, 1, 0, Math.PI * 2);
  ctx.arc(-25, -13, 1, 0, Math.PI * 2);
  ctx.arc(25, -13, 1, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${icon} ${label}`, 0, -16);
}

function drawBridge(ctx: CanvasRenderingContext2D) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-28, 6, 56, 8);

  // Bridge planks
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(-28, -8, 56, 16);

  // Plank lines
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 1;
  for (let i = -24; i < 28; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -8);
    ctx.lineTo(i, 8);
    ctx.stroke();
  }

  // Highlights
  ctx.fillStyle = PALETTE.woodLight;
  for (let i = -24; i < 28; i += 6) {
    ctx.fillRect(i, -8, 4, 1);
  }

  // Rails
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-28, -14, 4, 28);
  ctx.fillRect(24, -14, 4, 28);

  // Rail posts
  ctx.fillRect(-28, -14, 56, 3);
}

function drawAreaLabels(ctx: CanvasRenderingContext2D, vl: number, vt: number, vr: number, vb: number) {
  MAP_AREAS.forEach(area => {
    const cx = area.bounds.x + area.bounds.w / 2;
    const cy = area.bounds.y + 40;

    if (cx < vl - 100 || cx > vr + 100 || cy < vt - 50 || cy > vb + 50) return;

    ctx.save();

    // Background pill
    const text = `${area.icon} ${area.name}`;
    ctx.font = 'bold 13px monospace';
    const metrics = ctx.measureText(text);
    const padding = 10;
    const width = metrics.width + padding * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - width / 2, cy - 12, width, 20, 10);
    ctx.fill();

    // Border
    ctx.strokeStyle = area.color + '80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - width / 2, cy - 12, width, 20, 10);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 3);

    ctx.restore();
  });
}
