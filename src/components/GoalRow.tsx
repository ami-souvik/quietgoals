'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type DragControls } from 'framer-motion';
import type { Goal, GoalPriority, GoalStatus } from '@/db/schema';

export interface GoalRowProps {
  goal: Goal;
  index: number;
  isFocused: boolean;
  isEditing: boolean;
  isExpanded?: boolean;
  exitStatus?: 'completed' | 'killed' | null;
  shouldReduceMotion?: boolean | null;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: (newTitle: string) => void;
  onCancelEdit: () => void;
  onToggleExpand?: () => void;
  onUpdateGoal?: (updates: Partial<Goal>) => void;
  onCyclePriority: () => void;
  onComplete: () => void;
  onKill: () => void;
  dragControls?: DragControls;
}

export function PriorityIndicator({
  priority,
  onClick,
  disabled,
}: {
  priority: GoalPriority;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const barsActive =
    priority === 'high' ? 3 : priority === 'medium' ? 2 : priority === 'low' ? 1 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group/priority flex h-7 items-center gap-1 rounded px-1.5 hover:bg-surface-active transition-colors cursor-pointer select-none disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
      title={`Priority: ${priority} (click to cycle, or press 1/2/3/0)`}
      aria-label={`Priority: ${priority}. Click or press 1, 2, 3, 0 to change.`}
    >
      <div className="flex items-end gap-[2.5px] h-3">
        <span
          className={`w-[2.5px] rounded-full transition-colors ${
            barsActive >= 1
              ? priority === 'high'
                ? 'bg-gold h-2'
                : 'bg-text-secondary h-2'
              : 'bg-border/60 group-hover/priority:bg-text-muted h-1.5'
          }`}
        />
        <span
          className={`w-[2.5px] rounded-full transition-colors ${
            barsActive >= 2
              ? priority === 'high'
                ? 'bg-gold h-2.5'
                : 'bg-text-secondary h-2.5'
              : 'bg-border/60 group-hover/priority:bg-text-muted h-1.5'
          }`}
        />
        <span
          className={`w-[2.5px] rounded-full transition-colors ${
            barsActive >= 3
              ? 'bg-gold h-3 shadow-xs shadow-gold/30'
              : 'bg-border/60 group-hover/priority:bg-text-muted h-1.5'
          }`}
        />
      </div>
    </button>
  );
}

