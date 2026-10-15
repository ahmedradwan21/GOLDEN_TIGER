'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Flame, Zap, Calendar, Power } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/context/I18nContext';
import type { Campaign } from '@/types';

const CAMPAIGN_ICONS: Record<string, typeof Flame> = {
  black_friday: Flame,
  mid_month_flash: Zap,
  monthly_start: Calendar,
};

export default function AdminCampaignsPage() {
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/campaigns');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
      } catch {
        toast.error('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleToggle(campaign: Campaign) {
    setToggling(campaign.type);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: campaign.type,
          isActive: !campaign.isActive,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCampaigns((prev) =>
        prev.map((c) => (c.type === campaign.type ? data.campaign : c))
      );
      toast.success(
        `${campaign.title} ${data.campaign.isActive ? 'activated' : 'deactivated'}`
      );
    } catch {
      toast.error('Failed to update campaign');
    } finally {
      setToggling(null);
    }
  }

  async function handleDiscountChange(campaign: Campaign, value: number) {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: campaign.type,
          discountPercentage: value,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCampaigns((prev) =>
        prev.map((c) => (c.type === campaign.type ? data.campaign : c))
      );
    } catch {
      // Non-critical
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
        <h1 className="font-heading text-3xl font-bold">{t('admin.campaigns.title')}</h1>
        <p className="text-muted mt-1">{t('admin.campaigns.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaigns.map((campaign) => {
          const Icon = CAMPAIGN_ICONS[campaign.type] ?? Flame;
          return (
            <Card
              key={campaign.id}
              className={`bg-surface border-border p-6 transition-all ${
                campaign.isActive
                  ? 'border-gold/50 shadow-[0_0_24px_rgba(212,175,55,0.15)]'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${campaign.isActive ? 'bg-gold/20' : 'bg-surface-elevated'}`}>
                  <Icon className={`w-6 h-6 ${campaign.isActive ? 'text-gold' : 'text-muted'}`} />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  campaign.isActive
                    ? 'bg-success/20 text-success'
                    : 'bg-surface-elevated text-muted'
                }`}>
                  {campaign.isActive ? t('admin.campaigns.active') : t('admin.campaigns.inactive')}
                </div>
              </div>

              <h3 className="font-heading text-lg font-bold mb-1">{campaign.title}</h3>
              <p className="text-sm text-muted mb-4">{campaign.description}</p>

              <div className="mb-4">
                <label className="text-xs text-muted uppercase tracking-wider mb-1 block">
                  {t('admin.campaigns.discount')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={70}
                    value={campaign.discountPercentage}
                    onChange={(e) => handleDiscountChange(campaign, parseInt(e.target.value, 10))}
                    className="flex-1 accent-gold"
                  />
                  <span className="text-lg font-bold text-gold w-12 text-right">{campaign.discountPercentage}%</span>
                </div>
              </div>

              <Button
                onClick={() => handleToggle(campaign)}
                disabled={toggling === campaign.type}
                className={`w-full ${campaign.isActive ? '' : 'gold-button'}`}
                variant={campaign.isActive ? 'outline' : 'default'}
              >
                {toggling === campaign.type ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : campaign.isActive ? (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    {t('admin.campaigns.deactivate')}
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    {t('admin.campaigns.activate')}
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="bg-surface border-border p-6">
        <h3 className="font-heading text-lg font-bold mb-2">{t('admin.campaigns.howTitle')}</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            {t('admin.campaigns.how1')}
          </li>
          <li className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            {t('admin.campaigns.how2')}
          </li>
          <li className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            {t('admin.campaigns.how3')}
          </li>
        </ul>
      </Card>
    </div>
  );
}
