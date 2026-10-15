import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { getTopCustomers, createCoupon } from '@/lib/data/loyalty';
import { formatPrice } from '@/lib/pricing';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await getTopCustomers(20);
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: 'Failed to load loyalty data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { customerEmail, customerPhone, discountType, value, maxUses } = body;

    if (!customerEmail && !customerPhone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const coupon = await createCoupon({
      discountType: discountType ?? 'percentage',
      value: value ?? 10,
      maxUses: maxUses ?? 1,
      expiresAt: expiresAt.toISOString(),
      isReward: true,
      customerEmail: customerEmail ?? null,
      customerPhone: customerPhone ?? null,
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }

    return NextResponse.json({
      coupon,
      message: `Coupon ${coupon.code} created for ${customerEmail || customerPhone} — ${discountType === 'percentage' ? value + '% off' : formatPrice(value)} valid for 30 days`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
