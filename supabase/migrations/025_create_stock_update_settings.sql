-- Create table for stock update settings
CREATE TABLE IF NOT EXISTS stock_update_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  next_update_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default value (3 months from now)
INSERT INTO stock_update_settings (next_update_date)
VALUES (NOW() + INTERVAL '3 months')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE stock_update_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read stock update settings"
  ON stock_update_settings
  FOR SELECT
  USING (true);

-- Policy: Only admins can update
CREATE POLICY "Only admins can update stock update settings"
  ON stock_update_settings
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Policy: Only admins can insert
CREATE POLICY "Only admins can insert stock update settings"
  ON stock_update_settings
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_stock_update_settings_updated_at
  BEFORE UPDATE ON stock_update_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_update_settings_updated_at();

