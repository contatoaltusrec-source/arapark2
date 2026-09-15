import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useActivity } from '../foundation/ActivityContext';
import { useUnityLoader } from './unity/UnityLoader';
import type { UnityInstance, UnityMessage } from './unity/UnityTypes';
import { AraParkCanvas } from './AraParkCanvas';

export function AraParkUnityHost() {
  const { setStatus, sendBridgeEvent, updateMetrics, closeActivity } = useActivity();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const handleUnityReady = useCallback((instance: UnityInstance) => {
    setStatus('ready');
    sendBridgeEvent({ type: 'UNITY_READY', source: 'unity' });
    
    // Send initial config to Unity
    instance.SendMessage('GameManager', 'Initialize', JSON.stringify({
      worldWidth: 3200,
      worldHeight: 3200,
      voiceRange: 180,
    }));
  }, [setStatus, sendBridgeEvent]);

  const handleUnityError = useCallback((error: string) => {
    console.warn('Unity error, using fallback:', error);
    setUseFallback(true);
    setStatus('ready');
    sendBridgeEvent({ type: 'UNITY_FALLBACK', source: 'shell', payload: { reason: error } });
  }, [setStatus, sendBridgeEvent]);

  const handleProgress = useCallback((progress: number) => {
    setLoadProgress(progress);
  }, []);

  const { status, initUnity, quitUnity, sendMessage } = useUnityLoader({
    containerRef,
    onReady: handleUnityReady,
    onError: handleUnityError,
    onProgress: handleProgress,
  });

  // Initialize Unity on mount
  useEffect(() => {
    setStatus('loading');
    initUnity();

    return () => {
      quitUnity();
    };
  }, [initUnity, quitUnity, setStatus]);

  // Handle status changes
  useEffect(() => {
    if (status === 'fallback') {
      setUseFallback(true);
    }
  }, [status]);

  // Handle messages from Unity
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UNITY_MESSAGE') {
        const message = event.data.payload as UnityMessage;
        handleUnityMessage(message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleUnityMessage = useCallback((message: UnityMessage) => {
    sendBridgeEvent({
      type: message.type,
      source: 'unity',
      payload: message.data,
    });

    // Update metrics based on Unity messages
    if (message.type === 'PLAYER_POSITION') {
      const { x, y } = message.data as { x: number; y: number };
      const cellX = Math.floor(x / 200);
      const cellY = Math.floor(y / 200);
      updateMetrics({ currentCell: `${cellX},${cellY}` });
    }
  }, [sendBridgeEvent, updateMetrics]);

  // Send mic state to Unity
  useEffect(() => {
    if (status === 'ready' && !useFallback) {
      sendMessage('AudioManager', 'SetMicActive', micActive ? '1' : '0');
    }
  }, [micActive, status, useFallback, sendMessage]);

  if (status === 'loading' || status === 'loading-script' || status === 'loading-unity') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🌳
          </div>
        </div>
        <p className="mt-6 text-green-400 text-sm font-medium">
          {status === 'loading-unity' ? 'Carregando Unity WebGL...' : 'Inicializando...'}
        </p>
        {status === 'loading-unity' && (
          <div className="mt-3 w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${loadProgress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        <p className="text-gray-600 text-xs mt-2">
          {status === 'loading-unity' ? `${Math.round(loadProgress * 100)}%` : 'Preparando ambiente'}
        </p>
      </div>
    );
  }

  if (useFallback) {
    return <AraParkCanvas />;
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 border-b border-gray-800 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg">🌳</span>
          <span className="text-white font-medium text-sm">Ara Park</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
            Unity WebGL
          </span>
        </div>
        <div className="flex items-center gap-3">
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
            onClick={closeActivity}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Unity container */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-600 bg-gray-900/70 px-3 py-2 rounded-lg backdrop-blur-sm">
          <p>WASD / Setas para mover</p>
          <p>ESC para sair</p>
        </div>
      </div>
    </div>
  );
}
