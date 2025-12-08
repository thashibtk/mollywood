-- Add RLS policies to allow admin users to view all orders and order items
-- Admin users can view all orders
CREATE POLICY "Admin users can view all orders"
  ON orders FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin users can view all order items
CREATE POLICY "Admin users can view all order items"
  ON order_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Admin users can update orders
CREATE POLICY "Admin users can update orders"
  ON orders FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

