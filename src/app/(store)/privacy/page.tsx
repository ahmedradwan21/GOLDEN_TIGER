import type { Metadata } from 'next';
import { supabase } from '@/lib/db';
import { LegalPageClient } from '@/components/pages/LegalPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Privacy Policy - The Golden Tiger',
  description: 'How we protect and use your information at The Golden Tiger.',
};

export default async function PrivacyPage() {
  const { data } = await supabase
    .from('site_content')
    .select('title_en, title_ar, body_en, body_ar')
    .eq('page_key', 'privacy')
    .maybeSingle();

  return <LegalPageClient pageKey="privacy" content={data ?? null} />;
}
