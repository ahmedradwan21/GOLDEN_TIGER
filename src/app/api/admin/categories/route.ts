import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db-admin';
import { categorySchema } from '@/lib/admin-catalog';

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('categories').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = await Promise.all((data ?? []).map(async category => {
    const { count, error } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', category.id);
    if (error) throw new Error(error.message);
    return { ...category, products_count: count ?? 0 };
  })).catch(() => null);
  return rows ? NextResponse.json(rows) : NextResponse.json({ error: 'Unable to count products' }, { status: 500 });
}
async function save(req: NextRequest, edit: boolean) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const fields = categorySchema.parse(body);
    if (edit && !body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    if (fields.parent_id && fields.parent_id === body.id) return NextResponse.json({ error: 'A category cannot be its own parent' }, { status: 400 });
    const result = edit ? await supabaseAdmin.from('categories').update(fields).eq('id', body.id).select().single() : await supabaseAdmin.from('categories').insert({ ...fields, id: `cat-${crypto.randomUUID()}` }).select().single();
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json(result.data);
  } catch { return NextResponse.json({ error: 'Invalid category fields' }, { status: 400 }); }
}
export const POST = (req: NextRequest) => save(req, false);
export const PATCH = (req: NextRequest) => save(req, true);
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const { count, error: countError } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if (count) return NextResponse.json({ error: 'category_has_products', products_count: count }, { status: 409 });
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ success: true });
}
