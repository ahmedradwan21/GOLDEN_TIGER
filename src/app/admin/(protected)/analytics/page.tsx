'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, Filter, Search, AlertTriangle, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';

const PIE_COLORS = ['#D4AF37', '#E8751A', '#22C55E', '#3B82F6', '#A8A29E', '#EF4444'];

interface CTRData {
  summary: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalViews: number;
    totalAddToCart: number;
    totalVisits: number;
  };
  dailyData: { date: string; impressions: number; clicks: number; views: number; addToCart: number; visits: number }[];
  topProducts: { productId: string; title: string; clicks: number; impressions: number; ctr: number }[];
  deviceBreakdown: Record<string, number>;
}

interface FunnelData {
  stages: { stage: string; count: number; color: string; rate: number }[];
  overallConversion: number;
}

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const [ctrData, setCtrData] = useState<CTRData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [searchGaps, setSearchGaps] = useState<{ query: string; count: number; lastSearched: string }[]>([]);
  const [lowStock, setLowStock] = useState<{ id: string; title: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ctrRes, funnelRes, gapsRes, lowStockRes] = await Promise.all([
          fetch(`/api/admin/analytics/ctr?days=${days}`),
          fetch(`/api/admin/analytics/funnel?days=${days === 7 ? 30 : days}`),
          fetch('/api/admin/analytics/search-gaps'),
          fetch('/api/admin/analytics/low-stock'),
        ]);
        if (ctrRes.ok) setCtrData(await ctrRes.json());
        if (funnelRes.ok) setFunnelData(await funnelRes.json());
        if (gapsRes.ok) {
          const gapsData = await gapsRes.json();
          setSearchGaps(gapsData.queries ?? []);
        }
        if (lowStockRes.ok) {
          const lsData = await lowStockRes.json();
          setLowStock(lsData.products ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  const deviceData = ctrData
    ? Object.entries(ctrData.deviceBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t('admin.analytics.title')}</h1>
          <p className="text-muted mt-1">{t('admin.analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          {[7, 14, 30].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
              className={days === d ? 'gold-button' : ''}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      {ctrData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label={t('admin.analytics.impressions')} value={ctrData.summary.totalImpressions.toLocaleString()} />
          <SummaryCard label={t('admin.analytics.clicks')} value={ctrData.summary.totalClicks.toLocaleString()} />
          <SummaryCard label={t('admin.analytics.ctr')} value={`${ctrData.summary.ctr}%`} highlight />
          <SummaryCard label={t('admin.analytics.addToCart')} value={ctrData.summary.totalAddToCart.toLocaleString()} />
        </div>
      )}

      {/* Daily impressions vs clicks chart */}
      {ctrData && ctrData.dailyData.length > 0 && (
        <Card className="bg-surface border-border p-6">
          <h2 className="font-heading text-xl font-bold mb-4">{t('admin.analytics.dailyChart')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ctrData.dailyData}>
              <defs>
                <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8751A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E8751A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
              <XAxis dataKey="date" stroke="#A8A29E" fontSize={12} />
              <YAxis stroke="#A8A29E" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1D1D26', border: '1px solid #2A2A35', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="impressions" stroke="#D4AF37" strokeWidth={2} fill="url(#impGrad)" />
              <Area type="monotone" dataKey="clicks" stroke="#E8751A" strokeWidth={2} fill="url(#clickGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion funnel */}
        {funnelData && (
          <Card className="bg-surface border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h2 className="font-heading text-xl font-bold">{t('admin.analytics.funnel')}</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData.stages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                <XAxis type="number" stroke="#A8A29E" fontSize={12} />
                <YAxis type="category" dataKey="stage" stroke="#A8A29E" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1D1D26', border: '1px solid #2A2A35', borderRadius: '8px' }}
                  formatter={(value: number, _name: string, props: { payload?: { rate?: number } }) => [
                    `${value} sessions (${props.payload?.rate ?? 0}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.stages.map((stage, i) => (
                    <Cell key={i} fill={stage.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted">{t('admin.analytics.overallConversion')}</span>
              <span className="text-lg font-bold text-green-400">{funnelData.overallConversion}%</span>
            </div>
          </Card>
        )}

        {/* Device breakdown */}
        {deviceData.length > 0 && (
          <Card className="bg-surface border-border p-6">
            <h2 className="font-heading text-xl font-bold mb-4">{t('admin.analytics.device')}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {deviceData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1D1D26', border: '1px solid #2A2A35', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Top Products by CTR */}
      {ctrData && ctrData.topProducts.length > 0 && (
        <Card className="bg-surface border-border p-6">
          <h2 className="font-heading text-xl font-bold mb-4">{t('admin.analytics.topProducts')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase">
                  <th className="text-left py-3 px-2">{t('admin.analytics.product')}</th>
                  <th className="text-right py-3 px-2">{t('admin.analytics.impressions')}</th>
                  <th className="text-right py-3 px-2">{t('admin.analytics.clicks')}</th>
                  <th className="text-right py-3 px-2">{t('admin.analytics.ctr')}</th>
                </tr>
              </thead>
              <tbody>
                {ctrData.topProducts.map((p) => (
                  <tr key={p.productId} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-2 text-text">{p.title}</td>
                    <td className="py-3 px-2 text-right text-muted">{p.impressions.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-text">{p.clicks.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-semibold ${p.ctr > 5 ? 'text-green-400' : p.ctr > 2 ? 'text-gold' : 'text-muted'}`}>
                        {p.ctr}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Search Gaps & Low Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zero-Result Search Queries */}
        <Card className="bg-surface border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gold" />
            <h2 className="font-heading text-xl font-bold">{t('admin.analytics.searchGaps')}</h2>
          </div>
          <p className="text-sm text-muted mb-3">{t('admin.analytics.searchGapsDesc')}</p>
          {searchGaps.length > 0 ? (
            <div className="space-y-2">
              {searchGaps.map((gap, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">{gap.query}</p>
                    <p className="text-xs text-muted">{new Date(gap.lastSearched).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold text-danger bg-danger/10 px-2.5 py-1 rounded-full shrink-0">
                    {gap.count}x — 0 {t('admin.analytics.results')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('admin.analytics.noSearchGaps')}</p>
            </div>
          )}
        </Card>

        {/* Low Stock Warning */}
        <Card className="bg-surface border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-tiger-orange" />
            <h2 className="font-heading text-xl font-bold">{t('admin.analytics.lowStock')}</h2>
          </div>
          <p className="text-sm text-muted mb-3">{t('admin.analytics.lowStockDesc')}</p>
          {lowStock.length > 0 ? (
            <div className="space-y-2">
              {lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
                  <div className="min-w-0 flex items-center gap-2">
                    {item.stock === 0 ? (
                      <PackageX className="w-4 h-4 text-danger shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-tiger-orange shrink-0" />
                    )}
                    <p className="text-sm font-medium text-text truncate">{item.title}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    item.stock === 0
                      ? 'bg-danger/10 text-danger'
                      : item.stock <= 3
                        ? 'bg-tiger-orange/10 text-tiger-orange'
                        : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {item.stock === 0 ? t('admin.analytics.outOfStock') : `${item.stock} ${t('admin.analytics.left')}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('admin.analytics.allStocked')}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="bg-surface border-border p-5">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-gold' : ''}`}>{value}</p>
    </Card>
  );
}
