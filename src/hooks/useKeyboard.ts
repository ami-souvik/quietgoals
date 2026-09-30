'use client';

import { useEffect } from 'react';
import type { GoalPriority } from '@/db/schema';

interface UseKeyboardHandlers {
  onNewGoalBottom: () => void;
  onNewGoalBelow: () => void;
  onMoveFocusUp: () => void;
  onMoveFocusDown: () => void;
  onEditTitle: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onSetPriority: (priority: GoalPriority) => void;
  onComplete: () => void;
  onKill: () => void;
  onToggleArchive?: () => void;
  onToggleShortcuts: () => void;
  onEscape: () => void;
  isSheetOpen: boolean;
}

export function useKeyboard(handlers: UseKeyboardHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // When typing in an input, only Escape is handled globally
      if (isTyping) {
        if (e.key === 'Escape') {
          handlers.onEscape();
        }
        return;
      }

      // Shortcut sheet toggle
      if (e.key === '?') {
        e.preventDefault();
        handlers.onToggleShortcuts();
        return;
      }

      // Escape key (dismisses sheet or deselects)
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onEscape();
        return;
      }

      // If shortcut sheet is currently open, block other commands
      if (handlers.isSheetOpen) {
        return;
      }

      // Move focused row up / down with Alt (Option)
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'Up')) {
        e.preventDefault();
        handlers.onMoveRowUp();
        return;
      }
      if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
        e.preventDefault();
        handlers.onMoveRowDown();
        return;
      }

      // Don't intercept if other modifiers are held (Command/Ctrl)
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      // Shift+N: new goal directly below focused row
      if ((e.key === 'N' || e.key === 'n') && e.shiftKey) {
        e.preventDefault();
        handlers.onNewGoalBelow();
        return;
      }

      // n: new goal at the bottom
      if (e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handlers.onNewGoalBottom();
        return;
      }

      // Focus navigation: ArrowUp / ArrowDown or k / j
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlers.onMoveFocusUp();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handlers.onMoveFocusDown();
        return;
      }

      // Edit title: Enter or e
      if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handlers.onEditTitle();
        return;
      }

      // Priority shortcuts: 1 (high), 2 (medium), 3 (low), 0 (none)
      if (e.key === '1') {
        e.preventDefault();
        handlers.onSetPriority('high');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        handlers.onSetPriority('medium');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        handlers.onSetPriority('low');
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        handlers.onSetPriority('none');
        return;
      }

      // Complete focused row: c
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handlers.onComplete();
        return;
      }

      // Kill focused row: x
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handlers.onKill();
        return;
      }

      // Toggle Archive: a
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlers.onToggleArchive?.();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
