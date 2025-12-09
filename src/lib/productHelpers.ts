import { supabase, Product as SupabaseProduct } from './supabase';
import { Product as ShopProduct } from '@/types/product';

// Helper function to convert Supabase Storage paths to public URLs
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath || imagePath.trim() === "") {
    console.log("[getImageUrl] No image path provided, using placeholder");
    return "/logo/logo.jpg";
  }
  
  const trimmedPath = imagePath.trim();
  
  // If it's already a full URL (http/https), return as-is
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    console.log("[getImageUrl] Already a full URL:", trimmedPath);
    return trimmedPath;
  }
  
  // If it's a local path (starts with /), return as-is
  if (trimmedPath.startsWith("/")) {
    console.log("[getImageUrl] Local path, returning as-is:", trimmedPath);
    return trimmedPath;
  }
  
  // Check if it's a Supabase storage URL that's missing the protocol
  // Sometimes Supabase URLs might be stored without https://
  if (trimmedPath.includes("supabase.co") || trimmedPath.includes("storage/v1")) {
    const fullUrl = trimmedPath.startsWith("//") ? `https:${trimmedPath}` : `https://${trimmedPath}`;
    console.log("[getImageUrl] Fixed Supabase URL:", fullUrl);
    return fullUrl;
  }
  
  // Otherwise, it's a Supabase Storage path - convert to public URL
  try {
    console.log("[getImageUrl] Converting storage path to public URL:", trimmedPath);
    const { data } = supabase.storage.from("product-images").getPublicUrl(trimmedPath);
    
    if (!data || !data.publicUrl) {
      console.error("[getImageUrl] No publicUrl in response:", data);
      return "/logo/logo.jpg";
    }
    
    console.log("[getImageUrl] Converted to:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("[getImageUrl] Exception getting public URL for image:", trimmedPath, error);
    return "/logo/logo.jpg";
  }
};

// Map Supabase product to shop product format
export const mapSupabaseToShopProduct = (
  product: SupabaseProduct
): ShopProduct | null => {
  // Only show published products
  if (product.status && product.status !== "published") return null;

  // Get image (prefer first from images array, fallback to image_url)
  // Filter out null/empty values from images array
  const validImages = product.images?.filter(img => img && img.trim() !== "") || [];
  const rawImage =
    validImages.length > 0
      ? validImages[0]
      : (product.image_url && product.image_url.trim() !== "")
      ? product.image_url
      : "/logo/logo.jpg";
  
  console.log("[mapSupabaseToShopProduct] Product ID:", product.id);
  console.log("[mapSupabaseToShopProduct] Raw image path:", rawImage);
  console.log("[mapSupabaseToShopProduct] Images array:", product.images);
  console.log("[mapSupabaseToShopProduct] Valid images:", validImages);
  console.log("[mapSupabaseToShopProduct] Image URL:", product.image_url);
  
  // Convert to public URL if needed
  const image = getImageUrl(rawImage);
  
  console.log("[mapSupabaseToShopProduct] Final image URL:", image);

  // Convert sizes object to array (only include sizes with stock > 0)
  const sizeArray: string[] = [];
  if (product.sizes) {
    Object.entries(product.sizes).forEach(([size, stock]) => {
      if (stock && stock > 0) {
        sizeArray.push(size);
      }
    });
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description || "",
    price: product.price,
    category: product.category,
    color: "black" as const, // Default to black, can be enhanced later
    image,
    size: sizeArray.length > 0 ? (sizeArray as any) : undefined,
    material: product.material || undefined,
    type: product.type as
      | "Round Neck"
      | "V Neck"
      | "Crew Neck"
      | "Polo"
      | undefined,
    pattern: product.pattern as
      | "Solid"
      | "Striped"
      | "Printed"
      | "Graphic"
      | undefined,
    fit: product.fit as "Regular" | "Slim" | "Relaxed" | undefined,
    sku: product.sku || undefined,
  };
};

// Fetch products by IDs from Supabase
export async function getProductsByIds(
  productIds: string[]
): Promise<ShopProduct[]> {
  if (productIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("status", "published");

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    const mappedProducts = (data || [])
      .map(mapSupabaseToShopProduct)
      .filter((p): p is ShopProduct => p !== null);

    // Preserve order of productIds
    const productMap = new Map(mappedProducts.map((p) => [p.id, p]));
    return productIds
      .map((id) => productMap.get(id))
      .filter((p): p is ShopProduct => p !== null);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Fetch a single product by ID
export async function getProductById(
  productId: string
): Promise<ShopProduct | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("status", "published")
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    if (!data) return null;

    return mapSupabaseToShopProduct(data);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

