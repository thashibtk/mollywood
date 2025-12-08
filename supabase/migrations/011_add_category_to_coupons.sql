-- Add category field to coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Create index for category
CREATE INDEX IF NOT EXISTS idx_coupons_category ON coupons(category);

-- Update comment
COMMENT ON COLUMN coupons.category IS 'Category code (1111, 2222, 3333) or NULL for all categories';

