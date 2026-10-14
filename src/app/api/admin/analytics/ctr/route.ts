import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '7', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: logs } = await supabase
      .from('click_logs')
      .select('event_type, product_id, created_at, device_type, session_id')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (!logs) {
      return NextResponse.json({ error: 'Failed to load CTR data' }, { status: 500 });
    }

    const eventCounts: Record<string, number> = {};
    const dailyData: Record<string, { date: string; impressions: number; clicks: number; views: number; addToCart: number; visits: number }> = {};
    const productClicks: Record<string, { productId: string; clicks: number; impressions: number }> = {};
    const deviceBreakdown: Record<string, number> = {};

    for (const log of logs) {
      const eventType = log.event_type as string;
      eventCounts[eventType] = (eventCounts[eventType] ?? 0) + 1;

      const dateStr = new Date(log.created_at as string).toISOString().slice(0, 10);
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, impressions: 0, clicks: 0, views: 0, addToCart: 0, visits: 0 };
      }
      const day = dailyData[dateStr];
      if (eventType === 'IMPRESSION') day.impressions++;
      else if (eventType === 'CLICK') day.clicks++;
      else if (eventType === 'VIEW') day.views++;
      else if (eventType === 'ADD_TO_CART') day.addToCart++;
      else if (eventType === 'VISIT') day.visits++;

      if (log.product_id) {
        const pid = log.product_id as string;
        if (!productClicks[pid]) {
          productClicks[pid] = { productId: pid, clicks: 0, impressions: 0 };
        }
        if (eventType === 'CLICK') productClicks[pid].clicks++;
        if (eventType === 'IMPRESSION') productClicks[pid].impressions++;
      }

      const device = (log.device_type as string) ?? 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] ?? 0) + 1;
    }

    const totalImpressions = eventCounts['IMPRESSION'] ?? 0;
    const totalClicks = eventCounts['CLICK'] ?? 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const topProducts: { productId: string; clicks: number; impressions: number; ctr: number; title: string; slug: string }[] =
      Object.values(productClicks)
        .map(p => ({
          ...p,
          ctr: p.impressions > 0 ? Math.round((p.clicks / p.impressions) * 10000) / 100 : 0,
          title: 'Unknown',
          slug: '',
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

    if (topProducts.length > 0) {
      const productIds = topProducts.map(p => p.productId);
      const { data: productInfo } = await supabase
        .from('products')
        .select('id, title, slug')
        .in('id', productIds);

      const productMap = new Map((productInfo ?? []).map((p: { id: string; title: string; slug: string }) => [p.id, p]));
      for (const tp of topProducts) {
        const info = productMap.get(tp.productId);
        tp.title = info?.title ?? 'Unknown';
        tp.slug = info?.slug ?? '';
      }
    }

    return NextResponse.json({
      summary: {
        totalImpressions,
        totalClicks,
        ctr: Math.round(ctr * 100) / 100,
        totalViews: eventCounts['VIEW'] ?? 0,
        totalAddToCart: eventCounts['ADD_TO_CART'] ?? 0,
        totalVisits: eventCounts['VISIT'] ?? 0,
      },
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      topProducts,
      deviceBreakdown,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load CTR analytics' }, { status: 500 });
  }
}
