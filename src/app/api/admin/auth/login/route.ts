import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createAdminCookie } from '@/lib/auth/session';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ipHits = new Map<string, { count: number; resetAt: number }>();
const emailHits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 15 * 60 * 1000;

function checkRate(key: string, map: Map<string, { count: number; resetAt: number }>): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { email, password } = parsed.data;
    if (!checkRate(ip, ipHits) || !checkRate(email.toLowerCase(), emailHits)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const { data: admin } = await supabase
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

    await supabase
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    await createAdminCookie(admin.id, admin.email, admin.role);
    return NextResponse.json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
