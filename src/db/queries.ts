import { db } from '@/lib/db';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { goals, type Goal, type GoalPriority } from './schema';

export async function listActiveGoals(userId: string, userEmail?: string): Promise<Goal[]> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  return db
    .select()
    .from(goals)
    .where(and(userCondition, eq(goals.status, 'active')))
    .orderBy(asc(goals.position));
}

export async function listArchivedGoals(userId: string, userEmail?: string): Promise<Goal[]> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  return db
    .select()
    .from(goals)
    .where(
      and(
        userCondition,
        inArray(goals.status, ['completed', 'killed']),
      ),
    )
    .orderBy(desc(goals.archivedAt), desc(goals.updatedAt));
}

export async function createGoal(
  userId: string,
  input: {
    title: string;
    position: string;
    priority?: GoalPriority;
    userEmail?: string;
  },
): Promise<Goal> {
  const [created] = await db
    .insert(goals)
    .values({
      userId,
      userEmail: input.userEmail,
      title: input.title,
      position: input.position,
      priority: input.priority ?? 'none',
      status: 'active',
    })
    .returning();

  return created;
}

export async function updateGoal(
  userId: string,
  id: string,
  input: {
    title?: string;
    priority?: GoalPriority;
  },
): Promise<Goal | undefined> {
  const [updated] = await db
    .update(goals)
    .set({
      ...input,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();

  return updated;
}

export async function moveGoal(
  userId: string,
  id: string,
  newPosition: string,
): Promise<Goal | undefined> {
  const [moved] = await db
    .update(goals)
    .set({
      position: newPosition,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();

  return moved;
}

export async function archiveGoal(
  userId: string,
  id: string,
  status: 'completed' | 'killed',
): Promise<Goal | undefined> {
  const now = new Date().toISOString();
  const [archived] = await db
    .update(goals)
    .set({
      status,
      archivedAt: now,
      updatedAt: now,
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();

  return archived;
}

export async function restoreGoal(
  userId: string,
  id: string,
  position: string,
): Promise<Goal | undefined> {
  const now = new Date().toISOString();
  const [restored] = await db
    .update(goals)
    .set({
      status: 'active',
      position,
      archivedAt: null,
      updatedAt: now,
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();

  return restored;
}

export async function deleteForever(userId: string, id: string): Promise<void> {
  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
}
