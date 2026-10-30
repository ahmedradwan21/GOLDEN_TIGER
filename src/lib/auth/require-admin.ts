import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminSession, type AdminPayload } from '@/lib/auth/session';
import { isOriginAllowed } from '@/lib/api/origin';

export type RequireAdminResult =
  | { ok: true; admin: AdminPayload }
  | { ok: false; response: NextResponse };

/** Single admin gate for /api/admin/* routes. Optional request also enforces the Origin check. */
export async function requireAdmin(req?: Request): Promise<RequireAdminResult> {
  if (req && !isOriginAllowed(req)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  const admin = await getAdminSession();
  if (!admin) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { ok: true, admin };
}
