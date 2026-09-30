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
