// Server-only Telegram order notification. Reads TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
// from process.env at call time; never import this from client components.

export interface TelegramOrder {
  order_number: string | null;
  email?: string | null;
  shipping_address: unknown;
  delivery_method: string | null;
  shipping_cents: number;
  total_cents: number;
  payment_method?: string | null;
}

export interface TelegramOrderItem {
  title_snapshot: string;
  quantity: number;
  unit_price_cents: number;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatOrderMessage(order: TelegramOrder, items: TelegramOrderItem[]): string {
  const a = (order.shipping_address && typeof order.shipping_address === 'object'
    ? order.shipping_address
    : {}) as Record<string, string | undefined>;
  const v = (x: unknown) => (x && String(x).trim() ? escapeHtml(x) : '—');
  const address = [a.addressLine1, a.addressLine2, a.city, a.stateOrRegion, a.postalCode, a.country]
    .filter((p) => p && String(p).trim())
    .map(escapeHtml)
    .join(', ');
  const lines = items.map(
    (i) => `• ${escapeHtml(i.title_snapshot)} × ${i.quantity} — ${money(i.unit_price_cents * i.quantity)}`
  );

  return [
    `🛒 <b>New order ${v(order.order_number)}</b>`,
    '',
    `👤 Name: ${v(a.fullName)}`,
    `📞 Phone: ${v(a.phone)}`,
    `📞 Secondary phone: ${v(a.secondaryPhone)}`,
    `📍 Address: ${address || '—'}`,
    `🏷 Landmark: ${v(a.landmark)}`,
    `📝 Delivery notes: ${v(a.deliveryNotes)}`,
    `⏰ Preferred delivery time: ${v(a.preferredDeliveryTime)}`,
    '',
    '<b>Products</b>',
    ...lines,
    '',
    `🚚 Shipping method: ${v(order.delivery_method)}`,
    `🚚 Shipping cost: ${money(order.shipping_cents)}`,
    `💰 <b>Total: ${money(order.total_cents)}</b>`,
  ].join('\n');
}

/** Sends the notification. Never throws; returns false on any failure. */
export async function sendOrderTelegram(
  order: TelegramOrder,
  items: TelegramOrderItem[],
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured');
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatOrderMessage(order, items),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) {
      // Log status + body only; never the URL (it contains the token).
      console.error(`[telegram] sendMessage failed [${res.status}]: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[telegram] sendMessage error:', err instanceof Error ? err.name : 'unknown');
    return false;
  }
}
