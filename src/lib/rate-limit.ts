import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';

/** First x-forwarded-for value (set by the hosting proxy); falls back to x-real-ip, then 'unknown'. */
export function getClientIp(req: Request): string {
  const first = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = first || req.headers.get('x-real-ip')?.trim() || 'unknown';
  return ip.slice(0, 64);
}

/**
 * Records one hit for `key` via the rate_limit_hit DB function.
 * Returns true when allowed. On DB error: failClosed (default) blocks, otherwise allows.
 */
export async function rateLimitHit(
  key: string,
  limit: number,
  windowSeconds: number,
  opts: { failClosed?: boolean } = {}
): Promise<boolean> {
  const failClosed = opts.failClosed ?? true;
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('rate_limit_hit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error('[rate-limit] rpc failed:', error.message ?? error);
      return !failClosed;
    }
    return data === true;
  } catch (err) {
    console.error('[rate-limit] rpc threw:', err instanceof Error ? err.message : String(err));
    return !failClosed;
  }
}

export function rateLimitedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
    { status: 429 }
  );
}
