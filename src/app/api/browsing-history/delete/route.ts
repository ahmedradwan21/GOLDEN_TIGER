import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';

const schema = z.object({ sessionId: z.string().min(8).max(128) });

// Clears the browsing history rows for one anonymous browsing session.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { error, count } = await supabaseAdmin
      .from('browsing_history')
      .delete({ count: 'exact' })
      .eq('session_id', parsed.data.sessionId);
    if (error) {
      console.error('[browsing-history] delete failed:', error.code, error.message);
      return serverError(error, 500, "browsing-history");
    }
    return NextResponse.json({ deleted: count ?? 0 });
  } catch (err) {
    console.error('[browsing-history] Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected error clearing browsing history' }, { status: 500 });
  }
}
