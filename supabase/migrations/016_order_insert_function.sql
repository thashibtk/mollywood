-- Create a function to insert orders with elevated privileges
-- This allows API routes to insert orders with user_id even when using anon key
CREATE OR REPLACE FUNCTION insert_order_with_user(
  p_order_id VARCHAR(50),
  p_razorpay_order_id VARCHAR(255),
  p_razorpay_payment_id VARCHAR(255),
  p_user_id UUID,
  p_customer_name VARCHAR(255),
  p_customer_email VARCHAR(255),
  p_customer_phone VARCHAR(20),
  p_shipping_address JSONB,
  p_subtotal DECIMAL(10, 2),
  p_discount DECIMAL(10, 2),
  p_total DECIMAL(10, 2),
  p_coupon_code VARCHAR(50),
  p_status VARCHAR(50),
  p_payment_status VARCHAR(50),
  p_payment_method VARCHAR(50)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, bypasses RLS
AS $$
DECLARE
  v_order_uuid UUID;
BEGIN
  INSERT INTO orders (
    order_id,
    razorpay_order_id,
    razorpay_payment_id,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    subtotal,
    discount,
    total,
    coupon_code,
    status,
    payment_status,
    payment_method
  ) VALUES (
    p_order_id,
    p_razorpay_order_id,
    p_razorpay_payment_id,
    p_user_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    p_subtotal,
    p_discount,
    p_total,
    p_coupon_code,
    COALESCE(p_status, 'confirmed'),
    COALESCE(p_payment_status, 'paid'),
    COALESCE(p_payment_method, 'razorpay')
  )
  RETURNING id INTO v_order_uuid;
  
  RETURN v_order_uuid;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION insert_order_with_user TO authenticated;
GRANT EXECUTE ON FUNCTION insert_order_with_user TO anon;

-- Create a function to insert order items
CREATE OR REPLACE FUNCTION insert_order_items(
  p_order_id UUID,
  p_items JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      size,
      quantity,
      price
    ) VALUES (
      p_order_id,
      item->>'productId',
      item->>'productName',
      item->>'size',
      (item->>'quantity')::INTEGER,
      (item->>'price')::DECIMAL(10, 2)
    );
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_order_items TO authenticated;
GRANT EXECUTE ON FUNCTION insert_order_items TO anon;


