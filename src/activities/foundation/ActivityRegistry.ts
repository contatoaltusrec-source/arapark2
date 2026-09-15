import type { ActivityConfig } from '../../types/activities';

export const ARA_PARK_CONFIG: ActivityConfig = {
  id: 'ara-park',
  name: 'Ara Park',
  description: 'Espaço social 2D com voz por proximidade. Caminhe pelo parque, encontre amigos e converse naturalmente. Explore áreas temáticas, interaja com outros jogadores e viva experiências sociais únicas.',
  icon: '🌳',
  color: '#22c55e',
  maxPlayers: 100,
  requiresAudio: true,
  requiresMicrophone: true,
};

export const ACTIVITIES_REGISTRY: ActivityConfig[] = [
  ARA_PARK_CONFIG,
];
