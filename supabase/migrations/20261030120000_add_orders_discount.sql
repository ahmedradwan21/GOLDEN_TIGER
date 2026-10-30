/*
# Coupon discounts on orders
Adds discount_cents (applied coupon discount) and coupon_code to orders.
*/
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
