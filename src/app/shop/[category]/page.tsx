"use client";

import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Product as ShopProduct } from "@/types/product";
import { supabase, Product as SupabaseProduct } from "@/lib/supabase";
import { mapSupabaseToShopProduct } from "@/lib/productHelpers";
import { useCart } from "@/context/CartContext";
import gsap from "gsap";
import BackgroundImage from "@/components/BackgroundImage";
import ScorpioLoader from "@/components/ScorpioLoader";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const [flyingProduct, setFlyingProduct] = useState<{
    id: string;
    x: number;
    y: number;
    endX: number;
    endY: number;
    target: "wishlist" | "cart";
  } | null>(null);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Grid layout state (3, 4, or 5 columns)
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5>(4);

  // Category data mapping
  const categoryData = [
    {
      category: "1111",
      name: "Cosmic",
      src: "/categories/1.gif",
      alt: "Collection 1111",
    },
    {
      category: "2222",
      name: "Quantum",
      src: "/categories/2.gif",
      alt: "Collection 2222",
    },
    {
      category: "3333",
      name: "Interstellar",
      src: "/categories/3.gif",
      alt: "Collection 3333",
    },
    {
      category: "4444",
      name: "Nebula",
      src: "/categories/4.gif",
      alt: "Collection 4444",
    },
    {
      category: "5555",
      name: "Stellar",
      src: "/categories/5.gif",
      alt: "Collection 5555",
    },
    {
      category: "6666",
      name: "Galactic",
      src: "/categories/6.gif",
      alt: "Collection 6666",
    },
    {
      category: "7777",
      name: "Astral",
      src: "/categories/7.gif",
      alt: "Collection 7777",
    },
    {
      category: "8888",
      name: "Void",
      src: "/categories/8.gif",
      alt: "Collection 8888",
    },
    {
      category: "9999",
      name: "Celestial",
      src: "/categories/9.gif",
      alt: "Collection 9999",
    },
  ];

  // Get category name
  const categoryName = useMemo(() => {
    const found = categoryData.find((cat) => cat.category === category);
    return found?.name || `Category ${category}`;
  }, [category]);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // First, let's check what products exist
        const { data: allData, error: allError } = await supabase
          .from("products")
          .select("*");

        console.log("All products from Supabase:", allData);
        console.log("Category filter:", category);
        console.log("All errors:", allError);

        // Now fetch with filters - try both exact match and case-insensitive
        let query = supabase
          .from("products")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false });

        // Filter by category (exact match)
        query = query.eq("category", category);

        const { data, error } = await query;

        console.log("Filtered products:", data);
        console.log("Filter error:", error);

        if (error) {
          console.error("Error fetching products:", error);
          setAllProducts([]);
          return;
        }

        console.log("Raw products before mapping:", data);

        // Map Supabase products to shop format
        const mappedProducts = (data || [])
          .map((product) => {
            const mapped = mapSupabaseToShopProduct(product);
            if (!mapped) {
              console.log("Product filtered out:", product.id, product.status);
            }
            return mapped;
          })
          .filter((p): p is ShopProduct => p !== null);

        console.log("Mapped products:", mappedProducts);
        setAllProducts(mappedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Size filter
      if (selectedSizes.length > 0) {
        const hasMatchingSize = selectedSizes.some((size) =>
          product.size?.includes(size as any)
        );
        if (!hasMatchingSize) return false;
      }

      return true;
    });
  }, [allProducts, selectedSizes]);

  // Get unique filter options from products
  const filterOptions = useMemo(() => {
    const sizes = new Set<string>();

    allProducts.forEach((product) => {
      product.size?.forEach((s) => sizes.add(s));
    });

    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
    
    return {
      sizes: Array.from(sizes).sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      }),
    };
  }, [allProducts]);

  // Toggle filter functions
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearAllFilters = () => {
    setSelectedSizes([]);
  };

  const hasActiveFilters = useMemo(() => {
    return selectedSizes.length > 0;
  }, [selectedSizes]);

  // Get grid classes based on selected columns - UPDATED FOR COMPACT 3-COLUMN LAYOUT
  const getGridClasses = () => {
    switch (gridColumns) {
      case 3:
        return "grid grid-cols-2 sm:grid-cols-3";
      case 4:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
      case 5:
        return "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
      default:
        return "grid grid-cols-2 sm:grid-cols-3";
    }
  };

  // Initial animation on mount only
  useEffect(() => {
    if (containerRef.current && !hasAnimatedRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
      hasAnimatedRef.current = true;
    }
  }, []);

  // Memoize product IDs to detect actual changes
  const filteredProductIds = useMemo(
    () =>
      filteredProducts
        .map((p) => p.id)
        .sort()
        .join(","),
    [filteredProducts]
  );

  const previousProductIdsRef = useRef<string>("");

  // Only animate products when filtered products actually change (different items, not just re-render)
  useEffect(() => {
    // Only animate if the product list actually changed
    if (filteredProductIds !== previousProductIdsRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (productsRef.current && productsRef.current.children) {
          const cards = Array.from(
            productsRef.current.children
          ) as HTMLElement[];

          // Kill any existing animations on these elements
          cards.forEach((card) => {
            gsap.killTweensOf(card);
          });

          // Set initial state
          cards.forEach((card) =>
            gsap.set(card, { opacity: 1, y: 0, rotateX: 0 })
          );

          // Animate only on initial load or when products actually change
          if (previousProductIdsRef.current === "") {
            // Initial load - full animation
            gsap.fromTo(
              cards,
              { y: 50, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.05,
                duration: 0.5,
                ease: "power2.out",
                delay: 0.3,
              }
            );
          } else {
            // Products changed (filter applied) - subtle animation
            gsap.fromTo(
              cards,
              { opacity: 0.5 },
              {
                opacity: 1,
                stagger: 0.03,
                duration: 0.3,
                ease: "power1.out",
              }
            );
          }
        }
      });

      // Update the previous product IDs reference
      previousProductIdsRef.current = filteredProductIds;
    }
  }, [filteredProductIds]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <BackgroundImage src="bg1.webp" opacity={0.5} />
      <Header />

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen p-4 sm:p-6 md:p-8 lg:p-16 pt-20 md:pt-24"
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/shop")}
          whileHover={{ scale: 1.1, x: -5 }}
          className="absolute top-20 left-4 sm:top-24 sm:left-6 md:top-28 px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-all duration-300 z-20"
        >
          ← Back to Categories
        </motion.button>

        <div className="max-w-7xl mx-auto px-4 mt-20 sm:mt-24 md:mt-28">
          <div className="text-center mb-8 sm:mb-12 space-y-4 relative z-10">
            <div className="relative z-10">
              <p className="text-gray-300">{categoryName}</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-2 ">
                Collection {category}
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-4">
                Select a product to explore
              </p>
            </div>
          </div>

          {/* Filters and Aligners Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
            {/* Filters Button */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-wider"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-white text-black text-xs rounded-full">
                    {selectedSizes.length}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Aligner Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <motion.button
                onClick={() => setGridColumns(3)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 border-2 transition-all duration-300 flex items-center justify-center ${
                  gridColumns === 3
                    ? "border-white bg-white text-black"
                    : "border-white text-white hover:bg-white/20"
                }`}
                aria-label="3 Column Layout"
              >
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                </div>
              </motion.button>
              <motion.button
                onClick={() => setGridColumns(4)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 border-2 transition-all duration-300 flex items-center justify-center ${
                  gridColumns === 4
                    ? "border-white bg-white text-black"
                    : "border-white text-white hover:bg-white/20"
                }`}
                aria-label="4 Column Layout"
              >
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                </div>
              </motion.button>
              <motion.button
                onClick={() => setGridColumns(5)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 border-2 transition-all duration-300 flex items-center justify-center ${
                  gridColumns === 5
                    ? "border-white bg-white text-black"
                    : "border-white text-white hover:bg-white/20"
                }`}
                aria-label="5 Column Layout"
              >
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                  <div className="w-1 h-4 bg-current"></div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Filter Sidebar */}
          <AnimatePresence>
            {isFilterOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterOpen(false)}
                  className="fixed inset-0 bg-black/50 z-40"
                />
                {/* Sidebar */}
                <motion.div
                  initial={{ x: -400 }}
                  animate={{ x: 0 }}
                  exit={{ x: -400 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-black border-r-2 border-white z-50 overflow-y-auto"
                >
                  <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold uppercase tracking-wider">
                        Filters
                      </h2>
                      <motion.button
                        onClick={() => setIsFilterOpen(false)}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 border-2 border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                      >
                        ×
                      </motion.button>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <motion.button
                        onClick={clearAllFilters}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-wider text-sm"
                      >
                        Clear All Filters
                      </motion.button>
                    )}

                    {/* Size Filter */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 uppercase tracking-wider">
                        Size
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.sizes.map((size) => (
                          <motion.button
                            key={size}
                            onClick={() => toggleSize(size)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 border-2 transition-all duration-300 uppercase ${
                              selectedSizes.includes(size)
                                ? "border-white bg-white text-black"
                                : "border-white text-white hover:bg-white/20"
                            }`}
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="pt-4 border-t-2 border-white">
                      <p className="text-sm text-gray-300">
                        Showing {filteredProducts.length} of{" "}
                        {allProducts.length} products
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {loading ? (
            <ScorpioLoader />
          ) : (
            <div
              ref={productsRef}
              className={`${getGridClasses()} gap-3 sm:gap-4 md:gap-5`}
            >
              {filteredProducts.map((product, index) => {
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
                      onClick={() =>
                        router.push(`/shop/${category}/${product.id}`)
                      }
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
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              product.image,
                              product.id
                            );
                            const target = e.target as HTMLImageElement;
                            target.src = "/logo/logo.jpg";
                          }}
                          unoptimized={product.image.startsWith("https://")}
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Available Sizes Overlay - Slides in on hover */}
                        <div className="absolute top-0 right-0 h-full w-8 sm:w-10 bg-black/80 backdrop-blur-sm transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out flex flex-col items-center justify-center gap-1 sm:gap-2 z-10">
                          {product.size?.map((size, index) => (
                            <motion.span
                              key={size}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
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
                              {product.fit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* No Results Message */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-400 mb-2">No products found</p>
              <p className="text-sm text-gray-500 mb-4">
                {allProducts.length === 0
                  ? `No published products found in category "${category}". Make sure products are set to "Published" status in the admin panel.`
                  : "Try adjusting your filters"}
              </p>
              {hasActiveFilters && (
                <motion.button
                  onClick={clearAllFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-wider"
                >
                  Clear Filters
                </motion.button>
              )}
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
