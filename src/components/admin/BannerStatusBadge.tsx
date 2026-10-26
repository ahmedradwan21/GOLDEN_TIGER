'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { getBannerStatus, type BannerScheduleFields } from '@/lib/homepage-banners';

const styles: Record<string, string> = {
  live: 'bg-success/15 text-success border-success/30',
  scheduled: 'bg-gold/10 text-gold border-gold/30',
  expired: 'bg-danger/10 text-danger border-danger/30',
  hidden: 'bg-surface-elevated text-muted border-border',
  off: 'bg-surface-elevated text-muted border-border',
};

/** Live / Scheduled / Expired / Hidden (unpublished) / Off. */
export function BannerStatusBadge({
  row,
  isPublished = true,
  className,
}: {
  row: BannerScheduleFields;
  isPublished?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const status = getBannerStatus(row);
  const key = status !== 'off' && !isPublished ? 'hidden' : status;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        styles[key],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full bg-current', key === 'live' && 'animate-pulse')} />
      {t(`admin.banners.status.${key}`)}
    </span>
  );
}
