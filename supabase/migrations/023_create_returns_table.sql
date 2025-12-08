-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'return' CHECK (status IN ('return', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all returns
CREATE POLICY "Admins can view all returns"
  ON returns FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Policy: Admins can insert returns
CREATE POLICY "Admins can insert returns"
  ON returns FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Policy: Admins can update returns
CREATE POLICY "Admins can update returns"
  ON returns FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_returns_updated_at();

