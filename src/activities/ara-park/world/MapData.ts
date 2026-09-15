export interface MapArea {
  id: string;
  name: string;
  icon: string;
  bounds: { x: number; y: number; w: number; h: number };
  color: string;
  description: string;
}

export interface MapDecoration {
  type: 'tree' | 'flower' | 'bench' | 'lamp' | 'fountain' | 'rock' | 'bush' | 'mushroom' | 'crystal' | 'sign' | 'stage' | 'tent' | 'house' | 'bridge' | 'pond';
  x: number;
  y: number;
  variant?: number;
  rotation?: number;
}

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 3200;
export const TILE_SIZE = 32;

export const MAP_AREAS: MapArea[] = [
  {
    id: 'central-plaza',
    name: 'Praça Central',
    icon: '⛲',
    bounds: { x: 1200, y: 1200, w: 800, h: 800 },
    color: '#22c55e',
    description: 'O coração do Ara Park. Fonte, bancos e encontros.',
  },
  {
    id: 'music-zone',
    name: 'Zona Musical',
    icon: '🎵',
    bounds: { x: 0, y: 0, w: 1000, h: 1000 },
    color: '#a855f7',
    description: 'Palco, instrumentos e jams ao vivo.',
  },
  {
    id: 'games-zone',
    name: 'Zona de Jogos',
    icon: '🎮',
    bounds: { x: 2200, y: 0, w: 1000, h: 1000 },
    color: '#3b82f6',
    description: 'Arcade, mesas de jogo e competições.',
  },
  {
    id: 'art-zone',
    name: 'Zona de Arte',
    icon: '🎨',
    bounds: { x: 0, y: 2200, w: 1000, h: 1000 },
    color: '#f59e0b',
    description: 'Galerias, esculturas e criatividade.',
  },
  {
    id: 'tech-zone',
    name: 'Zona Tech',
    icon: '💻',
    bounds: { x: 2200, y: 2200, w: 1000, h: 1000 },
    color: '#06b6d4',
    description: 'Hackers, makers e inovação.',
  },
  {
    id: 'nature-trail',
    name: 'Trilha Natural',
    icon: '🌿',
    bounds: { x: 1000, y: 0, w: 1200, h: 600 },
    color: '#16a34a',
    description: 'Floresta, lago e caminho tranquilo.',
  },
  {
    id: 'events-stage',
    name: 'Palco de Eventos',
    icon: '🎪',
    bounds: { x: 1000, y: 2600, w: 1200, h: 600 },
    color: '#ef4444',
    description: 'Shows, palestras e eventos especiais.',
  },
  {
    id: 'chill-zone',
    name: 'Zona Relax',
    icon: '🌙',
    bounds: { x: 0, y: 1000, w: 600, h: 1200 },
    color: '#6366f1',
    description: 'Espaço calmo para conversar.',
  },
  {
    id: 'market',
    name: 'Mercado',
    icon: '🏪',
    bounds: { x: 2600, y: 1000, w: 600, h: 1200 },
    color: '#f97316',
    description: 'Barracas, trocas e novidades.',
  },
];

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateDecorations(): MapDecoration[] {
  const decorations: MapDecoration[] = [];
  const random = rng(42);

  // Trees scattered everywhere
  for (let i = 0; i < 200; i++) {
    decorations.push({
      type: 'tree',
      x: random() * WORLD_WIDTH,
      y: random() * WORLD_HEIGHT,
      variant: Math.floor(random() * 4),
    });
  }

  // Flowers
  for (let i = 0; i < 150; i++) {
    decorations.push({
      type: 'flower',
      x: random() * WORLD_WIDTH,
      y: random() * WORLD_HEIGHT,
      variant: Math.floor(random() * 5),
    });
  }

  // Bushes
  for (let i = 0; i < 80; i++) {
    decorations.push({
      type: 'bush',
      x: random() * WORLD_WIDTH,
      y: random() * WORLD_HEIGHT,
      variant: Math.floor(random() * 3),
    });
  }

  // Rocks
  for (let i = 0; i < 60; i++) {
    decorations.push({
      type: 'rock',
      x: random() * WORLD_WIDTH,
      y: random() * WORLD_HEIGHT,
      variant: Math.floor(random() * 3),
    });
  }

  // Benches in plaza and chill zone
  const benchPositions = [
    { x: 1400, y: 1400 }, { x: 1600, y: 1400 }, { x: 1800, y: 1400 },
    { x: 1400, y: 1800 }, { x: 1600, y: 1800 }, { x: 1800, y: 1800 },
    { x: 200, y: 1400 }, { x: 200, y: 1600 }, { x: 200, y: 1800 },
    { x: 400, y: 1400 }, { x: 400, y: 1600 },
  ];
  benchPositions.forEach(pos => {
    decorations.push({ type: 'bench', x: pos.x, y: pos.y, variant: Math.floor(random() * 2) });
  });

  // Lamps along paths
  for (let i = 0; i < 40; i++) {
    decorations.push({
      type: 'lamp',
      x: 1200 + (i % 10) * 80,
      y: 1200 + Math.floor(i / 10) * 200,
    });
  }
  for (let i = 0; i < 20; i++) {
    decorations.push({
      type: 'lamp',
      x: 1200 + Math.floor(i / 5) * 200,
      y: 1200 + (i % 5) * 80,
    });
  }

  // Fountain in center
  decorations.push({ type: 'fountain', x: 1600, y: 1600 });

  // Stage in events zone
  decorations.push({ type: 'stage', x: 1600, y: 2800 });

  // Tents in market
  for (let i = 0; i < 6; i++) {
    decorations.push({
      type: 'tent',
      x: 2700 + (i % 3) * 150,
      y: 1200 + Math.floor(i / 3) * 200,
      variant: i % 3,
    });
  }

  // Houses in various zones
  decorations.push({ type: 'house', x: 300, y: 300, variant: 0 });
  decorations.push({ type: 'house', x: 600, y: 400, variant: 1 });
  decorations.push({ type: 'house', x: 2500, y: 300, variant: 2 });
  decorations.push({ type: 'house', x: 2800, y: 600, variant: 0 });
  decorations.push({ type: 'house', x: 300, y: 2500, variant: 1 });
  decorations.push({ type: 'house', x: 700, y: 2700, variant: 2 });
  decorations.push({ type: 'house', x: 2500, y: 2500, variant: 0 });
  decorations.push({ type: 'house', x: 2900, y: 2800, variant: 1 });

  // Ponds
  decorations.push({ type: 'pond', x: 1400, y: 300 });
  decorations.push({ type: 'pond', x: 500, y: 1500 });

  // Crystals in tech zone
  for (let i = 0; i < 15; i++) {
    decorations.push({
      type: 'crystal',
      x: 2300 + random() * 800,
      y: 2300 + random() * 800,
      variant: Math.floor(random() * 3),
    });
  }

  // Mushrooms in nature trail
  for (let i = 0; i < 20; i++) {
    decorations.push({
      type: 'mushroom',
      x: 1100 + random() * 1000,
      y: 100 + random() * 400,
      variant: Math.floor(random() * 3),
    });
  }

  // Signs at area entrances
  decorations.push({ type: 'sign', x: 1200, y: 1200, variant: 0 });
  decorations.push({ type: 'sign', x: 1000, y: 500, variant: 1 });
  decorations.push({ type: 'sign', x: 2200, y: 500, variant: 2 });
  decorations.push({ type: 'sign', x: 500, y: 2200, variant: 3 });
  decorations.push({ type: 'sign', x: 2700, y: 2200, variant: 4 });

  // Bridges
  decorations.push({ type: 'bridge', x: 1400, y: 350 });
  decorations.push({ type: 'bridge', x: 500, y: 1550 });

  return decorations;
}

export function getCurrentArea(x: number, y: number): MapArea | null {
  for (const area of MAP_AREAS) {
    const { bounds } = area;
    if (x >= bounds.x && x <= bounds.x + bounds.w && y >= bounds.y && y <= bounds.y + bounds.h) {
      return area;
    }
  }
  return null;
}
