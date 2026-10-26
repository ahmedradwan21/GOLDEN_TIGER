import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db-admin';
import { LOYALTY_TIER_FIELDS, sanitizeTierInput } from '@/lib/loyalty-tiers';

export const dynamic = 'force-dynamic';
const db = () => (supabaseAdmin as any).from('loyalty_tiers');
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET() {
  if (!(await getAdminSession())) return unauthorized();
  const { data, error } = await db().select(LOYALTY_TIER_FIELDS).order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tiers: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();
  const input = sanitizeTierInput(await req.json());
  if (!input.name_en) return NextResponse.json({ error: 'English name is required' }, { status: 400 });
  const { data, error } = await db().insert(input).select(LOYALTY_TIER_FIELDS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tier: data });
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const input = sanitizeTierInput(body);
  if ('name_en' in input && !input.name_en) return NextResponse.json({ error: 'English name is required' }, { status: 400 });
  const { data, error } = await db().update(input).eq('id', body.id).select(LOYALTY_TIER_FIELDS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tier: data });
}

export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const { error } = await db().delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
