/*
# Affiliates contract for /admin/affiliates
The affiliates table already exists; this only makes sure every column the admin
page uses is present. Safe to run more than once.
Each affiliate owns one coupon (coupon_code -> coupons.code).
Only the server (service role) reads or writes affiliates.
*/
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS affiliates_coupon_code_key ON public.affiliates (coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_completed_coupon ON public.orders (coupon_code) WHERE status = 'COMPLETED';

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.affiliates FROM anon, authenticated;
GRANT ALL ON public.affiliates TO service_role;
