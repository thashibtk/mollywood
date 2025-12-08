"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, ProductInsert, ProductSizes } from "@/lib/supabase";
import { convertImageToWebP } from "@/utils/imageUtils";

const CATEGORIES = ["1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999"];
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

// Category-based pricing
const CATEGORY_PRICES: Record<string, number> = {
  "1111": 1111,
  "2222": 2222,
  "3333": 3333,
  "4444": 4444,
  "5555": 5555,
  "6666": 6666,
  "7777": 7777,
  "8888": 8888,
  "9999": 9999,
};

// Product attributes for filtering
const MATERIALS = [
  "Cotton",
  "Polyester",
  "Cotton Blend",
  "Linen",
  "Bamboo",
  "Modal",
  "Organic Cotton",
  "Recycled Polyester",
];

const TYPES = [
  "T-Shirt",
  "Polo Shirt",
  "Hoodie",
  "Sweatshirt",
  "Tank Top",
  "Long Sleeve",
  "V-Neck",
  "Crew Neck",
  "Henley",
];

const PATTERNS = [
  "Solid",
  "Striped",
  "Polka Dot",
  "Geometric",
  "Abstract",
  "Floral",
  "Graphic Print",
  "Logo Print",
  "Tie-Dye",
  "Camouflage",
];

const FITS = [
  "Regular Fit",
  "Slim Fit",
  "Relaxed Fit",
  "Oversized",
  "Athletic Fit",
  "Classic Fit",
];

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGif, setUploadingGif] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<
    { url: string; preview: string }[]
  >([]);
  const [formData, setFormData] = useState<ProductInsert>({
    name: "",
    description: "",
    price: CATEGORY_PRICES["1111"],
    category: "1111",
    image_url: "",
    images: [],
    video_url: "",
    status: "draft",
    sku: "",
    sizes: {},
    material: "",
    type: "",
    pattern: "",
    fit: "",
  });
  const [sizes, setSizes] = useState<ProductSizes>({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    "2XL": 0,
    "3XL": 0,
  });

  // Prefill category from URL query param
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && CATEGORIES.includes(categoryParam)) {
      setFormData((prev) => ({
        ...prev,
        category: categoryParam,
        price: CATEGORY_PRICES[categoryParam] || prev.price,
      }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Auto-fill price when category changes
    if (name === "category" && CATEGORY_PRICES[value]) {
      setFormData((prev) => ({
        ...prev,
        category: value,
        price: CATEGORY_PRICES[value],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "price" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} size must be less than 5MB`);
        }

        // Convert to WebP
        const webpFile = await convertImageToWebP(file);

        // Create unique filename
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.webp`;
        const filePath = `products/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, webpFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/webp",
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(filePath);

        // Create preview
        const reader = new FileReader();
        return new Promise<{ url: string; preview: string }>((resolve) => {
          reader.onloadend = () => {
            resolve({
              url: publicUrl,
              preview: reader.result as string,
            });
          };
          reader.readAsDataURL(webpFile);
        });
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Update state
      const newUrls = uploadedImages.map((img) => img.url);

      setImages((prev) => [...prev, ...newUrls]);
      setImagePreviews((prev) => [...prev, ...uploadedImages]);

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newUrls],
        // Set first image as image_url for backward compatibility
        image_url: prev.image_url || newUrls[0] || "",
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image(s)");
      console.error("Error uploading images:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGifUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGif(true);
    setError(null);

    try {
      // Validate file type
      if (file.type !== "image/gif") {
        throw new Error("Please upload a valid GIF file");
      }

      // Validate file size (max 10MB for GIFs)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("GIF size must be less than 10MB");
      }

      // Create unique filename
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.gif`;
      const filePath = `products/videos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/gif",
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        video_url: publicUrl,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to upload GIF");
      console.error("Error uploading GIF:", err);
    } finally {
      setUploadingGif(false);
      if (gifInputRef.current) {
        gifInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);
    setFormData((prev) => ({
      ...prev,
      images: newImages,
      image_url: newImages[0] || "",
    }));
  };

  const handleRemoveGif = () => {
    setFormData((prev) => ({
      ...prev,
      video_url: "",
    }));
  };

  const handleSizeChange = (size: string, stock: number) => {
    setSizes((prev) => ({
      ...prev,
      [size]: stock,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.price || !formData.category) {
        throw new Error("Please fill in all required fields");
      }

      // Calculate total inventory from sizes
      const totalInventory = Object.values(sizes).reduce(
        (sum, stock) => sum + (stock || 0),
        0
      );

      // Filter out sizes with 0 stock
      const sizesWithStock: ProductSizes = {};
      Object.entries(sizes).forEach(([size, stock]) => {
        if (stock && stock > 0) {
          sizesWithStock[size as keyof ProductSizes] = stock;
        }
      });

      // Generate SKU if not provided
      const sku = formData.sku || `MO-${Date.now()}`;

      const { data, error: insertError } = await supabase
        .from("products")
        .insert([
          {
            ...formData,
            sku,
            price: parseFloat(formData.price.toString()),
            inventory: totalInventory,
            sizes: sizesWithStock,
            images: images.length > 0 ? images : null,
            video_url: formData.video_url || null,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Redirect to products list with success message and category
      router.push(
        `/admin/products?success=Product created successfully&category=${formData.category}`
      );
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      console.error("Error creating product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      router.push(`/admin/products?category=${categoryParam}`);
    } else {
      router.push("/admin/products");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Add New Product
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Create a new product for the Mollywood catalogue
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="stockout">Stockout</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Cosmic Void Black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Product description..."
                  />
                </div>

                
              </div>
            </div>

            {/* Product Attributes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Attributes
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                These attributes help customers filter and search for products
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <select
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select Material</option>
                    {MATERIALS.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pattern
                  </label>
                  <select
                    name="pattern"
                    value={formData.pattern}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select Pattern</option>
                    {PATTERNS.map((pattern) => (
                      <option key={pattern} value={pattern}>
                        {pattern}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fit
                  </label>
                  <select
                    name="fit"
                    value={formData.fit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select Fit</option>
                    {FITS.map((fit) => (
                      <option key={fit} value={fit}>
                        {fit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pricing
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="2999"
                />
              </div>
            </div>

            {/* Sizes & Stock */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sizes & Stock
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Enter stock quantity for each available size
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SIZES.map((size) => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size {size}
                    </label>
                    <input
                      type="number"
                      value={sizes[size as keyof ProductSizes] || 0}
                      onChange={(e) =>
                        handleSizeChange(size, parseInt(e.target.value) || 0)
                      }
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Inventory:</span>{" "}
                  {Object.values(sizes).reduce(
                    (sum, stock) => sum + (stock || 0),
                    0
                  )}{" "}
                  units
                </p>
              </div>
            </div>

            {/* Product Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Images
              </h3>
              <div className="space-y-4">
                {/* Image Thumbnails */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {uploading
                        ? "Uploading & Converting..."
                        : "Click to upload images (multiple allowed)"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Images will be auto-converted to WebP
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Product Video (GIF) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Video (GIF)
              </h3>
              <div className="space-y-4">
                {formData.video_url ? (
                  <div className="relative group w-full max-w-sm">
                    <img
                      src={formData.video_url}
                      alt="Product GIF"
                      className="w-full h-auto rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveGif}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      ref={gifInputRef}
                      type="file"
                      accept="image/gif"
                      onChange={handleGifUpload}
                      className="hidden"
                      id="gif-upload"
                    />
                    <label
                      htmlFor="gif-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg
                        className="w-12 h-12 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {uploadingGif
                          ? "Uploading GIF..."
                          : "Click to upload Product GIF"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        GIF format only, max 10MB
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="MO-12345"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
