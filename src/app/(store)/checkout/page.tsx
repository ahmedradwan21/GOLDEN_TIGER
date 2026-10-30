'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, Truck, ChevronLeft, Loader as Loader2, Package, Pencil, Wallet, Tag, X } from 'lucide-react';
import { computeCouponDiscount } from '@/lib/coupon-discount';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import {
  formatPrice,
  computePriceBreakdown,
} from '@/lib/pricing';
import { PAYMENT_METHODS, isPaymentMethod, type PaymentMethod, type PaymentInfo } from '@/lib/payment-methods';
import { toDeliveryMethod, type ShippingMethodRow } from '@/lib/shipping-methods';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { productTitle } from '@/lib/localize';
import { track } from '@/lib/tracker';
import { trackInitiateCheckout } from '@/lib/fbpixel';
import type { ShippingDetails, DeliveryMethod } from '@/types';

const SHIPPING_SCHEMA = z.object({
  fullName: z.string().min(2, 'checkout.err.fullName'),
  email: z.string().email('checkout.err.email'),
  phone: z.string().trim().regex(/^01\d{9}$/, 'checkout.err.phone'),
  addressLine1: z.string().min(3, 'checkout.err.address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'checkout.err.city'),
  stateOrRegion: z.string().min(2, 'checkout.err.state'),
  secondaryPhone: z.string().trim().regex(/^(01\d{9})?$/, 'checkout.err.phone').optional(),
  landmark: z.string().trim().min(2, 'checkout.err.landmark'),
  preferredDeliveryTime: z.string().max(100).optional(),
  deliveryNotes: z.string().max(500).optional(),
});

const FORM_STORAGE_KEY = 'golden-tiger-checkout-form';
const DELIVERY_STORAGE_KEY = 'golden-tiger-checkout-delivery';

// Same visitor id for start / PATCH / complete; persisted so all calls match orders.session_id.
function getCheckoutSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = localStorage.getItem('gt_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('gt_sid', sid);
    }
    return sid;
  } catch {
    return '';
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const { user } = useAuth();
  const { t, dir, locale } = useI18n();
  const BackIcon = ChevronLeft;
  const [orderId, setOrderId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: '', email: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', stateOrRegion: '', postalCode: '', country: 'Egypt', deliveryNotes: '',
    secondaryPhone: '', landmark: '', preferredDeliveryTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryId, setDeliveryId] = useState('');
  const [shippingRows, setShippingRows] = useState<ShippingMethodRow[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const submittingRef = useRef(false);
  const [processing, setProcessing] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: 'percentage' | 'fixed'; value: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const steps = [
    { num: 1, label: t('checkout.step.shipping'), icon: Truck },
    { num: 2, label: t('checkout.step.review'), icon: Package },
    { num: 3, label: t('checkout.step.payment'), icon: Wallet },
  ];

  const deliveryMethods: DeliveryMethod[] = shippingRows.map((r) => toDeliveryMethod(r, locale === 'ar' ? 'ar' : 'en'));
  const deliveryMethod: DeliveryMethod | null = deliveryMethods.find((d) => d.id === deliveryId) || deliveryMethods[0] || null;

  useEffect(() => {
    fetch('/api/payment-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((info: PaymentInfo | null) => setPaymentInfo(info))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/shipping-methods')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ShippingMethodRow[]) => {
        if (!Array.isArray(rows)) return;
        setShippingRows(rows);
        setDeliveryId((prev) => (rows.some((r) => r.id === prev) ? prev : rows[0]?.id ?? ''));
      })
      .catch(() => {});
  }, []);
  const breakdown = computePriceBreakdown(items, deliveryMethod);
  const discount = appliedCoupon
    ? computeCouponDiscount({ discount_type: appliedCoupon.discountType, value: appliedCoupon.value }, breakdown.subtotal)
    : 0;
  const total = Math.max(0, breakdown.total - discount);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) { setCouponError(t('checkout.coupon.err.not_found')); return; }
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalCents: breakdown.subtotal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const key = `checkout.coupon.err.${data?.error ?? 'server'}`;
        const msg = t(key);
        setCouponError(msg === key ? t('checkout.coupon.err.server') : msg);
        return;
      }
      setAppliedCoupon({ code: data.code, discountType: data.discountType, value: data.value });
      setCouponInput('');
      toast.success(t('checkout.coupon.applied'));
    } catch {
      setCouponError(t('checkout.coupon.err.server'));
    } finally {
      setApplyingCoupon(false);
    }
  }

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        email: user.email,
        fullName: user.name || prev.fullName,
      }));
    }
  }, [user]);

  // Stable key from productId:quantity pairs so /start runs once per cart contents, not per array identity.
  const cartKey = items.map((i) => `${i.id}:${i.quantity}`).sort().join('|');
  const startedKeyRef = useRef<string | null>(null);
  const [startError, setStartError] = useState('');
  const [startAttempt, setStartAttempt] = useState(0);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    const runKey = `${cartKey}#${startAttempt}`;
    if (startedKeyRef.current === runKey) return;
    startedKeyRef.current = runKey;

    if (startAttempt === 0) {
      trackInitiateCheckout({
        contentIds: items.map((i) => i.id),
        value: total,
        numItems: breakdown.itemCount,
      });
    }

    setStartError('');
    const sid = getCheckoutSessionId();
    fetch('/api/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (startedKeyRef.current !== runKey) return; // superseded by a newer cart
        if (r.ok && data?.orderId) {
          setOrderId(data.orderId);
        } else {
          setOrderId(null);
          setStartError(data?.error || t('checkout.err.submitFailed'));
        }
      })
      .catch(() => {
        if (startedKeyRef.current !== runKey) return;
        setOrderId(null);
        setStartError(t('checkout.err.submitFailed'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, cartKey, startAttempt]);

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace('/cart');
    }
  }, [hydrated, items.length, router]);

  useEffect(() => {
    try {
      const formRaw = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (formRaw) {
        const parsed = JSON.parse(formRaw);
        setShipping((prev) => ({ ...prev, ...parsed, postalCode: '', country: 'Egypt' }));
      }
      const deliveryRaw = sessionStorage.getItem(DELIVERY_STORAGE_KEY);
      if (deliveryRaw) {
        setDeliveryId(deliveryRaw);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(shipping));
      sessionStorage.setItem(DELIVERY_STORAGE_KEY, deliveryId);
    } catch {
      // ignore
    }
  }, [shipping, deliveryId]);

  if (!hydrated || items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <div className="animate-pulse h-8 w-8 rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = SHIPPING_SCHEMA.safeParse(shipping);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = t(issue.message);
      });
      setErrors(fieldErrors);
      toast.error(t('checkout.err.fixBelow'));
      return;
    }
    setErrors({});

    if (orderId) {
      fetch(`/api/checkout/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getCheckoutSessionId(),
          email: shipping.email,
          shippingAddress: shipping,
          deliveryMethod: deliveryId || undefined,
        }),
      }).catch(() => {
        // Non-critical
      });
    }

    setStep(2);
  }

  function updateShipping(field: keyof ShippingDetails, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }

  async function handleConfirmOrder() {
    // Prevent duplicate submissions (double clicks / repeated taps).
    if (submittingRef.current) return;
    setSubmitError('');
    if (!isPaymentMethod(paymentMethod)) {
      setPaymentError(t('checkout.err.paymentMethod'));
      toast.error(t('checkout.err.paymentMethod'));
      return;
    }
    if (!orderId) {
      setSubmitError(t('checkout.err.submitFailed'));
      toast.error(t('checkout.err.submitFailed'));
      return;
    }
    submittingRef.current = true;
    setProcessing(true);
    const fail = (msg: string) => {
      submittingRef.current = false;
      setProcessing(false);
      setSubmitError(msg);
      toast.error(msg);
    };

    const sid = getCheckoutSessionId();
    try {
      // Make sure the latest customer details and delivery method are saved before submitting.
      const saveRes = await fetch(`/api/checkout/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, email: shipping.email, shippingAddress: shipping, deliveryMethod: deliveryId || undefined }),
      });
      if (!saveRes.ok) return fail(t('checkout.err.submitFailed'));

      const completeRes = await fetch(`/api/checkout/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, paymentMethod, couponCode: appliedCoupon?.code ?? null }),
      });

      if (completeRes.status === 409) {
        const conflict = await completeRes.json();
        if (!conflict.items) return fail(t('checkout.err.submitFailed'));
        const issueMsg = conflict.items.map((i: { title: string; available: number; requested: number }) =>
          t('checkout.err.stockItem').replace('{title}', i.title).replace('{available}', String(i.available ?? 0)).replace('{requested}', String(i.requested))
        ).join(locale === 'ar' ? '، ' : ', ') || t('checkout.err.outOfStock');
        return fail(`${t('checkout.err.noLongerAvailable')} ${issueMsg}`);
      }
      if (completeRes.status === 422) {
        const body = await completeRes.json().catch(() => null);
        if (body?.couponError) {
          setAppliedCoupon(null);
          return fail(t(`checkout.coupon.err.${body.couponError}`));
        }
      }
      if (!completeRes.ok) return fail(t('checkout.err.submitFailed'));

      const completed = await completeRes.json();
      clearCart();
      sessionStorage.removeItem(FORM_STORAGE_KEY);
      sessionStorage.removeItem(DELIVERY_STORAGE_KEY);
      const orderSummary = {
        orderNumber: completed.orderNumber,
        items: [...items],
        shippingDetails: shipping,
        deliveryMethod: deliveryMethod ?? { id: '', name: '', description: '', fee: 0, estimatedDays: '' },
        subtotal: breakdown.subtotal,
        tax: breakdown.tax,
        shipping: breakdown.shipping,
        discount,
        total: completed.totalCents ?? total,
        placedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(`golden-tiger-order-${completed.orderNumber}`, JSON.stringify(orderSummary));
      } catch {
        // ignore
      }
      toast.success(t('checkout.orderSubmitted'));
      router.push(`/order-confirmation/${completed.orderNumber}`);
    } catch {
      fail(t('checkout.err.submitFailed'));
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cart" className="text-muted hover:text-gold transition-colors">
          <BackIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-text">{t('checkout.title')}</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, index) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  step > s.num
                    ? 'bg-success text-white'
                    : step === s.num
                      ? 'bg-gold text-background'
                      : 'bg-surface-elevated text-muted'
                )}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  step >= s.num ? 'text-text' : 'text-muted'
                )}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-20 h-px mx-2',
                  step > s.num ? 'bg-success' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {startError && (
        <div role="alert" className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4">
          <p className="flex-1 text-sm text-danger">{startError}</p>
          <button
            type="button"
            onClick={() => setStartAttempt((n) => n + 1)}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            {t('checkout.retry')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <form ref={formRef} onSubmit={handleShippingSubmit} className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-text mb-2">{t('checkout.shippingDetails')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t('checkout.field.fullName')} error={errors.fullName}>
                  <input
                    type="text"
                    value={shipping.fullName}
                    onChange={(e) => updateShipping('fullName', e.target.value)}
                    autoComplete="name"
                    className={inputClass(errors.fullName)}
                    placeholder={t('placeholder.fullName')}
                  />
                </FormField>
                <FormField label={t('common.email')} error={errors.email}>
                  <input
                    type="email"
                    value={shipping.email}
                    onChange={(e) => updateShipping('email', e.target.value)}
                    autoComplete="email"
                    className={inputClass(errors.email)}
                    placeholder={t('placeholder.email')}
                  />
                </FormField>
                <FormField label={t('checkout.field.phone')} error={errors.phone}>
                  <input
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) => updateShipping('phone', e.target.value)}
                    autoComplete="tel"
                    className={inputClass(errors.phone)}
                    placeholder="01xxxxxxxxx"
                    inputMode="numeric"
                    maxLength={11}
                  />
                </FormField>
                <FormField label={t('checkout.field.secondaryPhone')} error={errors.secondaryPhone}>
                  <input
                    type="tel"
                    value={shipping.secondaryPhone ?? ''}
                    onChange={(e) => updateShipping('secondaryPhone', e.target.value)}
                    className={inputClass(errors.secondaryPhone)}
                    placeholder="01xxxxxxxxx"
                    inputMode="numeric"
                    maxLength={11}
                  />
                </FormField>
                <FormField label={t('checkout.field.addressLine1')} error={errors.addressLine1} full>
                  <input
                    type="text"
                    value={shipping.addressLine1}
                    onChange={(e) => updateShipping('addressLine1', e.target.value)}
                    autoComplete="address-line1"
                    className={inputClass(errors.addressLine1)}
                    placeholder={t('placeholder.address1')}
                  />
                </FormField>
                <FormField label={t('checkout.field.addressLine2')} full>
                  <input
                    type="text"
                    value={shipping.addressLine2}
                    onChange={(e) => updateShipping('addressLine2', e.target.value)}
                    autoComplete="address-line2"
                    className={inputClass()}
                    placeholder={t('placeholder.address2')}
                  />
                </FormField>
                <FormField label={t('checkout.field.city')} error={errors.city}>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(e) => updateShipping('city', e.target.value)}
                    autoComplete="address-level2"
                    className={inputClass(errors.city)}
                    placeholder={t('placeholder.city')}
                  />
                </FormField>
                <FormField label={t('checkout.field.stateRegion')} error={errors.stateOrRegion}>
                  <input
                    type="text"
                    value={shipping.stateOrRegion}
                    onChange={(e) => updateShipping('stateOrRegion', e.target.value)}
                    autoComplete="address-level1"
                    className={inputClass(errors.stateOrRegion)}
                    placeholder={t('placeholder.state')}
                  />
                </FormField>
                <FormField label={t('checkout.field.landmark')} error={errors.landmark} full>
                  <input
                    type="text"
                    value={shipping.landmark ?? ''}
                    onChange={(e) => updateShipping('landmark', e.target.value)}
                    className={inputClass(errors.landmark)}
                    placeholder={t('placeholder.landmark')}
                  />
                </FormField>
                <FormField label={t('checkout.field.preferredDeliveryTime')} error={errors.preferredDeliveryTime} full>
                  <input
                    type="text"
                    value={shipping.preferredDeliveryTime ?? ''}
                    onChange={(e) => updateShipping('preferredDeliveryTime', e.target.value)}
                    maxLength={100}
                    className={inputClass(errors.preferredDeliveryTime)}
                    placeholder={t('placeholder.preferredDeliveryTime')}
                  />
                </FormField>
                <FormField label={t('checkout.field.deliveryNotes')} error={errors.deliveryNotes} full>
                  <textarea
                    value={shipping.deliveryNotes ?? ''}
                    onChange={(e) => updateShipping('deliveryNotes', e.target.value)}
                    maxLength={500}
                    rows={3}
                    className={inputClass(errors.deliveryNotes)}
                    placeholder={t('placeholder.deliveryNotes')}
                  />
                </FormField>
              </div>

              {/* Delivery method */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-text mb-3">{t('checkout.deliveryMethod')}</h3>
                <div className="space-y-2">
                  {deliveryMethods.map((method) => {
                    const isSelected = deliveryId === method.id;
                    const isFree = method.fee === 0 || (!!method.freeThreshold && breakdown.subtotal >= method.freeThreshold);
                    return (
                      <label
                        key={method.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          isSelected
                            ? 'border-gold bg-gold/5'
                            : 'border-border hover:border-muted'
                        )}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={method.id}
                          checked={isSelected}
                          onChange={(e) => setDeliveryId(e.target.value)}
                          className="sr-only"
                        />
                        <div className={cn(
                          'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                          isSelected ? 'border-gold' : 'border-muted'
                        )}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-gold" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text">{method.name}</p>
                          {method.estimatedDays ? <p className="text-xs text-muted">{method.estimatedDays}</p> : null}
                        </div>
                        <span className={cn('text-sm font-semibold', isFree ? 'text-success' : 'text-text')}>
                          {isFree ? t('common.free') : formatPrice(method.fee)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full h-12 gold-button rounded-lg text-sm font-semibold">
                {t('checkout.continueToReview')}
              </button>
            </form>
          )}

          {/* Step 2: Order Summary Review */}
          {step === 2 && (
            <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-text">{t('checkout.reviewYourOrder')}</h2>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-gold hover:text-gold-light transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('common.edit')}
                </button>
              </div>

              {/* Shipping details */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">{t('common.shippingAddress')}</h3>
                <div className="text-sm text-muted space-y-0.5 p-3 rounded-lg bg-surface-elevated">
                  <p className="text-text font-medium">{shipping.fullName}</p>
                  <p>{shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}</p>
                  <p>{shipping.city}, {shipping.stateOrRegion}</p>
                  <p>{shipping.country}</p>
                  {shipping.landmark ? <p>{t('checkout.field.landmark')}: {shipping.landmark}</p> : null}
                  <p>{shipping.email} | {shipping.phone}{shipping.secondaryPhone ? ` | ${shipping.secondaryPhone}` : ''}</p>
                  {shipping.preferredDeliveryTime ? <p>{t('checkout.field.preferredDeliveryTime')}: {shipping.preferredDeliveryTime}</p> : null}
                  {shipping.deliveryNotes ? <p>{shipping.deliveryNotes}</p> : null}
                </div>
              </div>

              {/* Delivery method */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">{t('checkout.deliveryMethod')}</h3>
                <div className="text-sm text-muted p-3 rounded-lg bg-surface-elevated">
                  <span className="text-text font-medium">{deliveryMethod?.name}</span>{deliveryMethod?.estimatedDays ? ` - ${deliveryMethod.estimatedDays}` : ''}
                </div>
              </div>

              {/* Line items */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">{t('common.itemsCount').replace('{count}', String(breakdown.itemCount))}</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <SafeImage
                        src={item.image}
                        alt={productTitle(item, locale)}
                        width={56}
                        height={56}
                        className="rounded-lg border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p dir="auto" className="text-sm font-medium text-text line-clamp-1">{productTitle(item, locale)}</p>
                        <p className="text-xs text-muted">{t('common.qty').replace('{qty}', String(item.quantity))} x {formatPrice(item.unitPrice)}</p>
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
                <div className="flex justify-between"><span className="text-muted">{t('common.subtotal')}</span><span className="text-text">{formatPrice(breakdown.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('checkout.tax8pct')}</span><span className="text-text">{formatPrice(breakdown.tax)}</span></div>
                <div className="flex justify-between"><span className="text-muted">{t('common.shipping')}</span><span className={cn(breakdown.shipping === 0 ? 'text-success' : 'text-text')}>{breakdown.shipping === 0 ? t('common.free') : formatPrice(breakdown.shipping)}</span></div>
                {discount > 0 && (<div className="flex justify-between"><span className="text-muted">{t('checkout.coupon.discount').replace('{code}', appliedCoupon?.code ?? '')}</span><span className="text-success">−{formatPrice(discount)}</span></div>)}
                <div className="flex justify-between border-t border-border pt-2"><span className="text-text font-semibold">{t('common.total')}</span><span className="text-lg font-bold text-gold">{formatPrice(total)}</span></div>
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full h-12 gold-button rounded-lg text-sm font-semibold"
              >
                {t('checkout.continueToPayment')}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
              >
                {t('checkout.backToShipping')}
              </button>
            </div>
          )}

          {/* Step 3: Payment method */}
          {step === 3 && (
            <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-6">
              <fieldset>
                <legend className="font-heading text-lg font-bold text-text mb-3">{t('checkout.paymentMethod')}</legend>
                <div className="space-y-2" role="radiogroup" aria-invalid={!!paymentError}>
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = paymentMethod === pm;
                    const hint =
                      pm === 'instapay'
                        ? paymentInfo?.instapay_handle ? t('checkout.pay.instapayHint').replace('{value}', paymentInfo.instapay_handle) : ''
                        : pm === 'vodafone_cash'
                          ? paymentInfo?.vodafone_cash_number ? t('checkout.pay.vodafoneHint').replace('{value}', paymentInfo.vodafone_cash_number) : ''
                          : t('checkout.pay.codHint');
                    return (
                      <label
                        key={pm}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          isSelected ? 'border-gold bg-gold/5' : paymentError ? 'border-danger' : 'border-border hover:border-muted'
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm}
                          checked={isSelected}
                          onChange={() => { setPaymentMethod(pm); setPaymentError(''); }}
                          className="sr-only"
                        />
                        <div className={cn(
                          'mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                          isSelected ? 'border-gold' : 'border-muted'
                        )}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-gold" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text">{t(`checkout.pay.${pm}`)}</p>
                          {isSelected && hint ? <p dir="auto" className="text-xs text-muted mt-1">{hint}</p> : null}
                          {isSelected && pm !== 'cod' ? <p className="text-xs text-muted mt-1">{t('checkout.pay.screenshotHint')}</p> : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {paymentError && <p className="text-xs text-danger mt-2">{paymentError}</p>}
              </fieldset>

              <div className="flex justify-between border-t border-border pt-4 text-sm"><span className="text-text font-semibold">{t('common.total')}</span><span className="text-lg font-bold text-gold">{formatPrice(total)}</span></div>

              {submitError && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30">
                  <p className="text-sm text-danger">{submitError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={processing}
                className="w-full h-12 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('checkout.processing')}
                  </>
                ) : (
                  t('checkout.confirmOrder')
                )}
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => setStep(2)}
                className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
              >
                {t('checkout.backToReview')}
              </button>
            </div>
          )}

        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          {/* Mobile toggle */}
          <button
            onClick={() => setSummaryOpen((v) => !v)}
            className="w-full lg:hidden flex items-center justify-between p-4 rounded-lg bg-surface border border-border mb-4"
          >
            <span className="text-sm font-semibold text-text">
              {t('checkout.orderSummaryWithTotal').replace('{total}', formatPrice(total))}
            </span>
            <ChevronLeft className={cn('h-4 w-4 text-muted transition-transform', summaryOpen && '-rotate-90')} />
          </button>

          <div className={cn(
            'bg-surface rounded-xl border border-border p-5 lg:sticky lg:top-24',
            !summaryOpen && 'hidden lg:block'
          )}>
            <h2 className="font-heading text-lg font-bold text-text mb-4">{t('common.orderSummary')}</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="relative shrink-0">
                    <SafeImage
                      src={item.image}
                      alt={productTitle(item, locale)}
                      width={48}
                      height={48}
                      className="rounded-lg border border-border"
                    />
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-background text-[0.625rem] font-bold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <p dir="auto" className="text-xs text-text line-clamp-2 flex-1">{productTitle(item, locale)}</p>
                  <span className="text-xs font-semibold text-text">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 pb-4">
              <label htmlFor="coupon-code" className="block text-xs font-medium text-muted mb-1.5">{t('checkout.coupon.label')}</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-lg border border-gold/40 bg-gold/10 text-sm">
                  <span className="flex items-center gap-2 text-gold font-medium" dir="ltr"><Tag className="h-4 w-4" />{appliedCoupon.code}</span>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setAppliedCoupon(null)}
                    className="text-muted hover:text-text"
                    aria-label={t('checkout.coupon.remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="coupon-code"
                    dir="ltr"
                    maxLength={64}
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                    placeholder={t('checkout.coupon.placeholder')}
                    className={cn(inputClass(couponError || undefined), 'flex-1 uppercase')}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || items.length === 0}
                    className="h-10 px-4 rounded-lg gold-button text-sm font-semibold flex items-center gap-2 disabled:opacity-70"
                  >
                    {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('checkout.coupon.apply')}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-danger mt-1">{couponError}</p>}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">{t('common.subtotal')}</span><span className="text-text">{formatPrice(breakdown.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t('common.tax')}</span><span className="text-text">{formatPrice(breakdown.tax)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t('common.shipping')}</span><span className={cn(breakdown.shipping === 0 && 'text-success')}>{breakdown.shipping === 0 ? t('common.free') : formatPrice(breakdown.shipping)}</span></div>
              {discount > 0 && (<div className="flex justify-between"><span className="text-muted">{t('checkout.coupon.discount').replace('{code}', appliedCoupon?.code ?? '')}</span><span className="text-success">−{formatPrice(discount)}</span></div>)}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text font-semibold">{t('common.total')}</span>
                <span className="text-xl font-bold text-gold">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
  full,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function inputClass(error?: string): string {
  return cn(
    'w-full h-10 px-3 rounded-lg bg-surface-elevated border text-sm text-text placeholder:text-muted focus-ring',
    error ? 'border-danger' : 'border-border'
  );
}
