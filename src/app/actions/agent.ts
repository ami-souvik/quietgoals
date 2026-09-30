'use server';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiTokens } from '@/db/schema';
import { generateRawToken, hashToken } from '@/lib/agentTokens';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface AgentTokenStatus {
  hasActiveToken: boolean;
  createdAt?: string | null;
  lastUsedAt?: string | null;
}

export async function getAgentTokenStatus(): Promise<AgentTokenStatus> {
  const user = await requireUser();

  const [activeToken] = await db
    .select({
      id: apiTokens.id,
      createdAt: apiTokens.createdAt,
      lastUsedAt: apiTokens.lastUsedAt,
    })
    .from(apiTokens)
    .where(and(eq(apiTokens.userId, user.id), isNull(apiTokens.revokedAt)))
    .orderBy(desc(apiTokens.createdAt))
    .limit(1);

  if (!activeToken) {
    return { hasActiveToken: false };
  }

  return {
    hasActiveToken: true,
    createdAt: activeToken.createdAt,
    lastUsedAt: activeToken.lastUsedAt,
  };
}

export async function generateAgentToken(): Promise<{
  success: boolean;
  token?: string;
  createdAt?: string;
  error?: string;
}> {
  const user = await requireUser();
  const now = new Date().toISOString();

  try {
    // 1. Revoke any existing active tokens for this user
    await db
      .update(apiTokens)
      .set({ revokedAt: now })
      .where(and(eq(apiTokens.userId, user.id), isNull(apiTokens.revokedAt)));

    // 2. Generate raw token and hash
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    // 3. Store hashed token
    await db.insert(apiTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      createdAt: now,
      lastUsedAt: null,
      revokedAt: null,
    });

    revalidatePath('/');
    return { success: true, token: rawToken, createdAt: now };
  } catch (error) {
    console.error('Failed to generate agent token:', error);
    return { success: false, error: 'Could not generate API token' };
  }
}

export async function revokeAgentToken(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await requireUser();
  const now = new Date().toISOString();

  try {
    await db
      .update(apiTokens)
      .set({ revokedAt: now })
      .where(and(eq(apiTokens.userId, user.id), isNull(apiTokens.revokedAt)));

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to revoke agent token:', error);
    return { success: false, error: 'Could not revoke API token' };
  }
}
