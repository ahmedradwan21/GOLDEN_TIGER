import { describe, it, expect, afterEach } from 'bun:test';
import { formatOrderMessage, sendOrderTelegram } from './telegram-order';

const order = {
  order_number: 'GT-123',
  shipping_address: {
    fullName: 'Ahmed Ali', phone: '01012345678', secondaryPhone: '01198765432',
    addressLine1: '5 Tahrir St', city: 'Cairo', country: 'Egypt',
    landmark: 'Near the mosque', deliveryNotes: 'Ring twice', preferredDeliveryTime: 'After 5pm',
  },
  delivery_method: 'express',
  shipping_cents: 1499,
  total_cents: 6499,
};
const items = [{ title_snapshot: 'Tiger Mug', quantity: 2, unit_price_cents: 2500 }];

afterEach(() => { delete process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_CHAT_ID; });

describe('telegram order message', () => {
  it('includes every required order detail', () => {
    const m = formatOrderMessage(order, items);
    for (const s of ['GT-123', 'Ahmed Ali', '01012345678', '01198765432', '5 Tahrir St, Cairo, Egypt',
      'Near the mosque', 'Ring twice', 'After 5pm', 'Tiger Mug × 2', 'express', '$14.99', '$64.99']) {
      expect(m).toContain(s);
    }
  });

  it('returns false and does not call Telegram when secrets are missing', async () => {
    let called = false;
    const ok = await sendOrderTelegram(order, items, (async () => { called = true; return new Response(); }) as never);
    expect(ok).toBe(false);
    expect(called).toBe(false);
  });

  it('returns false instead of throwing when Telegram fails', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 't'; process.env.TELEGRAM_CHAT_ID = 'c';
    const ok = await sendOrderTelegram(order, items, (async () => { throw new Error('down'); }) as never);
    expect(ok).toBe(false);
  });

  it('sends to the configured chat', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 't'; process.env.TELEGRAM_CHAT_ID = '42';
    let body: { chat_id?: string } = {};
    const ok = await sendOrderTelegram(order, items, (async (_u: string, init: RequestInit) => {
      body = JSON.parse(String(init.body)); return new Response('{}', { status: 200 });
    }) as never);
    expect(ok).toBe(true);
    expect(body.chat_id).toBe('42');
  });
});
