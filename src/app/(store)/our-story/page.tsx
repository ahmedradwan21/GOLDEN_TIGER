import type { Metadata } from 'next';
import { supabase } from '@/lib/db';
import { OurStoryClient } from '@/components/pages/OurStoryClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Our Story - The Golden Tiger',
  description: 'The journey of The Golden Tiger — from a small boutique to a global premium marketplace.',
};

export default async function OurStoryPage() {
  const { data } = await supabase
    .from('site_content')
    .select('title_en, title_ar, body_en, body_ar')
    .eq('page_key', 'our_story')
    .maybeSingle();

  return <OurStoryClient content={data ?? null} />;
}
