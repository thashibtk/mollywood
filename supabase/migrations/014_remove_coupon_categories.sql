-- Remove categories column from coupons table
-- Coupons will now apply to the entire cart

ALTER TABLE coupons
DROP COLUMN IF EXISTS categories;

-- Drop the GIN index on categories if it exists
DROP INDEX IF EXISTS idx_coupons_categories;

