import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase
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
