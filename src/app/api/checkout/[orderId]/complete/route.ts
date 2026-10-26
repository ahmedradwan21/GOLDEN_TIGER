import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { getSession } from '@/lib/auth/session';
import { TAX_RATE } from '@/lib/pricing';
import { generateOrderNumber } from '@/lib/payments/mockGateway';

const completeSchema = z.object({
  sessionId: z.string().min(1),
  paymentRef: z.string().min(1),
});

function dbFail(step: string, error: { message: string; code?: string } | null) {
  console.error(`[checkout] ${step} failed:`, error?.code, error?.message);
  return NextResponse.json(
    { error: `Database error during ${step}: ${error?.message ?? 'unknown error'} (possible RLS rejection)`, code: error?.code ?? null },
    { status: 500 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await req.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const session = await getSession();

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .maybeSingle();
    if (orderError) return dbFail('orders select', orderError);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', params.orderId);
    if (itemsError) return dbFail('order_items select', itemsError);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    const productIds = items.map((i: { product_id: string | null }) => i.product_id).filter(Boolean) as string[];
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, price_cents, stock, is_published')
      .in('id', productIds);
    if (productsError) return dbFail('products select', productsError);

    const productMap = new Map((products ?? []).map((p: { id: string; title: string; price_cents: number; stock: number; is_published: boolean }) => [p.id, p]));

    const stockIssues: { productId: string; title: string; available: number; requested: number }[] = [];
    for (const item of items as { product_id: string | null; title_snapshot: string; quantity: number }[]) {
      if (!item.product_id) continue;
      const p = productMap.get(item.product_id);
      if (!p || !p.is_published) {
        stockIssues.push({ productId: item.product_id, title: item.title_snapshot, available: 0, requested: item.quantity });
        continue;
      }
      if (p.stock < item.quantity) {
        stockIssues.push({ productId: p.id, title: p.title, available: p.stock, requested: item.quantity });
      }
    }

    if (stockIssues.length > 0) {
      return NextResponse.json({ error: 'Some items are out of stock', items: stockIssues }, { status: 409 });
    }

    let subtotal = 0;
    for (const item of items as { product_id: string | null; unit_price_cents: number; quantity: number }[]) {
      const p = item.product_id ? productMap.get(item.product_id) : null;
      const unitPrice = p?.price_cents ?? item.unit_price_cents;
      subtotal += unitPrice * item.quantity;
    }

    const tax = Math.round(subtotal * TAX_RATE);
    let shipping = order.shipping_cents;
    if (order.delivery_method === 'standard') {
      shipping = subtotal >= 5000 ? 0 : 599;
    } else if (order.delivery_method === 'express') {
      shipping = 1499;
    } else if (order.delivery_method === 'next-day') {
      shipping = 2499;
    }
    const total = subtotal + tax + shipping;

    // Atomic stock decrement via the decrement_stock DB function (returns true/false).
    // If any item fails, restore the items already decremented and abort WITHOUT completing the order.
    const decremented: { productId: string; quantity: number }[] = [];
    const rollback = async () => {
      for (const d of decremented) {
        const { data: cur } = await supabaseAdmin.from('products').select('stock').eq('id', d.productId).maybeSingle();
        if (!cur) { console.error(`[checkout] rollback: product ${d.productId} not found`); continue; }
        const { error: rbError } = await supabaseAdmin
          .from('products')
          .update({ stock: (cur as { stock: number }).stock + d.quantity })
          .eq('id', d.productId);
        if (rbError) console.error(`[checkout] rollback failed for ${d.productId}:`, rbError.message);
      }
    };

    for (const item of items as { product_id: string | null; title_snapshot: string; quantity: number }[]) {
      if (!item.product_id) continue;
      const { data: ok, error: rpcError } = await supabaseAdmin.rpc('decrement_stock' as never, {
        p_id: item.product_id,
        qty: item.quantity,
      } as never);
      if (rpcError) {
        await rollback();
        return dbFail(`decrement_stock (${item.product_id})`, rpcError);
      }
      if (ok !== true) {
        await rollback();
        return NextResponse.json(
          { error: 'insufficient stock', items: [{ productId: item.product_id, title: item.title_snapshot, requested: item.quantity }] },
          { status: 409 }
        );
      }
      decremented.push({ productId: item.product_id, quantity: item.quantity });
    }

    const orderNumber = generateOrderNumber();
    const { data: doneRows, error: completeError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        order_number: orderNumber,
        payment_ref: parsed.data.paymentRef,
        payment_method: 'mock_card',
        user_id: session?.userId ?? order.user_id,
        subtotal_cents: subtotal,
        tax_cents: tax,
        shipping_cents: shipping,
        total_cents: total,
      })
      .eq('id', params.orderId)
      .select('id');
    if (completeError) { await rollback(); return dbFail('orders complete update', completeError); }
    if (!doneRows || doneRows.length === 0) { await rollback(); return dbFail('orders complete update', { message: 'no rows updated' }); }

    return NextResponse.json({ orderId: params.orderId, orderNumber, totalCents: total });
  } catch (err) {
    console.error('[checkout] Unexpected error:', err);
    return NextResponse.json({ error: `Unexpected checkout error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
