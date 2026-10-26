import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db-admin';
import { couponSchema } from '@/lib/admin-catalog';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data ?? []);
}
async function save(req: NextRequest, edit: boolean) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const fields = couponSchema.parse(body);
    if (edit && !body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const result = edit ? await supabaseAdmin.from('coupons').update(fields).eq('id', body.id).select().single() : await supabaseAdmin.from('coupons').insert(fields).select().single();
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json(result.data);
  } catch { return NextResponse.json({ error: 'Invalid coupon fields' }, { status: 400 }); }
}
export const POST = (req: NextRequest) => save(req, false);
export const PATCH = (req: NextRequest) => save(req, true);
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ success: true });
}
