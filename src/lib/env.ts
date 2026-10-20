import 'server-only';
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  });

  if (!parsed.success) {
    console.error('[env] Missing required environment variables:', parsed.error.issues);
    throw new Error('Server environment is not configured. Check server logs for details.');
  }

  cached = parsed.data;
  return cached;
}

export function isDatabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getDatabaseNotConfiguredMessage(): string {
  return 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.';
}

export function ensureDatabaseConfigured(): void {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }
}
