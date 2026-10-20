# SETUP — GOLDEN_TIGER

## 1. Install
```bash
npm install
```

## 2. Environment
Copy `.env.example` to `.env.local` and fill in:
```bash
cp .env.example .env.local
```
| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon/public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role) — **server only, never expose** |
| `JWT_SECRET` | any random string, **min 32 chars**: `openssl rand -hex 32` |

## 3. Database
Apply the migrations in order from `supabase/migrations/` (Supabase SQL Editor, or `supabase db push` if linked).

## 4. Seed the first admin
```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_STRONG_PASSWORD', 12))"
```
Then in the SQL Editor:
```sql
insert into admins (id, email, name, password_hash, role, created_at)
values ('adm_seed_001', 'admin@example.com', 'Admin', '<paste-hash-here>', 'super_admin', now());
```

## 5. Run
```bash
npm run dev        # development
npm run build && npm start   # production
```
Admin panel: `http://localhost:3000/admin/login`
