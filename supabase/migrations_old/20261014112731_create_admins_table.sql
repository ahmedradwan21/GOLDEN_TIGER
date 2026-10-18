/*
# Create admins table and seed default admin

## What this migration does
Creates the admins table for admin dashboard authentication and seeds the default admin account.

## New Tables
1. `admins` — admin accounts for the dashboard
   - id (text, primary key)
   - email (text, unique)
   - name (text)
   - password_hash (text): bcrypt hashed password
   - role (text): ADMIN or SUPER_ADMIN
   - last_login_at (timestamptz, nullable)
   - created_at (timestamptz)

## Security
- RLS enabled on admins
- Only authenticated users can read/insert/update

## Important Notes
- Default admin: admin@thegoldentiger.com / ChangeMe-Now-12345
- Password hash is a real bcrypt hash of "ChangeMe-Now-12345" (10 rounds)
*/

CREATE TABLE IF NOT EXISTS admins (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'ADMIN',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_admins" ON admins;
CREATE POLICY "auth_read_admins"
ON admins FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_admins" ON admins;
CREATE POLICY "auth_insert_admins"
ON admins FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_admins" ON admins;
CREATE POLICY "auth_update_admins"
ON admins FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

INSERT INTO admins (id, email, name, password_hash, role)
VALUES ('admin-001', 'admin@thegoldentiger.com', 'Store Admin', '$2b$10$VpgvD.PrnRPdguUUw6hMkOmVwBMgZcJm2eSyWstRZ0N0lLbbHLcM.', 'SUPER_ADMIN')
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, role=EXCLUDED.role, password_hash=EXCLUDED.password_hash;
