/*
# Create base tables: categories, products, orders, order_items, click_logs

Includes SEO columns and advertising columns (is_sponsored, is_homepage_banner,
ad_priority, banner_image_url, banner_headline, banner_subtext, ad_starts_at, ad_ends_at).
Also adds points_earned and coupon_code columns to orders.
*/

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_id text REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  brand text,
  sku text UNIQUE,
  short_description text,
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  specifications jsonb,
  price_cents integer NOT NULL,
  compare_at_cents integer,
  currency text NOT NULL DEFAULT 'USD',
  stock integer NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  video_urls text[] NOT NULL DEFAULT '{}',
  rating real NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  seo_keywords text,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  is_sponsored boolean NOT NULL DEFAULT false,
  is_homepage_banner boolean NOT NULL DEFAULT false,
  ad_priority integer NOT NULL DEFAULT 0,
  banner_image_url text,
  banner_headline text,
  banner_subtext text,
  ad_starts_at timestamptz,
  ad_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published_created ON products(is_published, created_at);
CREATE INDEX IF NOT EXISTS idx_products_price_cents ON products(price_cents);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_tags_gin ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_sponsored ON products(is_sponsored, ad_priority);
CREATE INDEX IF NOT EXISTS idx_products_homepage_banner ON products(is_homepage_banner, ad_priority);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE,
  session_id text NOT NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'CHECKOUT_STARTED',
  email text,
  shipping_address jsonb,
  delivery_method text,
  subtotal_cents integer NOT NULL,
  tax_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text,
  payment_ref text,
  checkout_started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  points_earned integer NOT NULL DEFAULT 0,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  title_snapshot text NOT NULL,
  image_snapshot text,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS click_logs (
  id serial PRIMARY KEY,
  event_type text NOT NULL,
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  path text NOT NULL DEFAULT '/',
  source text,
  referrer text,
  user_agent text,
  device_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_click_logs_product_event_created ON click_logs(product_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_click_logs_event_created ON click_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_click_logs_session_created ON click_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_click_logs_created_at ON click_logs(created_at);

ALTER TABLE click_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_click_logs" ON click_logs;
CREATE POLICY "anon_insert_click_logs" ON click_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_click_logs" ON click_logs;
CREATE POLICY "anon_select_click_logs" ON click_logs FOR SELECT
  TO anon, authenticated USING (true);