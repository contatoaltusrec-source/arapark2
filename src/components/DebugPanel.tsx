import { useActivity } from '../activities/foundation/ActivityContext';
import { motion } from 'framer-motion';

export function DebugPanel() {
  const { debugPanelOpen, toggleDebugPanel, metrics, bridgeLog, activeActivity } = useActivity();

  if (!debugPanelOpen) {
    return (
      <button
        onClick={toggleDebugPanel}
        className="fixed bottom-4 right-4 z-[60] px-3 py-2 rounded-lg bg-gray-900/90 border border-gray-700 text-gray-400 text-xs hover:text-green-400 hover:border-green-500/30 transition-colors backdrop-blur-sm"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed bottom-4 right-4 z-[60] w-80 max-h-[70vh] overflow-y-auto rounded-xl bg-gray-900/95 border border-gray-700 backdrop-blur-sm shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-bold text-green-400">ARA PARK DEBUG</h3>
        <button
          onClick={toggleDebugPanel}
          className="text-gray-500 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="FPS" value={metrics.fps} color={metrics.fps > 50 ? 'green' : metrics.fps > 30 ? 'yellow' : 'red'} />
          <MetricBox label="Frame (ms)" value={metrics.frameTime.toFixed(1)} />
          <MetricBox label="Memory" value={`${metrics.memoryMB} MB`} />
          <MetricBox label="Ping" value={`${metrics.ping} ms`} />
          <MetricBox label="Entities" value={metrics.entitiesRendered} />
          <MetricBox label="Known" value={metrics.entitiesKnown} />
          <MetricBox label="Voice Users" value={metrics.voiceUsers} color="green" />
          <MetricBox label="Cell" value={metrics.currentCell} />
          <MetricBox label="Msg/s" value={metrics.messagesPerSecond} />
          <MetricBox label="RX" value={`${metrics.rxBytes} B`} />
          <MetricBox label="TX" value={`${metrics.txBytes} B`} />
          <MetricBox label="Activity" value={activeActivity?.config.id || '—'} />
        </div>

        {/* Bridge log */}
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Bridge Events ({bridgeLog.length})</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {bridgeLog.slice(-10).reverse().map((event, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  event.source === 'unity' ? 'bg-blue-400' :
                  event.source === 'livekit' ? 'bg-purple-400' : 'bg-green-400'
                }`} />
                <span className="text-gray-500 font-mono">{event.type}</span>
                <span className="text-gray-600 ml-auto">{event.source}</span>
              </div>
            ))}
            {bridgeLog.length === 0 && (
              <p className="text-gray-600 text-xs italic">Nenhum evento</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass = color === 'green' ? 'text-green-400' :
                     color === 'yellow' ? 'text-yellow-400' :
                     color === 'red' ? 'text-red-400' : 'text-white';

  return (
    <div className="bg-gray-800/50 rounded-lg px-3 py-2">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-mono font-medium ${colorClass}`}>{value}</div>
    </div>
  );
}
