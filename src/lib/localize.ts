/**
 * Bilingual content helpers.
 *
 * Rule: when the locale is Arabic AND the Arabic value is a non-blank string,
 * show the Arabic value. In every other case (English locale, null, undefined,
 * empty string, whitespace-only) fall back to the English value so a product
 * or category is never rendered blank.
 */
export type ContentLocale = 'en' | 'ar';

export function pickLocalized(
  en: string | null | undefined,
  ar: string | null | undefined,
  locale: ContentLocale
): string {
  if (locale === 'ar' && typeof ar === 'string' && ar.trim() !== '') return ar;
  return en ?? '';
}

export function productTitle(
  p: { title: string; titleAr?: string | null },
  locale: ContentLocale
): string {
  return pickLocalized(p.title, p.titleAr, locale);
}

export function productDescription(
  p: { description: string; descriptionAr?: string | null },
  locale: ContentLocale
): string {
  return pickLocalized(p.description, p.descriptionAr, locale);
}

export function categoryName(
  c: { name: string; nameAr?: string | null },
  locale: ContentLocale
): string {
  return pickLocalized(c.name, c.nameAr, locale);
}
