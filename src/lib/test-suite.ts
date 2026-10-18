import "server-only";
import { supabase, isDatabaseConfigured, handleDatabaseError } from "@/lib/db";

export interface TableAuditResult {
	table: string;
	connected: boolean;
	rowCount: number | null;
	error: string | null;
}

export interface AuditReport {
	timestamp: string;
	overallPass: boolean;
	results: TableAuditResult[];
}

const CORE_TABLES = [
	"products",
	"categories",
	"admins",
	"product_reviews",
	"site_content",
	"job_postings",
	"coupons",
	"orders",
	"order_items",
	"click_logs",
] as const;

/**
 * Runtime connectivity audit for the 10 core database tables.
 *
 * In development: logs detailed per-table results to the terminal.
 * In production: returns the report silently for programmatic use
 * (e.g. the /api/health endpoint) without leaking connection details.
 */
export async function runTableAudit(): Promise<AuditReport> {
	const isDev = process.env.NODE_ENV === "development";
	const results: TableAuditResult[] = [];

	if (!isDatabaseConfigured()) {
		for (const table of CORE_TABLES) {
			results.push({
				table,
				connected: false,
				rowCount: null,
				error: "Environment variables not configured",
			});
		}
		if (isDev) {
			console.error(
				"\x1b[31m[test-suite] Supabase env vars missing — all tables failed.\x1b[0m",
			);
		}
		return {
			timestamp: new Date().toISOString(),
			overallPass: false,
			results,
		};
	}

	for (const table of CORE_TABLES) {
		try {
			const { count, error } = await supabase
				.from(table)
				.select("id", { count: "exact", head: true });

			if (error) {
				results.push({
					table,
					connected: false,
					rowCount: null,
					error: error.message,
				});
				if (isDev) {
					console.error(
						`\x1b[31m  ❌ ${table}: ${error.message}\x1b[0m`,
					);
				}
			} else {
				results.push({
					table,
					connected: true,
					rowCount: count ?? 0,
					error: null,
				});
				if (isDev) {
					console.log(
						`\x1b[32m  ✅ ${table}: ${count ?? 0} rows\x1b[0m`,
					);
				}
			}
		} catch (err) {
			handleDatabaseError(err, `test-suite:${table}`);
			const msg = err instanceof Error ? err.message : String(err);
			results.push({
				table,
				connected: false,
				rowCount: null,
				error: msg,
			});
		}
	}

	const overallPass = results.every((r) => r.connected);

	if (isDev) {
		const banner = "═══════════════════════════════════════════════════════════";
		console.log(`\n${banner}`);
		console.log(
			` 🐯 TIGER TEST SUITE — ${overallPass ? "ALL TABLES CONNECTED" : "SOME TABLES FAILED"} 🐯`,
		);
		console.log(
			`    ${results.filter((r) => r.connected).length}/${results.length} tables reachable`,
		);
		console.log(`${banner}\n`);
	}

	return {
		timestamp: new Date().toISOString(),
		overallPass,
		results,
	};
}
