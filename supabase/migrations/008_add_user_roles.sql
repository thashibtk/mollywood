-- Add user_metadata role field and create admin role check
-- This will be stored in auth.users.user_metadata

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in user_metadata
  -- This will be set when creating admin users
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND (raw_user_meta_data->>'role')::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easy admin checking (optional)
CREATE OR REPLACE VIEW admin_users AS
SELECT id, email, created_at
FROM auth.users
WHERE (raw_user_meta_data->>'role')::text = 'admin';

