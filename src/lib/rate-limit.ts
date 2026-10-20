import 'server-only';

interface RateEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory fixed-window rate limiter (per server instance).
// Suitable for login/register endpoints; swap for Redis/Upstash in multi-instance deployments.
const buckets = new Map<string, RateEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute

// Periodically sweep expired entries so the map doesn't grow unbounded.
let sweepScheduled = false;
function scheduleSweep(): void {
  if (sweepScheduled) return;
  sweepScheduled = true;
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (entry.resetAt < now) buckets.delete(key);
    }
  }, WINDOW_MS);
  // Don't hold the Node process open just for the sweeper.
  if (typeof timer.unref === 'function') timer.unref();
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Returns true if the request is allowed, false if the limit was exceeded.
 * Default: 10 requests per minute per key.
 */
export function checkRateLimit(key: string, limit = 10, windowMs = WINDOW_MS): boolean {
  scheduleSweep();
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export function rateLimitResponse(): Response {
  return Response.json(
    { error: 'Too many requests. Please try again in a minute.' },
    { status: 429 },
  );
}
