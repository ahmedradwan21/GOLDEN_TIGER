-- The admin login API runs with the anon key (no user session yet).
-- The previous policies only granted SELECT/INSERT/UPDATE to "authenticated",
-- so the anon-role Supabase client got zero rows back and login always failed.
-- Add anon-accessible policies so the login flow can look up and update the admin row.

CREATE POLICY "anon_select_admins"
  ON admins FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_update_admins"
  ON admins FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow insert for seeding via anon key if needed
CREATE POLICY "anon_insert_admins"
  ON admins FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
