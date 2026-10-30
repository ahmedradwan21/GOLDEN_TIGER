import type { DeliveryMethod } from '@/types';
import { pickLocalized, type ContentLocale } from '@/lib/localize';

/** Public fields of a shipping_methods row returned by /api/shipping-methods. */
export interface ShippingMethodRow {
  id: string;
  name_en: string;
  name_ar: string | null;
  eta_en: string | null;
  eta_ar: string | null;
  price_cents: number;
}

/** Maps a DB row to the DeliveryMethod used by pricing. price_cents=0 means free shipping. */
export function toDeliveryMethod(row: ShippingMethodRow, locale: ContentLocale): DeliveryMethod {
  const eta = pickLocalized(row.eta_en, row.eta_ar, locale);
  return {
    id: row.id,
    name: pickLocalized(row.name_en, row.name_ar, locale),
    description: eta,
    fee: Math.max(0, row.price_cents ?? 0),
    estimatedDays: eta,
  };
}
