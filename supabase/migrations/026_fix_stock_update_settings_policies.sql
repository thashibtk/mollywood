-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can update stock update settings" ON stock_update_settings;
DROP POLICY IF EXISTS "Only admins can insert stock update settings" ON stock_update_settings;

-- Policy: Only admins can update (using is_admin function)
CREATE POLICY "Only admins can update stock update settings"
  ON stock_update_settings
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Policy: Only admins can insert (using is_admin function)
CREATE POLICY "Only admins can insert stock update settings"
  ON stock_update_settings
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

