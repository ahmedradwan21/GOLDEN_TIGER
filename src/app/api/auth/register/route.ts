import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { hashPassword } from '@/lib/auth/password';
import { createSessionCookie } from '@/lib/auth/session';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'INVALID_INPUT', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (lookupError) {
      return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: 'This email is already registered.', code: 'EMAIL_ALREADY_REGISTERED' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ id, email, password_hash: passwordHash, name })
      .select('id, email, name')
      .single();

    if (error?.code === '23505') {
      return NextResponse.json({ error: 'This email is already registered.', code: 'EMAIL_ALREADY_REGISTERED' }, { status: 409 });
    }
    if (error || !user) {
      return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
    }

    await createSessionCookie(user.id, user.email);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
