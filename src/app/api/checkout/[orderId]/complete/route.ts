import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db-admin';
import { getSession } from '@/lib/auth/session';
import { TAX_RATE } from '@/lib/pricing';
import { getShippingPriceCents } from '@/lib/data/shipping-methods';
import { generateOrderNumber } from '@/lib/payments/mockGateway';
import { sendOrderTelegram } from '@/lib/telegram-order';
import { paymentMethodSchema } from '@/lib/payment-methods';
import { computeCouponDiscount } from '@/lib/coupon-discount';
import { findUsableCoupon, redeemCoupon, releaseCoupon } from '@/lib/data/coupons';

const completeSchema = z.object({
  sessionId: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  couponCode: z.string().trim().max(64).optional().nullable(),
});

function dbFail(step: string, error: { message: string; code?: string } | null) {
  console.error(`[checkout] ${step} failed:`, error?.code, error?.message);
  return NextResponse.json({ error: 'Checkout could not be processed. Please try again.' }, { status: 500 });
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
    if (order.session_id !== parsed.data.sessionId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    // An order is "submitted" once it has an order_number. It stays CHECKOUT_STARTED
    // (pending confirmation) — it is never marked paid/COMPLETED on submission.
    if (order.status !== 'CHECKOUT_STARTED' || order.order_number) {
      return NextResponse.json({ error: 'Order was already submitted' }, { status: 409 });
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
    const shipping = (await getShippingPriceCents(order.delivery_method)) ?? order.shipping_cents ?? 0;

    // Coupon is re-checked here with the server-trusted subtotal; the client value is never used.
    let discount = 0;
    let coupon: { id: string; code: string; uses_count: number; max_uses: number | null } | null = null;
    if (parsed.data.couponCode) {
      const found = await findUsableCoupon(parsed.data.couponCode, session?.email);
      if (!found.ok) return NextResponse.json({ error: 'coupon', couponError: found.error }, { status: 422 });
      coupon = found.coupon;
      discount = computeCouponDiscount(found.coupon, subtotal);
    }
    const total = Math.max(0, subtotal + tax + shipping - discount);

    // Claim the order atomically so double-clicks / concurrent requests cannot
    // submit it (or decrement stock) twice. On an order_number unique collision
    // (Postgres 23505) retry with a fresh number, up to 3 retries.
    const MAX_CLAIM_RETRIES = 3;
    let orderNumber = '';
    let claimed: { id: string }[] | null = null;
    for (let attempt = 0; attempt <= MAX_CLAIM_RETRIES; attempt++) {
      orderNumber = generateOrderNumber();
      const { data, error: claimError } = await supabaseAdmin
        .from('orders')
        .update({ order_number: orderNumber })
        .eq('id', params.orderId)
        .eq('status', 'CHECKOUT_STARTED')
        .is('order_number', null)
        .select('id');
      if (claimError?.code === '23505' && attempt < MAX_CLAIM_RETRIES) {
        console.warn(`[checkout] order_number collision, retrying (${attempt + 1}/${MAX_CLAIM_RETRIES})`);
        continue;
      }
      if (claimError) return dbFail('orders claim', claimError);
      claimed = data;
      break;
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ error: 'Order was already submitted' }, { status: 409 });
    }
    const releaseClaim = async () => {
      const { error: relError } = await supabaseAdmin
        .from('orders')
        .update({ order_number: null })
        .eq('id', params.orderId)
        .eq('order_number', orderNumber);
      if (relError) console.error('[checkout] release claim failed:', relError.message);
    };

    // Atomic increment guarded by max_uses. 0 rows affected = limit reached: abort, order not completed.
    if (coupon && !(await redeemCoupon(coupon.code))) {
      await releaseClaim();
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit. The order was not placed.', couponError: 'used_up' },
        { status: 422 }
      );
    }
    const restoreCoupon = async () => {
      if (coupon) await releaseCoupon(coupon.code);
    };

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
      await restoreCoupon();
      await releaseClaim();
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

    const { data: doneRows, error: completeError } = await supabaseAdmin
      .from('orders')
      .update({
        // Status intentionally stays CHECKOUT_STARTED: the order is submitted and
        // awaiting confirmation; nothing has been paid.
        user_id: session?.userId ?? order.user_id,
        subtotal_cents: subtotal,
        tax_cents: tax,
        shipping_cents: shipping,
        total_cents: total,
        discount_cents: discount,
        coupon_code: coupon?.code ?? null,
        payment_method: parsed.data.paymentMethod,
      })
      .eq('id', params.orderId)
      .eq('status', 'CHECKOUT_STARTED')
      .eq('order_number', orderNumber)
      .select('id');
    if (completeError) { await rollback(); return dbFail('orders complete update', completeError); }
    if (!doneRows || doneRows.length === 0) { await rollback(); return dbFail('orders complete update', { message: 'no rows updated' }); }

    // Notify via Telegram once. The atomic order_number claim above guarantees only one
    // request reaches this point per order, so retries cannot send duplicates. A failed
    // send is logged and never affects the saved order.
    await sendOrderTelegram(
      { ...order, payment_method: parsed.data.paymentMethod, order_number: orderNumber, shipping_cents: shipping, total_cents: total },
      items as { title_snapshot: string; quantity: number; unit_price_cents: number }[]
    );

    const res = NextResponse.json({ orderId: params.orderId, orderNumber, totalCents: total, discountCents: discount });
    // Short-lived proof of ownership for the confirmation page (httpOnly; never readable by JS).
    res.cookies.set(`gt_oc_${orderNumber}`, order.session_id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60,
      path: '/order-confirmation',
    });
    return res;
  } catch (err) {
    console.error('[checkout] Unexpected error:', err);
    return NextResponse.json({ error: 'Checkout could not be processed. Please try again.' }, { status: 500 });
  }
}
