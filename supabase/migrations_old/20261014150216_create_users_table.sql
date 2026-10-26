/*
# Create users table

Creates the users table for customer accounts.
- id (text, PK), email (unique), name, phone, password_hash, timestamps
- RLS enabled, anon can INSERT (registration), authenticated can SELECT/UPDATE
*/

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "user_read_own" ON users;
CREATE POLICY "user_read_own" ON users FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "user_update_own" ON users;
CREATE POLICY "user_update_own" ON users FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);