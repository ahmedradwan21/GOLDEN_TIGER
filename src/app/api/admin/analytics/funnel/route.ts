import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [logsRes, ordersRes] = await Promise.all([
      supabase.from('click_logs').select('event_type, session_id').gte('created_at', since),
      supabase.from('orders').select('id, status, session_id').gte('created_at', since),
    ]);

    const logs = logsRes.data ?? [];
    const orders = ordersRes.data ?? [];

    const uniqueSessions = new Set<string>();
    const impressionSessions = new Set<string>();
    const clickSessions = new Set<string>();
    const addToCartSessions = new Set<string>();
    const checkoutStartedSessions = new Set<string>();
    const completedSessions = new Set<string>();

    for (const log of logs) {
      const sid = log.session_id as string;
      const et = log.event_type as string;
      uniqueSessions.add(sid);
      if (et === 'IMPRESSION') impressionSessions.add(sid);
      if (et === 'CLICK') clickSessions.add(sid);
      if (et === 'ADD_TO_CART') addToCartSessions.add(sid);
    }

    for (const order of orders) {
      const sid = order.session_id as string;
      const status = order.status as string;
      if (status === 'CHECKOUT_STARTED' || status === 'COMPLETED') {
        checkoutStartedSessions.add(sid);
      }
      if (status === 'COMPLETED') {
        completedSessions.add(sid);
      }
    }

    const stages = [
      { stage: 'Visits', count: uniqueSessions.size, color: '#D4AF37' },
      { stage: 'Impressions', count: impressionSessions.size, color: '#F2D675' },
      { stage: 'Clicks', count: clickSessions.size, color: '#E8751A' },
      { stage: 'Add to Cart', count: addToCartSessions.size, color: '#B8860B' },
      { stage: 'Checkout Started', count: checkoutStartedSessions.size, color: '#7C6A1E' },
      { stage: 'Completed', count: completedSessions.size, color: '#22C55E' },
    ];

    const rates = stages.map((s, i) => {
      if (i === 0) return { ...s, rate: 100 };
      const prev = stages[i - 1].count;
      return { ...s, rate: prev > 0 ? Math.round((s.count / prev) * 10000) / 100 : 0 };
    });

    const overallConversion = uniqueSessions.size > 0
      ? Math.round((completedSessions.size / uniqueSessions.size) * 10000) / 100
      : 0;

    return NextResponse.json({ stages: rates, overallConversion });
  } catch {
    return NextResponse.json({ error: 'Failed to load funnel data' }, { status: 500 });
  }
}
