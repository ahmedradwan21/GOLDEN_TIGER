import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-admin';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const session = auth.admin;

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  let query = supabaseAdmin
    .from('job_applications')
    .select('id, job_id, full_name, email, phone, cover_letter, resume_url, created_at')
    .order('created_at', { ascending: false });

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;

  if (error) {
    return serverError(error, 500);
  }

  return NextResponse.json({ applications: data ?? [] });
}
