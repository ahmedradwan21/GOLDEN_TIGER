/** Browser-safe validation for /admin/settings (store numbers + shipping methods). */

export interface StoreNumbers {
  whatsapp_number: string;
  vodafone_cash_number: string;
  instapay_handle: string;
}

export interface ShippingMethodInput {
  name_en: string;
  name_ar: string | null;
  price_cents: number;
  eta_en: string | null;
  eta_ar: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AdminShippingMethod extends ShippingMethodInput {
  id: string;
}

const str = (v: unknown, max: number): string | null => {
  if (v == null) return '';
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > max ? null : s;
};

/** Phone-like values: digits, spaces, +, -, (, ). Empty allowed. */
const PHONE = /^[+\d\s()-]*$/;

export function validateStoreNumbers(body: unknown): StoreNumbers | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const whatsapp = str(b.whatsapp_number, 30);
  const vodafone = str(b.vodafone_cash_number, 30);
  const instapay = str(b.instapay_handle, 100);
  if (whatsapp === null || vodafone === null || instapay === null) return null;
  if (!PHONE.test(whatsapp) || !PHONE.test(vodafone)) return null;
  return { whatsapp_number: whatsapp, vodafone_cash_number: vodafone, instapay_handle: instapay };
}

export function validateShippingMethod(body: unknown): ShippingMethodInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const name_en = str(b.name_en, 120);
  const name_ar = str(b.name_ar, 120);
  const eta_en = str(b.eta_en, 120);
  const eta_ar = str(b.eta_ar, 120);
  if (!name_en || name_ar === null || eta_en === null || eta_ar === null) return null;
  const price = Number(b.price_cents);
  const sort = Number(b.sort_order ?? 0);
  if (!Number.isInteger(price) || price < 0 || price > 100_000_000) return null;
  if (!Number.isInteger(sort) || sort < -10000 || sort > 10000) return null;
  return {
    name_en,
    name_ar: name_ar || null,
    price_cents: price,
    eta_en: eta_en || null,
    eta_ar: eta_ar || null,
    sort_order: sort,
    is_active: b.is_active !== false,
  };
}
