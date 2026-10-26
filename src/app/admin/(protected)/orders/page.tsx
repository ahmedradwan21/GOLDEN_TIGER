'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import { useI18n } from '@/context/I18nContext';
import { fmt } from '@/lib/admin-i18n';

interface Order {
  id: string;
  order_number: string | null;
  session_id: string;
  status: string;
  email: string | null;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminOrdersPage() {
  const { t } = useI18n();
  const statusLabel = (s: string) => {
    const key = `admin.orders.status.${s}`;
    const v = t(key);
    return v === key ? s.replace(/_/g, ' ') : v;
  };
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t('admin.orders.title')}</h1>
        <p className="text-muted mt-1">{fmt(t('admin.orders.count'), { n: data?.total ?? 0 })}</p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'CHECKOUT_STARTED', 'COMPLETED', 'CANCELLED', 'ABANDONED'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={statusFilter === s ? 'gold-button' : ''}
          >
            {s === '' ? t('admin.orders.all') : statusLabel(s)}
          </Button>
        ))}
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <ShoppingCart className="w-12 h-12 mb-3" />
            <p>{t('admin.orders.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase">
                  <th className="text-left py-3 px-4">{t('admin.orders.colNumber')}</th>
                  <th className="text-left py-3 px-4">{t('admin.orders.colEmail')}</th>
                  <th className="text-center py-3 px-4">{t('admin.common.status')}</th>
                  <th className="text-right py-3 px-4">{t('admin.orders.colSubtotal')}</th>
                  <th className="text-right py-3 px-4">{t('admin.orders.colTax')}</th>
                  <th className="text-right py-3 px-4">{t('admin.orders.colShipping')}</th>
                  <th className="text-right py-3 px-4">{t('admin.orders.colTotal')}</th>
                  <th className="text-left py-3 px-4">{t('admin.orders.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 text-text">{o.order_number ?? o.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-muted">{o.email ?? '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className={
                        o.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        o.status === 'CHECKOUT_STARTED' ? 'bg-blue-500/20 text-blue-400' :
                        o.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {statusLabel(o.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-muted">{formatPrice(o.subtotal_cents)}</td>
                    <td className="py-3 px-4 text-right text-muted">{formatPrice(o.tax_cents)}</td>
                    <td className="py-3 px-4 text-right text-muted">{formatPrice(o.shipping_cents)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gold">{formatPrice(o.total_cents)}</td>
                    <td className="py-3 px-4 text-muted text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted">{fmt(t('admin.common.page'), { page, total: data.totalPages })}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
