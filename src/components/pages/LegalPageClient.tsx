'use client';

import { useI18n } from '@/context/I18nContext';
import { Shield, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentData {
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
}

export function LegalPageClient({
  pageKey,
  content,
}: {
  pageKey: 'privacy' | 'terms';
  content: ContentData | null;
}) {
  const { t, locale, dir } = useI18n();
  const isAr = locale === 'ar';
  const titleKey = pageKey === 'privacy' ? 'privacy.title' : 'terms.title';
  const subtitleKey = pageKey === 'privacy' ? 'privacy.subtitle' : 'terms.subtitle';
  const title = content ? (isAr ? content.title_ar : content.title_en) : t(titleKey);
  const body = content ? (isAr ? content.body_ar : content.body_en) : '';
  const Icon = pageKey === 'privacy' ? Shield : FileText;

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6">
          <Icon className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4">{title}</h1>
        <p className="text-lg text-muted">{t(subtitleKey)}</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-8 sm:p-10">
        {body ? (
          <p className={cn('text-base text-text leading-relaxed whitespace-pre-line', dir === 'rtl' && 'text-right')}>
            {body}
          </p>
        ) : (
          <p className="text-muted text-center py-8">{t('common.loading')}</p>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} The Golden Tiger. {t('footer.allRightsReserved')}
        </p>
      </div>
    </div>
  );
}
