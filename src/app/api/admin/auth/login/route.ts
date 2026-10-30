import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { verifyPassword } from '@/lib/auth/password';
import { createAdminCookie } from '@/lib/auth/session';
import { normalizeEmail } from '@/lib/auth/email';
import { getClientIp, rateLimitHit, rateLimitedResponse } from '@/lib/rate-limit';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RATE_LIMIT = 5;
const RATE_WINDOW = 15 * 60; // seconds

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);
    if (
      !(await rateLimitHit(`admin-login:ip:${ip}`, RATE_LIMIT, RATE_WINDOW)) ||
      !(await rateLimitHit(`admin-login:email:${email}`, RATE_LIMIT, RATE_WINDOW))
    ) {
      return rateLimitedResponse();
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, name, role, password_hash')
      .eq('email', email)
      .maybeSingle();
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await supabaseAdmin
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    await createAdminCookie(admin.id, admin.email, admin.role);
    return NextResponse.json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/auth/login] Error:', msg);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
