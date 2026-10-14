import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
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
    const { data: existing } = await supabase
      .from('orders')
      .select('id, session_id, status, checkout_started_at')
      .eq('session_id', sessionId)
      .eq('status', 'CHECKOUT_STARTED')
      .gte('checkout_started_at', cutoff)
      .maybeSingle();

    const productIds = items.map((i) => i.productId);
    const { data: products } = await supabase
      .from('products')
      .select('id, title, images, price_cents')
      .in('id', productIds);

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
      await supabase.from('order_items').delete().eq('order_id', existing.id);
      await supabase
        .from('orders')
        .update({
          user_id: session?.userId ?? null,
          subtotal_cents: subtotal,
          total_cents: subtotal,
        })
        .eq('id', existing.id);

      const itemsWithOrderId = orderItems.map((i) => ({ ...i, order_id: existing.id }));
      await supabase.from('order_items').insert(itemsWithOrderId);

      return NextResponse.json({ orderId: existing.id });
    }

    const { data: order, error } = await supabase
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

    if (error || !order) {
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }

    const itemsWithOrderId = orderItems.map((i) => ({ ...i, order_id: order.id }));
    await supabase.from('order_items').insert(itemsWithOrderId);

    return NextResponse.json({ orderId: order.id });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
