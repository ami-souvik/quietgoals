'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Goal } from '@/db/schema';

interface ArchiveListProps {
  archivedGoals: Goal[];
  onRestore: (goal: Goal) => void;
  onDeleteForever: (goalId: string) => void;
  onBackToActive: () => void;
}

function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ArchiveList({
  archivedGoals,
  onRestore,
  onDeleteForever,
  onBackToActive,
}: ArchiveListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const handleDeleteClick = (goalId: string) => {
    if (confirmDeleteId === goalId) {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
      setConfirmDeleteId(null);
      onDeleteForever(goalId);
    } else {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
      setConfirmDeleteId(goalId);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
        confirmTimerRef.current = null;
      }, 2000);
    }
  };

  const completedGoals = archivedGoals.filter((g) => g.status === 'completed');
  const killedGoals = archivedGoals.filter((g) => g.status === 'killed');
  const isEmpty = archivedGoals.length === 0;

  return (
    <div className="space-y-6">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <p className="text-xs text-text-muted font-mono">
            no archived goals — complete or kill a goal to see it here
          </p>
          <button
            type="button"
            onClick={onBackToActive}
            className="text-xs text-gold hover:underline font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold rounded px-1.5 py-0.5"
          >
            ← back to active (esc)
          </button>
        </div>
      ) : (
        <>
          {/* Completed Group */}
          {completedGoals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted/70">
                  Completed
                </span>
                <span className="text-[11px] font-mono text-text-muted/50 tabular-nums">
                  {completedGoals.length}
                </span>
              </div>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {completedGoals.map((goal) => (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: -8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="group flex min-h-[52px] items-center justify-between rounded-lg border border-border bg-surface py-3 px-4 transition-colors hover:border-border-subtle hover:bg-surface-hover"
                    >
                      {/* Left: Gold check + Title */}
                      <div className="flex items-start gap-3 min-w-0 flex-1 mr-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold mt-0.5">
                          <svg
                            className="h-3 w-3 stroke-[2.5]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </span>
                        <span className="break-words whitespace-normal text-sm font-normal text-text-primary">
                          {goal.title}
                        </span>
                      </div>

                      {/* Right: Relative Time + Actions (Restore, Delete forever) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-text-muted mr-1">
                          {formatRelativeTime(goal.archivedAt)}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Restore */}
                          <button
                            type="button"
                            onClick={() => onRestore(goal)}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-mono text-text-muted hover:text-gold hover:bg-surface-active transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
                            title="Restore goal (move back to active list)"
                            aria-label={`Restore: ${goal.title}`}
                          >
                            <svg
                              className="h-3.5 w-3.5 stroke-[2]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                              />
                            </svg>
                            <span className="hidden sm:inline">restore</span>
                          </button>

                          {/* Delete Forever with inline confirm */}
                          {confirmDeleteId === goal.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(goal.id)}
                              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-mono text-ember bg-ember-muted/30 border border-ember/50 hover:bg-ember-muted/60 transition-all cursor-pointer animate-pulse focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember"
                              title="Click again to delete forever"
                              aria-label="Confirm delete forever"
                            >
                              <span>press again to confirm</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(goal.id)}
                              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-mono text-text-muted hover:text-ember hover:bg-ember-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember"
                              title="Delete forever"
                              aria-label={`Delete forever: ${goal.title}`}
                            >
                              <svg
                                className="h-3.5 w-3.5 stroke-[2]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                              <span className="hidden sm:inline">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Killed Group */}
          {killedGoals.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted/70">
                  Killed
                </span>
                <span className="text-[11px] font-mono text-text-muted/50 tabular-nums">
                  {killedGoals.length}
                </span>
              </div>

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {killedGoals.map((goal) => (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: -8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="group flex min-h-[52px] items-center justify-between rounded-lg border border-border bg-surface py-3 px-4 transition-colors hover:border-border-subtle hover:bg-surface-hover"
                    >
                      {/* Left: Ember cross mark + Title */}
                      <div className="flex items-start gap-3 min-w-0 flex-1 mr-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ember-muted/20 text-ember mt-0.5">
                          <svg
                            className="h-3 w-3 stroke-[2.5]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </span>
                        <span className="break-words whitespace-normal text-sm font-normal text-text-secondary">
                          {goal.title}
                        </span>
                      </div>

                      {/* Right: Relative Time + Actions (Restore, Delete forever) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-text-muted mr-1">
                          {formatRelativeTime(goal.archivedAt)}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Restore */}
                          <button
                            type="button"
                            onClick={() => onRestore(goal)}
                            className="flex h-7 items-center gap-1 rounded px-2 text-xs font-mono text-text-muted hover:text-gold hover:bg-surface-active transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
                            title="Restore goal (move back to active list)"
                            aria-label={`Restore: ${goal.title}`}
                          >
                            <svg
                              className="h-3.5 w-3.5 stroke-[2]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                              />
                            </svg>
                            <span className="hidden sm:inline">restore</span>
                          </button>

                          {/* Delete Forever with inline confirm */}
                          {confirmDeleteId === goal.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(goal.id)}
                              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-mono text-ember bg-ember-muted/30 border border-ember/50 hover:bg-ember-muted/60 transition-all cursor-pointer animate-pulse focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember"
                              title="Click again to delete forever"
                              aria-label="Confirm delete forever"
                            >
                              <span>press again to confirm</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(goal.id)}
                              className="flex h-7 items-center gap-1 rounded px-2 text-xs font-mono text-text-muted hover:text-ember hover:bg-ember-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember"
                              title="Delete forever"
                              aria-label={`Delete forever: ${goal.title}`}
                            >
                              <svg
                                className="h-3.5 w-3.5 stroke-[2]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                              <span className="hidden sm:inline">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer hint */}
      <footer className="mt-8 flex items-center justify-between px-1 text-xs text-text-muted font-mono">
        <span className="tabular-nums">
          {archivedGoals.length} {archivedGoals.length === 1 ? 'archived goal' : 'archived goals'}
        </span>
        <button
          type="button"
          onClick={onBackToActive}
          className="text-[11px] text-text-muted/70 hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold rounded px-1 py-0.5"
        >
          <span>press esc or a to return</span>
        </button>
      </footer>
    </div>
  );
}
