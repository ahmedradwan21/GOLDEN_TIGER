import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`login:${getClientIp(req)}`)) return rateLimitResponse();
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, password_hash')
      .eq('email', email)
      .maybeSingle();
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await createSessionCookie(user.id, user.email);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auth/login] Error:', msg);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
