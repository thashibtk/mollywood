-- Add policy to allow all users to read active/scheduled coupons (for applying them)
CREATE POLICY "Allow all users to read active coupons" ON coupons
  FOR SELECT
  USING (
    status IN ('active', 'scheduled')
  );

