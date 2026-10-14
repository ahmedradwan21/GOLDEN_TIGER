import type { PaymentInput, PaymentResult } from '@/types';

export async function processPayment(input: PaymentInput): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const digits = input.cardNumber.replace(/\D/g, '');

  if (digits === '4242424242424242') {
    return {
      success: true,
      message: 'Payment processed successfully.',
    };
  }

  if (digits === '4000000000000002') {
    return {
      success: false,
      message: 'Your card was declined. Please try a different card.',
      declineCode: 'card_declined',
    };
  }

  return {
    success: false,
    message: 'This card cannot be processed in demo mode. Use 4242 4242 4242 4242 for a successful payment.',
    declineCode: 'invalid_card',
  };
}

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.floor(100000 + Math.random() * 900000);
  return `GT-${ymd}-${random}`;
}
