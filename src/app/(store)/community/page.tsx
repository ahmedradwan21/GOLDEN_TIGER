import type { Metadata } from 'next';
import { supabase } from '@/lib/db';
import type { Database } from '@/types/database';
import { CommunityHubClient } from '@/components/pages/CommunityHubClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Community & Offers - The Golden Tiger',
  description:
    'Join The Golden Tiger community across WhatsApp, Telegram, Facebook, Instagram, and Messenger for exclusive offers and updates.',
};

type CommunityLink = Database['public']['Tables']['social_community_links']['Row'];

export default async function CommunityPage() {
  const { data, error } = await supabase
    .from('social_community_links')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[community] failed to load links:', error.message);
  }

  const links: CommunityLink[] = data ?? [];

  return <CommunityHubClient links={links} />;
}
