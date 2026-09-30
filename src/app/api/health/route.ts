import { NextResponse } from 'next/server';
import { client } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lightweight database connectivity ping
    await client.execute('SELECT 1');

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'error',
      },
      { status: 503 }
    );
  }
}
