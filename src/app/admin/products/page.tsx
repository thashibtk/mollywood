"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, Product } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const CATEGORIES = [
    "1111",
    "2222",
    "3333",
    "4444",
    "5555",
    "6666",
    "7777",
    "8888",
    "9999",
  ];

  // Check for success message
  useEffect(() => {
    const success = searchParams.get("success");
    const categoryParam = searchParams.get("category");

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }

    if (success) {
      setSuccessMessage(success);
      setShowSuccess(true);
      // Remove success and category params from URL to clean it up, but keep state
      router.replace("/admin/products");
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams, router]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("*");

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      published: {
        label: "Published",
        className: "bg-green-100 text-green-700",
      },
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
      stockout: { label: "Stockout", className: "bg-red-100 text-red-700" },
      archived: {
        label: "Archived",
        className: "bg-yellow-100 text-yellow-700",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  // Calculate category counts
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = products.filter((p) => p.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              ← Back
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {selectedCategory
                ? `Category: ${selectedCategory}`
                : "Products Catalogue"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedCategory
                ? `Manage products in ${selectedCategory}`
                : "Select a category to manage products"}
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            router.push(
              selectedCategory
                ? `/admin/products/add?category=${selectedCategory}`
                : "/admin/products/add"
            )
          }
          className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition"
        >
          Add Product
        </button>
      </div>

      <div className="px-8 py-8 space-y-6">
        {/* Success Message */}
        {showSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        )}

        {!selectedCategory ? (
          /* Category Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition group"
              >
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-black mb-2">
                  {category}
                </h3>
                <p className="text-sm text-gray-500">
                  {categoryCounts[category] || 0} Products
                </p>
              </button>
            ))}
          </div>
        ) : (
          /* Product List View */
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded-lg"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="stockout">Stockout</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {loading ? (
              <ScorpioLoader />
            ) : filteredProducts.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="mb-2">No products found in this category</p>
                <p className="text-xs">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first product to get started"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  // Calculate total inventory from sizes
                  const totalInventory = product.sizes
                    ? Object.values(product.sizes).reduce(
                        (sum, stock) => sum + (stock || 0),
                        0
                      )
                    : product.inventory;

                  // Get sizes and stocks
                  const sizes = product.sizes
                    ? (
                        Object.keys(product.sizes) as Array<
                          keyof typeof product.sizes
                        >
                      ).filter((size) => product.sizes![size] !== undefined)
                    : [];

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Product Image */}
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        ) : product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">
                              No Image
                            </span>
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500">
                              SKU: {product.sku || product.id}
                            </p>
                            <span className="text-xs text-gray-400">·</span>
                            <p className="text-xs text-gray-500">
                              ₹{product.price.toLocaleString()}
                            </p>
                            {product.category && (
                              <>
                                <span className="text-xs text-gray-400">·</span>
                                <p className="text-xs text-gray-500">
                                  Category: {product.category}
                                </p>
                              </>
                            )}
                          </div>
                          {(product.material ||
                            product.type ||
                            product.pattern ||
                            product.fit) && (
                            <div className="flex items-center gap-2 mt-1">
                              {product.material && (
                                <span className="text-xs text-gray-400">
                                  {product.material}
                                </span>
                              )}
                              {product.type && (
                                <>
                                  <span className="text-xs text-gray-300">
                                    ·
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {product.type}
                                  </span>
                                </>
                              )}
                              {product.pattern && (
                                <>
                                  <span className="text-xs text-gray-300">
                                    ·
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {product.pattern}
                                  </span>
                                </>
                              )}
                              {product.fit && (
                                <>
                                  <span className="text-xs text-gray-300">
                                    ·
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {product.fit}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Size and Stock Display */}
                      {sizes.length > 0 ? (
                        <div className="flex flex-col items-center mx-8">
                          <div className="flex gap-3 mb-1">
                            {sizes.map((size) => (
                              <span
                                key={size}
                                className="text-xs font-medium text-gray-700 min-w-[20px] text-center"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            {sizes.map((size) => (
                              <span
                                key={size}
                                className="text-xs text-gray-600 min-w-[20px] text-center"
                              >
                                {product.sizes?.[size] || 0}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mx-8 text-xs text-gray-400">
                          No sizes
                        </div>
                      )}

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            Inventory: {totalInventory}
                          </p>
                          {getStatusBadge(product.status)}
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/admin/products/edit/${product.id}`)
                          }
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
