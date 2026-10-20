/*
# Lock down public RLS policies (least privilege)

## What this migration does
Tightens Row Level Security on the storefront schema so the anon-key frontend
can only do what it actually needs to do, and nothing more.

1. Drops a set of overly-permissive anon policies that allowed public
   read/write to admin, user, order, coupon, campaign, and search-audit
   tables. Those tables must only be touched by server-side code running
   with the SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS).
2. Replaces the public products SELECT policy so only *published* products
   are visible to the storefront (anon + authenticated). Unpublished
   products are hidden from the public catalog.
3. Keeps the minimum set of anon policies the storefront genuinely needs:
   - anon SELECT on categories (read-only public catalog)
   - anon SELECT on campaigns (read-only — campaign banner reads statuses)
   - anon INSERT on orders + order_items (checkout flow creates rows)
   - anon INSERT on search_audit_logs (zero-result search logging)
   - anon INSERT on product_reviews (public review submission)
   - anon SELECT on site_content, job_postings, job_applications insert,
     announcement_bar_settings, social_community_links, browsing_history
     (already scoped by prior migrations — untouched here)

## Tables modified
- admins           — drops anon SELECT/INSERT/UPDATE
- users            — drops anon SELECT (login lookup now service-role only)
- orders           — drops anon SELECT/UPDATE (keeps anon INSERT)
- order_items      — drops anon UPDATE (keeps anon INSERT)
- coupons          — drops anon INSERT/UPDATE/DELETE
- campaigns        — drops anon INSERT/UPDATE/DELETE (keeps anon SELECT)
- search_audit_logs — drops anon UPDATE (keeps anon INSERT)
- products         — replaces anon SELECT with a published-only policy

## Security changes
- Anon role loses direct write access to admins, users, coupons, campaigns,
  and search_audit_logs. All admin read/write must go through server-side
  API routes that use the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
- Public product catalog is now scoped to is_published = true.

## Important notes
1. The customer login + admin login API routes run server-side and already
   use the service-role client (supabaseAdmin in src/lib/db.ts) for their
   credential lookups, so removing anon SELECT on users/admins does NOT
   break login. If any server route still uses the anon client to read
   users/admins, it must be migrated to the service-role client.
2. anon_insert_orders and anon_insert_order_items are intentionally KEPT
   because the checkout flow inserts order rows from the browser before
   the user is necessarily signed in.
3. All admin read/write must go through SUPABASE_SERVICE_ROLE_KEY
   server-side only. The service role bypasses RLS entirely.
*/

-- ============================================================
-- 1. Drop overly-permissive anon policies
-- ============================================================

-- admins: remove all anon access (admin login uses service role)
DROP POLICY IF EXISTS "anon_update_admins" ON admins;
DROP POLICY IF EXISTS "anon_insert_admins" ON admins;
DROP POLICY IF EXISTS "anon_select_admins" ON admins;

-- users: remove anon SELECT (login lookup must use service role)
DROP POLICY IF EXISTS "anon_select_users_for_login" ON users;

-- orders: keep anon INSERT (checkout), remove SELECT + UPDATE
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
DROP POLICY IF EXISTS "anon_update_orders" ON orders;

-- order_items: keep anon INSERT (checkout), remove UPDATE
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;

-- coupons: remove all anon write access
DROP POLICY IF EXISTS "anon_insert_coupons" ON coupons;
DROP POLICY IF EXISTS "anon_update_coupons" ON coupons;
DROP POLICY IF EXISTS "anon_delete_coupons" ON coupons;

-- campaigns: remove all anon write access (keep anon SELECT)
DROP POLICY IF EXISTS "anon_insert_campaigns" ON campaigns;
DROP POLICY IF EXISTS "anon_update_campaigns" ON campaigns;
DROP POLICY IF EXISTS "anon_delete_campaigns" ON campaigns;

-- search_audit_logs: remove anon UPDATE (keep anon INSERT)
DROP POLICY IF EXISTS "anon_update_search_audit" ON search_audit_logs;

-- ============================================================
-- 2. Replace public products read policy (published only)
-- ============================================================

DROP POLICY IF EXISTS "anon_select_products" ON products;

CREATE POLICY "public_read_published_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- ============================================================
-- 3. Verify the kept policies are intact (no-op; documented)
-- ============================================================
-- Kept by design (created by prior migrations, not touched here):
--   anon_insert_orders           (orders)      — checkout flow
--   anon_insert_order_items      (order_items) — checkout flow
--   anon_select_categories       (categories)  — public catalog read
--   anon_select_campaigns        (campaigns)   — campaign banner reads
--   anon_insert_search_audit     (search_audit_logs) — zero-result logging
