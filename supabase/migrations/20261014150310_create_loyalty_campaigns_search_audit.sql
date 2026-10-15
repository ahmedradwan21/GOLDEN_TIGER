/*
# Create coupons, campaigns, and search_audit_logs tables
Also seeds three default campaigns.

## New Tables
1. coupons — loyalty rewards and discount codes
2. campaigns — seasonal campaign toggles (black_friday, mid_month_flash, monthly_start)
3. search_audit_logs — tracks zero-result searches for fuzzy gap analysis
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  value integer NOT NULL DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_reward boolean NOT NULL DEFAULT false,
  customer_email text,
  customer_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_customer_email ON coupons(customer_email);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_coupons" ON coupons;
CREATE POLICY "anon_select_coupons" ON coupons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_coupons" ON coupons;
CREATE POLICY "anon_insert_coupons" ON coupons FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_coupons" ON coupons;
CREATE POLICY "anon_update_coupons" ON coupons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_coupons" ON coupons;
CREATE POLICY "anon_delete_coupons" ON coupons FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  description text,
  discount_percentage integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_campaigns" ON campaigns;
CREATE POLICY "anon_select_campaigns" ON campaigns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_campaigns" ON campaigns;
CREATE POLICY "anon_insert_campaigns" ON campaigns FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_campaigns" ON campaigns;
CREATE POLICY "anon_update_campaigns" ON campaigns FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_campaigns" ON campaigns;
CREATE POLICY "anon_delete_campaigns" ON campaigns FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS search_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_audit_created_at ON search_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_audit_result_count ON search_audit_logs(result_count);

ALTER TABLE search_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_search_audit" ON search_audit_logs;
CREATE POLICY "anon_select_search_audit" ON search_audit_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_search_audit" ON search_audit_logs;
CREATE POLICY "anon_insert_search_audit" ON search_audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_search_audit" ON search_audit_logs;
CREATE POLICY "anon_update_search_audit" ON search_audit_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_search_audit" ON search_audit_logs;
CREATE POLICY "anon_delete_search_audit" ON search_audit_logs FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO campaigns (type, is_active, title, description, discount_percentage)
VALUES
  ('black_friday', false, 'Black Friday Sale', 'Biggest sale of the year with massive discounts across all categories.', 30),
  ('mid_month_flash', false, 'Mid-Month Flash Sale', '48-hour flash sale with limited-time deals.', 15),
  ('monthly_start', false, 'Monthly Start Sale', 'New month, new deals — fresh discounts on popular items.', 10)
ON CONFLICT (type) DO NOTHING;