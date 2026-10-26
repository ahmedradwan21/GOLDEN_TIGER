import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { getSession } from '@/lib/auth/session';
import { formatPrice } from '@/lib/pricing';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // supabaseAdmin bypasses RLS, so every query MUST be scoped to the
  // session's user id (taken from the signed session cookie, never the request).
  const userId = session.userId;

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, order_number, total_cents, status, completed_at')
    .eq('user_id', userId)
    .eq('status', 'COMPLETED')
    .order('completed_at', { ascending: false })
    .limit(20);

  if (!orders || orders.length === 0) {
    return NextResponse.json([]);
  }

  const orderIds = orders.filter((o: { user_id: string | null }) => o.user_id === userId).map((o: { id: string }) => o.id);
  const { data: allItems } = await supabaseAdmin
    .from('order_items')
    .select('order_id, title_snapshot, image_snapshot, quantity, unit_price_cents')
    .in('order_id', orderIds); // orderIds come only from this user's orders above

  // Defensive: drop any order not owned by this user.
  const ownOrders = orders.filter((o: { user_id: string | null }) => o.user_id === userId);
  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return NextResponse.json(
    ownOrders.map((o: { id: string; order_number: string | null; total_cents: number; status: string; completed_at: string | null }) => ({
      id: o.id,
      orderNumber: o.order_number,
      totalCents: o.total_cents,
      totalFormatted: formatPrice(o.total_cents),
      status: o.status,
      completedAt: o.completed_at,
      itemCount: (itemsByOrder.get(o.id) ?? []).reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
      items: (itemsByOrder.get(o.id) ?? []).map((i: { title_snapshot: string; image_snapshot: string | null; quantity: number; unit_price_cents: number }) => ({
        title: i.title_snapshot,
        image: i.image_snapshot,
        quantity: i.quantity,
        unitPriceCents: i.unit_price_cents,
      })),
    }))
  );
}
