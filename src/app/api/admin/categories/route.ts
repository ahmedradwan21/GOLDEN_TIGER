import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, parent_id, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
