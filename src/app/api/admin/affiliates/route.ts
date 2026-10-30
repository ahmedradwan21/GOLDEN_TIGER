import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { AFFILIATE_COUPON, generateAffiliateCode, validateAffiliate } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

const COLUMNS = 'id, name, phone, email, commission_percent, notes, is_active, coupon_code, created_at';
const MAX_CODE_ATTEMPTS = 10;
const db = () => supabaseAdmin as any;

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await db().from('affiliates').select(COLUMNS).order('created_at', { ascending: false });
  if (error) return serverError(error, 500);
  return NextResponse.json(data ?? []);
}

/** Creates the affiliate plus its own NAME-XXXX coupon (10%, not a reward, no expiry). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const input = validateAffiliate(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid affiliate' }, { status: 400 });

  let code: string | null = null;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !code; attempt++) {
    const candidate = generateAffiliateCode(input.name);
    const { data: taken, error: lookupError } = await db()
      .from('coupons')
      .select('id')
      .ilike('code', candidate)
      .limit(1)
      .maybeSingle();
    if (lookupError) return serverError(lookupError, 500);
    if (taken) continue;
    const { error: couponError } = await db().from('coupons').insert({ code: candidate, ...AFFILIATE_COUPON });
    if (!couponError) code = candidate;
    else if (couponError.code !== '23505') return serverError(couponError, 500);
  }
  if (!code) return NextResponse.json({ error: 'Could not generate a unique coupon code' }, { status: 500 });

  const { data, error } = await db()
    .from('affiliates')
    .insert({ ...input, coupon_code: code })
    .select(COLUMNS)
    .single();
  if (error) {
    await db().from('coupons').delete().eq('code', code); // don't leave an orphan coupon behind
    return serverError(error, 500);
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : null;
  const input = validateAffiliate(body);
  if (!id || !input) return NextResponse.json({ error: 'Invalid affiliate' }, { status: 400 });
  const { data, error } = await db()
    .from('affiliates')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return serverError(error, 500);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

/** Deletes the affiliate and its coupon. Past orders keep their coupon_code text. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { data, error } = await db().from('affiliates').delete().eq('id', id).select('coupon_code').maybeSingle();
  if (error) return serverError(error, 500);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.coupon_code) await db().from('coupons').delete().eq('code', data.coupon_code);
  return NextResponse.json({ ok: true });
}
