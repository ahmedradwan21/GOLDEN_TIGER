import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const globalForSupabase = globalThis as unknown as {
	supabase: SupabaseClient<Database> | undefined;
	__diagnosticsLogged: boolean | undefined;
};

// القيم بتتقرأ من ملف .env.local
// لازم تتكتب بالشكل ده بالظبط (process.env.NEXT_PUBLIC_...) عشان Next.js يقرأها
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isDatabaseConfigured(): boolean {
	return supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 0;
}

function createSupabaseClient(): SupabaseClient<Database> {
	if (!isDatabaseConfigured()) {
		throw new Error(
			"Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server.",
		);
	}
	return createClient<Database>(supabaseUrl, supabaseAnonKey, {
		auth: { persistSession: false },
	});
}

export const supabase: SupabaseClient<Database> =
	globalForSupabase.supabase ??
	(globalForSupabase.supabase = createSupabaseClient());

export function handleDatabaseError(err: unknown, context: string): void {
	const message = err instanceof Error ? err.message : String(err);
	const stack = err instanceof Error ? err.stack : undefined;
	console.error(`\x1b[31m[DB ERROR] ${context}: ${message}\x1b[0m`);
	if (stack) {
		console.error(`\x1b[31m${stack}\x1b[0m`);
	}
}

export async function logDatabaseDiagnostics(): Promise<void> {
	if (globalForSupabase.__diagnosticsLogged) return;
	globalForSupabase.__diagnosticsLogged = true;

	const banner = "═══════════════════════════════════════════════════════════";
	console.log(`\n${banner}`);
	console.log(" 🐯 TIGER SYSTEM CONTROLLER — MODE: DEVELOPMENT 🐯");
	console.log(banner);

	try {
		const { count, error } = await supabase
			.from("products")
			.select("id", { count: "exact", head: true });

		if (error) {
			console.error(
				`\x1b[31m  ❌ [DEV ERROR] فشل الاتصال بالجداول السحابية: ${error.message}\x1b[0m`,
			);
		} else {
			console.log(
				`\x1b[32m  ✅ [DEV SUCCESS] الاتصال مستقر! تم العثور على ${count ?? 0} منتجاً حياً.\x1b[0m`,
			);
		}
	} catch (err) {
		console.error(
			`\x1b[31m  ❌ [CRITICAL SYSTEM CRASH]: ${err instanceof Error ? err.message : err}\x1b[0m`,
		);
	}
	console.log(`${banner}\n`);
}
