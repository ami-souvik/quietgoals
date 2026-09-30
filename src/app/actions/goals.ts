'use server';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { goals } from '@/db/schema';
import { and, asc, eq, ne } from 'drizzle-orm';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateGoalSchema = z.object({
  id: z.string().uuid('Invalid goal ID format'),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or fewer'),
  afterPosition: z.string().optional().nullable(),
  position: z.string().optional(),
});

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;

export async function createGoal(input: CreateGoalInput) {
  const user = await requireUser();

  const validated = CreateGoalSchema.safeParse(input);
  if (!validated.success) {
    const firstIssue = validated.error.issues?.[0];
    return {
      success: false,
      error: firstIssue?.message ?? 'Invalid input',
    };
  }

  const { id, title, afterPosition, position } = validated.data;
  const finalPosition = position ?? generateKeyBetween(afterPosition ?? null, null);

  try {
    const [existing] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)));

    if (existing) {
      return { success: true, noop: true };
    }

    await db.insert(goals).values({
      id,
      userId: user.id,
      title,
      position: finalPosition,
      status: 'active',
      priority: 'none',
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create goal:', error);
    return { success: false, error: 'Could not save goal' };
  }
}

const UpdateGoalSchema = z.object({
  id: z.string().uuid('Invalid goal ID format'),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or fewer')
    .optional(),
  priority: z.enum(['none', 'low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'completed', 'killed']).optional(),
  position: z.string().optional(),
});

export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;

export async function updateGoal(input: UpdateGoalInput) {
  const user = await requireUser();

  const validated = UpdateGoalSchema.safeParse(input);
  if (!validated.success) {
    const firstIssue = validated.error.issues?.[0];
    return {
      success: false,
      error: firstIssue?.message ?? 'Invalid update input',
    };
  }

  const { id, title, priority, status, position } = validated.data;

  try {
    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Goal not found' };
    }

    const hasTitleChange = title !== undefined && title !== existing.title;
    const hasPriorityChange = priority !== undefined && priority !== existing.priority;
    const hasStatusChange = status !== undefined && status !== existing.status;
    const hasPositionChange = position !== undefined && position !== existing.position;

    if (!hasTitleChange && !hasPriorityChange && !hasStatusChange && !hasPositionChange) {
      return { success: true, noop: true };
    }

    const now = new Date().toISOString();
    const updateValues: Partial<typeof goals.$inferInsert> = {
      updatedAt: now,
    };

    if (hasTitleChange) updateValues.title = title;
    if (hasPriorityChange) updateValues.priority = priority;
    if (hasPositionChange) updateValues.position = position;
    if (hasStatusChange) {
      updateValues.status = status;
      if (status === 'completed' || status === 'killed') {
        updateValues.archivedAt = now;
      } else if (status === 'active') {
        updateValues.archivedAt = null;
      }
    }

    await db
      .update(goals)
      .set(updateValues)
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update goal:', error);
    return { success: false, error: 'Could not update goal' };
  }
}

const MoveGoalSchema = z.object({
  id: z.string().uuid(),
  beforeId: z.string().uuid().nullable().optional(),
  afterId: z.string().uuid().nullable().optional(),
});

export type MoveGoalInput = z.infer<typeof MoveGoalSchema>;

export async function moveGoal(input: MoveGoalInput) {
  const user = await requireUser();

  const validated = MoveGoalSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: 'Invalid move goal input' };
  }

  const { id, beforeId, afterId } = validated.data;

  try {
    let beforePosition: string | null = null;
    let afterPosition: string | null = null;

    if (beforeId) {
      const [beforeGoal] = await db
        .select({ position: goals.position })
        .from(goals)
        .where(and(eq(goals.id, beforeId), eq(goals.userId, user.id)))
        .limit(1);
      beforePosition = beforeGoal?.position ?? null;
    }

    if (afterId) {
      const [afterGoal] = await db
        .select({ position: goals.position })
        .from(goals)
        .where(and(eq(goals.id, afterId), eq(goals.userId, user.id)))
        .limit(1);
      afterPosition = afterGoal?.position ?? null;
    }

    let newPosition = generateKeyBetween(beforePosition, afterPosition);

    // Check for collisions with existing active goals
    const [conflict] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(
        and(
          eq(goals.userId, user.id),
          eq(goals.status, 'active'),
          eq(goals.position, newPosition),
          ne(goals.id, id)
        )
      )
      .limit(1);

    const isColliding =
      newPosition === beforePosition ||
      newPosition === afterPosition ||
      Boolean(conflict);

    if (isColliding) {
      // Regenerate keys for user's active list in one atomic transaction
      await db.transaction(async (tx) => {
        const activeList = await tx
          .select({ id: goals.id })
          .from(goals)
          .where(and(eq(goals.userId, user.id), eq(goals.status, 'active')))
          .orderBy(asc(goals.position));

        const orderedIds = activeList.map((g) => g.id).filter((gId) => gId !== id);
        let insertIndex = 0;
        if (beforeId) {
          const bIdx = orderedIds.indexOf(beforeId);
          insertIndex = bIdx !== -1 ? bIdx + 1 : orderedIds.length;
        }
        orderedIds.splice(insertIndex, 0, id);

        const newKeys = generateNKeysBetween(null, null, orderedIds.length);
        const now = new Date().toISOString();

        for (let i = 0; i < orderedIds.length; i++) {
          await tx
            .update(goals)
            .set({ position: newKeys[i], updatedAt: now })
            .where(and(eq(goals.id, orderedIds[i]), eq(goals.userId, user.id)));

          if (orderedIds[i] === id) {
            newPosition = newKeys[i];
          }
        }
      });
    } else {
      await db
        .update(goals)
        .set({
          position: newPosition,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(goals.id, id), eq(goals.userId, user.id)));
    }

    revalidatePath('/');
    return { success: true, position: newPosition };
  } catch (error) {
    console.error('Failed to move goal:', error);
    return { success: false, error: 'Could not reorder goal' };
  }
}

const ArchiveGoalSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['completed', 'killed']),
});

export async function archiveGoal(input: z.infer<typeof ArchiveGoalSchema>) {
  const validated = ArchiveGoalSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: 'Invalid archive goal input' };
  }
  return updateGoal({
    id: validated.data.id,
    status: validated.data.status,
  });
}

const RestoreGoalSchema = z.object({
  id: z.string().uuid(),
  position: z.string().min(1),
});

export async function restoreGoal(input: z.infer<typeof RestoreGoalSchema>) {
  const user = await requireUser();
  const validated = RestoreGoalSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: 'Invalid restore goal input' };
  }

  const { id, position } = validated.data;
  const now = new Date().toISOString();

  try {
    await db
      .update(goals)
      .set({
        status: 'active',
        position,
        archivedAt: null,
        updatedAt: now,
      })
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to restore goal:', error);
    return { success: false, error: 'Could not restore goal' };
  }
}

const DeleteGoalForeverSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteGoalForever(input: z.infer<typeof DeleteGoalForeverSchema>) {
  const user = await requireUser();
  const validated = DeleteGoalForeverSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: 'Invalid delete goal input' };
  }

  const { id } = validated.data;

  try {
    await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, user.id)));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete goal forever:', error);
    return { success: false, error: 'Could not delete goal forever' };
  }
}

