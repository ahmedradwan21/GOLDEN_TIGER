const STATE_CHANGING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * CSRF guard: for state-changing methods, an Origin header (when present) must match the request host.
 * Edge-safe (used by middleware and routes).
 */
export function isOriginAllowed(req: Request): boolean {
  if (!STATE_CHANGING.has(req.method.toUpperCase())) return true;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || req.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function forbiddenOriginResponse(): Response {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Returns a 403 response when the origin check fails, otherwise null. */
export function checkOrigin(req: Request): Response | null {
  return isOriginAllowed(req) ? null : forbiddenOriginResponse();
}
