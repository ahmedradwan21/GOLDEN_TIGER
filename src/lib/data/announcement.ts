import 'server-only';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { toAnnouncementSettings, type AnnouncementSettings } from '@/lib/announcement';

/**
 * Read the single announcement_bar_settings row on the server.
 * Uses the service-role client when configured (RLS cannot hide the row),
 * and falls back to the public client so the storefront keeps working.
 */
export async function getAnnouncementSettings(): Promise<AnnouncementSettings | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const { supabaseAdmin } = await import('@/lib/db-admin');
    const { data, error } = await supabaseAdmin
      .from('announcement_bar_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (!error) return toAnnouncementSettings(data as Record<string, unknown> | null);
    console.error('[announcement] service read failed:', error.message);
  } catch (err) {
    console.error('[announcement] service client unavailable:', err instanceof Error ? err.message : err);
  }

  const { data, error } = await supabase
    .from('announcement_bar_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[announcement] public read failed:', error.message);
    return null;
  }
  return toAnnouncementSettings(data as Record<string, unknown> | null);
}
