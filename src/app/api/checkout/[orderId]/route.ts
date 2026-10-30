import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { TAX_RATE } from '@/lib/pricing';
import { shippingAddressSchema } from '@/lib/checkout-address';

const updateSchema = z.object({
  sessionId: z.string().min(1).max(200),
  email: z.string().trim().email().max(254).optional(),
  shippingAddress: shippingAddressSchema.optional(),
  deliveryMethod: z.string().trim().min(1).max(100).optional(),
});

function dbFail(step: string, error: { message: string; code?: string } | null) {
  console.error(`[checkout] ${step} failed:`, error?.code, error?.message);
  return NextResponse.json({ error: 'Checkout could not be processed. Please try again.' }, { status: 500 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, session_id, delivery_method, status, order_number')
      .eq('id', params.orderId)
      .maybeSingle();
    if (orderError) return dbFail('orders select', orderError);
    // Same response for "missing" and "not yours" so order ids cannot be probed.
    if (!order || order.session_id !== parsed.data.sessionId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'CHECKOUT_STARTED' || order.order_number) {
      return NextResponse.json({ error: 'Order can no longer be changed' }, { status: 409 });
    }

    // Delivery method must be an active shipping_methods row; its price is server-trusted.
    let shippingCents: number | null = null;
    if (parsed.data.deliveryMethod !== undefined) {
      const { data: method, error: methodError } = await (supabaseAdmin as any)
        .from('shipping_methods')
        .select('id, price_cents')
        .eq('id', parsed.data.deliveryMethod)
        .eq('is_active', true)
        .maybeSingle();
      if (methodError) return dbFail('shipping_methods select', methodError);
      if (!method) return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 });
      shippingCents = Math.max(0, Number(method.price_cents) || 0);
    }

    const update: Record<string, unknown> = {};
    if (parsed.data.email !== undefined) update.email = parsed.data.email;
    if (parsed.data.shippingAddress !== undefined) update.shipping_address = parsed.data.shippingAddress;

    if (parsed.data.deliveryMethod !== undefined && shippingCents !== null) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('unit_price_cents, quantity')
        .eq('order_id', params.orderId);
      if (itemsError) return dbFail('order_items select', itemsError);

      const subtotal = (items ?? []).reduce((s: number, i: { unit_price_cents: number; quantity: number }) => s + i.unit_price_cents * i.quantity, 0);
      const tax = Math.round(subtotal * TAX_RATE);
      update.delivery_method = parsed.data.deliveryMethod;
      update.tax_cents = tax;
      update.shipping_cents = shippingCents;
      update.total_cents = subtotal + tax + shippingCents;
    }

    if (Object.keys(update).length === 0) return NextResponse.json({ success: true });

    const { data: updated, error: updError } = await supabaseAdmin
      .from('orders')
      .update(update)
      .eq('id', params.orderId)
      .eq('session_id', parsed.data.sessionId)
      .eq('status', 'CHECKOUT_STARTED')
      .is('order_number', null)
      .select('id');
    if (updError) return dbFail('orders update', updError);
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Order can no longer be changed' }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[checkout] Unexpected error:', err);
    return NextResponse.json({ error: 'Checkout could not be processed. Please try again.' }, { status: 500 });
  }
}
