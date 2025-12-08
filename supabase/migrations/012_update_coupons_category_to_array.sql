-- Change category from single value to array of categories
-- First, drop the existing category column
ALTER TABLE coupons DROP COLUMN IF EXISTS category;

-- Add category as JSONB array to support multiple categories
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_coupons_categories ON coupons USING GIN (categories);

-- Update comment
COMMENT ON COLUMN coupons.categories IS 'Array of category codes (e.g., ["1111", "2222"]) or empty array [] for all categories';

