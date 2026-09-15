import { ActivityProvider, useActivity } from './activities/foundation/ActivityContext';
import { ActivityContainer } from './activities/foundation/ActivityContainer';
import { AraParkActivity } from './activities/ara-park/AraParkActivity';
import { Home } from './pages/Home';
import { DebugPanel } from './components/DebugPanel';

function AppContent() {
  const { activeActivity, toggleDebugPanel } = useActivity();

  return (
    <div className="relative">
      {/* Main shell - only visible when no activity is open */}
      {!activeActivity && <Home />}

      {/* Activity container overlay */}
      <ActivityContainer>
        {activeActivity?.config.id === 'ara-park' && <AraParkActivity />}
      </ActivityContainer>

      {/* Debug panel - always available */}
      <DebugPanel />

      {/* Debug toggle when activity is open */}
      {activeActivity && (
        <button
          onClick={toggleDebugPanel}
          className="fixed top-3 right-3 z-[60] w-8 h-8 rounded-lg bg-gray-900/80 border border-gray-700 flex items-center justify-center text-xs hover:border-green-500/30 transition-colors"
          title="Debug Panel"
        >
          🐛
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ActivityProvider>
      <AppContent />
    </ActivityProvider>
  );
}
