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
  return NextResponse.json(
    { error: `Database error during ${step}: ${error?.message ?? 'unknown error'} (possible RLS rejection)`, code: error?.code ?? null },
    { status: 500 }
  );
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
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('orders')
      .select('id, session_id, status, checkout_started_at')
      .eq('session_id', sessionId)
      .eq('status', 'CHECKOUT_STARTED')
      .gte('checkout_started_at', cutoff)
      .maybeSingle();
    if (existingError) return dbFail('orders select', existingError);

    const productIds = items.map((i) => i.productId);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, images, price_cents')
      .in('id', productIds);
    if (productsError) return dbFail('products select', productsError);

    const productMap = new Map((products ?? []).map((p: { id: string; title: string; images: string[]; price_cents: number }) => [p.id, p]));
    const orderItems = items.map((i) => {
      const p = productMap.get(i.productId);
      return {
        product_id: i.productId,
        title_snapshot: p?.title ?? 'Unknown Product',
        image_snapshot: p?.images?.[0] ?? null,
        unit_price_cents: p?.price_cents ?? 0,
        quantity: i.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);

    if (existing) {
      const { error: delError } = await supabaseAdmin.from('order_items').delete().eq('order_id', existing.id);
      if (delError) return dbFail('order_items delete', delError);
      const { error: updError } = await supabaseAdmin
        .from('orders')
        .update({
          user_id: session?.userId ?? null,
          subtotal_cents: subtotal,
          total_cents: subtotal,
        })
        .eq('id', existing.id);
      if (updError) return dbFail('orders update', updError);

      const itemsWithOrderId = orderItems.map((i) => ({ ...i, order_id: existing.id }));
      const { error: insError } = await supabaseAdmin.from('order_items').insert(itemsWithOrderId);
      if (insError) return dbFail('order_items insert', insError);

      return NextResponse.json({ orderId: existing.id });
    }

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

    if (error || !order) return dbFail('orders insert', error);

    const itemsWithOrderId = orderItems.map((i) => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(itemsWithOrderId);
    if (itemsError) return dbFail('order_items insert', itemsError);

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error('[checkout] Unexpected error:', err);
    return NextResponse.json({ error: `Unexpected checkout error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
