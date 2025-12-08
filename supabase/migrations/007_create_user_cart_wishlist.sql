-- Create user_cart table to store cart items for logged-in users
CREATE TABLE IF NOT EXISTS user_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, size)
);

-- Create user_wishlist table to store wishlist items for logged-in users
CREATE TABLE IF NOT EXISTS user_wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_cart_user_id ON user_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cart_product_id ON user_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_user_id ON user_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlist_product_id ON user_wishlist(product_id);

-- Create updated_at trigger for user_cart
CREATE TRIGGER update_user_cart_updated_at
  BEFORE UPDATE ON user_cart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user_cart
CREATE POLICY "Users can view their own cart" ON user_cart
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON user_cart
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON user_cart
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON user_cart
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for user_wishlist
CREATE POLICY "Users can view their own wishlist" ON user_wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON user_wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON user_wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

