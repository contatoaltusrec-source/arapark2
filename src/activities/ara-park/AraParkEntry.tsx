import { useState } from 'react';
import { motion } from 'framer-motion';
import { ARA_PARK_CONFIG } from '../foundation/ActivityRegistry';

interface AraParkEntryProps {
  onEnter: () => void;
}

export function AraParkEntry({ onEnter }: AraParkEntryProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-950 via-green-950/20 to-gray-950 relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
            }}
            animate={{
              y: [null, -20, 20, -10, 0],
              opacity: [0.2, 0.6, 0.3, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Logo / Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10"
      >
        <div className="text-6xl mb-4">{ARA_PARK_CONFIG.icon}</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
          Ara Park
        </h1>
        <p className="text-green-300/70 text-sm md:text-base max-w-md mx-auto px-4">
          {ARA_PARK_CONFIG.description}
        </p>
      </motion.div>

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 z-10"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Protótipo experimental
        </span>
      </motion.div>

      {/* Enter button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 z-10"
      >
        <button
          onClick={onEnter}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="relative group px-10 py-4 rounded-xl bg-green-500 hover:bg-green-400 text-gray-950 font-bold text-lg transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-400/40 hover:scale-105 active:scale-95"
        >
          <span className="relative z-10">ENTRAR</span>
          {hovering && (
            <motion.div
              layoutId="ara-park-glow"
              className="absolute inset-0 rounded-xl bg-green-300/20 blur-xl"
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
        transition={{ delay: 0.8 }}
        className="mt-8 text-center z-10"
      >
        <p className="text-gray-500 text-xs">
          Unity WebGL • LiveKit • Voz por proximidade
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Pressione ESC para sair
        </p>
      </motion.div>
    </div>
  );
}
