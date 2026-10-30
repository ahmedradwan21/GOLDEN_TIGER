import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [productsRes, ordersRes, completedOrdersRes, clickLogsRes, lowStockRes] = await Promise.all([
      supabaseAdmin.from('products').select('id, stock, price_cents, is_published').eq('is_published', true),
      supabaseAdmin.from('orders').select('id, order_number, status, total_cents, created_at, completed_at').gte('created_at', thirtyDaysAgo.toISOString()),
      supabaseAdmin.from('orders').select('id, total_cents').eq('status', 'COMPLETED').gte('completed_at', thirtyDaysAgo.toISOString()),
      supabaseAdmin.from('click_logs').select('id, event_type, created_at').gte('created_at', sevenDaysAgo.toISOString()),
      supabaseAdmin.from('products').select('id, title, stock').lt('stock', 10).eq('is_published', true),
    ]);

    const products = productsRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const completedOrders = completedOrdersRes.data ?? [];
    const clickLogs = clickLogsRes.data ?? [];
    const lowStock = lowStockRes.data ?? [];

    const totalRevenue = completedOrders.reduce((sum: number, o: { total_cents: number }) => sum + o.total_cents, 0);
    const totalOrders = orders.length;
    const completedCount = completedOrders.length;
    const conversionRate = totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0;

    const totalClicks = clickLogs.filter((c: { event_type: string }) => c.event_type === 'CLICK').length;
    const totalImpressions = clickLogs.filter((c: { event_type: string }) => c.event_type === 'IMPRESSION').length;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const inventoryValue = products.reduce((sum: number, p: { stock: number; price_cents: number }) => sum + (p.stock * p.price_cents), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o: { created_at: string }) => new Date(o.created_at) >= today).length;

    const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalOrders,
        completedOrders: completedCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        ctr: Math.round(ctr * 100) / 100,
        totalClicks,
        totalImpressions,
        avgOrderValue: Math.round(avgOrderValue),
        todayOrders,
        inventoryValue,
        activeProducts: products.length,
      },
      lowStockProducts: lowStock.slice(0, 10),
      recentOrders: orders.slice(-10).reverse(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
