"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { Product as ShopProduct } from "@/types/product";
import { getProductsByIds } from "@/lib/productHelpers";
import { useState, useEffect } from "react";
import ScorpioLoader from "@/components/ScorpioLoader";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist, addToCart, isInCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      if (wishlist.length > 0) {
        const products = await getProductsByIds(wishlist);
        setWishlistProducts(products);
      } else {
        setWishlistProducts([]);
      }
      setLoading(false);
    };

    fetchWishlistProducts();
  }, [wishlist]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider">
              Your Wishlist
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {wishlistProducts.length === 0
                ? "You haven't saved any products yet."
                : `You have ${wishlistProducts.length} ${
                    wishlistProducts.length === 1 ? "item" : "items"
                  } saved for later.`}
            </p>
          </div>
          <button
            onClick={() => router.push("/shop")}
            className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
          >
            Explore Products
          </button>
        </div>

        {loading ? (
          <ScorpioLoader />
        ) : wishlistProducts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-md p-10 text-center">
            <p className="text-lg text-gray-400">
              Your wishlist is empty. Add items to keep track of your
              favourites.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-6 px-6 py-3 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {wishlistProducts.map((product, index) => {
              const defaultSize = product.size?.[0] ?? "Free Size";
              const inCart = isInCart(product.id, defaultSize);
              const handleRemove = (e: React.MouseEvent) => {
                e.stopPropagation();
                removeFromWishlist(product.id);
              };
              const handleAddToCart = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (inCart) {
                  router.push("/cart");
                } else {
                  addToCart(product.id, defaultSize, 1);
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
                    onClick={() =>
                      router.push(`/shop/${product.category}/${product.id}`)
                    }
                  >
                    {/* Wishlist Icon - Top left of card */}
                    <div className="absolute top-2 left-2 z-30">
                      <motion.button
                        onClick={handleRemove}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg bg-white border-white text-black hover:bg-white"
                        aria-label="Remove from Wishlist"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="currentColor"
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
                          target.src = "/placeholder.jpg";
                        }}
                        unoptimized={product.image.startsWith("https://")}
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
      </div>

      <Footer />
    </div>
  );
}
