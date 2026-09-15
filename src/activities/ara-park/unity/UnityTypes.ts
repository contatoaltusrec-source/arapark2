export interface UnityConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl?: string;
  companyName?: string;
  productName?: string;
  productVersion?: string;
}

export interface UnityInstance {
  SendMessage: (gameObject: string, method: string, value?: string) => void;
  Quit: () => Promise<void>;
  SetFullscreen: (fullscreen: boolean) => void;
}

export interface UnityBridgeEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
}

export interface UnityMessage {
  type: 'PLAYER_POSITION' | 'PLAYER_DIRECTION' | 'PLAYER_MOVE' | 'PLAYER_STOP' | 'EMOTE' | 'INTERACT';
  data: Record<string, unknown>;
}

export type UnityEventType = 
  | 'UNITY_LOADED'
  | 'UNITY_ERROR'
  | 'PLAYER_MOVE'
  | 'PLAYER_POSITION'
  | 'EMOTE_REQUEST'
  | 'INTERACT_REQUEST'
  | 'WORLD_READY';
