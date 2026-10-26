import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { TAX_RATE } from '@/lib/pricing';

const updateSchema = z.object({
  email: z.string().email().optional(),
  shippingAddress: z.record(z.string()).optional(),
  deliveryMethod: z.string().optional(),
});

function dbFail(step: string, error: { message: string; code?: string } | null) {
  console.error(`[checkout] ${step} failed:`, error?.code, error?.message);
  return NextResponse.json(
    { error: `Database error during ${step}: ${error?.message ?? 'unknown error'} (possible RLS rejection)`, code: error?.code ?? null },
    { status: 500 }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, delivery_method')
      .eq('id', params.orderId)
      .maybeSingle();
    if (orderError) return dbFail('orders select', orderError);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (parsed.data.email !== undefined) update.email = parsed.data.email;
    if (parsed.data.shippingAddress !== undefined) update.shipping_address = parsed.data.shippingAddress;
    if (parsed.data.deliveryMethod !== undefined) update.delivery_method = parsed.data.deliveryMethod;

    if (parsed.data.deliveryMethod !== undefined) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('unit_price_cents, quantity')
        .eq('order_id', params.orderId);
      if (itemsError) return dbFail('order_items select', itemsError);

      const subtotal = (items ?? []).reduce((s: number, i: { unit_price_cents: number; quantity: number }) => s + i.unit_price_cents * i.quantity, 0);
      const tax = Math.round(subtotal * TAX_RATE);
      let shipping = 0;
      if (parsed.data.deliveryMethod === 'standard') {
        shipping = subtotal >= 5000 ? 0 : 599;
      } else if (parsed.data.deliveryMethod === 'express') {
        shipping = 1499;
      } else if (parsed.data.deliveryMethod === 'next-day') {
        shipping = 2499;
      }
      update.tax_cents = tax;
      update.shipping_cents = shipping;
      update.total_cents = subtotal + tax + shipping;
    }

    const { data: updated, error: updError } = await supabaseAdmin.from('orders').update(update).eq('id', params.orderId).select('id');
    if (updError) return dbFail('orders update', updError);
    if (!updated || updated.length === 0) return dbFail('orders update', { message: 'no rows updated' });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[checkout] Unexpected error:', err);
    return NextResponse.json({ error: `Unexpected checkout error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
