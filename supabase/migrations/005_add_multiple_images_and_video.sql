-- Add multiple images support (JSONB array) and video URL
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create index for images queries
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN (images);

-- Keep image_url for backward compatibility, but images array is the primary field
-- Example structure for images:
-- ["https://...image1.jpg", "https://...image2.jpg", "https://...image3.jpg"]

