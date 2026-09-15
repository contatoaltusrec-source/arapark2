import { useState } from 'react';
import { motion } from 'framer-motion';
import { ARA_PARK_CONFIG } from '../foundation/ActivityRegistry';
import { MAP_AREAS } from './world/MapData';

interface AraParkEntryProps {
  onEnter: () => void;
}

export function AraParkEntry({ onEnter }: AraParkEntryProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-950 via-green-950/30 to-gray-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Stars / particles */}
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1 + Math.random() * 3,
              height: 1 + Math.random() * 3,
              backgroundColor: ['#22c55e', '#a855f7', '#3b82f6', '#f59e0b', '#06b6d4'][i % 5],
              opacity: 0.15 + Math.random() * 0.3,
            }}
            initial={{
              x: Math.random() * 1200,
              y: Math.random() * 800,
            }}
            animate={{
              y: [null, -30, 30, -15, 0],
              x: [null, 10, -10, 5, 0],
              opacity: [0.1, 0.4, 0.2, 0.35, 0.1],
            }}
            transition={{
              duration: 5 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        {/* Gradient orbs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }}
          animate={{ x: [0, 50, -30, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)', right: '10%', top: '20%' }}
          animate={{ x: [0, -40, 30, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="relative"
        >
          <div className="text-7xl mb-2 drop-shadow-lg">🌳</div>
          <motion.div
            className="absolute -inset-4 rounded-full bg-green-500/10 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
            Ara Park
          </h1>
          <p className="text-green-300/70 text-base md:text-lg max-w-lg mx-auto px-6 leading-relaxed">
            {ARA_PARK_CONFIG.description}
          </p>
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Protótipo experimental
          </span>
        </motion.div>

        {/* Areas preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-2 max-w-md px-4"
        >
          {MAP_AREAS.slice(0, 6).map((area, i) => (
            <motion.span
              key={area.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{
                color: area.color,
                borderColor: area.color + '30',
                backgroundColor: area.color + '08',
              }}
            >
              {area.icon} {area.name}
            </motion.span>
          ))}
          <span className="text-xs px-2.5 py-1 rounded-full text-gray-500 border border-gray-800">
            +{MAP_AREAS.length - 6} áreas
          </span>
        </motion.div>

        {/* Enter button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-10"
        >
          <button
            onClick={onEnter}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="relative group px-12 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-gray-950 font-bold text-lg transition-all duration-300 shadow-xl shadow-green-500/25 hover:shadow-green-400/40 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              ENTRAR NO PARQUE
              <motion.span
                animate={{ x: hovering ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                →
              </motion.span>
            </span>
            {hovering && (
              <motion.div
                layoutId="ara-park-glow"
                className="absolute inset-0 rounded-2xl bg-green-300/20 blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">🗺️ Mapa 3200×3200</span>
            <span className="flex items-center gap-1">🎮 Pixel Art</span>
            <span className="flex items-center gap-1">🔊 Voz espacial</span>
          </div>
          <p className="text-gray-600 text-xs">
            WASD para mover • ESC para sair • M para minimap
          </p>
        </motion.div>
      </div>
    </div>
  );
}
