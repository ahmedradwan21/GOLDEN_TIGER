/*
# Create social_community_links table

## Purpose
Stores the community/social channels (WhatsApp, Telegram, Facebook, Instagram, Messenger)
that appear on the public /community hub page and are managed from the admin dashboard.

## 1. New Tables
- `social_community_links`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `platform` (text, unique, not null) — stable key: whatsapp | telegram | facebook | instagram | messenger
  - `name_en` (text, not null) — English display name
  - `name_ar` (text, not null) — Arabic display name
  - `description_en` (text, default '') — English utility description
  - `description_ar` (text, default '') — Arabic utility description
  - `url` (text, not null) — the channel link opened in a new tab
  - `is_visible` (boolean, default true) — whether the channel is shown publicly
  - `sort_order` (int, default 0) — display ordering (ascending)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## 2. Security (RLS)
- Enable RLS on `social_community_links`.
- Public (anon + authenticated) can SELECT only visible rows (`is_visible = true`).
- Authenticated admins can SELECT all rows, INSERT, UPDATE, and DELETE.
  Admin writes are performed through the admin dashboard (authenticated session).

## 3. Seed Data
- Five rows seeded for whatsapp, telegram, facebook, instagram, messenger with
  placeholder URLs and bilingual names/descriptions. Idempotent via ON CONFLICT.
*/

CREATE TABLE IF NOT EXISTS social_community_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  url text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_community_links_sort_order_idx
  ON social_community_links (sort_order);

ALTER TABLE social_community_links ENABLE ROW LEVEL SECURITY;

-- Public read of visible rows only
DROP POLICY IF EXISTS "public_select_visible_community_links" ON social_community_links;
CREATE POLICY "public_select_visible_community_links"
  ON social_community_links FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

-- Authenticated admins can read all rows (needed for the admin UI list)
DROP POLICY IF EXISTS "admin_select_all_community_links" ON social_community_links;
CREATE POLICY "admin_select_all_community_links"
  ON social_community_links FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_community_links" ON social_community_links;
CREATE POLICY "admin_insert_community_links"
  ON social_community_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_community_links" ON social_community_links;
CREATE POLICY "admin_update_community_links"
  ON social_community_links FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_community_links" ON social_community_links;
CREATE POLICY "admin_delete_community_links"
  ON social_community_links FOR DELETE
  TO authenticated
  USING (true);

-- Seed rows (idempotent)
INSERT INTO social_community_links (platform, name_en, name_ar, description_en, description_ar, url, is_visible, sort_order)
VALUES
  ('whatsapp',  'WhatsApp Community',  'مجتمع واتساب',  'Join our WhatsApp group for exclusive offers and instant updates.', 'انضم لمجموعة واتساب للحصول على عروض حصرية وتحديثات فورية.', 'https://chat.whatsapp.com/placeholder', true, 1),
  ('telegram',  'Telegram Channel',    'قناة تيليجرام',  'Follow our Telegram channel for flash deals and announcements.',    'تابع قناة تيليجرام لعروض الفلاش والإعلانات.',              'https://t.me/placeholder',              true, 2),
  ('facebook',  'Facebook Page',       'صفحة فيسبوك',    'Like our Facebook page for posts, reviews, and community events.',   'تفاعل مع صفحتنا على فيسبوك للمنشورات والتقييمات والفعاليات.', 'https://facebook.com/placeholder',       true, 3),
  ('instagram', 'Instagram',           'إنستجرام',       'See our latest products and lifestyle shots on Instagram.',         'شاهد أحدث منتجاتنا ولقطات الأسلوب على إنستجرام.',           'https://instagram.com/placeholder',      true, 4),
  ('messenger', 'Messenger',           'ماسنجر',         'Chat with us directly on Facebook Messenger for quick support.',    'تواصل معنا مباشرة عبر ماسنجر فيسبوك للدعم السريع.',           'https://m.me/placeholder',               true, 5)
ON CONFLICT (platform) DO NOTHING;
