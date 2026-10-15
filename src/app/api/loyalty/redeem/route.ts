import { NextRequest, NextResponse } from 'next/server';
import { createCoupon } from '@/lib/data/loyalty';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { discountType, value, pointsCost } = body;

    if (!discountType || value === undefined || pointsCost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const coupon = await createCoupon({
      discountType,
      value,
      maxUses: 1,
      expiresAt: expiresAt.toISOString(),
      isReward: true,
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }

    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 });
  }
}
