import { randomInt } from 'node:crypto';

// Card payment was removed: the site never collects card details.
// Only the order-number generator remains.

// Uppercase alphanumerics without the ambiguous 0/O/1/I.
export const ORDER_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ORDER_NUMBER_RANDOM_LENGTH = 10;

/** GT-YYYYMMDD-XXXXXXXXXX, random part from a CSPRNG (node:crypto). */
export function generateOrderNumber(now: Date = new Date()): string {
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  let random = '';
  for (let i = 0; i < ORDER_NUMBER_RANDOM_LENGTH; i++) {
    random += ORDER_NUMBER_ALPHABET[randomInt(ORDER_NUMBER_ALPHABET.length)];
  }
  return `GT-${ymd}-${random}`;
}
