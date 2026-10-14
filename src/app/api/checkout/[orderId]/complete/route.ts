import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { TAX_RATE } from '@/lib/pricing';
import { generateOrderNumber } from '@/lib/payments/mockGateway';

const completeSchema = z.object({
  sessionId: z.string().min(1),
  paymentRef: z.string().min(1),
});

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

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', params.orderId);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    const productIds = items.map((i: { product_id: string | null }) => i.product_id).filter(Boolean) as string[];
    const { data: products } = await supabase
      .from('products')
      .select('id, title, price_cents, stock, is_published')
      .in('id', productIds);

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

    for (const item of items as { product_id: string | null; quantity: number }[]) {
      if (!item.product_id) continue;
      const p = productMap.get(item.product_id);
      if (p) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, p.stock - item.quantity) })
          .eq('id', item.product_id);
      }
    }

    const orderNumber = generateOrderNumber();
    await supabase
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
      .eq('id', params.orderId);

    return NextResponse.json({ orderId: params.orderId, orderNumber, totalCents: total });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
