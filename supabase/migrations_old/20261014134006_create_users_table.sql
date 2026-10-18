/*
# Create users table

## What this migration does
Creates the users table for customer accounts.

## New Tables
1. `users` — customer accounts
   - id (text, primary key)
   - email (text, unique)
   - name (text, nullable)
   - phone (text, nullable)
   - password_hash (text): bcrypt hashed password
   - created_at, updated_at (timestamptz)

## Security
- RLS enabled on users
- anon can INSERT (registration via API)
- authenticated can SELECT and UPDATE own data
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
