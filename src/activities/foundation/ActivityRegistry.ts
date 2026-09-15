import type { ActivityConfig } from '../../types/activities';

export const ARA_PARK_CONFIG: ActivityConfig = {
  id: 'ara-park',
  name: 'Ara Park',
  description: 'Espaço social 2D com voz por proximidade. Caminhe, encontre amigos e converse naturalmente.',
  icon: '🌳',
  color: '#22c55e',
  maxPlayers: 100,
  requiresAudio: true,
  requiresMicrophone: true,
};

export const ACTIVITIES_REGISTRY: ActivityConfig[] = [
  ARA_PARK_CONFIG,
  {
    id: 'card-game',
    name: 'Jogo de Cartas',
    description: 'Em breve — jogo de cartas multiplayer.',
    icon: '🃏',
    color: '#8b5cf6',
  },
  {
    id: 'collab-draw',
    name: 'Desenho Colaborativo',
    description: 'Em breve — desenhe junto com amigos.',
    icon: '🎨',
    color: '#f59e0b',
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Em breve — quiz multiplayer em tempo real.',
    icon: '🧠',
    color: '#3b82f6',
  },
  {
    id: 'watch-party',
    name: 'Watch Party',
    description: 'Em breve — assista vídeos junto com a galera.',
    icon: '🎬',
    color: '#ef4444',
  },
];
