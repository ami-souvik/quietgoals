import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { apiTokens } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateRawToken(): string {
  // Clear, recognizable prefix: qg_live_
  const randomPart = crypto.randomBytes(24).toString('base64url');
  return `qg_live_${randomPart}`;
}

// In-memory rate limiter: 60 requests per minute per token / user
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

// Periodic cleanup of stale rate limit entries
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitBuckets.entries()) {
      if (now > bucket.resetAt) {
        rateLimitBuckets.delete(key);
      }
    }
  }, 120000);
  if (typeof interval === 'object' && interval !== null && 'unref' in interval) {
    (interval as { unref: () => void }).unref();
  }
}

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs };
  }

  bucket.count += 1;
  const resetMs = Math.max(0, bucket.resetAt - now);

  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0, resetMs };
  }

  return { allowed: true, remaining: maxRequests - bucket.count, resetMs };
}

export async function verifyBearerToken(bearerHeader: string | null): Promise<{
  valid: boolean;
  userId?: string;
  tokenId?: string;
  error?: string;
}> {
  if (!bearerHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const parts = bearerHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false, error: 'Invalid Authorization header format. Expected "Bearer <token>"' };
  }

  const token = parts[1].trim();
  if (!token) {
    return { valid: false, error: 'Empty bearer token' };
  }

  const tokenHash = hashToken(token);

  try {
    const [record] = await db
      .select({
        id: apiTokens.id,
        userId: apiTokens.userId,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(and(eq(apiTokens.tokenHash, tokenHash), isNull(apiTokens.revokedAt)))
      .limit(1);

    if (!record) {
      return { valid: false, error: 'Invalid or revoked API token' };
    }

    // Update lastUsedAt asynchronously
    const now = new Date().toISOString();
    db.update(apiTokens)
      .set({ lastUsedAt: now })
      .where(eq(apiTokens.id, record.id))
      .catch((err) => {
        console.error('Failed to update token lastUsedAt:', err);
      });

    return { valid: true, userId: record.userId, tokenId: record.id };
  } catch (error) {
    console.error('Error verifying bearer token:', error);
    return { valid: false, error: 'Authentication database lookup failed' };
  }
}
