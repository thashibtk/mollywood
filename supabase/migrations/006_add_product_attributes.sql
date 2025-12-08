-- Add product attributes for filtering and searching
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS material VARCHAR(100),
ADD COLUMN IF NOT EXISTS type VARCHAR(100),
ADD COLUMN IF NOT EXISTS pattern VARCHAR(100),
ADD COLUMN IF NOT EXISTS fit VARCHAR(100);

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_pattern ON products(pattern);
CREATE INDEX IF NOT EXISTS idx_products_fit ON products(fit);

