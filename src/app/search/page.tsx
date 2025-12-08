"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import StarsBackground from "@/components/StarsBackground";
import Footer from "@/components/Footer";
import { Product as ShopProduct } from "@/types/product";
import { supabase } from "@/lib/supabase";
import { mapSupabaseToShopProduct } from "@/lib/productHelpers";
import { useCart } from "@/context/CartContext";
import ScorpioLoader from "@/components/ScorpioLoader";
import BackgroundImage from "@/components/BackgroundImage";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("q") || "";
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const [flyingProduct, setFlyingProduct] = useState<{
    id: string;
    x: number;
    y: number;
    endX: number;
    endY: number;
    target: "wishlist" | "cart";
  } | null>(null);

  // Fetch products based on search query
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchQuery.trim()) {
        setAllProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Search in name, description, category, material, type, pattern, fit
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("status", "published")
          .or(
            `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,material.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%,pattern.ilike.%${searchQuery}%,fit.ilike.%${searchQuery}%`
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching products:", error);
          setAllProducts([]);
          return;
        }

        // Map Supabase products to shop format
        const mappedProducts = (data || [])
          .map((product) => {
            const mapped = mapSupabaseToShopProduct(product);
            return mapped;
          })
          .filter((p): p is ShopProduct => p !== null);

        setAllProducts(mappedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  const handleProductClick = (product: ShopProduct) => {
    router.push(`/shop/${product.category}/${product.id}`);
  };

  const animateProductFly = (
    startRect: DOMRect,
    endRect: DOMRect,
    productId: string,
    target: "wishlist" | "cart"
  ) => {
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    setFlyingProduct({
      id: productId,
      x: startRect.left + startRect.width / 2,
      y: startRect.top + startRect.height / 2,
      endX,
      endY,
      target,
    });

    setTimeout(() => {
      setFlyingProduct(null);
    }, 800);
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <StarsBackground />
      <BackgroundImage src="bg1.webp" opacity={0.5} />
      <div className="relative z-10 min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Search Results
            </h1>
            {searchQuery && (
              <p className="text-gray-400 text-lg">
                {allProducts.length === 0
                  ? `No products found for "${searchQuery}"`
                  : `Found ${allProducts.length} product${
                      allProducts.length !== 1 ? "s" : ""
                    } for "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Products Grid */}
          {allProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {allProducts.map((product, index) => {
                const inWishlist = isInWishlist(product.id);

                const handleWishlistIcon = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (inWishlist) {
                    removeFromWishlist(product.id);
                  } else {
                    const buttonRect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    const navButton = document.querySelector(
                      '[aria-label="Wishlist"]'
                    ) as HTMLElement;
                    if (navButton) {
                      const navRect = navButton.getBoundingClientRect();
                      animateProductFly(
                        buttonRect,
                        navRect,
                        product.id,
                        "wishlist"
                      );
                    }
                    addToWishlist(product.id);
                  }
                };

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    className="group relative"
                  >
                    <div
                      className="border border-gray-700 bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-500 h-full flex flex-col cursor-pointer group-hover:border-white group-hover:bg-black/70 group-hover:shadow-lg group-hover:shadow-white/10 relative"
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Wishlist Icon - Top left of card */}
                      <div className="absolute top-2 left-2 z-30">
                        <motion.button
                          onClick={handleWishlistIcon}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg ${
                            inWishlist
                              ? "bg-white border-white text-black"
                              : "bg-black/70 border-gray-400 text-white hover:bg-white hover:text-black hover:border-white"
                          }`}
                          aria-label={
                            inWishlist
                              ? "Remove from Wishlist"
                              : "Add to Wishlist"
                          }
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill={inWishlist ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </motion.button>
                      </div>

                      {/* Image Container - More Square Aspect Ratio */}
                      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Available Sizes Overlay - Slides in on hover */}
                        <div className="absolute top-0 right-0 h-full w-8 sm:w-10 bg-black/80 backdrop-blur-sm transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out flex flex-col items-center justify-center gap-1 sm:gap-2 z-10">
                          {product.size?.map((size, sizeIndex) => (
                            <motion.span
                              key={size}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: sizeIndex * 0.1 }}
                              className="text-xs font-bold text-white border border-white/50 rounded px-1 py-0.5 min-w-[20px] text-center"
                            >
                              {size}
                            </motion.span>
                          ))}
                        </div>

                        {/* Mobile Sizes Indicator */}
                        <div className="absolute bottom-2 left-2 sm:hidden">
                          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                            <span className="text-xs text-white">
                              {product.size?.length} sizes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content - Compact Layout */}
                      <div className="p-3 flex-1 flex flex-col">
                        {/* Product Name and Price */}
                        <div className="mb-2">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight flex-1">
                              {product.name}
                            </h3>
                            <span className="text-sm font-bold text-white whitespace-nowrap">
                              ₹{product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Color and Additional Info */}
                        <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-800">
                          <span className="text-xs text-gray-400 uppercase tracking-wider">
                            {product.color}
                          </span>
                          {product.fit && (
                            <span className="text-xs text-gray-400">
                              {product.fit} fit
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <svg
                className="w-24 h-24 text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
              <p className="text-gray-400 mb-6">
                Try searching with different keywords
              </p>
              <button
                onClick={() => router.push("/shop")}
                className="px-6 py-3 border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all"
              >
                Browse All Products
              </button>
            </div>
          )}

          {/* Flying Product Animation */}
          {flyingProduct && (
            <motion.div
              initial={{
                x: flyingProduct.x,
                y: flyingProduct.y,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: flyingProduct.endX,
                y: flyingProduct.endY,
                scale: 0.3,
                opacity: 0,
                }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed z-[100] pointer-events-none"
              style={{ left: 0, top: 0 }}
            >
              <div className="w-16 h-16 border-2 border-white bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-black text-white">
          <StarsBackground />
          <div className="flex items-center justify-center min-h-screen">
            <ScorpioLoader />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
