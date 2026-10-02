'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Goal, GoalPriority, GoalStatus } from '@/db/schema';
import { PriorityIndicator } from './GoalRow';

interface KanbanBoardProps {
  goals: Goal[];
  archivedGoals?: Goal[];
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
  onArchiveGoal: (goal: Goal, status: 'completed' | 'killed') => void;
  onCreateGoal: (title: string, status?: GoalStatus) => void;
  onRestoreGoal?: (goal: Goal) => void;
}

const COLUMNS: {
  id: GoalStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    id: 'not-started',
    title: 'Not started',
    dotColor: 'bg-zinc-400',
    badgeBg: 'bg-zinc-500/10 border-border',
    badgeText: 'text-text-secondary',
  },
  {
    id: 'in-progress',
    title: 'In progress',
    dotColor: 'bg-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    badgeText: 'text-sky-300',
  },
  {
    id: 'completed',
    title: 'Completed',
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-300',
  },
];

export function KanbanBoard({
  goals,
  archivedGoals = [],
  onUpdateGoal,
  onArchiveGoal,
  onCreateGoal,
}: KanbanBoardProps) {
  const [newTitleByColumn, setNewTitleByColumn] = useState<Record<string, string>>({});
  const [activeInputColumn, setActiveInputColumn] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Group goals into columns
  const getGoalsForColumn = (columnId: GoalStatus): Goal[] => {
    if (columnId === 'completed') {
      const activeCompleted = goals.filter((g) => g.status === 'completed');
      const archivedCompleted = archivedGoals.filter((g) => g.status === 'completed');
      return [...activeCompleted, ...archivedCompleted];
    }
    if (columnId === 'in-progress') {
      return goals.filter((g) => g.status === 'in-progress');
    }
    // 'not-started': includes 'not-started' and legacy 'active'
    return goals.filter(
      (g) => g.status === 'not-started' || g.status === 'active' || (!g.status && g.status !== 'completed')
    );
  };

  const handleCreate = (columnId: GoalStatus) => {
    const title = (newTitleByColumn[columnId] || '').trim();
    if (!title) return;
    onCreateGoal(title, columnId);
    setNewTitleByColumn((prev) => ({ ...prev, [columnId]: '' }));
    setActiveInputColumn(null);
  };

  const moveColumn = (goal: Goal, targetStatus: GoalStatus) => {
    if (targetStatus === 'completed') {
      onArchiveGoal(goal, 'completed');
    } else {
      onUpdateGoal(goal.id, { status: targetStatus });
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-start">
        {COLUMNS.map((col) => {
          const colGoals = getGoalsForColumn(col.id);
          const isAdding = activeInputColumn === col.id;

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-xl border border-border/70 bg-surface/50 p-3 min-h-[480px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-border/40 mb-3 select-none">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-medium text-text-primary tracking-wide">
                    {col.title}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-surface-active text-text-muted">
                    {colGoals.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveInputColumn(isAdding ? null : col.id);
                    setNewTitleByColumn((prev) => ({ ...prev, [col.id]: '' }));
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-active transition-colors cursor-pointer text-xs"
                  title={`Add task to ${col.title}`}
                >
                  +
                </button>
              </div>

              {/* Inline Add Input at top of column */}
              <AnimatePresence>
                {isAdding && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3 rounded-lg border border-gold/50 bg-surface p-2.5 shadow-sm space-y-2"
                  >
                    <input
                      type="text"
                      value={newTitleByColumn[col.id] || ''}
                      onChange={(e) =>
                        setNewTitleByColumn((prev) => ({ ...prev, [col.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreate(col.id);
                        } else if (e.key === 'Escape') {
                          setActiveInputColumn(null);
                        }
                      }}
                      placeholder={`New ${col.title.toLowerCase()} task...`}
                      className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                      maxLength={200}
                      autoFocus
                    />
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-[10px] font-mono text-text-muted">press enter</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveInputColumn(null)}
                          className="px-2 py-0.5 text-[10px] text-text-muted hover:text-text-secondary rounded cursor-pointer"
                        >
                          cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreate(col.id)}
                          className="px-2.5 py-0.5 text-[10px] font-medium bg-gold text-bg rounded hover:bg-gold-light cursor-pointer"
                        >
                          add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cards List */}
              <div className="space-y-2.5 flex-1">
                {colGoals.length === 0 && !isAdding && (
                  <div className="py-12 text-center text-xs text-text-muted font-mono select-none">
                    no tasks
                  </div>
                )}

                {colGoals.map((goal, index) => {
                  const isExpanded = expandedCardId === goal.id;

                  return (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`rounded-lg border transition-all ${
                        isExpanded
                          ? 'border-gold/60 bg-surface shadow-md'
                          : 'border-border/80 bg-surface/90 hover:border-border hover:bg-surface'
                      }`}
                    >
                      {/* Card Header & Title */}
                      <div
                        onClick={() => setExpandedCardId(isExpanded ? null : goal.id)}
                        className="p-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-text-muted">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <PriorityIndicator
                              priority={goal.priority}
                              onClick={() => {
                                const nextPrio: Record<GoalPriority, GoalPriority> = {
                                  none: 'low',
                                  low: 'medium',
                                  medium: 'high',
                                  high: 'none',
                                };
                                onUpdateGoal(goal.id, { priority: nextPrio[goal.priority] });
                              }}
                            />

                            {/* Move Column Arrows */}
                            {col.id === 'not-started' && (
                              <button
                                type="button"
                                onClick={() => moveColumn(goal, 'in-progress')}
                                className="h-5 w-5 flex items-center justify-center rounded text-text-muted hover:text-sky-400 hover:bg-surface-active text-xs cursor-pointer"
                                title="Move to In progress"
                              >
                                →
                              </button>
                            )}
                            {col.id === 'in-progress' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => moveColumn(goal, 'not-started')}
                                  className="h-5 w-5 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-active text-xs cursor-pointer"
                                  title="Move to Not started"
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveColumn(goal, 'completed')}
                                  className="h-5 w-5 flex items-center justify-center rounded text-text-muted hover:text-emerald-400 hover:bg-surface-active text-xs cursor-pointer"
                                  title="Move to Completed"
                                >
                                  ✓
                                </button>
                              </>
                            )}
                            {col.id === 'completed' && (
                              <button
                                type="button"
                                onClick={() => moveColumn(goal, 'in-progress')}
                                className="h-5 w-5 flex items-center justify-center rounded text-text-muted hover:text-sky-400 hover:bg-surface-active text-xs cursor-pointer"
                                title="Move back to In progress"
                              >
                                ←
                              </button>
                            )}
                          </div>
                        </div>

                        <p className={`text-xs font-normal break-words leading-relaxed ${
                          col.id === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'
                        }`}>
                          {goal.title}
                        </p>

                        {/* Snippets / metadata if present */}
                        {(goal.description || goal.link) && !isExpanded && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 text-[10px] text-text-muted">
                            {goal.description && (
                              <span className="flex items-center gap-1" title="Has description">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7" />
                                </svg>
                                <span>note</span>
                              </span>
                            )}
                            {goal.link && (
                              <span className="flex items-center gap-1 text-gold/80" title={goal.link}>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span>link</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded View inside Card */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-3 pb-3 pt-1 border-t border-border/50 space-y-3 cursor-default"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Description Textarea */}
                            <div>
                              <textarea
                                value={goal.description || ''}
                                onChange={(e) =>
                                  onUpdateGoal(goal.id, { description: e.target.value })
                                }
                                placeholder="Add a description..."
                                rows={2}
                                className="w-full rounded-md border border-border/70 bg-bg/60 p-2 text-xs text-text-primary placeholder:text-text-muted focus:border-gold/60 focus:outline-none resize-none"
                              />
                            </div>

                            {/* Link input */}
                            <div>
                              <input
                                type="url"
                                value={goal.link || ''}
                                onChange={(e) => onUpdateGoal(goal.id, { link: e.target.value })}
                                placeholder="Add a link (https://...)"
                                className="w-full rounded-md border border-border/70 bg-bg/60 px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-gold/60 focus:outline-none"
                              />
                              {goal.link && (
                                <a
                                  href={goal.link.startsWith('http') ? goal.link : `https://${goal.link}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline mt-1"
                                >
                                  <span>open link</span>
                                  <span>↗</span>
                                </a>
                              )}
                            </div>

                            {/* Bottom Card Actions */}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onArchiveGoal(goal, 'completed')}
                                  className="px-2.5 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onArchiveGoal(goal, 'killed')}
                                  className="px-2.5 py-1 rounded bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  kill
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setExpandedCardId(null)}
                                className="px-3 py-1 rounded bg-surface-active hover:bg-surface border border-border text-[11px] text-text-primary font-medium transition-colors cursor-pointer"
                              >
                                done
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
