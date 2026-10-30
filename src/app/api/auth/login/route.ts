import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';
import { normalizeEmail } from '@/lib/auth/email';
import { getClientIp, rateLimitHit, rateLimitedResponse } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const WINDOW = 15 * 60;
const LIMIT = 10;
// Valid bcrypt hash (cost 12) of a throwaway value; compared when the user does not exist
// so unknown emails take the same time as wrong passwords.
const DUMMY_HASH = '$2b$12$hgGT3FFyYT38JombRZR1au92qtMRpRbwst6a2WkRzcN4AqkE2qPUO';

function invalidCredentials() {
  return NextResponse.json({ error: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await rateLimitHit(`login:ip:${ip}`, LIMIT, WINDOW))) return rateLimitedResponse();

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', code: 'INVALID_INPUT' }, { status: 400 });
    }

    const email = normalizeEmail(parsed.data.email);
    const { password } = parsed.data;
    if (!(await rateLimitHit(`login:email:${email}`, LIMIT, WINDOW))) return rateLimitedResponse();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, password_hash')
      .eq('email', email)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
    }

    const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !valid) return invalidCredentials();

    await createSessionCookie(user.id, user.email);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auth/login] Error:', msg);
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
