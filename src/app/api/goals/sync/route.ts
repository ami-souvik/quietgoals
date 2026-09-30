import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { goals } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateNKeysBetween } from 'fractional-indexing';

const SyncInputSchema = z.object({
  offlineTasks: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1),
    status: z.enum(['active', 'completed', 'killed']).optional().default('active'),
    createdAt: z.number().optional()
  }))
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validated = SyncInputSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    const offlineTasks = validated.data.offlineTasks;
    
    if (offlineTasks.length > 0) {
      const taskIds = offlineTasks.map(t => t.id);
      
      // Find which ones already exist
      const existing = await db
        .select({ id: goals.id })
        .from(goals)
        .where(and(eq(goals.userId, user.id), inArray(goals.id, taskIds)));
        
      const existingIds = new Set(existing.map(g => g.id));
      
      // Filter strictly new tasks
      const newTasks = offlineTasks.filter(t => !existingIds.has(t.id));
      
      if (newTasks.length > 0) {
        const newKeys = generateNKeysBetween(null, null, newTasks.length);
        
        await db.insert(goals).values(
          newTasks.map((t, idx) => ({
            id: t.id,
            userId: user.id,
            userEmail: user.email,
            title: t.title,
            position: newKeys[idx],
            status: t.status,
            priority: 'none' as const,
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
