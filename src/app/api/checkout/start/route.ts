import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { getSession } from '@/lib/auth/session';

const startSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(99),
    })
  ).min(1).max(100),
  sessionId: z.string().min(1),
});

function dbFail(step: string, error: { message: string; code?: string } | null) {
  console.error(`[checkout] ${step} failed:`, error?.code, error?.message);
  return NextResponse.json({ error: 'Checkout could not be processed. Please try again.' }, { status: 500 });
}

// Newest open order for this session. Never uses maybeSingle(): duplicates must not crash.
async function findOpenOrder(sessionId: string, cutoff?: string) {
  let q = supabaseAdmin
    .from('orders')
    .select('id, session_id, status, checkout_started_at')
    .eq('session_id', sessionId)
    .eq('status', 'CHECKOUT_STARTED')
    .is('order_number', null);
  if (cutoff) q = q.gte('checkout_started_at', cutoff);
  const { data, error } = await q.order('checkout_started_at', { ascending: false }).limit(1);
  return { data: (data?.[0] ?? null) as { id: string } | null, error };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { items, sessionId } = parsed.data;
    const session = await getSession();

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing, error: existingError } = await findOpenOrder(sessionId, cutoff);
    if (existingError) return dbFail('orders select', existingError);

    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, images, price_cents, is_published')
      .in('id', productIds);
    if (productsError) return dbFail('products select', productsError);

    type ProductRow = { id: string; title: string; images: string[] | null; price_cents: number | null; is_published: boolean };
    const productMap = new Map((products ?? []).map((p: ProductRow) => [p.id, p]));

    // Never create an order line from a missing/unpublished/unpriced product.
    const isSellable = (p: ProductRow | undefined): p is ProductRow =>
      !!p && p.is_published === true && Number.isInteger(p.price_cents) && (p.price_cents as number) > 0;
    const invalidItems = items
      .filter((i) => !isSellable(productMap.get(i.productId)))
      .map((i) => ({ productId: i.productId, quantity: i.quantity, reason: 'unavailable' as const }));
    if (invalidItems.length > 0) {
      return NextResponse.json({ error: 'Some items are no longer available', items: invalidItems }, { status: 400 });
    }

    const orderItems = items.map((i) => {
      const p = productMap.get(i.productId) as ProductRow;
      return {
        product_id: p.id,
        title_snapshot: p.title,
        image_snapshot: p.images?.[0] ?? null,
        unit_price_cents: p.price_cents as number,
        quantity: i.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);

    // Replace items/totals on an existing open order (shared by the reuse and 23505 paths).
    const reuseOrder = async (orderId: string) => {
      const { error: delError } = await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
      if (delError) return dbFail('order_items delete', delError);
      const { error: updError } = await supabaseAdmin
        .from('orders')
        .update({
          user_id: session?.userId ?? null,
          subtotal_cents: subtotal,
          total_cents: subtotal,
        })
        .eq('id', orderId);
      if (updError) return dbFail('orders update', updError);

      const itemsWithOrderId = orderItems.map((i) => ({ ...i, order_id: orderId }));
      const { error: insError } = await supabaseAdmin.from('order_items').insert(itemsWithOrderId);
      if (insError) return dbFail('order_items insert', insError);

      return NextResponse.json({ orderId });
    };

    if (existing) return reuseOrder(existing.id);

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        session_id: sessionId,
        user_id: session?.userId ?? null,
        email: session?.email ?? null,
        status: 'CHECKOUT_STARTED',
        subtotal_cents: subtotal,
        total_cents: subtotal,
      })
      .select('id')
      .single();

    if (error?.code === '23505') {
      // A concurrent /start created the open order first (partial unique index); reuse it.
      const { data: winner, error: winnerError } = await findOpenOrder(sessionId);
      if (winnerError || !winner) return dbFail('orders reselect', winnerError ?? error);
      return reuseOrder(winner.id);
    }
    if (error || !order) return dbFail('orders insert', error);

    const itemsWithOrderId = orderItems.map((i) => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemsWithOrderId);
    if (itemsError) return dbFail('order_items insert', itemsError);

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error('[checkout] Unexpected error:', err);
    return NextResponse.json({ error: 'Checkout could not be processed. Please try again.' }, { status: 500 });
  }
}
