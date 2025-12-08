-- Add logistic_name column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS logistic_name VARCHAR(255);

-- Add index for logistic name queries
CREATE INDEX IF NOT EXISTS idx_orders_logistic_name ON orders(logistic_name);

