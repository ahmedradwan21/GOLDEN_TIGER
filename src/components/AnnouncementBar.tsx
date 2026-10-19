'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/db';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type AnnouncementBarSettings = Database['public']['Tables']['announcement_bar_settings']['Row'];

function isWithinSchedule(
  now: Date,
  startsAt: string | null,
  endsAt: string | null
): boolean {
  if (startsAt) {
    const start = new Date(startsAt);
    if (now.getTime() < start.getTime()) return false;
  }
  if (endsAt) {
    const end = new Date(endsAt);
    if (now.getTime() > end.getTime()) return false;
  }
  return true;
}

export function AnnouncementBar() {
  const { t, locale, dir } = useI18n();
  const [settings, setSettings] = useState<AnnouncementBarSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error } = await supabase
          .from('announcement_bar_settings')
          .select('*')
          .eq('id', 'main')
          .maybeSingle();
        if (error) return;
        if (!cancelled) setSettings(data);
      } catch {
        // Non-critical: storefront must keep rendering without the bar
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || !settings) return null;
  if (!settings.is_enabled) return null;
  if (!isWithinSchedule(new Date(), settings.starts_at, settings.ends_at)) return null;

  const message = locale === 'ar' ? settings.message_ar : settings.message_en;
  if (!message) return null;

  const hasValidLink =
    typeof settings.link_url === 'string' && settings.link_url.trim().length > 0;

  const barStyle: React.CSSProperties = {
    backgroundColor: settings.background_color,
    color: settings.text_color,
  };

  const content = (
    <div
      className="w-full py-2.5 text-center text-sm font-medium animate-fade-in"
      style={barStyle}
      role="region"
      aria-label={t('topbar.freeship')}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <p
          className={cn(
            'truncate transition-colors',
            hasValidLink && 'hover:underline cursor-pointer'
          )}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          {message}
        </p>
      </div>
    </div>
  );

  if (hasValidLink) {
    return (
      <Link href={settings.link_url as string} className="block focus-ring">
        {content}
      </Link>
    );
  }

  return content;
}
