import { NextResponse } from 'next/server';
import { getActiveShippingMethods } from '@/lib/data/shipping-methods';

export const dynamic = 'force-dynamic';

// Public storefront read: active shipping methods, ordered by sort_order.
export async function GET() {
  try {
    const methods = await getActiveShippingMethods();
    return NextResponse.json(methods, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Could not load shipping methods' }, { status: 500 });
  }
}
