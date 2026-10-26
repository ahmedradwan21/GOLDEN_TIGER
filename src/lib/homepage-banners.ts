// Browser-safe homepage banner rules shared by the storefront slider, the
// admin product form and /admin/banners. Higher ad_priority shows first.

export interface BannerScheduleFields {
  is_homepage_banner?: boolean | null;
  ad_priority?: number | null;
  ad_starts_at?: string | null;
  ad_ends_at?: string | null;
}

export type BannerStatus = 'off' | 'scheduled' | 'live' | 'expired';

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Live = is_homepage_banner AND (start is null or <= now) AND (end is null or >= now). */
export function isBannerLive(row: BannerScheduleFields, now: Date = new Date()): boolean {
  return getBannerStatus(row, now) === 'live';
}

export function getBannerStatus(row: BannerScheduleFields, now: Date = new Date()): BannerStatus {
  if (!row.is_homepage_banner) return 'off';
  const nowMs = now.getTime();
  const start = toTime(row.ad_starts_at);
  const end = toTime(row.ad_ends_at);
  if (start !== null && start > nowMs) return 'scheduled';
  if (end !== null && end < nowMs) return 'expired';
  return 'live';
}

/** Sort by ad_priority, highest first. Stable for equal priorities. */
export function sortByPriority<T extends BannerScheduleFields>(rows: T[]): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => (b.row.ad_priority ?? 0) - (a.row.ad_priority ?? 0) || a.index - b.index)
    .map(({ row }) => row);
}

/** Only live banners, highest priority first. */
export function selectLiveBanners<T extends BannerScheduleFields>(rows: T[], now: Date = new Date()): T[] {
  return sortByPriority(rows.filter((row) => isBannerLive(row, now)));
}

/**
 * Turn a top-to-bottom display order into priorities: the first item gets the
 * highest number so it shows first on the homepage.
 */
export function prioritiesFromOrder(ids: string[]): { id: string; ad_priority: number }[] {
  return ids.map((id, index) => ({ id, ad_priority: ids.length - index }));
}

export const MAX_AD_PRIORITY = 1000;

export function clampPriority(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_AD_PRIORITY, n));
}

/** ISO string -> value for <input type="datetime-local"> in the admin's own timezone. */
export function toLocalInputValue(iso: string | null | undefined): string {
  const t = toTime(iso);
  if (t === null) return '';
  const d = new Date(t);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (admin's timezone) -> ISO string, or null when empty. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export type BannerFieldError = 'invalidStart' | 'invalidEnd' | 'endBeforeStart';

/**
 * Normalize banner fields from an admin request body. Only keys present in the
 * body are returned, so partial PATCH updates keep untouched columns.
 */
export function normalizeBannerFields(
  body: Record<string, unknown>
): { fields: Record<string, unknown>; error: BannerFieldError | null } {
  const fields: Record<string, unknown> = {};
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

  if ('is_homepage_banner' in body) fields.is_homepage_banner = body.is_homepage_banner === true;
  if ('is_sponsored' in body) fields.is_sponsored = body.is_sponsored === true;
  if ('ad_priority' in body) fields.ad_priority = clampPriority(body.ad_priority);
  if ('banner_image_url' in body) fields.banner_image_url = text(body.banner_image_url);
  if ('banner_headline' in body) fields.banner_headline = text(body.banner_headline);
  if ('banner_subtext' in body) fields.banner_subtext = text(body.banner_subtext);

  for (const key of ['ad_starts_at', 'ad_ends_at'] as const) {
    if (!(key in body)) continue;
    const raw = body[key];
    if (raw === null || raw === '' || raw === undefined) {
      fields[key] = null;
      continue;
    }
    const t = typeof raw === 'string' ? toTime(raw) : null;
    if (t === null) return { fields, error: key === 'ad_starts_at' ? 'invalidStart' : 'invalidEnd' };
    fields[key] = new Date(t).toISOString();
  }

  const start = toTime(fields.ad_starts_at as string | null | undefined);
  const end = toTime(fields.ad_ends_at as string | null | undefined);
  if (start !== null && end !== null && end < start) return { fields, error: 'endBeforeStart' };

  return { fields, error: null };
}
