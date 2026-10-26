'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Gift, Loader2, Mail, Phone, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import { toast } from 'sonner';
import { useI18n } from '@/context/I18nContext';
import type { CustomerLTV } from '@/types';

export default function AdminLoyaltyPage() {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<CustomerLTV[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/loyalty');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setCustomers(data.customers ?? []);
      } catch {
        toast.error(t('admin.loyalty.loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleGenerateCoupon(customer: CustomerLTV) {
    setGenerating(customer.email);
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: customer.email,
          customerPhone: customer.phone,
          discountType: 'percentage',
          value: 15,
          maxUses: 1,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast.success(data.message);
    } catch {
      toast.error(t('admin.loyalty.couponFailed'));
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <Crown className="w-7 h-7 text-gold" />
          {t('admin.loyalty.title')}
        </h1>
        <p className="text-muted mt-1">{t('admin.loyalty.subtitle')}</p>
      </div>

      {customers.length === 0 ? (
        <Card className="bg-surface border-border p-12 text-center">
          <Gift className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">{t('admin.loyalty.noData')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((customer, idx) => (
            <Card key={customer.email} className="bg-surface border-border p-5 card-glow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg shrink-0 ${
                    idx === 0 ? 'bg-gold-gradient text-background' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                    idx === 2 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-surface-elevated text-muted'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text truncate">
                      {customer.name ?? customer.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </span>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                        customer.isGuest
                          ? 'bg-surface-elevated text-muted'
                          : 'bg-gold/20 text-gold'
                      }`}>
                        {customer.isGuest ? t('admin.loyalty.guest') : t('admin.loyalty.registered')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted uppercase tracking-wider">{t('admin.loyalty.totalSpent')}</p>
                    <p className="text-xl font-bold text-gold">{formatPrice(customer.totalSpentCents)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted uppercase tracking-wider">{t('admin.loyalty.orders')}</p>
                    <p className="text-xl font-bold text-text">{customer.totalOrders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted uppercase tracking-wider flex items-center gap-1 justify-end">
                      <Sparkles className="w-3 h-3" /> {t('admin.loyalty.points')}
                    </p>
                    <p className="text-xl font-bold text-gold">{customer.totalPoints.toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateCoupon(customer)}
                    disabled={generating === customer.email}
                    className="gold-button shrink-0"
                  >
                    {generating === customer.email ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-1" />
                        {t('admin.loyalty.sendCoupon')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
