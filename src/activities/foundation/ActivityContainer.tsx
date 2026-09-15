import { type ReactNode, useEffect, useRef } from 'react';
import { useActivity } from './ActivityContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityContainerProps {
  children: ReactNode;
}

export function ActivityContainer({ children }: ActivityContainerProps) {
  const { activeActivity, closeActivity } = useActivity();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeActivity) {
        closeActivity();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeActivity, closeActivity]);

  return (
    <AnimatePresence>
      {activeActivity && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-gray-950"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
