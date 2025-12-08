-- Create a function to fetch order by UUID with elevated privileges
-- This allows API routes to fetch orders after creation even when using anon key
CREATE OR REPLACE FUNCTION get_order_by_id(p_order_uuid UUID)
RETURNS TABLE (
  id UUID,
  order_id VARCHAR(50),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  user_id UUID,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  shipping_address JSONB,
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  total DECIMAL(10, 2),
  coupon_code VARCHAR(50),
  status VARCHAR(50),
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, bypasses RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_id,
    o.razorpay_order_id,
    o.razorpay_payment_id,
    o.user_id,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.shipping_address,
    o.subtotal,
    o.discount,
    o.total,
    o.coupon_code,
    o.status,
    o.payment_status,
    o.payment_method,
    o.created_at,
    o.updated_at
  FROM orders o
  WHERE o.id = p_order_uuid;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_order_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_by_id TO anon;

