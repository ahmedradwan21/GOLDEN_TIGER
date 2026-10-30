import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';
import { buildEarningsReport, type ReportOrder } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

const PAGE = 1000;

const parseIso = (v: string | null): string | null | undefined => {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
};

/**
 * GET ?from=ISO&to=ISO (both optional, inclusive).
 * Order date = completed_at, falling back to created_at when completed_at is empty.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(); if (!auth.ok) return auth.response;
  const from = parseIso(req.nextUrl.searchParams.get('from'));
  const to = parseIso(req.nextUrl.searchParams.get('to'));
  if (from === undefined || to === undefined || (from && to && from > to)) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
  }

  const db = supabaseAdmin as any;
  const { data: affiliates, error: affError } = await db
    .from('affiliates')
    .select('id, name, coupon_code, commission_percent, is_active')
    .not('coupon_code', 'is', null)
    .order('name', { ascending: true });
  if (affError) return serverError(affError, 500);

  const orders: ReportOrder[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db
      .from('orders')
      .select('coupon_code, total_cents, status, completed_at, created_at')
      .eq('status', 'COMPLETED')
      .not('coupon_code', 'is', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) return serverError(error, 500);
    orders.push(...((data ?? []) as ReportOrder[]));
    if (!data || data.length < PAGE) break;
  }

  const rows = buildEarningsReport(affiliates ?? [], orders, { from, to });
  const totals = rows.reduce(
    (acc, r) => ({
      order_count: acc.order_count + r.order_count,
      total_sales_cents: acc.total_sales_cents + r.total_sales_cents,
      commission_cents: acc.commission_cents + r.commission_cents,
    }),
    { order_count: 0, total_sales_cents: 0, commission_cents: 0 }
  );
  return NextResponse.json({ rows, totals, from, to });
}
