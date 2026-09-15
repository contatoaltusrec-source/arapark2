import { motion } from 'framer-motion';
import { ARA_PARK_CONFIG } from '../activities/foundation/ActivityRegistry';
import { useActivity } from '../activities/foundation/ActivityContext';
import { MAP_AREAS } from '../activities/ara-park/world/MapData';

export function Home() {
  const { openActivity, activeActivity } = useActivity();
  const isActive = activeActivity?.config.id === 'ara-park';

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

      {/* Hero - Ara Park */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center gap-12"
        >
          {/* Left - Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{ARA_PARK_CONFIG.icon}</span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Ara Park
                </h1>
                <p className="text-green-400 text-sm mt-1">Espaço social 2D multiplayer</p>
              </div>
            </div>

            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              {ARA_PARK_CONFIG.description}
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                🗺️ Mundo 3200×3200
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                🔊 Voz por proximidade
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                🎮 Pixel Art
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                📱 Mobile ready
              </span>
            </div>

            <button
              onClick={() => !isActive && openActivity(ARA_PARK_CONFIG)}
              disabled={isActive}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-gray-950 shadow-xl shadow-green-500/25 hover:shadow-green-400/40 hover:scale-105 active:scale-95'
              }`}
            >
              {isActive ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  No Ara Park
                </span>
              ) : (
                <span>ENTRAR NO PARQUE →</span>
              )}
            </button>
          </div>

          {/* Right - Visual preview */}
          <div className="flex-1 w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-square rounded-3xl overflow-hidden border border-gray-800 bg-gray-900/50"
            >
              {/* Mini world preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-950/50 via-gray-900 to-green-950/30">
                {/* Area grid */}
                <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-1 opacity-40">
                  {MAP_AREAS.map((area) => (
                    <div
                      key={area.id}
                      className="rounded-lg border"
                      style={{
                        backgroundColor: area.color + '15',
                        borderColor: area.color + '30',
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {area.icon}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Animated dots (players) */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{ backgroundColor: ['#f472b6', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399', '#fb923c', '#f87171', '#2dd4bf'][i] }}
                    animate={{
                      x: [100 + Math.random() * 200, 150 + Math.random() * 150, 100 + Math.random() * 200],
                      y: [100 + Math.random() * 200, 150 + Math.random() * 150, 100 + Math.random() * 200],
                    }}
                    transition={{
                      duration: 8 + Math.random() * 4,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}

                {/* Center fountain */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xl">⛲</span>
                </motion.div>
              </div>

              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950/90 to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Preview do mundo</span>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Ao vivo
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Areas section */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-2">Áreas do Parque</h2>
          <p className="text-gray-400 text-sm mb-8">Explore {MAP_AREAS.length} áreas temáticas, cada uma com sua atmosfera única.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MAP_AREAS.map((area, i) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
                className="relative rounded-2xl border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 hover:bg-gray-900/80 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: area.color + '15', border: `1px solid ${area.color}30` }}
                  >
                    {area.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white group-hover:text-green-300 transition-colors">
                      {area.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">{area.description}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                  <span>{area.bounds.w}×{area.bounds.h}</span>
                  <span>•</span>
                  <span style={{ color: area.color + '99' }}>
                    {Math.floor(area.bounds.w * area.bounds.h / 10000)}m²
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-8">Como funciona</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🚶"
              title="Caminhe livremente"
              description="Explore o mapa com WASD ou setas. O mundo é grande e cheio de surpresas."
              delay={0.7}
            />
            <FeatureCard
              icon="🔊"
              title="Voz por proximidade"
              description="Aproxime-se de alguém para ouvir. A distância define a conversa naturalmente."
              delay={0.8}
            />
            <FeatureCard
              icon="👥"
              title="Socialize"
              description="Encontre amigos, faça novos conhecidos e aproveite as áreas temáticas."
              delay={0.9}
            />
          </div>
        </motion.div>
      </section>

      {/* Technical info */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/30 p-6"
        >
          <h3 className="text-sm font-medium text-gray-400 mb-4">Stack Técnica</h3>
          <div className="flex flex-wrap gap-3">
            {['React', 'TypeScript', 'Canvas 2D', 'AOI System', 'Spatial Hash', 'Voice Proximity', 'LiveKit (futuro)', 'Unity WebGL (futuro)'].map(tech => (
              <span key={tech} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 border border-gray-800">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Trivo Activities Lab — Protótipo experimental</span>
            <span>Ara Park v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  );
}
