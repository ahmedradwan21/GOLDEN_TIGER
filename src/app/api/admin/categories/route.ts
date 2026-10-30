import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { categorySchema } from '@/lib/admin-catalog';

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const { data, error } = await supabaseAdmin.from('categories').select('*').order('sort_order');
  if (error) return serverError(error, 500);
  const rows = await Promise.all((data ?? []).map(async category => {
    const { count, error } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', category.id);
    if (error) throw new Error(error.message);
    return { ...category, products_count: count ?? 0 };
  })).catch(() => null);
  return rows ? NextResponse.json(rows) : NextResponse.json({ error: 'Unable to count products' }, { status: 500 });
}
async function save(req: NextRequest, edit: boolean) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const fields = categorySchema.parse(body);
    if (edit && !body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    if (fields.parent_id && fields.parent_id === body.id) return NextResponse.json({ error: 'A category cannot be its own parent' }, { status: 400 });
    const result = edit ? await supabaseAdmin.from('categories').update(fields).eq('id', body.id).select().single() : await supabaseAdmin.from('categories').insert({ ...fields, id: `cat-${crypto.randomUUID()}` }).select().single();
    return result.error ? serverError(result.error, 400) : NextResponse.json(result.data);
  } catch { return NextResponse.json({ error: 'Invalid category fields' }, { status: 400 }); }
}
export const POST = (req: NextRequest) => save(req, false);
export const PATCH = (req: NextRequest) => save(req, true);
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const { count, error: countError } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (countError) return serverError(countError, 500);
  if (count) return NextResponse.json({ error: 'category_has_products', products_count: count }, { status: 409 });
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  return error ? serverError(error, 400) : NextResponse.json({ success: true });
}
