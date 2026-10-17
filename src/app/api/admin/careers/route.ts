import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  let query = supabase
    .from('job_applications')
    .select('id, job_id, full_name, email, phone, cover_letter, resume_url, created_at')
    .order('created_at', { ascending: false });

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] });
}
