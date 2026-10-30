import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const status = searchParams.get('status') ?? '';
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('orders')
      .select('id, order_number, session_id, status, email, total_cents, subtotal_cents, tax_cents, shipping_cents, currency, created_at, completed_at, checkout_started_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;
    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({
      orders: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
