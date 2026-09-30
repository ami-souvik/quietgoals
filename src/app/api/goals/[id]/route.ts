import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateGoal, deleteGoalForever } from '@/app/actions/goals';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    
    // Inject the ID from the route param into the body
    const result = await updateGoal({ id, ...body });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid payload or unauthorized' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    
    const result = await deleteGoalForever({ id });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid payload or unauthorized' }, { status: 400 });
  }
}
