-- Add tracking_code column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(255);

-- Add index for tracking code queries
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

