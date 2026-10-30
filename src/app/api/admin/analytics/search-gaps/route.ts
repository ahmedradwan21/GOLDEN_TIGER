import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { supabaseAdmin } from '@/lib/db-admin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  try {
    const { data, error } = await supabaseAdmin
      .from('search_audit_logs')
      .select('query, result_count, created_at')
      .eq('result_count', 0)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) {
      return NextResponse.json({ queries: [] });
    }

    const queryCounts: Record<string, { query: string; count: number; lastSearched: string }> = {};
    for (const row of data as { query: string; result_count: number; created_at: string }[]) {
      const key = row.query.toLowerCase().trim();
      if (!queryCounts[key]) {
        queryCounts[key] = { query: row.query, count: 0, lastSearched: row.created_at };
      }
      queryCounts[key].count += 1;
      if (row.created_at > queryCounts[key].lastSearched) {
        queryCounts[key].lastSearched = row.created_at;
      }
    }

    const queries = Object.values(queryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return NextResponse.json({ queries });
  } catch {
    return NextResponse.json({ queries: [] }, { status: 500 });
  }
}
