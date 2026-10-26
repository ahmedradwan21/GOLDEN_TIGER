// Browser-safe announcement bar rules. The external table is a single row:
// announcement_bar_settings(message_en, message_ar, is_active).

export interface AnnouncementSettings {
  message_en: string;
  message_ar: string;
  is_active: boolean;
}

export const EMPTY_ANNOUNCEMENT: AnnouncementSettings = {
  message_en: '',
  message_ar: '',
  is_active: false,
};

/** Map a raw table row (any shape) to the three supported fields. */
export function toAnnouncementSettings(row: Record<string, unknown> | null | undefined): AnnouncementSettings {
  if (!row) return { ...EMPTY_ANNOUNCEMENT };
  return {
    message_en: typeof row.message_en === 'string' ? row.message_en : '',
    message_ar: typeof row.message_ar === 'string' ? row.message_ar : '',
    is_active: row.is_active === true,
  };
}

/**
 * The message to show for a locale, or null when the bar should be hidden.
 * Arabic shows message_ar; if it is empty, English is used as the fallback.
 */
export function pickAnnouncementMessage(
  settings: AnnouncementSettings | null | undefined,
  locale: string
): string | null {
  if (!settings || !settings.is_active) return null;
  const en = settings.message_en.trim();
  const ar = settings.message_ar.trim();
  const message = locale === 'ar' ? ar || en : en || ar;
  return message || null;
}

/**
 * Key remembered after a shopper closes the bar. It changes whenever either
 * message changes, so a new announcement shows again.
 */
export function announcementDismissKey(settings: AnnouncementSettings): string {
  const source = `${settings.message_en}\u0000${settings.message_ar}`;
  let hash = 5381;
  for (let i = 0; i < source.length; i++) hash = ((hash << 5) + hash + source.charCodeAt(i)) | 0;
  return `gt-announcement-dismissed:${(hash >>> 0).toString(36)}`;
}

export function validateAnnouncementInput(body: unknown): AnnouncementSettings | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message_en !== 'string' || typeof b.message_ar !== 'string' || typeof b.is_active !== 'boolean') {
    return null;
  }
  const message_en = b.message_en.trim();
  const message_ar = b.message_ar.trim();
  if (message_en.length > 300 || message_ar.length > 300) return null;
  return { message_en, message_ar, is_active: b.is_active };
}
