import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDisplayCoupons } from '@/lib/data/catalog-settings';
export async function GET(req: NextRequest) {
  const mine = req.nextUrl.searchParams.get('mine') === '1';
  const session = mine ? await getSession() : null;
  if (mine && !session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getDisplayCoupons(session?.email), { headers: { 'Cache-Control': 'private, no-store' } });
}
