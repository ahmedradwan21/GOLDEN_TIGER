import { serverError } from '@/lib/api/errors';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET() {
  const { data, error } = await supabase
    .from('job_postings')
    .select('id, title, department, location, type, description, requirements, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return serverError(error, 500);
  }

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, department, location, type, description, requirements, isActive } = body;

    if (!title || !department || !location || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        title: String(title).slice(0, 300),
        department: String(department).slice(0, 200),
        location: String(location).slice(0, 200),
        type: String(type ?? 'Full-time').slice(0, 100),
        description: String(description),
        requirements: requirements ? String(requirements) : null,
        is_active: Boolean(isActive ?? true),
      })
      .select('id, title, department, location, type, description, requirements, is_active, created_at, updated_at')
      .single();

    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({ job: data });
  } catch {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { jobId, title, department, location, type, description, requirements, isActive } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (title !== undefined) update.title = String(title).slice(0, 300);
    if (department !== undefined) update.department = String(department).slice(0, 200);
    if (location !== undefined) update.location = String(location).slice(0, 200);
    if (type !== undefined) update.type = String(type).slice(0, 100);
    if (description !== undefined) update.description = String(description);
    if (requirements !== undefined) update.requirements = requirements ? String(requirements) : null;
    if (isActive !== undefined) update.is_active = Boolean(isActive);

    const { data, error } = await supabase
      .from('job_postings')
      .update(update)
      .eq('id', jobId)
      .select('id, title, department, location, type, description, requirements, is_active, created_at, updated_at')
      .single();

    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({ job: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden: SUPER_ADMIN only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', jobId);

    if (error) {
      return serverError(error, 500);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
