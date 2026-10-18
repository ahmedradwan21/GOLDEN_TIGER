/*
# Create browsing_history table

1. New Tables
- `browsing_history`
  - `id` (uuid, primary key)
  - `session_id` (text, not null) — anonymous browser session identifier
  - `product_id` (text, references products(id) on delete cascade)
  - `product_slug` (text, not null) — denormalized for quick rendering
  - `product_title` (text, not null) — denormalized for quick rendering
  - `product_image` (text) — denormalized first image URL
  - `product_price` (integer, cents) — denormalized price for display
  - `viewed_at` (timestamptz, default now())

2. Purpose
Stores a lightweight log of products each visitor has clicked/viewed,
enabling the browsing history ribbon and related-products recommendations.

3. Security
- Enable RLS on `browsing_history`.
- The storefront is public (no sign-in), so policies allow
  anon + authenticated to read, insert, and delete rows.
- Updates are not needed — history entries are immutable.
*/

CREATE TABLE IF NOT EXISTS browsing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  product_title text NOT NULL,
  product_image text,
  product_price integer,
  viewed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_browsing_history_session
  ON browsing_history(session_id, viewed_at DESC);

ALTER TABLE browsing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_browsing_history" ON browsing_history;
CREATE POLICY "anon_select_browsing_history"
  ON browsing_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_browsing_history" ON browsing_history;
CREATE POLICY "anon_insert_browsing_history"
  ON browsing_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_browsing_history" ON browsing_history;
CREATE POLICY "anon_delete_browsing_history"
  ON browsing_history FOR DELETE
  TO anon, authenticated USING (true);
