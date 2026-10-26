'use client';

import { useI18n } from '@/context/I18nContext';
import { pickLocalized } from '@/lib/localize';

/**
 * Renders the Arabic value when the locale is Arabic and the value is not blank,
 * otherwise the English value. Usable from server components.
 */
export function LocalizedText({
  en,
  ar,
  className,
}: {
  en: string;
  ar?: string | null;
  className?: string;
}) {
  const { locale } = useI18n();
  return (
    <span dir="auto" className={className}>
      {pickLocalized(en, ar, locale)}
    </span>
  );
}

/** Translated UI string, usable from server components. `{name}` placeholders are filled from vars. */
export function T({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  const { t } = useI18n();
  let s = t(k);
  if (vars) for (const [name, v] of Object.entries(vars)) s = s.replace(`{${name}}`, String(v));
  return <>{s}</>;
}
