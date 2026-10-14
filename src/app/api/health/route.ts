import { NextResponse } from 'next/server';
import { supabase, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {
    server: { status: 'ok' },
  };

  if (isDatabaseConfigured()) {
    const start = Date.now();
    try {
      const { error } = await supabase.from('categories').select('id').limit(1);
      checks.database = {
        status: error ? 'degraded' : 'ok',
        latency: Date.now() - start,
      };
    } catch {
      checks.database = { status: 'error' };
    }
  } else {
    checks.database = { status: 'not_configured' };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok' || c.status === 'not_configured');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', timestamp: new Date().toISOString(), checks },
    { status: allOk ? 200 : 503 }
  );
}
