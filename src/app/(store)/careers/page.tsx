import type { Metadata } from 'next';
import { supabase } from '@/lib/db';
import { CareersClient } from '@/components/pages/CareersClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Careers - The Golden Tiger',
  description: 'Join The Golden Tiger team. Explore open positions and apply today.',
};

export default async function CareersPage() {
  const { data } = await supabase
    .from('job_postings')
    .select('id, title, department, location, type, description, requirements, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return <CareersClient jobs={data ?? []} />;
}
