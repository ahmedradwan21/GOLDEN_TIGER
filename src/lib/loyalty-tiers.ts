export interface LoyaltyTier {
  id: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  discount_percentage: number;
  free_shipping: boolean;
  points_required: number;
  sort_order: number;
  is_active: boolean;
}

export const LOYALTY_TIER_FIELDS =
  'id,name_en,name_ar,description_en,description_ar,discount_percentage,free_shipping,points_required,sort_order,is_active';

/** Arabic text when locale is ar and present, otherwise English. */
export function localizedTier(tier: LoyaltyTier, locale: string) {
  const ar = locale === 'ar';
  const pick = (a: string | null, e: string | null) => (ar && a && a.trim() ? a : e ?? '');
  return { name: pick(tier.name_ar, tier.name_en), description: pick(tier.description_ar, tier.description_en) };
}

/** Whitelists and coerces writable columns from a request body. */
export function sanitizeTierInput(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const str = (k: string) => {
    if (k in body) out[k] = body[k] == null ? null : String(body[k]).trim();
  };
  ['name_en', 'name_ar', 'description_en', 'description_ar'].forEach(str);
  if ('discount_percentage' in body) out.discount_percentage = Math.max(0, Math.min(100, Number(body.discount_percentage) || 0));
  if ('points_required' in body) out.points_required = Math.max(0, Math.round(Number(body.points_required) || 0));
  if ('sort_order' in body) out.sort_order = Math.round(Number(body.sort_order) || 0);
  if ('free_shipping' in body) out.free_shipping = Boolean(body.free_shipping);
  if ('is_active' in body) out.is_active = Boolean(body.is_active);
  return out;
}
