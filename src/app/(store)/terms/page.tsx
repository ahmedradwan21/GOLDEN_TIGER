import type { Metadata } from 'next';
import { supabase } from '@/lib/db';
import { LegalPageClient } from '@/components/pages/LegalPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Terms of Service - The Golden Tiger',
  description: 'The rules that govern your use of The Golden Tiger services.',
};

export default async function TermsPage() {
  const { data } = await supabase
    .from('site_content')
    .select('title_en, title_ar, body_en, body_ar')
    .eq('page_key', 'terms')
    .maybeSingle();

  return <LegalPageClient pageKey="terms" content={data ?? null} />;
}
