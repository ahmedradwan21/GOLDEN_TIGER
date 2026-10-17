import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, fullName, email, phone, coverLetter, resumeUrl } = body;

    if (!jobId || !fullName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: String(jobId),
        full_name: String(fullName).trim().slice(0, 200),
        email: String(email).trim().slice(0, 300),
        phone: phone ? String(phone).trim().slice(0, 50) : null,
        cover_letter: coverLetter ? String(coverLetter).slice(0, 5000) : null,
        resume_url: resumeUrl ? String(resumeUrl).slice(0, 2000) : null,
      })
      .select('id, job_id, full_name, email, phone, cover_letter, resume_url, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data });
  } catch {
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
