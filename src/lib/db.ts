import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient<Database> | undefined;
};

function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Lazy-initialized Supabase client.
 *
 * Uses a Proxy so the real client is only created on first property access,
 * not at module load time. This prevents build-time crashes when Next.js
 * evaluates route modules for page-data collection without env vars present.
 */
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop) {
      const client =
        globalForSupabase.supabase ?? (globalForSupabase.supabase = createSupabaseClient());
      return Reflect.get(client, prop);
    },
  }
);
