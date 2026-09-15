import { useEffect, useRef, useState, useCallback } from 'react';
import type { UnityConfig, UnityInstance } from './UnityTypes';

// Unity loader global type
declare global {
  interface Window {
    createUnityInstance?: (
      container: HTMLCanvasElement,
      config: UnityConfig,
      progressCallback?: (progress: number) => void,
    ) => Promise<UnityInstance>;
  }
}

interface UnityLoaderProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onReady: (instance: UnityInstance) => void;
  onError: (error: string) => void;
  onProgress: (progress: number) => void;
}

const UNITY_CONFIG: UnityConfig = {
  dataUrl: '/unity/Build/AraPark.data',
  frameworkUrl: '/unity/Build/AraPark.framework.js',
  codeUrl: '/unity/Build/AraPark.loader.js',
  streamingAssetsUrl: 'StreamingAssets',
  companyName: 'Trivo',
  productName: 'Ara Park',
  productVersion: '0.1.0',
};

export function useUnityLoader({ containerRef, onReady, onError, onProgress }: UnityLoaderProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loading-script' | 'loading-unity' | 'ready' | 'error' | 'fallback'>('idle');
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<UnityInstance | null>(null);
  const scriptLoadedRef = useRef(false);

  // Load Unity loader script
  const loadUnityScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (scriptLoadedRef.current || window.createUnityInstance) {
        scriptLoadedRef.current = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = UNITY_CONFIG.codeUrl;
      script.async = true;

      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }, []);

  // Initialize Unity
  const initUnity = useCallback(async () => {
    if (!containerRef.current) return;

    setStatus('loading-script');

    // Try to load Unity loader script
    const scriptLoaded = await loadUnityScript();

    if (!scriptLoaded || !window.createUnityInstance) {
      setStatus('fallback');
      onError('Unity WebGL build not found. Using Canvas 2D fallback.');
      return;
    }

    setStatus('loading-unity');

    try {
      // Find or create canvas
      let canvas = containerRef.current.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 600;
        canvas.className = 'w-full h-full';
        canvas.style.display = 'block';
        containerRef.current.appendChild(canvas);
      }

      const instance = await window.createUnityInstance(
        canvas,
        UNITY_CONFIG,
        (progress) => {
          onProgress(progress);
        },
      );

      instanceRef.current = instance;
      setStatus('ready');
      onReady(instance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Unity';
      setError(errorMessage);
      setStatus('error');
      onError(errorMessage);
    }
  }, [containerRef, loadUnityScript, onReady, onError, onProgress]);

  // Cleanup
  const quitUnity = useCallback(async () => {
    if (instanceRef.current) {
      try {
        await instanceRef.current.Quit();
      } catch (e) {
        console.warn('Unity quit error:', e);
      }
      instanceRef.current = null;
    }
  }, []);

  // Send message to Unity
  const sendMessage = useCallback((gameObject: string, method: string, value?: string) => {
    if (instanceRef.current) {
      instanceRef.current.SendMessage(gameObject, method, value || '');
    }
  }, []);

  // Set fullscreen
  const setFullscreen = useCallback((fullscreen: boolean) => {
    if (instanceRef.current) {
      instanceRef.current.SetFullscreen(fullscreen);
    }
  }, []);

  return {
    status,
    error,
    initUnity,
    quitUnity,
    sendMessage,
    setFullscreen,
    isUnityAvailable: status === 'ready',
    isFallback: status === 'fallback',
  };
}
