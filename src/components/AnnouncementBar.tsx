'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import {
  announcementDismissKey,
  pickAnnouncementMessage,
  type AnnouncementSettings,
} from '@/lib/announcement';

/**
 * Storefront announcement bar, rendered above the header.
 * Reads the single settings row through /api/announcement (server-side read),
 * shows message_ar for Arabic, and can be closed. Closing is remembered per
 * message, so a new announcement appears again.
 */
export function AnnouncementBar() {
  const { t, locale } = useI18n();
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/announcement', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AnnouncementSettings | null) => {
        if (cancelled || !data) return;
        try {
          if (window.localStorage.getItem(announcementDismissKey(data)) === '1') setDismissed(true);
        } catch {
          // storage unavailable: show the bar
        }
        setSettings(data);
      })
      .catch(() => {
        // Non-critical: storefront keeps rendering without the bar
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const message = pickAnnouncementMessage(settings, locale);
  if (!settings || !message || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      if (settings) window.localStorage.setItem(announcementDismissKey(settings), '1');
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="relative w-full bg-gold-gradient text-background text-sm font-medium animate-fade-in"
      role="region"
      aria-label={t('announcement.label')}
    >
      <div className="max-w-[1440px] mx-auto px-10 sm:px-12 py-2.5 text-center">
        <p dir={locale === 'ar' ? 'rtl' : 'ltr'} className="leading-snug">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('announcement.dismiss')}
        className="absolute top-1/2 -translate-y-1/2 end-2 sm:end-4 h-7 w-7 inline-flex items-center justify-center rounded-full hover:opacity-70 transition-opacity focus-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
