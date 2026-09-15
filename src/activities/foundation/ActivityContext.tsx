import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { ActivityConfig, ActivityInstance, ActivityStatus, ActivityBridgeEvent, DebugMetrics } from '../../types/activities';

interface ActivityContextValue {
  activeActivity: ActivityInstance | null;
  openActivity: (config: ActivityConfig) => void;
  closeActivity: () => void;
  restartActivity: () => void;
  setStatus: (status: ActivityStatus, error?: string) => void;
  sendBridgeEvent: (event: Omit<ActivityBridgeEvent, 'timestamp'>) => void;
  bridgeLog: ActivityBridgeEvent[];
  metrics: DebugMetrics;
  updateMetrics: (partial: Partial<DebugMetrics>) => void;
  debugPanelOpen: boolean;
  toggleDebugPanel: () => void;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activeActivity, setActiveActivity] = useState<ActivityInstance | null>(null);
  const [bridgeLog, setBridgeLog] = useState<ActivityBridgeEvent[]>([]);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [metrics, setMetrics] = useState<DebugMetrics>({
    fps: 0,
    frameTime: 0,
    memoryMB: 0,
    entitiesRendered: 0,
    entitiesKnown: 0,
    voiceUsers: 0,
    currentCell: '0,0',
    messagesPerSecond: 0,
    rxBytes: 0,
    txBytes: 0,
    ping: 0,
  });

  const fpsRef = useRef<number[]>([]);
  const lastFrameRef = useRef(performance.now());
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!activeActivity || activeActivity.status !== 'ready') return;

    const measure = () => {
      const now = performance.now();
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      fpsRef.current.push(1000 / delta);
      if (fpsRef.current.length > 60) fpsRef.current.shift();

      const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;

      setMetrics(prev => ({
        ...prev,
        fps: Math.round(avgFps),
        frameTime: Math.round(delta * 100) / 100,
        memoryMB: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : prev.memoryMB,
      }));

      animFrameRef.current = requestAnimationFrame(measure);
    };

    animFrameRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeActivity?.status]);

  const openActivity = useCallback((config: ActivityConfig) => {
    setActiveActivity({
      id: `${config.id}-${Date.now()}`,
      config,
      status: 'loading',
      startedAt: Date.now(),
    });
    setBridgeLog([]);
  }, []);

  const closeActivity = useCallback(() => {
    setActiveActivity(prev => prev ? { ...prev, status: 'closing' } : null);
    setTimeout(() => setActiveActivity(null), 300);
    setBridgeLog([]);
  }, []);

  const restartActivity = useCallback(() => {
    if (!activeActivity) return;
    const config = activeActivity.config;
    closeActivity();
    setTimeout(() => openActivity(config), 400);
  }, [activeActivity, closeActivity, openActivity]);

  const setStatus = useCallback((status: ActivityStatus, error?: string) => {
    setActiveActivity(prev => prev ? { ...prev, status, error } : null);
  }, []);

  const sendBridgeEvent = useCallback((event: Omit<ActivityBridgeEvent, 'timestamp'>) => {
    const fullEvent: ActivityBridgeEvent = { ...event, timestamp: Date.now() };
    setBridgeLog(prev => [...prev.slice(-49), fullEvent]);
  }, []);

  const updateMetrics = useCallback((partial: Partial<DebugMetrics>) => {
    setMetrics(prev => ({ ...prev, ...partial }));
  }, []);

  const toggleDebugPanel = useCallback(() => setDebugPanelOpen(prev => !prev), []);

  return (
    <ActivityContext.Provider value={{
      activeActivity,
      openActivity,
      closeActivity,
      restartActivity,
      setStatus,
      sendBridgeEvent,
      bridgeLog,
      metrics,
      updateMetrics,
      debugPanelOpen,
      toggleDebugPanel,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}
