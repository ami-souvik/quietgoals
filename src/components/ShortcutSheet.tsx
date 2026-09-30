'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface ShortcutSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['n'], label: 'New goal at bottom' },
  { keys: ['Shift', 'N'], label: 'New goal below focused' },
  { keys: ['↑', '↓', 'or', 'k', 'j'], label: 'Navigate goals' },
  { keys: ['Enter', 'or', 'e'], label: 'Edit title' },
  { keys: ['Alt', '↑', '↓'], label: 'Move row up / down' },
  { keys: ['1', '2', '3', '0'], label: 'Set priority (high, med, low, none)' },
  { keys: ['c'], label: 'Complete goal' },
  { keys: ['x'], label: 'Kill goal' },
  { keys: ['a'], label: 'Toggle active / archive' },
  { keys: ['?'], label: 'Toggle shortcuts' },
  { keys: ['Esc'], label: 'Close / cancel' },
];

export function ShortcutSheet({ isOpen, onClose }: ShortcutSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="relative w-full max-w-[420px] rounded-xl border border-border bg-surface p-5 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Keyboard Shortcuts
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shortcuts dialog"
                className="flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-surface-active transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
              >
                <span>esc</span>
                <kbd className="text-[10px]">✕</kbd>
              </button>
            </div>

            {/* List of Shortcuts */}
            <ul className="mt-3 space-y-2 text-xs">
              {SHORTCUTS.map((s, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between py-1 border-b border-border/20 last:border-0"
                >
                  <span className="text-text-secondary">{s.label}</span>
                  <div className="flex items-center gap-1 font-mono">
                    {s.keys.map((k, kIdx) =>
                      k === 'or' ? (
                        <span key={kIdx} className="text-[10px] text-text-muted px-0.5">
                          or
                        </span>
                      ) : (
                        <kbd
                          key={kIdx}
                          className="rounded border border-border bg-bg/60 px-1.5 py-0.5 text-[11px] text-text-primary shadow-xs"
                        >
                          {k}
                        </kbd>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
