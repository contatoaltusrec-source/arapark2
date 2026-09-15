import { motion } from 'framer-motion';
import { ACTIVITIES_REGISTRY } from '../activities/foundation/ActivityRegistry';
import { useActivity } from '../activities/foundation/ActivityContext';

export function Home() {
  const { openActivity, activeActivity } = useActivity();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold">
              T
            </div>
            <span className="font-semibold text-lg">Trivo</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Activities Lab</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">Amigos</span>
            <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">Mensagens</span>
            <span className="text-green-400 font-medium">Activities</span>
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
              👤
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Activities
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Experiências sociais interativas para você e seus amigos. 
            Entre, explore e converse naturalmente.
          </p>
        </motion.div>
      </section>

      {/* Activities Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACTIVITIES_REGISTRY.map((activity, i) => {
            const isAvailable = activity.id === 'ara-park';
            const isActive = activeActivity?.config.id === activity.id;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 transition-all duration-200 ${
                  isActive
                    ? 'border-green-500/50 bg-green-500/5'
                    : isAvailable
                    ? 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900/80 cursor-pointer'
                    : 'border-gray-800/50 bg-gray-900/30 opacity-60'
                }`}
                onClick={() => isAvailable && !isActive && openActivity(activity)}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Ativa
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="text-4xl mb-4">{activity.icon}</div>

                {/* Info */}
                <h3 className="text-lg font-semibold mb-1">{activity.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{activity.description}</p>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isAvailable ? (
                    <>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        Disponível
                      </span>
                      {activity.requiresAudio && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          🔊 Áudio
                        </span>
                      )}
                      {activity.requiresMicrophone && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          🎤 Mic
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-500 border border-gray-700">
                      Em breve
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer info */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Trivo Activities Lab — Protótipo experimental</span>
            <span>React + Unity WebGL + LiveKit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
