import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '7', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: logs } = await supabaseAdmin
      .from('click_logs')
      .select('event_type, product_id, source, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (!logs) {
      return NextResponse.json({ error: 'Failed to load ad data' }, { status: 500 });
    }

    const sponsoredEvents = (logs as { event_type: string; product_id: string | null; source: string | null; created_at: string }[])
      .filter((l) => l.source?.startsWith('sponsored_'));

    const productStats: Record<string, { productId: string; impressions: number; clicks: number; addToCart: number }> = {};
    const dailyData: Record<string, { date: string; impressions: number; clicks: number; addToCart: number }> = {};
    const sourceBreakdown: Record<string, { impressions: number; clicks: number }> = {};

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalAddToCart = 0;

    for (const log of sponsoredEvents) {
      const eventType = log.event_type;
      const pid = log.product_id;

      if (eventType === 'IMPRESSION') totalImpressions++;
      else if (eventType === 'CLICK') totalClicks++;
      else if (eventType === 'ADD_TO_CART') totalAddToCart++;

      const dateStr = new Date(log.created_at).toISOString().slice(0, 10);
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, impressions: 0, clicks: 0, addToCart: 0 };
      }
      if (eventType === 'IMPRESSION') dailyData[dateStr].impressions++;
      else if (eventType === 'CLICK') dailyData[dateStr].clicks++;
      else if (eventType === 'ADD_TO_CART') dailyData[dateStr].addToCart++;

      const src = log.source ?? 'unknown';
      if (!sourceBreakdown[src]) {
        sourceBreakdown[src] = { impressions: 0, clicks: 0 };
      }
      if (eventType === 'IMPRESSION') sourceBreakdown[src].impressions++;
      else if (eventType === 'CLICK') sourceBreakdown[src].clicks++;

      if (pid) {
        if (!productStats[pid]) {
          productStats[pid] = { productId: pid, impressions: 0, clicks: 0, addToCart: 0 };
        }
        if (eventType === 'IMPRESSION') productStats[pid].impressions++;
        else if (eventType === 'CLICK') productStats[pid].clicks++;
        else if (eventType === 'ADD_TO_CART') productStats[pid].addToCart++;
      }
    }

    const topAdProducts = Object.values(productStats)
      .map((p) => ({
        ...p,
        ctr: p.impressions > 0 ? Math.round((p.clicks / p.impressions) * 10000) / 100 : 0,
        title: 'Unknown',
        slug: '',
        is_sponsored: false,
        is_homepage_banner: false,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    if (topAdProducts.length > 0) {
      const productIds = topAdProducts.map((p) => p.productId);
      const { data: productInfo } = await supabaseAdmin
        .from('products')
        .select('id, title, slug, is_sponsored, is_homepage_banner')
        .in('id', productIds);

      const productMap = new Map(
        (productInfo ?? []).map((p: { id: string; title: string; slug: string; is_sponsored: boolean; is_homepage_banner: boolean }) => [p.id, p])
      );
      for (const tp of topAdProducts) {
        const info = productMap.get(tp.productId);
        tp.title = info?.title ?? 'Unknown';
        tp.slug = info?.slug ?? '';
        tp.is_sponsored = info?.is_sponsored ?? false;
        tp.is_homepage_banner = info?.is_homepage_banner ?? false;
      }
    }

    const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;

    return NextResponse.json({
      summary: {
        totalImpressions,
        totalClicks,
        ctr,
        totalAddToCart,
      },
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      topAdProducts,
      sourceBreakdown: Object.entries(sourceBreakdown).map(([source, stats]) => ({
        source,
        ...stats,
        ctr: stats.impressions > 0 ? Math.round((stats.clicks / stats.impressions) * 10000) / 100 : 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load ad analytics' }, { status: 500 });
  }
}
