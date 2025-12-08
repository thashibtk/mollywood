-- Create a function to atomically increment coupon usage count (case-sensitive)
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_code VARCHAR(50))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges, bypasses RLS
AS $$
DECLARE
  v_rows_updated INTEGER;
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE code = TRIM(p_coupon_code);
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  -- Log if no rows were updated (coupon not found)
  IF v_rows_updated = 0 THEN
    RAISE WARNING 'Coupon code not found: %', p_coupon_code;
  END IF;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_coupon_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_coupon_usage TO anon;

