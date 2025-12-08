-- Update products table to allow 'stockout' status
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_status_check;

ALTER TABLE products 
ADD CONSTRAINT products_status_check 
CHECK (status IN ('draft', 'published', 'archived', 'stockout'));

