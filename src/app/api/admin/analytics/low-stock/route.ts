import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, title, stock')
      .lt('stock', 10)
      .eq('is_published', true)
      .order('stock', { ascending: true })
      .limit(15);

    if (error || !data) {
      return NextResponse.json({ products: [] });
    }

    return NextResponse.json({ products: data });
  } catch {
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
