import { OrderConfirmationClient } from '@/components/checkout/OrderConfirmationClient';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { DELIVERY_METHODS } from '@/lib/pricing';

interface ConfirmationPageProps {
  params: { orderNumber: string };
}

export const metadata = {
  title: 'Order Confirmation',
};

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
  const { data: dbOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!dbOrder) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', dbOrder.id);

  const deliveryMethod = DELIVERY_METHODS.find((d) => d.id === dbOrder.delivery_method) ?? DELIVERY_METHODS[0];
  const shippingAddress = dbOrder.shipping_address as Record<string, string> | null;

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
