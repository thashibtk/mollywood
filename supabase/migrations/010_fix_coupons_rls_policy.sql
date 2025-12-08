-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations for admin users" ON coupons;

-- Create new policy that doesn't query auth.users table directly
-- Instead, it uses auth.jwt() to access user metadata from the JWT token
CREATE POLICY "Allow all operations for admin users" ON coupons
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

