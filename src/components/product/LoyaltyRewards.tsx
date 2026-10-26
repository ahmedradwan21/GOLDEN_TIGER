'use client';

import { useEffect, useState } from 'react';
import { Gift, Sparkles, Award, Loader2, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Coupon } from '@/types';
import { useI18n } from '@/context/I18nContext';
import { localizedTier, type LoyaltyTier } from '@/lib/loyalty-tiers';
import { DEFAULT_PROGRAM_NAME, localizedProgramName, type LoyaltySettings } from '@/lib/loyalty-settings';

const TIER_STYLES = [
  { icon: Award, color: 'from-amber-700 to-amber-500' },
  { icon: Sparkles, color: 'from-gray-400 to-gray-300' },
  { icon: Gift, color: 'from-yellow-600 to-yellow-400' },
];

export function LoyaltyRewards({ userPoints }: { userPoints: number }) {
  const { t, locale } = useI18n();
  const num = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  const [exchanging, setExchanging] = useState<string | null>(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState<Coupon | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [programSettings, setProgramSettings] = useState<LoyaltySettings>({ ...DEFAULT_PROGRAM_NAME });

  useEffect(() => {
    fetch('/api/loyalty/tiers')
      .then((r) => (r.ok ? r.json() : { tiers: [] }))
      .then((d) => setTiers(d.tiers ?? []))
      .catch(() => setTiers([]))
      .finally(() => setTiersLoading(false));
    fetch('/api/loyalty/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.settings) setProgramSettings(d.settings); })
      .catch(() => {});
  }, []);

  async function handleRedeem(tier: LoyaltyTier) {
    if (userPoints < tier.points_required) return;
    setExchanging(tier.id);

    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId: tier.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? t('loyalty.err.redeem'));
      }

      const data = await res.json();
      setRedeemedCoupon(data.coupon);
      toast.success(t('loyalty.toast.redeemed').replace('{tier}', localizedTier(tier, locale).name).replace('{code}', data.coupon.code));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loyalty.err.redeemPoints'));
    } finally {
      setExchanging(null);
    }
  }

  return (
    <Card className="bg-surface border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-gold" />
        <h3 className="font-heading text-lg font-bold">{localizedProgramName(programSettings, locale)}</h3>
      </div>
      <p className="text-sm text-muted mb-4">
        {t('loyalty.youHave')} <span className="text-gold font-bold">{num(userPoints)}</span> {t('loyalty.pointsExchange')}
      </p>

      {redeemedCoupon && (
        <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/30 animate-fade-in">
          <div className="flex items-center gap-2 text-success mb-1">
            <Check className="w-4 h-4" />
            <span className="font-semibold text-sm">{t('loyalty.couponRedeemed')}</span>
          </div>
          <p className="text-sm text-text">
            {t('loyalty.code')} <span className="font-mono font-bold text-gold">{redeemedCoupon.code}</span>
          </p>
          <p className="text-xs text-muted mt-1">
            {redeemedCoupon.discountType === 'percentage'
              ? t('loyalty.percentOffNext').replace('{value}', String(redeemedCoupon.value))
              : t('loyalty.saveNext')}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {tiersLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
        )}
        {tiers.map((tier, i) => {
          const { icon: Icon, color } = TIER_STYLES[i % TIER_STYLES.length];
          const { name, description } = localizedTier(tier, locale);
          const canRedeem = userPoints >= tier.points_required;
          const progress = tier.points_required > 0 ? Math.min(100, (userPoints / tier.points_required) * 100) : 100;

          return (
            <div
              key={tier.id}
              className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
                canRedeem
                  ? 'border-gold/40 hover:border-gold/60 cursor-pointer'
                  : 'border-border opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br ${color} shrink-0`}>
                  {canRedeem ? (
                    <Icon className="h-6 w-6 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-white/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-text">{name}</p>
                  <p className="text-xs text-muted">{description}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold-gradient transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {t('loyalty.pointsRequired').replace('{count}', num(tier.points_required))}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={!canRedeem || exchanging !== null}
                  onClick={() => handleRedeem(tier)}
                  className={canRedeem ? 'gold-button shrink-0' : 'shrink-0'}
                >
                  {exchanging === tier.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : canRedeem ? (
                    t('loyalty.redeem')
                  ) : (
                    t('loyalty.locked')
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
