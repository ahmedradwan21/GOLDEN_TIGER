import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { LOYALTY_TIER_FIELDS, sanitizeTierInput } from '@/lib/loyalty-tiers';

export const dynamic = 'force-dynamic';
const db = () => (supabaseAdmin as any).from('loyalty_tiers');

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await db().select(LOYALTY_TIER_FIELDS).order('sort_order', { ascending: true });
  if (error) return serverError(error, 500);
  return NextResponse.json({ tiers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const input = sanitizeTierInput(await req.json());
  if (!input.name_en) return NextResponse.json({ error: 'English name is required' }, { status: 400 });
  const { data, error } = await db().insert(input).select(LOYALTY_TIER_FIELDS).single();
  if (error) return serverError(error, 500);
  return NextResponse.json({ tier: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const input = sanitizeTierInput(body);
  if ('name_en' in input && !input.name_en) return NextResponse.json({ error: 'English name is required' }, { status: 400 });
  const { data, error } = await db().update(input).eq('id', body.id).select(LOYALTY_TIER_FIELDS).single();
  if (error) return serverError(error, 500);
  return NextResponse.json({ tier: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const { error } = await db().delete().eq('id', id);
  if (error) return serverError(error, 500);
  return NextResponse.json({ ok: true });
}
