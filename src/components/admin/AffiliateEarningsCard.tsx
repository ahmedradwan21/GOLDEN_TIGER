'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChartBar as BarChart3, Loader as Loader2, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/context/I18nContext';
import { formatPrice } from '@/lib/pricing';
import { dayBoundary, type EarningsRow } from '@/lib/affiliates';
import { CopyCodeButton } from '@/components/admin/AffiliatesCard';

interface Report {
  rows: EarningsRow[];
  totals: { order_count: number; total_sales_cents: number; commission_cents: number };
}

/** Earnings per affiliate from COMPLETED orders using their coupon, within an optional date range. */
export function AffiliateEarningsCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const { t } = useI18n();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (from && to && from > to) {
      setError(t('admin.affiliates.badRange'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      const fromIso = from ? dayBoundary(from, 'start') : null;
      const toIso = to ? dayBoundary(to, 'end') : null;
      if (fromIso) qs.set('from', fromIso);
      if (toIso) qs.set('to', toIso);
      const r = await fetch(`/api/admin/affiliates/report?${qs}`, { cache: 'no-store' });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error || t('admin.affiliates.reportFailed'));
      setReport(data as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.affiliates.reportFailed'));
    } finally {
      setLoading(false);
    }
  }, [from, to, t]);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-gold mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-text">{t('admin.affiliates.reportTitle')}</h2>
            <p className="text-xs text-muted mt-0.5">{t('admin.affiliates.reportSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="aff-from">{t('admin.affiliates.from')}</Label>
            <Input id="aff-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="bg-background w-40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aff-to">{t('admin.affiliates.to')}</Label>
            <Input id="aff-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="bg-background w-40" />
          </div>
          {(from || to) && (
            <Button variant="outline" onClick={() => { setFrom(''); setTo(''); }} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('admin.affiliates.allTime')}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {loading && !report ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gold" /></div>
      ) : !report || report.rows.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">{t('admin.affiliates.empty')}</p>
      ) : (
        <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-xs uppercase">
                <th className="text-start py-3 px-3">{t('admin.affiliates.name')}</th>
                <th className="text-start py-3 px-3">{t('admin.affiliates.code')}</th>
                <th className="text-end py-3 px-3">{t('admin.affiliates.orders')}</th>
                <th className="text-end py-3 px-3">{t('admin.affiliates.sales')}</th>
                <th className="text-end py-3 px-3">{t('admin.affiliates.commissionShort')}</th>
                <th className="text-end py-3 px-3">{t('admin.affiliates.earned')}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.affiliate_id} className="border-b border-border/50 hover:bg-surface-elevated/50 transition-colors">
                  <td className={`py-3 px-3 font-medium ${r.is_active ? 'text-text' : 'text-muted'}`}>{r.name}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <code className="text-gold font-mono text-xs" dir="ltr">{r.coupon_code}</code>
                      <CopyCodeButton code={r.coupon_code} />
                    </span>
                  </td>
                  <td className="py-3 px-3 text-end tabular-nums">{r.order_count}</td>
                  <td className="py-3 px-3 text-end tabular-nums text-muted">{formatPrice(r.total_sales_cents)}</td>
                  <td className="py-3 px-3 text-end tabular-nums text-muted">{r.commission_percent}%</td>
                  <td className="py-3 px-3 text-end tabular-nums font-semibold text-gold">{formatPrice(r.commission_cents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-3 px-3" colSpan={2}>{t('admin.affiliates.total')}</td>
                <td className="py-3 px-3 text-end tabular-nums">{report.totals.order_count}</td>
                <td className="py-3 px-3 text-end tabular-nums">{formatPrice(report.totals.total_sales_cents)}</td>
                <td className="py-3 px-3" />
                <td className="py-3 px-3 text-end tabular-nums text-gold">{formatPrice(report.totals.commission_cents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
