import 'server-only';
import { supabaseAdmin } from '@/lib/db-admin';
import type { ShippingMethodRow } from '@/lib/shipping-methods';

const COLUMNS = 'id, name_en, name_ar, eta_en, eta_ar, price_cents';

/** Active shipping methods ordered by sort_order. */
export async function getActiveShippingMethods(): Promise<ShippingMethodRow[]> {
  const { data, error } = await (supabaseAdmin as any)
    .from('shipping_methods')
    .select(COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`[shipping_methods] ${error.message}`);
  return (data ?? []) as ShippingMethodRow[];
}

/** Server-trusted shipping price for an active method id, or null when unknown/inactive. */
export async function getShippingPriceCents(id: string | null | undefined): Promise<number | null> {
  if (!id) return null;
  const { data, error } = await (supabaseAdmin as any)
    .from('shipping_methods')
    .select('price_cents')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return Math.max(0, data.price_cents ?? 0);
}