export function GoalRow({
  goal,
  index,
  isFocused,
  isEditing,
  isExpanded = false,
  exitStatus,
  shouldReduceMotion,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleExpand,
  onUpdateGoal,
  onCyclePriority,
  onComplete,
  onKill,
  dragControls,
}: GoalRowProps) {
  const [editTitle, setEditTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || '');
  const [linkInput, setLinkInput] = useState(goal.link || '');
  const [isAddingLink, setIsAddingLink] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const isExiting = Boolean(exitStatus);

  useEffect(() => {
    setEditTitle(goal.title);
  }, [goal.title]);

  useEffect(() => {
    setDescription(goal.description || '');
  }, [goal.description]);

  useEffect(() => {
    setLinkInput(goal.link || '');
  }, [goal.link]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isFocused && !isEditing && !isExiting && !isExpanded) {
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused, isEditing, isExiting, isExpanded]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing || isExiting || isExpanded) return;

    // Do not initiate drag if interacting with buttons, inputs, links, or interactive controls
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a')
    ) {
      return;
    }

    if (e.pointerType === 'touch') {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
        dragControls?.start(e);
      }, 260);
    } else if (e.pointerType === 'mouse' && e.button === 0) {
      dragControls?.start(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (timerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 7 || dy > 7) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSaveEdit(editTitle);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const handleSaveDescription = () => {
    if (onUpdateGoal && description !== (goal.description || '')) {
      onUpdateGoal({ description: description.trim() || null });
    }
  };

  const handleSaveLink = () => {
    const trimmed = linkInput.trim();
    if (onUpdateGoal) {
      onUpdateGoal({ link: trimmed || null });
    }
    setIsAddingLink(false);
  };

  const handleCycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateGoal || isExiting) return;
    const current = goal.status || 'not-started';
    const next: GoalStatus =
      current === 'not-started' || current === 'active'
        ? 'in-progress'
        : 'not-started';
    onUpdateGoal({ status: next });
  };

  // Base row styling based on exit or focus or expanded status
  let rowStyleClass =
    'border-border bg-surface hover:bg-surface-hover hover:border-border-subtle';

  if (exitStatus === 'completed') {
    rowStyleClass = 'border-gold/60 bg-surface/90 shadow-sm shadow-gold/10';
  } else if (exitStatus === 'killed') {
    rowStyleClass = 'border-ember/50 bg-[#1c1314] text-ember/70 shadow-xs shadow-ember/5';
  } else if (isExpanded) {
    rowStyleClass = 'border-gold/60 bg-surface shadow-md shadow-gold/5';
  } else if (isFocused) {
    rowStyleClass =
      'ring-1 ring-gold/80 border-gold/40 bg-surface-hover shadow-xs shadow-gold/5';
  }

  const currentStatus = goal.status || 'not-started';

  return (
    <motion.div
      ref={rowRef}
      role="listitem"
      tabIndex={isExiting ? -1 : 0}
      onClick={() => {
        if (isExiting) return;
        onSelect();
        if (!isExpanded && onToggleExpand) {
          onToggleExpand();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={`Goal ${index + 1}: ${goal.title}`}
      aria-current={isFocused ? 'true' : undefined}
      animate={
        exitStatus === 'killed' && !shouldReduceMotion
          ? {
              x: [0, -5, 5, -3, 3, -1, 0],
              transition: { duration: 0.18, ease: 'easeInOut' },
            }
          : undefined
      }
      className={`group relative flex flex-col justify-between rounded-lg border py-3 px-4 transition-colors duration-150 select-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg touch-manipulation overflow-hidden ${
        isExiting ? 'pointer-events-none' : 'cursor-pointer'
      } ${rowStyleClass}`}
    >
      {/* COMPLETE ANIMATION: Bright Fuse Line sweeping left -> right (~400ms) */}
      {exitStatus === 'completed' && !shouldReduceMotion && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.12, 0.04] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 bg-gold pointer-events-none"
          />
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] overflow-hidden pointer-events-none">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.4, ease: [0.3, 0, 0.2, 1] }}
              className="relative h-full w-full bg-gradient-to-r from-transparent via-gold to-white shadow-[0_0_10px_#dfb15b,0_0_3px_#fff]"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_2px_#dfb15b,0_0_2px_#fff]" />
            </motion.div>
          </div>
        </>
      )}

      {/* Main Row Line */}
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Left: Index + Title + Status Pill */}
        <div className="flex items-start gap-3 min-w-0 flex-1 mr-2 relative z-10">
          <span
            className={`tabular-nums font-mono text-xs select-none w-5 shrink-0 pt-0.5 transition-opacity ${
              exitStatus === 'killed'
                ? 'text-ember/50'
                : isFocused || isExpanded
                ? 'text-gold'
                : 'text-text-muted'
            }`}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="flex-1 min-w-0">
            {isEditing && !isExiting ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => onSaveEdit(editTitle)}
                maxLength={200}
                className="h-8 w-full bg-transparent text-sm font-normal text-text-primary border-b border-gold/60 focus:outline-none placeholder:text-text-muted"
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  onClick={(e) => {
                    if (isExiting) return;
                    e.stopPropagation();
                    if (isExpanded) {
                      setEditTitle(goal.title);
                      onStartEdit();
                    } else if (onToggleExpand) {
                      onToggleExpand();
                    }
                  }}
                  className={`break-words whitespace-normal text-sm font-normal transition-colors ${
                    exitStatus === 'killed'
                      ? 'line-through text-text-muted/60'
                      : exitStatus === 'completed'
                      ? 'text-gold-light'
                      : 'text-text-primary hover:text-white'
                  }`}
                  title={isExiting ? undefined : 'Click to expand or edit'}
                >
                  {goal.title}
                </span>

                {/* Status Pill on line item */}
                <button
                  type="button"
                  onClick={handleCycleStatus}
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer select-none ${
                    currentStatus === 'in-progress'
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                      : currentStatus === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-surface-active/60 border-border/80 text-text-secondary hover:text-text-primary hover:border-border'
                  }`}
                  title="Click to toggle status (Not started / In progress)"
                >
                  {currentStatus === 'in-progress'
                    ? 'In progress'
                    : currentStatus === 'completed'
                    ? 'Completed'
                    : 'Not started'}
                </button>

                {/* Link Chip preview if present and not expanded */}
                {goal.link && !isExpanded && (
                  <a
                    href={goal.link.startsWith('http') ? goal.link : `https://${goal.link}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-[11px] text-gold/80 hover:text-gold hover:underline"
                    title={goal.link}
                  >
                    <span>link</span>
                    <span>↗</span>
                  </a>
                )}

                {/* Note Indicator if present and not expanded */}
                {goal.description && !isExpanded && (
                  <span
                    className="inline-flex items-center text-[10px] text-text-muted"
                    title="Has description"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7" />
                    </svg>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Priority + Subtle Hover Actions + Expand chevron */}
        <div
          className={`flex items-center gap-2 shrink-0 relative z-10 transition-opacity duration-150 ${
            isExiting ? 'opacity-30' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <PriorityIndicator
            priority={goal.priority}
            disabled={isExiting}
            onClick={(e) => {
              if (isExiting) return;
              e.stopPropagation();
              onCyclePriority();
            }}
          />

          {/* Hover / Touch Actions: Complete and Kill */}
          {!isExiting && (
            <div className="flex items-center gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-150">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:text-gold hover:bg-surface-active transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
                title="Complete goal (or press c)"
                aria-label={`Complete goal: ${goal.title}`}
              >
                <svg
                  className="h-3.5 w-3.5 stroke-[2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onKill();
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-text-muted hover:text-ember hover:bg-ember-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember"
                title="Kill goal (or press x)"
                aria-label={`Kill goal: ${goal.title}`}
              >
                <svg
                  className="h-3.5 w-3.5 stroke-[2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Expand / Collapse Chevron */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="h-6 w-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-active transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand task'}
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* EXPANDED VIEW: Description, Link, Status, Actions */}
      <AnimatePresence>
        {isExpanded && !isExiting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="pt-3.5 mt-3 border-t border-border/60 space-y-3 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status Field Selection */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-mono text-text-muted">Status:</span>
              <div className="flex items-center gap-1.5">
                {(['not-started', 'in-progress', 'completed'] as GoalStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (st === 'completed') {
                        onComplete();
                      } else if (onUpdateGoal) {
                        onUpdateGoal({ status: st });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                      currentStatus === st || (st === 'not-started' && currentStatus === 'active')
                        ? 'bg-gold/15 text-gold border-gold/40 shadow-xs'
                        : 'text-text-muted hover:text-text-primary bg-surface-active/50 border-border/70'
                    }`}
                  >
                    {st === 'not-started'
                      ? 'Not started'
                      : st === 'in-progress'
                      ? 'In progress'
                      : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveDescription}
                placeholder="Add a description..."
                rows={3}
                className="w-full rounded-lg border border-border/70 bg-bg/50 p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-gold/50 focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Link Field */}
            <div>
              {goal.link && !isAddingLink ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-bg/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-gold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <a
                      href={goal.link.startsWith('http') ? goal.link : `https://${goal.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-primary hover:text-gold truncate hover:underline"
                    >
                      {goal.link}
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingLink(true)}
                      className="px-2 py-0.5 text-[11px] text-text-muted hover:text-text-primary rounded cursor-pointer"
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkInput('');
                        if (onUpdateGoal) onUpdateGoal({ link: null });
                      }}
                      className="px-1.5 py-0.5 text-[11px] text-ember hover:bg-ember-muted/20 rounded cursor-pointer"
                      title="Remove link"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : isAddingLink ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveLink();
                      } else if (e.key === 'Escape') {
                        setIsAddingLink(false);
                      }
                    }}
                    placeholder="Paste link URL (https://...)"
                    className="flex-1 rounded-lg border border-border/80 bg-bg/50 px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-gold/50 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveLink}
                    className="px-3 py-1.5 rounded-lg bg-gold text-bg text-xs font-medium hover:bg-gold-light transition-colors cursor-pointer"
                  >
                    save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingLink(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/80 px-3 py-1.5 text-xs text-text-secondary hover:border-gold/40 hover:text-text-primary hover:bg-surface-active/40 transition-colors cursor-pointer"
                >
                  <span className="text-sm leading-none">+</span>
                  <span>Add link</span>
                </button>
              )}
            </div>

            {/* Bottom Actions: Complete, Kill, and Done (as shown in screenshot) */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onComplete}
                  className="rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 text-xs transition-colors cursor-pointer shadow-xs"
                >
                  complete
                </button>
                <button
                  type="button"
                  onClick={onKill}
                  className="rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-medium px-4 py-1.5 text-xs transition-colors cursor-pointer shadow-xs"
                >
                  kill
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSaveDescription();
                  if (onToggleExpand) onToggleExpand();
                }}
                className="rounded-lg bg-surface-active hover:bg-surface border border-border text-text-primary font-medium px-4 py-1.5 text-xs transition-colors cursor-pointer shadow-xs"
              >
                done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
