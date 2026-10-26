import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Service-role client (bypasses RLS). Server-only: importing this file from a
// client component fails the build thanks to 'server-only'.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!url.startsWith('https://')) {
  throw new Error('[db-admin] NEXT_PUBLIC_SUPABASE_URL is missing or invalid. Set it in .env.local and restart the server.');
}
if (!serviceRoleKey) {
  throw new Error(
    '[db-admin] SUPABASE_SERVICE_ROLE_KEY is missing. Server routes need the service role key; refusing to fall back to the anon key (RLS would reject the queries). Set it in .env.local / your hosting env and restart.'
  );
}

const globalForAdmin = globalThis as unknown as { supabaseAdmin: SupabaseClient<Database> | undefined };

export const supabaseAdmin: SupabaseClient<Database> =
  globalForAdmin.supabaseAdmin ??
  (globalForAdmin.supabaseAdmin = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
