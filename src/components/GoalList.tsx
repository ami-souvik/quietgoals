'use client';

import { useCallback, useOptimistic, useRef, useState, useTransition, useEffect } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { generateKeyBetween } from 'fractional-indexing';
import {
  archiveGoal,
  createGoal,
  deleteGoalForever,
  moveGoal,
  restoreGoal,
  updateGoal,
} from '@/app/actions/goals';
import { AccountMenu } from '@/components/AccountMenu';
import { ArchiveList } from '@/components/ArchiveList';
import { CompleteParticles } from '@/components/CompleteParticles';
import { GoalRow } from '@/components/GoalRow';
import { ShortcutSheet } from '@/components/ShortcutSheet';
import { SoundToggle } from '@/components/SoundToggle';
import { mutationQueue } from '@/lib/mutationQueue';
import { useKeyboard } from '@/hooks/useKeyboard';
import {
  persistSoundPreference,
  play,
  setSoundEnabled,
} from '@/lib/sound';
import type { Goal, GoalPriority } from '@/db/schema';

export type GoalOptimisticAction =
  | { type: 'create'; goal: Goal }
  | { type: 'update'; id: string; data: Partial<Goal> }
  | { type: 'remove'; id: string }
  | { type: 'reorder'; id: string; position: string }
  | { type: 'setList'; goals: Goal[] };

export function comparePositions(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function goalReducer(state: Goal[], action: GoalOptimisticAction): Goal[] {
  switch (action.type) {
    case 'create':
      return [...state, action.goal].sort((a, b) => comparePositions(a.position, b.position));
    case 'update':
      return state.map((g) => (g.id === action.id ? { ...g, ...action.data } : g));
    case 'remove':
      return state.filter((g) => g.id !== action.id);
    case 'reorder':
      return state
        .map((g) => (g.id === action.id ? { ...g, position: action.position } : g))
        .sort((a, b) => comparePositions(a.position, b.position));
    case 'setList':
      return action.goals;
    default:
      return state;
  }
}

interface FailedGoal {
  id: string;
  title: string;
  position: string;
  afterPosition: string | null;
}

interface ReorderableItemProps {
  goal: Goal;
  index: number;
  isFocused: boolean;
  isEditing: boolean;
  exitStatus?: 'completed' | 'killed' | null;
  shouldReduceMotion: boolean | null;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: (newTitle: string) => void;
  onCancelEdit: () => void;
  onCyclePriority: () => void;
  onComplete: () => void;
  onKill: () => void;
  onExitComplete: (goalId: string) => void;
  onDragEnd: (goalId: string) => void;
}

function ReorderableGoalItem({
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
  onExitComplete,
  onDragEnd,
}: ReorderableItemProps) {
  const dragControls = useDragControls();
  const [showParticles, setShowParticles] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);

  const isExiting = Boolean(exitStatus);
  const isCollapsingNow = (isExiting && Boolean(shouldReduceMotion)) || isCollapsing;

  useEffect(() => {
    if (!exitStatus) return;

    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        onExitComplete(goal.id);
      }, 150);
      return () => clearTimeout(timer);
    }

    if (exitStatus === 'completed') {
      // 0ms - 400ms: Bright fuse line sweeps left -> right
      // ~400ms: releases gold particles burst and starts spring height collapse
      const burstTimer = setTimeout(() => {
        setShowParticles(true);
        setIsCollapsing(true);
      }, 400);

      // ~700ms: particles clean up, remove from local state
      const cleanupTimer = setTimeout(() => {
        onExitComplete(goal.id);
      }, 700);

      return () => {
        clearTimeout(burstTimer);
        clearTimeout(cleanupTimer);
      };
    }

    if (exitStatus === 'killed') {
      // Tints to ember/carbon, shakes slightly once (0-150ms), then drops and gap closes
      const dropTimer = setTimeout(() => {
        setIsCollapsing(true);
      }, 120);

      const cleanupTimer = setTimeout(() => {
        onExitComplete(goal.id);
      }, 340);

      return () => {
        clearTimeout(dropTimer);
        clearTimeout(cleanupTimer);
      };
    }
  }, [exitStatus, shouldReduceMotion, goal.id, onExitComplete]);

  return (
    <Reorder.Item
      value={goal}
      dragListener={false}
      dragControls={isExiting ? undefined : dragControls}
      whileDrag={{
        scale: 1.018,
        boxShadow:
          '0 16px 36px -6px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(223, 177, 91, 0.4)',
        zIndex: 50,
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 350, damping: 22, mass: 0.8 } // settles with small spring overshoot
      }
      onDragEnd={() => onDragEnd(goal.id)}
      className="relative touch-manipulation select-none"
    >
      <div className="relative">
        {/* Explosive Gold Particles (24 capped, clean up after ~700ms) */}
        {showParticles && !shouldReduceMotion && <CompleteParticles />}

        {/* Collapsing Row Wrapper */}
        <motion.div
          animate={
            isCollapsingNow
              ? {
                height: 0,
                opacity: 0,
                marginBottom: -8,
                y: exitStatus === 'killed' && !shouldReduceMotion ? 6 : 0,
              }
              : {
                height: 52,
                opacity: 1,
                marginBottom: 0,
                y: 0,
              }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.15, ease: 'easeOut' }
              : { type: 'spring', stiffness: 360, damping: 28 }
          }
          className="overflow-hidden rounded-lg"
        >
          <GoalRow
            goal={goal}
            index={index}
            isFocused={isFocused}
            isEditing={isEditing}
            exitStatus={exitStatus}
            shouldReduceMotion={shouldReduceMotion}
            onSelect={onSelect}
            onStartEdit={onStartEdit}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onCyclePriority={onCyclePriority}
            onComplete={onComplete}
            onKill={onKill}
            dragControls={isExiting ? undefined : dragControls}
          />
        </motion.div>
      </div>
    </Reorder.Item>
  );
}

