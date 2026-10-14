'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Check,
  Lock,
  CreditCard,
  Truck,
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Edit3,
  Package,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  formatPrice,
  computePriceBreakdown,
  DELIVERY_METHODS,
} from '@/lib/pricing';
import {
  processPayment,
  luhnCheck,
  formatCardNumber,
  formatExpiry,
} from '@/lib/payments/mockGateway';
import { SafeImage } from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';
import { track } from '@/lib/tracker';
import type { ShippingDetails, DeliveryMethod } from '@/types';

const SHIPPING_SCHEMA = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(3, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  stateOrRegion: z.string().min(2, 'State/Region is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'India',
];

const STEPS = [
  { num: 1, label: 'Shipping', icon: Truck },
  { num: 2, label: 'Review', icon: Package },
  { num: 3, label: 'Payment', icon: CreditCard },
];

const FORM_STORAGE_KEY = 'golden-tiger-checkout-form';
const DELIVERY_STORAGE_KEY = 'golden-tiger-checkout-delivery';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: '', email: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', stateOrRegion: '', postalCode: '', country: 'United States',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryId, setDeliveryId] = useState('standard');
  const [payment, setPayment] = useState({ nameOnCard: '', cardNumber: '', expiry: '', cvc: '' });
  const [paymentError, setPaymentError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const deliveryMethod = DELIVERY_METHODS.find((d) => d.id === deliveryId) || DELIVERY_METHODS[0];
  const breakdown = computePriceBreakdown(items, deliveryMethod);

  // Pre-fill from auth
  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        email: user.email,
        fullName: user.name || prev.fullName,
      }));
    }
  }, [user]);

  // Create or reuse order on mount
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    const sid = typeof window !== 'undefined'
      ? localStorage.getItem('gt_sid') || crypto.randomUUID()
      : '';
    fetch('/api/checkout/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sid,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.orderId) setOrderId(data.orderId);
      })
      .catch(() => {
        // Non-critical: checkout still works with sessionStorage fallback
      });
  }, [hydrated, items]);

  // Redirect to cart if empty (after hydration)
  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace('/cart');
    }
  }, [hydrated, items.length, router]);

  // Load saved form state from sessionStorage
  useEffect(() => {
    try {
      const formRaw = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (formRaw) {
        const parsed = JSON.parse(formRaw);
        setShipping(parsed);
      }
      const deliveryRaw = sessionStorage.getItem(DELIVERY_STORAGE_KEY);
      if (deliveryRaw) {
        setDeliveryId(deliveryRaw);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save form state
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
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error('Please fix the errors below.');
      return;
    }
    setErrors({});

    // Save shipping details to backend
    if (orderId) {
      fetch(`/api/checkout/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shipping.email,
          shippingAddress: shipping,
          deliveryMethod: deliveryId,
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

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError('');

    if (!payment.nameOnCard.trim()) {
      setPaymentError('Name on card is required.');
      return;
    }
    const digits = payment.cardNumber.replace(/\D/g, '');
    if (digits.length < 16) {
      setPaymentError('Card number must be 16 digits.');
      return;
    }
    if (!luhnCheck(payment.cardNumber)) {
      setPaymentError('Invalid card number. Please check and try again.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) {
      setPaymentError('Expiry must be in MM/YY format.');
      return;
    }
    if (!/^\d{3,4}$/.test(payment.cvc)) {
      setPaymentError('CVC must be 3 or 4 digits.');
      return;
    }

    setProcessing(true);
    const result = await processPayment({
      nameOnCard: payment.nameOnCard,
      cardNumber: digits,
      expiry: payment.expiry,
      cvc: payment.cvc,
      amount: breakdown.total,
    });

    if (!result.success) {
      setProcessing(false);
      setPaymentError(result.message);
      toast.error(result.message);
      return;
    }

    // Complete the order on the server
    if (orderId) {
      const sid = typeof window !== 'undefined'
        ? localStorage.getItem('gt_sid') || crypto.randomUUID()
        : '';
      try {
        const completeRes = await fetch(`/api/checkout/${orderId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            paymentRef: `mock_${digits.slice(-4)}`,
          }),
        });

        if (completeRes.status === 409) {
          const conflict = await completeRes.json();
          setProcessing(false);
          const issueMsg = conflict.items?.map((i: { title: string; available: number; requested: number }) =>
            `${i.title} (only ${i.available} available, you requested ${i.requested})`
          ).join(', ') || 'Some items are out of stock';
          toast.error(`Stock issue: ${issueMsg}`);
          setPaymentError(`Some items are no longer available: ${issueMsg}`);
          return;
        }

        if (completeRes.ok) {
          const completed = await completeRes.json();
          clearCart();
          sessionStorage.removeItem(FORM_STORAGE_KEY);
          sessionStorage.removeItem(DELIVERY_STORAGE_KEY);
          // Save summary for fallback display
          const orderSummary = {
            orderNumber: completed.orderNumber,
            items: [...items],
            shippingDetails: shipping,
            deliveryMethod,
            subtotal: breakdown.subtotal,
            tax: breakdown.tax,
            shipping: breakdown.shipping,
            total: breakdown.total,
            placedAt: new Date().toISOString(),
          };
          try {
            sessionStorage.setItem(`golden-tiger-order-${completed.orderNumber}`, JSON.stringify(orderSummary));
          } catch {
            // ignore
          }
          setProcessing(false);
          toast.success('Payment successful! Redirecting...');
          router.push(`/order-confirmation/${completed.orderNumber}`);
          return;
        }
      } catch {
        // Fall through to sessionStorage-only path
      }
    }

    // Fallback: generate locally (if no DB or API failed)
    setProcessing(false);
    const { generateOrderNumber } = await import('@/lib/payments/mockGateway');
    const orderNumber = generateOrderNumber();
    const orderSummary = {
      orderNumber,
      items: [...items],
      shippingDetails: shipping,
      deliveryMethod,
      subtotal: breakdown.subtotal,
      tax: breakdown.tax,
      shipping: breakdown.shipping,
      total: breakdown.total,
      placedAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(`golden-tiger-order-${orderNumber}`, JSON.stringify(orderSummary));
    } catch {
      // ignore
    }
    clearCart();
    sessionStorage.removeItem(FORM_STORAGE_KEY);
    sessionStorage.removeItem(DELIVERY_STORAGE_KEY);
    toast.success('Payment successful! Redirecting...');
    router.push(`/order-confirmation/${orderNumber}`);
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cart" className="text-muted hover:text-gold transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-text">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, index) => (
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
            {index < STEPS.length - 1 && (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <form ref={formRef} onSubmit={handleShippingSubmit} className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-text mb-2">Shipping Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" error={errors.fullName}>
                  <input
                    type="text"
                    value={shipping.fullName}
                    onChange={(e) => updateShipping('fullName', e.target.value)}
                    autoComplete="name"
                    className={inputClass(errors.fullName)}
                    placeholder="John Doe"
                  />
                </FormField>
                <FormField label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={shipping.email}
                    onChange={(e) => updateShipping('email', e.target.value)}
                    autoComplete="email"
                    className={inputClass(errors.email)}
                    placeholder="john@example.com"
                  />
                </FormField>
                <FormField label="Phone" error={errors.phone}>
                  <input
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) => updateShipping('phone', e.target.value)}
                    autoComplete="tel"
                    className={inputClass(errors.phone)}
                    placeholder="+1 234 567 8900"
                  />
                </FormField>
                <FormField label="Country" error={errors.country}>
                  <select
                    value={shipping.country}
                    onChange={(e) => updateShipping('country', e.target.value)}
                    autoComplete="country"
                    className={inputClass(errors.country)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Address Line 1" error={errors.addressLine1} full>
                  <input
                    type="text"
                    value={shipping.addressLine1}
                    onChange={(e) => updateShipping('addressLine1', e.target.value)}
                    autoComplete="address-line1"
                    className={inputClass(errors.addressLine1)}
                    placeholder="123 Main Street"
                  />
                </FormField>
                <FormField label="Address Line 2 (Optional)" full>
                  <input
                    type="text"
                    value={shipping.addressLine2}
                    onChange={(e) => updateShipping('addressLine2', e.target.value)}
                    autoComplete="address-line2"
                    className={inputClass()}
                    placeholder="Apartment, suite, etc."
                  />
                </FormField>
                <FormField label="City" error={errors.city}>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(e) => updateShipping('city', e.target.value)}
                    autoComplete="address-level2"
                    className={inputClass(errors.city)}
                    placeholder="New York"
                  />
                </FormField>
                <FormField label="State / Region" error={errors.stateOrRegion}>
                  <input
                    type="text"
                    value={shipping.stateOrRegion}
                    onChange={(e) => updateShipping('stateOrRegion', e.target.value)}
                    autoComplete="address-level1"
                    className={inputClass(errors.stateOrRegion)}
                    placeholder="NY"
                  />
                </FormField>
                <FormField label="Postal Code" error={errors.postalCode}>
                  <input
                    type="text"
                    value={shipping.postalCode}
                    onChange={(e) => updateShipping('postalCode', e.target.value)}
                    autoComplete="postal-code"
                    className={inputClass(errors.postalCode)}
                    placeholder="10001"
                  />
                </FormField>
              </div>

              {/* Delivery method */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-text mb-3">Delivery Method</h3>
                <div className="space-y-2">
                  {DELIVERY_METHODS.map((method) => {
                    const isSelected = deliveryId === method.id;
                    const isFree = method.freeThreshold && breakdown.subtotal >= method.freeThreshold;
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
                          <p className="text-xs text-muted">{method.description}</p>
                        </div>
                        <span className={cn('text-sm font-semibold', isFree ? 'text-success' : 'text-text')}>
                          {isFree ? 'FREE' : formatPrice(method.fee)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full h-12 gold-button rounded-lg text-sm font-semibold">
                Continue to Review
              </button>
            </form>
          )}

          {/* Step 2: Order Summary Review */}
          {step === 2 && (
            <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-text">Review Your Order</h2>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-gold hover:text-gold-light transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>

              {/* Shipping details */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Shipping Address</h3>
                <div className="text-sm text-muted space-y-0.5 p-3 rounded-lg bg-surface-elevated">
                  <p className="text-text font-medium">{shipping.fullName}</p>
                  <p>{shipping.addressLine1}{shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}</p>
                  <p>{shipping.city}, {shipping.stateOrRegion} {shipping.postalCode}</p>
                  <p>{shipping.country}</p>
                  <p>{shipping.email} | {shipping.phone}</p>
                </div>
              </div>

              {/* Delivery method */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Delivery Method</h3>
                <div className="text-sm text-muted p-3 rounded-lg bg-surface-elevated">
                  <span className="text-text font-medium">{deliveryMethod.name}</span> - {deliveryMethod.description}
                </div>
              </div>

              {/* Line items */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Items ({breakdown.itemCount})</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <SafeImage
                        src={item.image}
                        alt={item.title}
                        width={56}
                        height={56}
                        className="rounded-lg border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted">Qty: {item.quantity} x {formatPrice(item.unitPrice)}</p>
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
                <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-text">{formatPrice(breakdown.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Tax (8%)</span><span className="text-text">{formatPrice(breakdown.tax)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Shipping</span><span className={cn(breakdown.shipping === 0 ? 'text-success' : 'text-text')}>{breakdown.shipping === 0 ? 'FREE' : formatPrice(breakdown.shipping)}</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-text font-semibold">Total</span><span className="text-lg font-bold text-gold">{formatPrice(breakdown.total)}</span></div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full h-12 gold-button rounded-lg text-sm font-semibold"
              >
                Continue to Payment
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
              >
                Back to Shipping
              </button>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <form onSubmit={handlePaymentSubmit} className="bg-surface rounded-xl border border-border p-5 sm:p-6 space-y-4 relative">
              {/* Processing overlay */}
              {processing && (
                <div className="absolute inset-0 z-10 bg-surface/90 rounded-xl flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 text-gold animate-spin mb-4" />
                  <p className="text-sm text-text font-medium">Processing payment...</p>
                  <p className="text-xs text-muted mt-1">Please do not close this page.</p>
                </div>
              )}

              {/* Demo banner */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-tiger-orange/10 border border-tiger-orange/30">
                <span className="text-xs text-tiger-orange font-medium">
                  Demo mode: no real charges are made. Use 4242 4242 4242 4242 for success.
                </span>
              </div>

              <h2 className="font-heading text-lg font-bold text-text">Payment Details</h2>

              {/* Secured badge */}
              <div className="flex items-center gap-2 text-sm text-muted">
                <Lock className="h-4 w-4 text-gold" />
                Secured by <span className="font-medium text-gold">Golden Shield</span>
              </div>

              <FormField label="Name on Card" error={paymentError && !payment.nameOnCard ? paymentError : ''}>
                <input
                  type="text"
                  value={payment.nameOnCard}
                  onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })}
                  autoComplete="cc-name"
                  className={inputClass()}
                  placeholder="John Doe"
                />
              </FormField>

              <FormField label="Card Number" error="">
                <input
                  type="text"
                  inputMode="numeric"
                  value={payment.cardNumber}
                  onChange={(e) => setPayment({ ...payment, cardNumber: formatCardNumber(e.target.value) })}
                  autoComplete="cc-number"
                  className={inputClass()}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Expiry (MM/YY)" error="">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payment.expiry}
                    onChange={(e) => setPayment({ ...payment, expiry: formatExpiry(e.target.value) })}
                    autoComplete="cc-exp"
                    className={inputClass()}
                    placeholder="12/27"
                    maxLength={5}
                  />
                </FormField>
                <FormField label="CVC" error="">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payment.cvc}
                    onChange={(e) => setPayment({ ...payment, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    autoComplete="cc-csc"
                    className={inputClass()}
                    placeholder="123"
                    maxLength={4}
                  />
                </FormField>
              </div>

              {paymentError && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30">
                  <p className="text-sm text-danger">{paymentError}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Your payment information is encrypted and never stored.
              </div>

              <button type="submit" disabled={processing} className="w-full h-12 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay {formatPrice(breakdown.total)}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={processing}
                className="w-full h-10 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
              >
                Back to Review
              </button>
            </form>
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
              Order Summary ({formatPrice(breakdown.total)})
            </span>
            <ChevronLeft className={cn('h-4 w-4 text-muted transition-transform', summaryOpen && '-rotate-90')} />
          </button>

          <div className={cn(
            'bg-surface rounded-xl border border-border p-5 lg:sticky lg:top-24',
            !summaryOpen && 'hidden lg:block'
          )}>
            <h2 className="font-heading text-lg font-bold text-text mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="relative shrink-0">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="rounded-lg border border-border"
                    />
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gold text-background text-[0.625rem] font-bold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-text line-clamp-2 flex-1">{item.title}</p>
                  <span className="text-xs font-semibold text-text">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-text">{formatPrice(breakdown.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tax</span><span className="text-text">{formatPrice(breakdown.tax)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className={cn(breakdown.shipping === 0 && 'text-success')}>{breakdown.shipping === 0 ? 'FREE' : formatPrice(breakdown.shipping)}</span></div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text font-semibold">Total</span>
                <span className="text-xl font-bold text-gold">{formatPrice(breakdown.total)}</span>
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
