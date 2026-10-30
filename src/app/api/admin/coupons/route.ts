import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { couponSchema } from '@/lib/admin-catalog';

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
  return error ? serverError(error, 500) : NextResponse.json(data ?? []);
}
async function save(req: NextRequest, edit: boolean) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const fields = couponSchema.parse(body);
    if (edit && !body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const result = edit ? await supabaseAdmin.from('coupons').update(fields).eq('id', body.id).select().single() : await supabaseAdmin.from('coupons').insert(fields).select().single();
    return result.error ? serverError(result.error, 400) : NextResponse.json(result.data);
  } catch { return NextResponse.json({ error: 'Invalid coupon fields' }, { status: 400 }); }
}
export const POST = (req: NextRequest) => save(req, false);
export const PATCH = (req: NextRequest) => save(req, true);
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
  return error ? serverError(error, 400) : NextResponse.json({ success: true });
}
