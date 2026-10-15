'use client';

import { useState } from 'react';
import { Gift, Sparkles, Award, Loader2, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Coupon } from '@/types';

interface RewardTier {
  pointsRequired: number;
  discountType: 'percentage' | 'fixed';
  value: number;
  title: string;
  description: string;
  icon: typeof Gift;
  color: string;
}

const REWARD_TIERS: RewardTier[] = [
  {
    pointsRequired: 500,
    discountType: 'percentage',
    value: 10,
    title: 'Bronze Reward',
    description: '10% off your next order',
    icon: Award,
    color: 'from-amber-700 to-amber-500',
  },
  {
    pointsRequired: 1000,
    discountType: 'percentage',
    value: 20,
    title: 'Silver Reward',
    description: '20% off your next order',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-300',
  },
  {
    pointsRequired: 2500,
    discountType: 'percentage',
    value: 30,
    title: 'Gold Reward',
    description: '30% off + free shipping',
    icon: Gift,
    color: 'from-yellow-600 to-yellow-400',
  },
];

export function LoyaltyRewards({ userPoints }: { userPoints: number }) {
  const [exchanging, setExchanging] = useState<string | null>(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState<Coupon | null>(null);

  async function handleRedeem(tier: RewardTier) {
    if (userPoints < tier.pointsRequired) return;
    setExchanging(tier.title);

    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountType: tier.discountType,
          value: tier.value,
          pointsCost: tier.pointsRequired,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to redeem');
      }

      const data = await res.json();
      setRedeemedCoupon(data.coupon);
      toast.success(`Redeemed ${tier.title}! Your coupon code: ${data.coupon.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to redeem points');
    } finally {
      setExchanging(null);
    }
  }

  return (
    <Card className="bg-surface border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-gold" />
        <h3 className="font-heading text-lg font-bold">Loyalty Rewards</h3>
      </div>
      <p className="text-sm text-muted mb-4">
        You have <span className="text-gold font-bold">{userPoints.toLocaleString()}</span> points. Exchange them for premium coupons!
      </p>

      {redeemedCoupon && (
        <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/30 animate-fade-in">
          <div className="flex items-center gap-2 text-success mb-1">
            <Check className="w-4 h-4" />
            <span className="font-semibold text-sm">Coupon Redeemed!</span>
          </div>
          <p className="text-sm text-text">
            Code: <span className="font-mono font-bold text-gold">{redeemedCoupon.code}</span>
          </p>
          <p className="text-xs text-muted mt-1">
            {redeemedCoupon.discountType === 'percentage'
              ? `${redeemedCoupon.value}% off your next order`
              : `Save with this coupon on your next order`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {REWARD_TIERS.map((tier) => {
          const Icon = tier.icon;
          const canRedeem = userPoints >= tier.pointsRequired;
          const progress = Math.min(100, (userPoints / tier.pointsRequired) * 100);

          return (
            <div
              key={tier.title}
              className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
                canRedeem
                  ? 'border-gold/40 hover:border-gold/60 cursor-pointer'
                  : 'border-border opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br ${tier.color} shrink-0`}>
                  {canRedeem ? (
                    <Icon className="h-6 w-6 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-white/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-text">{tier.title}</p>
                  <p className="text-xs text-muted">{tier.description}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold-gradient transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {tier.pointsRequired.toLocaleString()} points required
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={!canRedeem || exchanging !== null}
                  onClick={() => handleRedeem(tier)}
                  className={canRedeem ? 'gold-button shrink-0' : 'shrink-0'}
                >
                  {exchanging === tier.title ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : canRedeem ? (
                    'Redeem'
                  ) : (
                    'Locked'
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
