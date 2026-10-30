import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { ensureBrand } from '@/lib/brand-admin';
import { CSV_TEMPLATE, importProductRows } from '@/lib/product-csv';

export async function GET() {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  return new NextResponse('\uFEFF' + CSV_TEMPLATE, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="products-template.csv"', 'Cache-Control': 'no-store' } });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string' || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Choose a CSV file up to 5 MB' }, { status: 400 });
    const summary = await importProductRows(await file.text(), {
      async categoryId(slug) {
        const { data, error } = await supabaseAdmin.from('categories').select('id').eq('slug', slug).maybeSingle();
        if (error) throw new Error(error.message);
        return data?.id ?? null;
      },
      async productId(slug) {
        const { data, error } = await supabaseAdmin.from('products').select('id').eq('slug', slug).maybeSingle();
        if (error) throw new Error(error.message);
        return data?.id ?? null;
      },
      async save(product) {
        const { category_slug, ...payload } = product;
        payload.brand = await ensureBrand(payload.brand);
        const { error } = await supabaseAdmin.from('products').upsert(payload, { onConflict: 'slug' });
        if (error) throw new Error(error.message);
      },
    });
    return NextResponse.json(summary);
  } catch (e) { console.error('[products-import]', e); return NextResponse.json({ error: 'Invalid CSV' }, { status: 400 }); }
}
