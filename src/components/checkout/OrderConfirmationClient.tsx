'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CircleCheck as CheckCircle, Package, Truck, Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import { SafeImage } from '@/components/ui/SafeImage';
import { Logo } from '@/components/layout/Logo';
import { trackPurchase } from '@/lib/fbpixel';
import { useI18n } from '@/context/I18nContext';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  isPaymentMethod,
  type PaymentMethod,
} from '@/lib/payment-methods';
import type { OrderSummary } from '@/types';

interface ServerOrderData {
  orderNumber: string;
  email: string;
  deliveryMethodName: string;
  deliveryMethodEstimate: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  placedAt: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  deliveryNotes: string;
  preferredDeliveryTime: string;
  whatsappNumber: string;
  instapayHandle: string;
  vodafoneCashNumber: string;
  shippingDetails: {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateOrRegion: string;
    postalCode: string;
    country: string;
  } | null;
  items: { id: string; slug: string; title: string; image: string; unitPrice: number; stock: number; quantity: number }[];
}

interface ConfirmationPageProps {
  orderNumber: string;
  serverOrder?: ServerOrderData;
}

export function OrderConfirmationClient({ orderNumber, serverOrder }: ConfirmationPageProps) {
  const { t } = useI18n();
  const [order, setOrder] = useState<OrderSummary | null>(serverOrder ? convertServerOrder(serverOrder) : null);
  const [loaded, setLoaded] = useState(!!serverOrder);

  useEffect(() => {
    if (serverOrder) return;
    try {
      const raw = sessionStorage.getItem(`golden-tiger-order-${orderNumber}`);
      if (raw) {
        setOrder(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [orderNumber, serverOrder]);

  useEffect(() => {
    if (!order) return;
    trackPurchase({
      contentIds: order.items.map((i) => i.id),
      value: order.total,
      numItems: order.items.reduce((sum, i) => sum + i.quantity, 0),
      orderId: order.orderNumber,
    });
  }, [order]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-pulse h-8 w-8 rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <Logo showTagline />
        <p className="text-sm text-muted mt-6 mb-4">Order not found.</p>
        <Link href="/" className="gold-button rounded-lg px-6 py-2.5 text-sm">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const rawMethod = serverOrder?.paymentMethod ?? '';
  const paymentMethod: PaymentMethod | '' = isPaymentMethod(rawMethod) ? rawMethod : '';
  const status = serverOrder?.status ?? '';
  // Manual payments stay pending until the admin confirms the screenshot.
  const showPaymentInstructions =
    paymentMethod !== '' && status !== 'COMPLETED' && status !== 'CANCELLED';
  const methodTitle =
    paymentMethod === 'instapay' ? t('order.pay.instapay')
    : paymentMethod === 'vodafone_cash' ? t('order.pay.vodafone_cash')
    : paymentMethod === 'cod' ? t('order.pay.cod')
    : '';
  const methodValue =
    paymentMethod === 'instapay' ? serverOrder?.instapayHandle ?? ''
    : paymentMethod === 'vodafone_cash' ? serverOrder?.vodafoneCashNumber ?? ''
    : '';
  const deliveryNotes = serverOrder?.deliveryNotes ?? '';
  const preferredDeliveryTime = serverOrder?.preferredDeliveryTime ?? '';
  const whatsappUrl = buildWhatsAppUrl(
    serverOrder?.whatsappNumber,
    buildWhatsAppOrderMessage({
      orderNumber: order.orderNumber,
      customerName: serverOrder?.customerName || order.shippingDetails.fullName,
      totalLabel: formatPrice(order.total),
      paymentMethod,
    })
  );

  const estimatedDays = parseInt(order.deliveryMethod.estimatedDays.split('-')[0]) || 5;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Logo showTagline />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-sm text-muted">
            Your order has been confirmed. A confirmation email has been sent to{' '}
            <span className="text-gold">{order.shippingDetails.email}</span>.
          </p>
          <p className="text-lg font-bold text-gold mt-3">{order.orderNumber}</p>
        </div>

        {/* Manual payment instructions */}
        {showPaymentInstructions && (
          <div className="mb-6 rounded-xl border border-gold/40 bg-gold/5 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gold animate-pulse" />
              <p dir="auto" className="text-sm font-semibold text-gold">
                {t('order.status.awaitingPayment')}
              </p>
            </div>

            <div>
              <h2 dir="auto" className="font-heading text-base font-bold text-text mb-2">
                {t('order.paymentInstructions')}
              </h2>
              <div className="rounded-lg border border-border bg-surface-elevated p-4 text-center">
                {paymentMethod === 'cod' ? (
                  <p dir="auto" className="text-xl sm:text-2xl font-bold text-text">
                    {methodTitle}
                  </p>
                ) : (
                  <>
                    <p dir="auto" className="text-xs text-muted mb-1">{methodTitle}</p>
                    {methodValue ? (
                      <p dir="auto" className="text-2xl sm:text-3xl font-bold text-text break-all">
                        {methodValue}
                      </p>
                    ) : (
                      <p dir="auto" className="text-sm text-muted">{t('order.sendScreenshot')}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="text-center space-y-3">
              <p dir="auto" className="text-sm text-muted">{t('order.sendScreenshot')}</p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span dir="auto">{t('order.whatsapp')}</span>
                </a>
              ) : null}
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-6">
          {/* Delivery estimate */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-elevated">
            <Calendar className="h-5 w-5 text-gold shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">Estimated Delivery</p>
              <p className="text-xs text-muted">
                {estimatedDelivery.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' via '}
                {order.deliveryMethod.name}
              </p>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingDetails && (
            <div>
              <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4 text-gold" />
                Shipping Address
              </h3>
              <div className="text-sm text-muted p-3 rounded-lg bg-surface-elevated">
                <p className="text-text font-medium">{order.shippingDetails.fullName}</p>
                <p>{order.shippingDetails.addressLine1}{order.shippingDetails.addressLine2 ? `, ${order.shippingDetails.addressLine2}` : ''}</p>
                <p>{order.shippingDetails.city}, {order.shippingDetails.stateOrRegion} {order.shippingDetails.postalCode}</p>
                <p>{order.shippingDetails.country}</p>
              </div>
            </div>
          )}

          {/* Delivery notes / preferred time */}
          {(deliveryNotes || preferredDeliveryTime) && (
            <div className="text-sm p-3 rounded-lg bg-surface-elevated space-y-1">
              {preferredDeliveryTime ? (
                <p>
                  <span dir="auto" className="text-muted">{t('order.preferredDeliveryTime')}: </span>
                  <span dir="auto" className="text-text">{preferredDeliveryTime}</span>
                </p>
              ) : null}
              {deliveryNotes ? (
                <p>
                  <span dir="auto" className="text-muted">{t('order.deliveryNotes')}: </span>
                  <span dir="auto" className="text-text">{deliveryNotes}</span>
                </p>
              ) : null}
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-gold" />
              Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="rounded-lg border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-text">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-text">{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Tax</span><span className="text-text">{formatPrice(order.tax)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Shipping</span><span className="text-text">{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span></div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-text font-semibold">Total Paid</span>
              <span className="text-xl font-bold text-gold">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 gold-button rounded-lg px-8 py-3 text-sm font-semibold"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function convertServerOrder(s: ServerOrderData): OrderSummary {
  return {
    orderNumber: s.orderNumber,
    items: s.items.map((i) => ({
      id: i.id,
      slug: i.slug,
      title: i.title,
      image: i.image,
      unitPrice: i.unitPrice,
      stock: i.stock,
      quantity: i.quantity,
    })),
    shippingDetails: s.shippingDetails ?? {
      fullName: '', email: s.email, phone: '', addressLine1: '', addressLine2: '',
      city: '', stateOrRegion: '', postalCode: '', country: '',
    },
    deliveryMethod: {
      id: '',
      name: s.deliveryMethodName,
      description: '',
      fee: s.shipping,
      estimatedDays: s.deliveryMethodEstimate,
    },
    subtotal: s.subtotal,
    tax: s.tax,
    shipping: s.shipping,
    total: s.total,
    placedAt: s.placedAt,
  };
}
