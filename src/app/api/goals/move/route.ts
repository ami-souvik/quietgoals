import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { moveGoal } from '@/app/actions/goals';

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    
    const result = await moveGoal(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: 'Invalid payload or unauthorized' }, { status: 400 });
  }
}
