-- Update orders table to allow 'return' and 'refunded' statuses
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'return', 'refunded'));

