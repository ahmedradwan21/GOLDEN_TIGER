import { z } from 'zod';

export const imageUrl = z.string().trim().refine(v => !v || /^https?:\/\//i.test(v), 'Use an HTTP(S) image URL');
export const brandSchema = z.object({
  name_en: z.string().trim().min(1), name_ar: z.string().trim().default(''),
  slug: z.string().trim().min(1).regex(/^[\p{L}\p{N}_-]+$/u),
  logo_url: imageUrl.nullable().default(null), sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
export const categorySchema = z.object({
  name: z.string().trim().min(1), name_ar: z.string().trim().default(''),
  slug: z.string().trim().min(1).regex(/^[\p{L}\p{N}_-]+$/u),
  image_url: imageUrl.nullable().default(null), parent_id: z.string().nullable().default(null),
  sort_order: z.number().int().default(0),
});
export const couponSchema = z.object({
  code: z.string().trim().min(1).transform(v => v.toUpperCase()),
  title_en: z.string().trim().default(''), title_ar: z.string().trim().default(''),
  discount_type: z.enum(['percentage', 'fixed']), value: z.number().int().nonnegative(),
  max_uses: z.number().int().positive().nullable().default(null),
  expires_at: z.string().datetime({ offset: true }).nullable().default(null),
  image_url: imageUrl.nullable().default(null), is_reward: z.boolean().default(false),
  customer_email: z.string().trim().email().transform(v => v.toLowerCase()).nullable().default(null),
}).refine(v => v.discount_type !== 'percentage' || v.value <= 100, 'Percentage cannot exceed 100');

export function brandSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || `brand-${Date.now()}`;
}
export function couponAvailable(c: { expires_at: string | null; max_uses: number | null; uses_count: number }, now = Date.now()) {
  return (!c.expires_at || Date.parse(c.expires_at) > now) && (c.max_uses === null || c.uses_count < c.max_uses);
}
export function couponTitle(c: { code: string; title_en?: string | null; title_ar?: string | null }, locale: string) {
  return (locale === 'ar' ? c.title_ar?.trim() : '') || c.title_en?.trim() || c.code;
}
