'use client';

import { useState, useEffect } from 'react';
import { Flame, X, Clock } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';

interface ActiveCampaign {
  id: string;
  type: string;
  title: string;
  description: string | null;
  discountPercentage: number;
  endsAt: string | null;
  isActive: boolean;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(targetDate: string | null): Countdown {
  const [timeLeft, setTimeLeft] = useState<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export function CampaignBanner() {
  const { t, dir } = useI18n();
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/campaigns');
        if (!res.ok) return;
        const data = await res.json();
        const active = (data.campaigns ?? []).filter((c: ActiveCampaign) => c.isActive === true);
        setCampaigns(active);
      } catch {
        // Non-critical
      }
    }
    load();
  }, []);

  if (dismissed || campaigns.length === 0) return null;

  const campaign = campaigns[0];
  const countdown = useCountdown(campaign.endsAt);

  return (
    <div className="relative bg-gradient-to-r from-tiger-orange via-gold-dark to-gold animate-fade-in">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className={cn('flex items-center justify-between gap-4', dir === 'rtl' && 'flex-row-reverse')}>
          <div className={cn('flex items-center gap-3 min-w-0', dir === 'rtl' && 'flex-row-reverse')}>
            <Flame className="h-5 w-5 text-white shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {campaign.title} — {campaign.discountPercentage}% OFF
              </p>
              {campaign.description && (
                <p className="text-xs text-white/80 truncate hidden sm:block">{campaign.description}</p>
              )}
            </div>
          </div>

          {campaign.endsAt && (
            <div className={cn('flex items-center gap-2 shrink-0', dir === 'rtl' && 'flex-row-reverse')}>
              <Clock className="h-4 w-4 text-white" />
              <div className={cn('flex items-center gap-1 text-white', dir === 'rtl' && 'flex-row-reverse')}>
                <TimeBlock value={countdown.days} label="d" />
                <span className="text-white/60">:</span>
                <TimeBlock value={countdown.hours} label="h" />
                <span className="text-white/60">:</span>
                <TimeBlock value={countdown.minutes} label="m" />
                <span className="text-white/60">:</span>
                <TimeBlock value={countdown.seconds} label="s" />
              </div>
            </div>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white shrink-0"
            aria-label={t('home.dismissBanner')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono font-bold text-sm tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[0.5rem] uppercase">{label}</span>
    </div>
  );
}
