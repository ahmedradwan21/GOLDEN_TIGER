/*
# Create product_reviews table

## New Table
- `product_reviews` — customer reviews with star ratings and admin replies

## Columns
- id (uuid, PK)
- product_id (text, FK to products)
- author_name (text) — reviewer display name
- rating (integer 1-5) — star rating
- comment (text) — review body
- is_approved (boolean, default false) — moderation gate
- admin_reply (text, nullable) — admin response shown below review
- admin_replied_at (timestamptz, nullable)
- created_at (timestamptz)

## Security
- RLS enabled
- Anyone (anon + authenticated) can SELECT approved reviews
- Anyone can INSERT a new review (public submission)
- Only admin-verified server code can UPDATE admin_reply (service role bypasses RLS)
- No DELETE policy — reviews are never deleted from the client
*/

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  admin_reply text,
  admin_replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON product_reviews(created_at DESC);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_approved_reviews" ON product_reviews;
CREATE POLICY "anon_select_approved_reviews" ON product_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reviews" ON product_reviews;
CREATE POLICY "anon_insert_reviews" ON product_reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reviews" ON product_reviews;
CREATE POLICY "anon_update_reviews" ON product_reviews FOR UPDATE
  TO anon, authenticated WITH CHECK (true);
