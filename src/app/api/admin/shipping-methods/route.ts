import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { validateShippingMethod } from '@/lib/admin-settings';

export const dynamic = 'force-dynamic';

const COLUMNS = 'id, name_en, name_ar, price_cents, eta_en, eta_ar, sort_order, is_active';

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await (supabaseAdmin as any)
    .from('shipping_methods')
    .select(COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) return serverError(error, 500);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const input = validateShippingMethod(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
  const { data, error } = await (supabaseAdmin as any).from('shipping_methods').insert(input).select(COLUMNS).single();
  if (error) return serverError(error, 500);
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : null;
  const input = validateShippingMethod(body);
  if (!id || !input) return NextResponse.json({ error: 'Invalid shipping method' }, { status: 400 });
  const { data, error } = await (supabaseAdmin as any)
    .from('shipping_methods')
    .update(input)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return serverError(error, 500);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await (supabaseAdmin as any).from('shipping_methods').delete().eq('id', id);
  if (error) return serverError(error, 500);
  return NextResponse.json({ ok: true });
}
