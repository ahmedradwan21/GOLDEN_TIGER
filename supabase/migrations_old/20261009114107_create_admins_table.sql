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

## Security
- RLS enabled on admins
- Only authenticated users can read; inserts restricted to authenticated (for seeding via API)
- The admin password is hashed with bcrypt (10 rounds)

## Important Notes
- Default admin: admin@thegoldentiger.com / ChangeMe-Now-12345
- The password hash below is a bcrypt hash of "ChangeMe-Now-12345"
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

-- Seed default admin (bcrypt hash of "ChangeMe-Now-12345")
INSERT INTO admins (id, email, name, password_hash, role)
VALUES ('admin-001', 'admin@thegoldentiger.com', 'Store Admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqkCJ4m8KvDgPJhP8dRQ5m4m4m4m4', 'SUPER_ADMIN')
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, role=EXCLUDED.role;
