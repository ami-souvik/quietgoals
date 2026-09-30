'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ArchiveCounterProps {
  count: number;
}

export function ArchiveCounter({ count }: ArchiveCounterProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface/60 border border-border/40 text-xs font-mono select-none"
      title="Archived goals (completed & killed)"
      aria-label={`${count} archived goals`}
    >
      <span className="text-[11px] text-text-muted">archive</span>
      <div className="relative inline-flex h-4 min-w-[12px] items-center justify-center overflow-hidden tabular-nums font-mono text-[11px] text-text-secondary">
        {shouldReduceMotion ? (
          <span>{count}</span>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="inline-block"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
