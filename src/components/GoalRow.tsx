'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, type DragControls } from 'framer-motion';
import type { Goal, GoalPriority } from '@/db/schema';

interface GoalRowProps {
  goal: Goal;
  index: number;
  isFocused: boolean;
  isEditing: boolean;
  exitStatus?: 'completed' | 'killed' | null;
  shouldReduceMotion?: boolean | null;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: (newTitle: string) => void;
  onCancelEdit: () => void;
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
  exitStatus,
  shouldReduceMotion,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onCyclePriority,
  onComplete,
  onKill,
  dragControls,
}: GoalRowProps) {
  const [editTitle, setEditTitle] = useState(goal.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const isExiting = Boolean(exitStatus);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isFocused && !isEditing && !isExiting) {
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused, isEditing, isExiting]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing || isExiting) return;

    // Do not initiate drag if interacting with buttons, inputs, or interactive controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
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
      // Desktop left click initiates drag on handle/row
      dragControls?.start(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (timerRef.current && startPosRef.current) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 7 || dy > 7) {
        // User is scrolling vertically, abort long press
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

  // Base row styling based on exit or focus status
  let rowStyleClass =
    'border-border bg-surface hover:bg-surface-hover hover:border-border-subtle';

  if (exitStatus === 'completed') {
    rowStyleClass = 'border-gold/60 bg-surface/90 shadow-sm shadow-gold/10';
  } else if (exitStatus === 'killed') {
    rowStyleClass = 'border-ember/50 bg-[#1c1314] text-ember/70 shadow-xs shadow-ember/5';
  } else if (isFocused) {
    rowStyleClass =
      'ring-1 ring-gold/80 border-gold/40 bg-surface-hover shadow-xs shadow-gold/5';
  }

  return (
    <motion.div
      ref={rowRef}
      role="listitem"
      tabIndex={isExiting ? -1 : 0}
      onClick={isExiting ? undefined : onSelect}
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
      className={`group relative flex min-h-[52px] items-center justify-between rounded-lg border py-3 px-4 transition-colors duration-150 select-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg touch-manipulation overflow-hidden ${
        isExiting ? 'pointer-events-none' : 'cursor-pointer'
      } ${rowStyleClass}`}
    >
      {/* COMPLETE ANIMATION: Bright Fuse Line sweeping left -> right (~400ms) */}
      {exitStatus === 'completed' && !shouldReduceMotion && (
        <>
          {/* Subtle golden ambient wash across the row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.12, 0.04] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 bg-gold pointer-events-none"
          />
          {/* Fuse line running along the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] overflow-hidden pointer-events-none">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.4, ease: [0.3, 0, 0.2, 1] }}
              className="relative h-full w-full bg-gradient-to-r from-transparent via-gold to-white shadow-[0_0_10px_#dfb15b,0_0_3px_#fff]"
            >
              {/* White-hot spark tip leading the fuse */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_2px_#dfb15b,0_0_2px_#fff]" />
            </motion.div>
          </div>
        </>
      )}

      {/* Left: Index / Grip + Title / Inline Input */}
      <div className="flex items-start gap-3 min-w-0 flex-1 mr-3 relative z-10">
        <span
          className={`tabular-nums font-mono text-xs select-none w-5 shrink-0 pt-0.5 transition-opacity ${
            exitStatus === 'killed'
              ? 'text-ember/50'
              : isFocused
              ? 'text-gold'
              : 'text-text-muted'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {isEditing && !isExiting ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={() => onSaveEdit(editTitle)}
            maxLength={200}
            className="h-8 flex-1 bg-transparent text-sm font-normal text-text-primary border-b border-gold/60 focus:outline-none placeholder:text-text-muted"
          />
        ) : (
          <span
            onClick={(e) => {
              if (isExiting) return;
              e.stopPropagation();
              setEditTitle(goal.title);
              onStartEdit();
            }}
            className={`break-words whitespace-normal text-sm font-normal transition-colors ${
              exitStatus === 'killed'
                ? 'line-through text-text-muted/60'
                : exitStatus === 'completed'
                ? 'text-gold-light'
                : 'text-text-primary hover:text-white'
            }`}
            title={isExiting ? undefined : 'Click or press Enter/E to edit'}
          >
            {goal.title}
          </span>
        )}
      </div>

      {/* Right side: Priority + Subtle Hover Actions (Reserved width to prevent layout shift) */}
      <div
        className={`flex items-center gap-2 shrink-0 relative z-10 transition-opacity duration-150 ${
          isExiting ? 'opacity-30' : ''
        }`}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
