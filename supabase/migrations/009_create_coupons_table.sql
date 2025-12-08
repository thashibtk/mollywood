-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5, 2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'expired')),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  max_usage INTEGER, -- NULL means unlimited
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

-- Create updated_at trigger
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated admin users
-- Check role from user metadata via auth.jwt()
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

