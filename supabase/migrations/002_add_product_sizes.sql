-- Add sizes field to products table (JSONB to store size and stock)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '{}'::jsonb;

-- Create index for sizes queries
CREATE INDEX IF NOT EXISTS idx_products_sizes ON products USING GIN (sizes);

-- Remove old inventory column as we're using per-size inventory now
-- Keep it for backward compatibility but it's now calculated from sizes
-- ALTER TABLE products DROP COLUMN IF EXISTS inventory;

-- Example structure for sizes:
-- {
--   "S": 10,
--   "M": 15,
--   "L": 20,
--   "XL": 12,
--   "2XL": 8,
--   "3XL": 5
-- }

