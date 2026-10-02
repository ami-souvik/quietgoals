import { db } from '@/lib/db';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { goals, type Goal, type GoalPriority, type GoalStatus } from './schema';

export async function listActiveGoals(userId: string, userEmail?: string): Promise<Goal[]> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  return db
    .select()
    .from(goals)
    .where(and(userCondition, inArray(goals.status, ['not-started', 'in-progress', 'active'])))
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
    status?: GoalStatus;
    description?: string | null;
    link?: string | null;
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
      status: input.status ?? 'not-started',
      description: input.description ?? null,
      link: input.link ?? null,
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
    status?: GoalStatus;
    description?: string | null;
    link?: string | null;
  },
  userEmail?: string,
): Promise<Goal | undefined> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  const [updated] = await db
    .update(goals)
    .set({
      ...input,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(goals.id, id), userCondition))
    .returning();

  return updated;
}

export async function moveGoal(
  userId: string,
  id: string,
  newPosition: string,
  userEmail?: string,
): Promise<Goal | undefined> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  const [moved] = await db
    .update(goals)
    .set({
      position: newPosition,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(goals.id, id), userCondition))
    .returning();

  return moved;
}

export async function archiveGoal(
  userId: string,
  id: string,
  status: 'completed' | 'killed',
  userEmail?: string,
): Promise<Goal | undefined> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  const now = new Date().toISOString();
  const [archived] = await db
    .update(goals)
    .set({
      status,
      archivedAt: now,
      updatedAt: now,
    })
    .where(and(eq(goals.id, id), userCondition))
    .returning();

  return archived;
}

export async function restoreGoal(
  userId: string,
  id: string,
  position: string,
  userEmail?: string,
): Promise<Goal | undefined> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  const now = new Date().toISOString();
  const [restored] = await db
    .update(goals)
    .set({
      status: 'not-started',
      position,
      archivedAt: null,
      updatedAt: now,
    })
    .where(and(eq(goals.id, id), userCondition))
    .returning();

  return restored;
}

export async function deleteForever(userId: string, id: string, userEmail?: string): Promise<void> {
  const userCondition = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  await db
    .delete(goals)
    .where(and(eq(goals.id, id), userCondition));
}
