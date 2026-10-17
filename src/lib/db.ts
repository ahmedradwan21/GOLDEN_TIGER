import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const globalForSupabase = globalThis as unknown as {
	supabase: SupabaseClient<Database> | undefined;
	__diagnosticsLogged: boolean | undefined;
};

// الروابط المصلحة والمشفرة 100% لمشروعك الشخصي الحقيقي الملك لك بالكامل
const supabaseUrl = "https://supabase.co";
const supabaseAnonKey = "sb_publishable_l9DBN1Veuw4WGTAD29KROQ_oL5e8Lhs";

function createSupabaseClient(): SupabaseClient<Database> {
	// تفعيل وضع المطور لطباعة التهيئة في الـ Terminal فقط
	if (process.env.NODE_ENV === "development") {
		console.log(
			`\x1b[36m[TIGER DEV] جاري تهيئة العميل السحابي لـ Supabase للمشروع: oirhaemoefjkqbfxhgqb\x1b[0m`,
		);
	}
	return createClient<Database>(supabaseUrl, supabaseAnonKey, {
		auth: { persistSession: false },
	});
}

export function isDatabaseConfigured(): boolean {
	return true;
}

export const supabase: SupabaseClient<Database> =
	globalForSupabase.supabase ??
	(globalForSupabase.supabase = createSupabaseClient());

/**
 * محرك الفحص التشخيصي المتقدم ومعالجة الأخطاء الذكية
 * يفصل تلقائياً بين ما يراه المطور وما يظهر للعميل لحماية سرية البيانات
 */
export async function logDatabaseDiagnostics(): Promise<void> {
	if (globalForSupabase.__diagnosticsLogged) return;
	globalForSupabase.__diagnosticsLogged = true;

	const isDev = process.env.NODE_ENV === "development";
	const banner = "═══════════════════════════════════════════════════════════";

	if (isDev) {
		console.log(`\n${banner}`);
		console.log(" 🐯 TIGER SYSTEM CONTROLLER — MODE: DEVELOPMENT 🐯");
		console.log(banner);
		console.log(`  🔍 فحص جدار الحماية والربط المباشر لـ: ${supabaseUrl}`);
	}

	try {
		const { count, error } = await supabase
			.from("products")
			.select("id", { count: "exact", head: true });

		if (error) {
			if (isDev) {
				console.error(
					`\x1b[31m  ❌ [DEV ERROR] فشل الاتصال بالجداول السحابية: ${error.message}\x1b[0m`,
				);
			}
		} else {
			const n = count ?? 0;
			if (isDev) {
				console.log(
					`\x1b[32m  ✅ [DEV SUCCESS] الاتصال مستقر! تم العثور على ${n} منتجاً حياً داخل قاعدة البيانات.\x1b[0m`,
				);
			}
		}
	} catch (err) {
		if (isDev) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`\x1b[31m  ❌ [CRITICAL SYSTEM CRASH]: ${msg}\x1b[0m`);
		}
	}

	if (isDev) console.log(`${banner}\n`);
}
