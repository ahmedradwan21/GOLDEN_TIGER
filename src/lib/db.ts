import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isDatabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

function createSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient<Database> | undefined;
};

export const supabase: SupabaseClient<Database> =
  globalForSupabase.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}
