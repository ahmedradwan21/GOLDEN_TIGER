import { OrderConfirmationClient } from '@/components/checkout/OrderConfirmationClient';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/db-admin';
import { getSession } from '@/lib/auth/session';
import { isPaymentMethod, toWhatsAppNumber } from '@/lib/payment-methods';

interface ConfirmationPageProps {
  params: { orderNumber: string };
}

export const metadata = {
  title: 'Order Confirmation',
};

// Admin WhatsApp from the project notes, used only when store_settings has no usable number.
const FALLBACK_WHATSAPP_NUMBER = '201114246786';

interface StoreSettings {
  whatsapp_number: string | null;
  instapay_handle: string | null;
  vodafone_cash_number: string | null;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  let serverOrder: Awaited<ReturnType<typeof buildServerOrder>> | undefined;

  if (isDatabaseConfigured()) {
    try {
      serverOrder = await buildServerOrder(params.orderNumber);
    } catch {
      // DB might not be ready, fall back to client sessionStorage
    }
  }

  if (serverOrder) {
    return (
      <OrderConfirmationClient
        orderNumber={params.orderNumber}
        serverOrder={serverOrder}
      />
    );
  }

  return <OrderConfirmationClient orderNumber={params.orderNumber} />;
}

async function buildServerOrder(orderNumber: string) {
  // orders/order_items have no anon SELECT under RLS: read with the service role, then authorize.
  const { data: dbOrder } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, email, user_id, session_id, delivery_method, shipping_address, subtotal_cents, tax_cents, shipping_cents, total_cents, completed_at, status, payment_method')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!dbOrder) return null;

  const session = await getSession().catch(() => null);
  const ownsBySession =
    !!session &&
    ((!!dbOrder.user_id && dbOrder.user_id === session.userId) ||
      (!!dbOrder.email && !!session.email && dbOrder.email.toLowerCase() === session.email.toLowerCase()));
  const proof = cookies().get(`gt_oc_${orderNumber}`)?.value;
  const ownsByCookie = !!proof && !!dbOrder.session_id && proof === dbOrder.session_id;
  if (!ownsBySession && !ownsByCookie) return null;

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('id, title_snapshot, image_snapshot, unit_price_cents, quantity')
    .eq('order_id', dbOrder.id);

  const { data: method } = dbOrder.delivery_method
    ? await (supabase as any)
        .from('shipping_methods')
        .select('name_en, eta_en')
        .eq('id', dbOrder.delivery_method)
        .maybeSingle()
    : { data: null };
  const deliveryMethod = { name: method?.name_en ?? '', estimatedDays: method?.eta_en ?? '' };
  const shippingAddress = dbOrder.shipping_address as Record<string, string> | null;
  const settings = await readStoreSettings();

  return {
    orderNumber: dbOrder.order_number ?? orderNumber,
    email: dbOrder.email ?? '',
    deliveryMethodName: deliveryMethod.name,
    deliveryMethodEstimate: deliveryMethod.estimatedDays,
    subtotal: dbOrder.subtotal_cents,
    tax: dbOrder.tax_cents,
    shipping: dbOrder.shipping_cents,
    total: dbOrder.total_cents,
    placedAt: dbOrder.completed_at ?? new Date().toISOString(),
    status: dbOrder.status ?? '',
    paymentMethod: isPaymentMethod(dbOrder.payment_method) ? dbOrder.payment_method : '',
    customerName: shippingAddress?.fullName ?? '',
    deliveryNotes: shippingAddress?.deliveryNotes ?? '',
    preferredDeliveryTime: shippingAddress?.preferredDeliveryTime ?? '',
    whatsappNumber: toWhatsAppNumber(settings?.whatsapp_number) || FALLBACK_WHATSAPP_NUMBER,
    instapayHandle: settings?.instapay_handle ?? '',
    vodafoneCashNumber: settings?.vodafone_cash_number ?? '',
    shippingDetails: shippingAddress ? {
      fullName: shippingAddress.fullName ?? '',
      email: shippingAddress.email ?? '',
      phone: shippingAddress.phone ?? '',
      addressLine1: shippingAddress.addressLine1 ?? '',
      addressLine2: shippingAddress.addressLine2 ?? '',
      city: shippingAddress.city ?? '',
      stateOrRegion: shippingAddress.stateOrRegion ?? '',
      postalCode: shippingAddress.postalCode ?? '',
      country: shippingAddress.country ?? '',
    } : null,
    items: (items ?? []).map((i: { id: string; title_snapshot: string; image_snapshot: string | null; unit_price_cents: number; quantity: number }) => ({
      id: i.id,
      slug: '',
      title: i.title_snapshot,
      image: i.image_snapshot ?? '',
      unitPrice: i.unit_price_cents,
      stock: 0,
      quantity: i.quantity,
    })),
  };
}

/**
 * store_settings is public-read under the hardened RLS setup, so the anon client
 * works here. If that read comes back empty, retry with the service-role client
 * (imported lazily so a missing service key cannot break the page's fallback path).
 */
async function readStoreSettings(): Promise<StoreSettings | null> {
  const { data, error } = await (supabase as any)
    .from('store_settings')
    .select('whatsapp_number, instapay_handle, vodafone_cash_number')
    .eq('id', 1)
    .maybeSingle();
  if (error) console.error('[order-confirmation] store_settings read failed:', error.message);
  if (data) return data as StoreSettings;

  try {
    const { supabaseAdmin } = await import('@/lib/db-admin');
    const { data: adminData } = await (supabaseAdmin as any)
      .from('store_settings')
      .select('whatsapp_number, instapay_handle, vodafone_cash_number')
      .eq('id', 1)
      .maybeSingle();
    return (adminData as StoreSettings) ?? null;
  } catch {
    return null;
  }
}
