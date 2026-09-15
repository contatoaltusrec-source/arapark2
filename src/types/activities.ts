export type ActivityStatus = 'idle' | 'loading' | 'ready' | 'error' | 'closing';

export interface ActivityConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  maxPlayers?: number;
  requiresAudio?: boolean;
  requiresMicrophone?: boolean;
}

export interface ActivityInstance {
  id: string;
  config: ActivityConfig;
  status: ActivityStatus;
  error?: string;
  startedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface ActivityLifecycle {
  mount: () => void;
  unmount: () => void;
  restart: () => void;
  reportError: (error: string) => void;
}

export interface ActivityBridgeEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
  source: 'unity' | 'shell' | 'livekit';
}

export interface DebugMetrics {
  fps: number;
  frameTime: number;
  memoryMB: number;
  entitiesRendered: number;
  entitiesKnown: number;
  voiceUsers: number;
  currentCell: string;
  messagesPerSecond: number;
  rxBytes: number;
  txBytes: number;
  ping: number;
}
