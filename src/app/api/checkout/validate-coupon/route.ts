import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { computeCouponDiscount } from '@/lib/coupon-discount';
import { findUsableCoupon } from '@/lib/data/coupons';

export const dynamic = 'force-dynamic';

// Returns stable error codes; the checkout page translates them (EN/AR).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const subtotal = Number(body?.subtotalCents);
  if (!Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const session = await getSession();
    const result = await findUsableCoupon(body?.code, session?.email);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
    const c = result.coupon;
    return NextResponse.json({
      code: c.code,
      discountType: c.discount_type === 'fixed' ? 'fixed' : 'percentage',
      value: c.value,
      discountCents: computeCouponDiscount(c, subtotal),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
