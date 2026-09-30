import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { listActiveGoals, listArchivedGoals } from '@/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const [activeGoals, archivedGoals] = await Promise.all([
      listActiveGoals(user.id),
      listArchivedGoals(user.id),
    ]);

    return NextResponse.json({
      activeGoals,
      archivedGoals,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    
    // We can reuse the server action createGoal which validates user and payload
    const { createGoal } = await import('@/app/actions/goals');
    const result = await createGoal(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid payload or unauthorized' }, { status: 400 });
  }
}