interface GoalListProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  initialGoals: Goal[];
  initialArchivedGoals?: Goal[];
  initialSoundEnabled?: boolean;
}

export function GoalList({
  user,
  initialGoals,
  initialArchivedGoals = [],
  initialSoundEnabled = false,
}: GoalListProps) {
  const [, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();

  // Sound preference state: SSR initialized from settings cookie, synced with localStorage
  const [soundOn, setSoundOn] = useState(initialSoundEnabled);

  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  const handleToggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      persistSoundPreference(next);
      if (next) {
        play('save');
      }
      return next;
    });
  }, []);

  // View state: 'active' or 'archive'
  const [currentView, setCurrentView] = useState<'active' | 'archive'>('active');

  // Archive goals state: synchronized locally with zero refetch flicker
  const [archivedGoals, setArchivedGoals] = useState<Goal[]>(initialArchivedGoals);

  const [optimisticGoals, dispatchOptimistic] = useOptimistic(
    initialGoals,
    goalReducer
  );

  // Active exiting states per goal: id -> 'completed' | 'killed'
  const [exitingMap, setExitingMap] = useState<Record<string, 'completed' | 'killed'>>({});

  // Reorder dragging state
  const [activeItems, setActiveItems] = useState<Goal[]>(initialGoals);

  // Sync active items with optimistic goals when not actively dragging
  const itemsToRender = activeItems.length === optimisticGoals.length ? activeItems : optimisticGoals;

  // Focus & Editing State
  const [focusedId, setFocusedId] = useState<string | null>(
    initialGoals[0]?.id ?? null
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  // Creation State
  const [isAddingBottom, setIsAddingBottom] = useState(false);
  const [insertBelowId, setInsertBelowId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Shortcuts modal
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Failed rows state
  const [failedGoals, setFailedGoals] = useState<Map<string, FailedGoal>>(new Map());

  // Offline queue state
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    return mutationQueue.subscribe((size, online) => {
      setQueuedCount(size);
      setIsOnline(online);
    });
  }, []);

  // Screen reader announcements
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
  }, []);

  // Lightweight polling: pick up external/agent edits every ~5s while tab is visible
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      if (
        document.visibilityState === 'visible' &&
        !editingId &&
        !isAddingBottom &&
        !insertBelowId
      ) {
        try {
          const res = await fetch('/api/goals', { cache: 'no-store' });
          if (res.ok) {
            const data: { activeGoals: Goal[]; archivedGoals: Goal[] } =
              await res.json();

            // Check if active goals have changed
            const activeChanged =
              data.activeGoals.length !== activeItems.length ||
              data.activeGoals.some((g, i) => {
                const cur = activeItems[i];
                return (
                  !cur ||
                  cur.id !== g.id ||
                  cur.title !== g.title ||
                  cur.priority !== g.priority ||
                  cur.position !== g.position
                );
              });

            if (activeChanged) {
              setActiveItems(data.activeGoals);
              startTransition(() => {
                dispatchOptimistic({ type: 'setList', goals: data.activeGoals });
              });
            }

            // Check if archived goals have changed
            const archivedChanged =
              data.archivedGoals.length !== archivedGoals.length ||
              data.archivedGoals.some((g, i) => {
                const cur = archivedGoals[i];
                return !cur || cur.id !== g.id || cur.status !== g.status;
              });

            if (archivedChanged) {
              setArchivedGoals(data.archivedGoals);
            }
          }
        } catch {
          // Ignore network blips during polling
        }
      }

      timeoutId = setTimeout(poll, 5000);
    }

    timeoutId = setTimeout(poll, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    editingId,
    isAddingBottom,
    insertBelowId,
    activeItems,
    archivedGoals,
    dispatchOptimistic,
  ]);

  const bottomInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const focusedIndex = itemsToRender.findIndex((g) => g.id === focusedId);
  const focusedGoal = focusedIndex !== -1 ? itemsToRender[focusedIndex] : null;

  // Unified persistence method for moving a goal (used by BOTH drag-drop and keyboard reordering)
  const persistMove = useCallback(
    (
      goalId: string,
      beforeGoal: Goal | null,
      afterGoal: Goal | null,
      updatedList?: Goal[]
    ) => {
      const beforePos = beforeGoal?.position ?? null;
      const afterPos = afterGoal?.position ?? null;
      const newPosition = generateKeyBetween(beforePos, afterPos);

      // 1. Optimistic update
      if (updatedList) {
        setActiveItems(
          updatedList.map((g) =>
            g.id === goalId ? { ...g, position: newPosition } : g
          )
        );
      }

      // 2. Call server action with offline queue
      startTransition(async () => {
        dispatchOptimistic({
          type: 'reorder',
          id: goalId,
          position: newPosition,
        });

        await mutationQueue.enqueue('move goal', async () => {
          const res = await moveGoal({
            id: goalId,
            beforeId: beforeGoal?.id ?? null,
            afterId: afterGoal?.id ?? null,
          });

          if (res.success && res.position) {
            // If server regenerated keys during collision, sync them
            if (res.position !== newPosition) {
              startTransition(() => {
                dispatchOptimistic({
                  type: 'reorder',
                  id: goalId,
                  position: res.position,
                });
              });
            }
          }
          return res;
        });
      });
    },
    [dispatchOptimistic]
  );

  // Pointer drag reorder handler
  const handleReorder = useCallback((newOrder: Goal[]) => {
    setActiveItems(newOrder);
  }, []);

  const handleDragEnd = useCallback(
    (draggedGoalId: string) => {
      const currentList = activeItems;
      const index = currentList.findIndex((g) => g.id === draggedGoalId);
      if (index === -1) return;

      const beforeGoal = index > 0 ? currentList[index - 1] : null;
      const afterGoal = index < currentList.length - 1 ? currentList[index + 1] : null;

      persistMove(draggedGoalId, beforeGoal, afterGoal, currentList);
    },
    [activeItems, persistMove]
  );

  // Helper to commit creation
  const handleCommitCreate = useCallback(
    (
      titleToCommit: string,
      targetAfterPosition: string | null,
      targetNextPosition: string | null
    ) => {
      const trimmed = titleToCommit.trim();
      if (!trimmed) {
        setIsAddingBottom(false);
        setInsertBelowId(null);
        return;
      }

      const id = crypto.randomUUID();
      const position = generateKeyBetween(targetAfterPosition, targetNextPosition);

      const optimisticGoal: Goal = {
        id,
        userId: optimisticGoals[0]?.userId ?? 'user',
        title: trimmed,
        status: 'active',
        priority: 'none',
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archivedAt: null,
      };

      const newList = [...optimisticGoals, optimisticGoal].sort((a, b) =>
        comparePositions(a.position, b.position)
      );
      setActiveItems(newList);
      setFocusedId(id);
      setNewTitle('');
      setIsAddingBottom(false);
      setInsertBelowId(null);
      play('create');
      announce(`Goal created: ${trimmed}`);

      startTransition(async () => {
        dispatchOptimistic({ type: 'create', goal: optimisticGoal });
        const success = await mutationQueue.enqueue('create goal', () =>
          createGoal({
            id,
            title: trimmed,
            position,
            afterPosition: targetAfterPosition,
          })
        );

        if (!success && isOnline) {
          setFailedGoals((prev) => {
            const next = new Map(prev);
            next.set(id, {
              id,
              title: trimmed,
              position,
              afterPosition: targetAfterPosition,
            });
            return next;
          });
        }
      });
    },
    [dispatchOptimistic, optimisticGoals, announce, isOnline]
  );

  // Keyboard navigation across non-exiting goals
  const handleMoveFocusUp = useCallback(() => {
    const nonExiting = itemsToRender.filter((g) => !exitingMap[g.id]);
    if (nonExiting.length === 0) return;
    const currIdx = nonExiting.findIndex((g) => g.id === focusedId);
    if (currIdx > 0) {
      setFocusedId(nonExiting[currIdx - 1].id);
      play('keyTick');
    } else {
      setFocusedId(nonExiting[0].id);
    }
  }, [focusedId, itemsToRender, exitingMap]);

  const handleMoveFocusDown = useCallback(() => {
    const nonExiting = itemsToRender.filter((g) => !exitingMap[g.id]);
    if (nonExiting.length === 0) return;
    const currIdx = nonExiting.findIndex((g) => g.id === focusedId);
    if (currIdx !== -1 && currIdx < nonExiting.length - 1) {
      setFocusedId(nonExiting[currIdx + 1].id);
      play('keyTick');
    } else {
      setFocusedId(nonExiting[nonExiting.length - 1].id);
    }
  }, [focusedId, itemsToRender, exitingMap]);

  const handleEditTitle = useCallback(() => {
    if (focusedGoal && !exitingMap[focusedGoal.id]) {
      setEditingId(focusedGoal.id);
    }
  }, [focusedGoal, exitingMap]);

  // Keyboard move up: uses same persistMove path as pointer drag
  const handleMoveRowUp = useCallback(() => {
    if (!focusedGoal || focusedIndex <= 0 || exitingMap[focusedGoal.id]) return;
    const beforeGoal = focusedIndex > 1 ? itemsToRender[focusedIndex - 2] : null;
    const afterGoal = itemsToRender[focusedIndex - 1];

    const currentList = [...itemsToRender];
    currentList.splice(focusedIndex, 1);
    currentList.splice(focusedIndex - 1, 0, focusedGoal);

    play('keyTick');
    persistMove(focusedGoal.id, beforeGoal, afterGoal, currentList);
  }, [focusedGoal, focusedIndex, itemsToRender, persistMove, exitingMap]);

  // Keyboard move down: uses same persistMove path as pointer drag
  const handleMoveRowDown = useCallback(() => {
    if (
      !focusedGoal ||
      focusedIndex < 0 ||
      focusedIndex >= itemsToRender.length - 1 ||
      exitingMap[focusedGoal.id]
    ) {
      return;
    }
    const beforeGoal = itemsToRender[focusedIndex + 1];
    const afterGoal =
      focusedIndex + 2 < itemsToRender.length ? itemsToRender[focusedIndex + 2] : null;

    const currentList = [...itemsToRender];
    currentList.splice(focusedIndex, 1);
    currentList.splice(focusedIndex + 1, 0, focusedGoal);

    play('keyTick');
    persistMove(focusedGoal.id, beforeGoal, afterGoal, currentList);
  }, [focusedGoal, focusedIndex, itemsToRender, persistMove, exitingMap]);

  const handleSetPriority = useCallback(
    (priority: GoalPriority) => {
      if (!focusedGoal || exitingMap[focusedGoal.id]) return;
      play('priority');
      const updated = { priority, updatedAt: new Date().toISOString() };
      setActiveItems((prev) =>
        prev.map((g) => (g.id === focusedGoal.id ? { ...g, ...updated } : g))
      );

      startTransition(async () => {
        dispatchOptimistic({
          type: 'update',
          id: focusedGoal.id,
          data: updated,
        });
        await mutationQueue.enqueue('update priority', () =>
          updateGoal({ id: focusedGoal.id, priority })
        );
      });
    },
    [dispatchOptimistic, focusedGoal, exitingMap]
  );

  // Optimistic Archive (Complete or Kill) Handler
  const handleArchive = useCallback(
    (goalToArchive: Goal, status: 'completed' | 'killed') => {
      if (exitingMap[goalToArchive.id]) return;
      play(status === 'completed' ? 'complete' : 'kill');
      announce(
        status === 'completed'
          ? `Goal completed: ${goalToArchive.title}`
          : `Goal killed: ${goalToArchive.title}`
      );

      // 1. Advance focus sensibly to the next remaining goal
      const currIdx = itemsToRender.findIndex((g) => g.id === goalToArchive.id);
      let nextFocusId: string | null = null;

      const following = itemsToRender
        .slice(currIdx + 1)
        .find((g) => g.id !== goalToArchive.id && !exitingMap[g.id]);
      if (following) {
        nextFocusId = following.id;
      } else {
        const preceding = [...itemsToRender.slice(0, currIdx)]
          .reverse()
          .find((g) => g.id !== goalToArchive.id && !exitingMap[g.id]);
        if (preceding) {
          nextFocusId = preceding.id;
        }
      }
      setFocusedId(nextFocusId);

      // 2. Add to archivedGoals immediately (optimistic)
      const now = new Date().toISOString();
      const archivedItem: Goal = {
        ...goalToArchive,
        status,
        archivedAt: now,
        updatedAt: now,
      };
      setArchivedGoals((prev) => [
        archivedItem,
        ...prev.filter((g) => g.id !== goalToArchive.id),
      ]);

      // 3. Mark goal as exiting to trigger physical exit animation in active list
      setExitingMap((prev) => ({ ...prev, [goalToArchive.id]: status }));

      // 4. Server call and animation run in parallel (optimistic with offline queue)
      startTransition(async () => {
        await mutationQueue.enqueue(`archive goal (${status})`, () =>
          archiveGoal({ id: goalToArchive.id, status })
        );
      });
    },
    [itemsToRender, exitingMap, announce]
  );

  // Called when exit animation completes: removes from active local state
  const handleExitComplete = useCallback(
    (goalId: string) => {
      setExitingMap((prev) => {
        if (!prev[goalId]) return prev;
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
      setActiveItems((prev) => prev.filter((g) => g.id !== goalId));
      startTransition(() => {
        dispatchOptimistic({ type: 'remove', id: goalId });
      });
    },
    [dispatchOptimistic]
  );

  // Restore Goal Action from Archive
  const handleRestoreGoal = useCallback(
    (goalToRestore: Goal) => {
      play('restore');
      announce(`Goal restored: ${goalToRestore.title}`);
      const lastPos =
        itemsToRender.length > 0
          ? itemsToRender[itemsToRender.length - 1].position
          : null;
      const newPosition = generateKeyBetween(lastPos, null);
      const now = new Date().toISOString();

      const restoredGoal: Goal = {
        ...goalToRestore,
        status: 'active',
        position: newPosition,
        archivedAt: null,
        updatedAt: now,
      };

      // 1. Remove from archive optimistically
      setArchivedGoals((prev) => prev.filter((g) => g.id !== goalToRestore.id));

      // 2. Add to active goals optimistically at the bottom
      const newList = [...itemsToRender, restoredGoal].sort((a, b) =>
        comparePositions(a.position, b.position)
      );
      setActiveItems(newList);
      setFocusedId(goalToRestore.id);

      // 3. Start server action with offline queue
      startTransition(async () => {
        dispatchOptimistic({ type: 'create', goal: restoredGoal });
        await mutationQueue.enqueue('restore goal', () =>
          restoreGoal({ id: goalToRestore.id, position: newPosition })
        );
      });
    },
    [dispatchOptimistic, itemsToRender, announce]
  );

  // Delete Forever Action from Archive
  const handleDeleteGoalForever = useCallback((goalId: string) => {
    announce('Goal deleted forever');
    // 1. Remove from archive optimistically
    setArchivedGoals((prev) => prev.filter((g) => g.id !== goalId));

    // 2. Start server action with offline queue
    startTransition(async () => {
      await mutationQueue.enqueue('delete goal forever', () =>
        deleteGoalForever({ id: goalId })
      );
    });
  }, [announce]);

  const handleEscape = useCallback(() => {
    if (isShortcutsOpen) {
      setIsShortcutsOpen(false);
      return;
    }
    if (currentView === 'archive') {
      setCurrentView('active');
      return;
    }
    if (editingId) {
      setEditingId(null);
      return;
    }
    if (isAddingBottom) {
      setIsAddingBottom(false);
      setNewTitle('');
      return;
    }
    if (insertBelowId) {
      setInsertBelowId(null);
      setNewTitle('');
      return;
    }
  }, [editingId, isAddingBottom, insertBelowId, isShortcutsOpen, currentView]);

  useKeyboard({
    onNewGoalBottom: () => {
      if (currentView !== 'active') return;
      setInsertBelowId(null);
      setIsAddingBottom(true);
      setTimeout(() => bottomInputRef.current?.focus(), 10);
    },
    onNewGoalBelow: () => {
      if (currentView !== 'active') return;
      if (focusedGoal && !exitingMap[focusedGoal.id]) {
        setIsAddingBottom(false);
        setInsertBelowId(focusedGoal.id);
        setTimeout(() => inlineInputRef.current?.focus(), 10);
      } else {
        setIsAddingBottom(true);
        setTimeout(() => bottomInputRef.current?.focus(), 10);
      }
    },
    onMoveFocusUp: () => {
      if (currentView === 'active') handleMoveFocusUp();
    },
    onMoveFocusDown: () => {
      if (currentView === 'active') handleMoveFocusDown();
    },
    onEditTitle: () => {
      if (currentView === 'active') handleEditTitle();
    },
    onMoveRowUp: () => {
      if (currentView === 'active') handleMoveRowUp();
    },
    onMoveRowDown: () => {
      if (currentView === 'active') handleMoveRowDown();
    },
    onSetPriority: (p) => {
      if (currentView === 'active') handleSetPriority(p);
    },
    onComplete: () => {
      if (currentView === 'active' && focusedGoal && !exitingMap[focusedGoal.id]) {
        handleArchive(focusedGoal, 'completed');
      }
    },
    onKill: () => {
      if (currentView === 'active' && focusedGoal && !exitingMap[focusedGoal.id]) {
        handleArchive(focusedGoal, 'killed');
      }
    },
    onToggleArchive: () => {
      setCurrentView((prev) => (prev === 'active' ? 'archive' : 'active'));
    },
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
    onEscape: handleEscape,
    isSheetOpen: isShortcutsOpen,
  });

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 450, damping: 32 };

  return (
    <div>
      {/* Header: Wordmark + "Active N · Archive M" Toggle + Controls */}
      <header className="flex items-center justify-between pb-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium tracking-tight text-text-primary">
            Quiet Goals
          </span>

          {/* Active N · Archive M Toggle */}
          <div className="flex items-center gap-1.5 text-xs font-mono select-none">
            <button
              type="button"
              onClick={() => setCurrentView('active')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold ${
                currentView === 'active'
                  ? 'text-text-primary font-medium bg-surface/90 border border-border/80 shadow-xs'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-pressed={currentView === 'active'}
              title="View active goals (press a to toggle)"
            >
              Active <span className="tabular-nums">{itemsToRender.length}</span>
            </button>

            <span className="text-border/70 select-none">·</span>

            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'archive' ? 'active' : 'archive')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold ${
                currentView === 'archive'
                  ? 'text-text-primary font-medium bg-surface/90 border border-border/80 shadow-xs'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-pressed={currentView === 'archive'}
              title="View archive (press a to toggle)"
            >
              Archive <span className="tabular-nums">{archivedGoals.length}</span>
            </button>
          </div>

          {/* Subtle inline offline dot in header while queued */}
          {(!isOnline || queuedCount > 0) && (
            <div
              className="flex items-center gap-1.5 text-[11px] font-mono text-ember/90 px-2 py-0.5 rounded-full bg-ember-muted/15 border border-ember/25"
              role="status"
              title={
                !isOnline
                  ? `Offline — ${queuedCount} mutation${queuedCount === 1 ? '' : 's'} queued`
                  : `${queuedCount} mutation${queuedCount === 1 ? '' : 's'} syncing...`
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ember animate-pulse" />
              <span>offline{queuedCount > 0 ? ` (${queuedCount})` : ''}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle enabled={soundOn} onToggle={handleToggleSound} />
          {user && (
            <AccountMenu user={user} />
          )}
        </div>
      </header>

      {/* Main View Surface with Soft Cross-Fade */}
      <AnimatePresence mode="wait" initial={false}>
        {currentView === 'active' ? (
          <motion.div
            key="active-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            <div className="space-y-2">
              {itemsToRender.length === 0 && !isAddingBottom ? (
                /* Empty state: one line of copy and a single "new goal" affordance. No illustrations. */
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <p className="text-xs text-text-muted font-mono">
                    no goals yet — your list is quiet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setInsertBelowId(null);
                      setIsAddingBottom(true);
                      setTimeout(() => bottomInputRef.current?.focus(), 10);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-gold/50 hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold cursor-pointer"
                  >
                    <span>+ new goal</span>
                    <span className="text-[10px] text-text-muted/70">press n</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Pointer Drag Reorder Group */}
                  <Reorder.Group
                  axis="y"
                  values={itemsToRender}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                <AnimatePresence initial={false}>
                  {itemsToRender.map((goal, index) => {
                    const isFocused = goal.id === focusedId;
                    const isEditing = goal.id === editingId;
                    const isInsertBelowActive = insertBelowId === goal.id;
                    const exitStatus = exitingMap[goal.id] ?? null;

                    return (
                      <div key={goal.id} className="space-y-2">
                        <ReorderableGoalItem
                          goal={goal}
                          index={index}
                          isFocused={isFocused}
                          isEditing={isEditing}
                          exitStatus={exitStatus}
                          shouldReduceMotion={shouldReduceMotion}
                          onSelect={() => {
                            if (!exitStatus) {
                              setFocusedId(goal.id);
                              setEditingId(null);
                            }
                          }}
                          onStartEdit={() => {
                            if (!exitStatus) {
                              setFocusedId(goal.id);
                              setEditingId(goal.id);
                            }
                          }}
                          onSaveEdit={(newTitleToSave) => {
                            setEditingId(null);
                            const trimmed = newTitleToSave.trim();
                            if (trimmed && trimmed !== goal.title) {
                              play('save');
                              const updated = {
                                title: trimmed,
                                updatedAt: new Date().toISOString(),
                              };
                              setActiveItems((prev) =>
                                prev.map((g) => (g.id === goal.id ? { ...g, ...updated } : g))
                              );
                              startTransition(async () => {
                                dispatchOptimistic({
                                  type: 'update',
                                  id: goal.id,
                                  data: updated,
                                });
                                await mutationQueue.enqueue('update title', () =>
                                  updateGoal({ id: goal.id, title: trimmed })
                                );
                              });
                            }
                          }}
                          onCancelEdit={() => setEditingId(null)}
                          onCyclePriority={() => {
                            if (exitStatus) return;
                            play('priority');
                            const nextPrio: Record<GoalPriority, GoalPriority> = {
                              none: 'low',
                              low: 'medium',
                              medium: 'high',
                              high: 'none',
                            };
                            const next = nextPrio[goal.priority];
                            const updated = {
                              priority: next,
                              updatedAt: new Date().toISOString(),
                            };
                            setActiveItems((prev) =>
                              prev.map((g) => (g.id === goal.id ? { ...g, ...updated } : g))
                            );
                            startTransition(async () => {
                              dispatchOptimistic({
                                type: 'update',
                                id: goal.id,
                                data: updated,
                              });
                              await mutationQueue.enqueue('update priority', () =>
                                updateGoal({ id: goal.id, priority: next })
                              );
                            });
                          }}
                          onComplete={() => handleArchive(goal, 'completed')}
                          onKill={() => handleArchive(goal, 'killed')}
                          onExitComplete={handleExitComplete}
                          onDragEnd={handleDragEnd}
                        />

                        {/* Inline Insert Below This Row (Shift+N) */}
                        {isInsertBelowActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 52 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={springTransition}
                            className="flex h-[52px] w-full items-center gap-3 rounded-lg border border-gold/50 bg-surface px-4 shadow-lg shadow-gold/5"
                          >
                            <span className="tabular-nums font-mono text-xs text-gold select-none w-5">
                              +
                            </span>
                            <input
                              ref={inlineInputRef}
                              type="text"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextG = itemsToRender[index + 1];
                                  handleCommitCreate(
                                    newTitle,
                                    goal.position,
                                    nextG ? nextG.position : null
                                  );
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setInsertBelowId(null);
                                  setNewTitle('');
                                }
                              }}
                              placeholder="new goal below... (enter saves, esc cancels)"
                              className="h-full flex-1 bg-transparent text-sm font-normal text-text-primary placeholder:text-text-muted focus:outline-none"
                              maxLength={200}
                              autoFocus
                            />
                            <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted select-none">
                              <kbd className="rounded border border-border px-1.5 py-0.5 bg-bg/50">↵</kbd>
                              <kbd className="rounded border border-border px-1.5 py-0.5 bg-bg/50 ml-1">esc</kbd>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </AnimatePresence>
              </Reorder.Group>

              {/* Failed rows with inline couldn't save — retry */}
              <AnimatePresence>
                {Array.from(failedGoals.values()).map((failed) => (
                  <motion.div
                    key={failed.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={springTransition}
                    className="overflow-hidden"
                  >
                    <div className="flex h-[52px] items-center justify-between rounded-lg border border-ember/30 bg-ember-muted/10 px-4">
                      <span className="truncate text-sm text-text-muted line-through">
                        {failed.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setFailedGoals((prev) => {
                            const next = new Map(prev);
                            next.delete(failed.id);
                            return next;
                          });
                          handleCommitCreate(failed.title, failed.afterPosition, null);
                        }}
                        className="flex items-center gap-1 text-xs text-ember hover:underline cursor-pointer"
                      >
                        <span>couldn&apos;t save — retry</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Bottom "+ new goal" Row or Inline Input */}
              <div className="pt-1">
                {isAddingBottom ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 52 }}
                    transition={springTransition}
                    className="flex h-[52px] w-full items-center gap-3 rounded-lg border border-gold/40 bg-surface px-4 shadow-lg shadow-gold/5"
                  >
                    <span className="tabular-nums font-mono text-xs text-gold select-none w-5">
                      {String(itemsToRender.length + 1).padStart(2, '0')}
                    </span>
                    <input
                      ref={bottomInputRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const lastKey =
                            itemsToRender.length > 0
                              ? itemsToRender[itemsToRender.length - 1].position
                              : null;
                          handleCommitCreate(newTitle, lastKey, null);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setNewTitle('');
                          setIsAddingBottom(false);
                        }
                      }}
                      placeholder="type a goal and press enter..."
                      className="h-full flex-1 bg-transparent text-sm font-normal text-text-primary placeholder:text-text-muted focus:outline-none"
                      maxLength={200}
                      autoFocus
                    />
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted select-none">
                      <kbd className="rounded border border-border px-1.5 py-0.5 bg-bg/50">↵</kbd>
                      <span>save</span>
                      <kbd className="rounded border border-border px-1.5 py-0.5 bg-bg/50 ml-1">esc</kbd>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setInsertBelowId(null);
                      setIsAddingBottom(true);
                    }}
                    className="flex h-[52px] w-full items-center gap-3 rounded-lg border border-dashed border-border/80 bg-surface/40 px-4 text-xs font-medium text-text-muted hover:border-border hover:bg-surface hover:text-text-secondary transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-sm font-light leading-none">
                      +
                    </span>
                    <span>new goal</span>
                    <span className="ml-auto text-[11px] text-text-muted/50 font-mono">press n</span>
                  </button>
                )}
              </div>
                </>
              )}
            </div>

            {/* Footer count indicator & Shortcuts trigger */}
            <footer className="mt-6 flex items-center justify-between px-1 text-xs text-text-muted font-mono">
              <span className="tabular-nums">
                {itemsToRender.length} {itemsToRender.length === 1 ? 'goal' : 'goals'}
              </span>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(true)}
                className="flex items-center gap-1 text-[11px] text-text-muted/70 hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold rounded px-1 py-0.5"
                title="Press ? to view shortcuts"
              >
                <span>shortcuts</span>
                <kbd className="rounded border border-border/80 px-1 py-0.2 bg-surface text-[10px]">?</kbd>
              </button>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="archive-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            <ArchiveList
              archivedGoals={archivedGoals}
              onRestore={handleRestoreGoal}
              onDeleteForever={handleDeleteGoalForever}
              onBackToActive={() => setCurrentView('active')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Sheet Overlay */}
      <ShortcutSheet
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Screen Reader Live Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );
}
