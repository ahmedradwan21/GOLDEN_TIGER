import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', code: 'INVALID_INPUT' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, password_hash')
      .eq('email', email)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'This email is not registered.', code: 'EMAIL_NOT_REGISTERED' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Wrong password. Please try again.', code: 'WRONG_PASSWORD' }, { status: 401 });
    }

    await createSessionCookie(user.id, user.email);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[auth/login] Error:', msg);
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
