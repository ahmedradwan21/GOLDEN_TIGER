'use client';

import { useI18n } from '@/context/I18nContext';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 h-10 px-3 rounded-lg hover:bg-surface-elevated focus-ring text-text transition-colors"
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4" />
      <span className="text-sm font-medium">{locale === 'en' ? 'عربي' : 'EN'}</span>
    </button>
  );
}
