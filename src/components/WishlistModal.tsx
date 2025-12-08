"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product as ShopProduct } from "@/types/product";
import { getProductsByIds } from "@/lib/productHelpers";
import { useCart } from "@/context/CartContext";
import ScorpioLoader from "@/components/ScorpioLoader";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll?: () => void;
  anchorRect: DOMRect | null;
}

export default function WishlistModal({
  isOpen,
  onClose,
  onViewAll,
  anchorRect,
}: WishlistModalProps) {
  const router = useRouter();
  const { wishlist, removeFromWishlist, addToCart, isInCart } = useCart();
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 80, left: 16 });
  const [wishlistProducts, setWishlistProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setWishlistProducts([]);
        return;
      }

      setLoading(true);
      const products = await getProductsByIds(wishlist);
      setWishlistProducts(products);
      setLoading(false);
    };

    if (isOpen) {
      fetchWishlistProducts();
    }
  }, [wishlist, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (anchorRect) {
      const panelWidth = Math.min(360, window.innerWidth - 32);
      const desiredLeft =
        anchorRect.left - (panelWidth - anchorRect.width) / 2;
      const clampedLeft = Math.max(
        16,
        Math.min(desiredLeft, window.innerWidth - panelWidth - 16)
      );
      const top = anchorRect.bottom + 12;
      setPosition({ top, left: clampedLeft });
    } else {
      setPosition({ top: 80, left: 16 });
    }
  }, [anchorRect, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push("/wishlist");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          className="fixed z-[120] w-[min(90vw,360px)] bg-black border border-white/20 rounded-xl shadow-2xl overflow-hidden"
          style={{ top: position.top, left: position.left }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-semibold uppercase tracking-wider">
                Wishlist
              </h2>
              <p className="text-sm text-gray-400">
                {wishlistProducts.length}{" "}
                {wishlistProducts.length === 1 ? "item" : "items"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white transition"
              aria-label="Close wishlist modal"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <ScorpioLoader />
            ) : wishlistProducts.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <p className="text-lg font-medium">
                  Your wishlist is feeling lonely.
                </p>
                <p className="mt-2 text-sm">
                  Add some favourites and they will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {wishlistProducts.map((product) => {
                  if (!product) return null;
                  const defaultSize = product.size?.[0] ?? "Free Size";
                  const inCart = isInCart(product.id, defaultSize);
                  return (
                    <li
                      key={product.id}
                      className="flex gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-md border border-white/10">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                          onError={(e) => {
                            console.error("Wishlist image failed to load:", product.image, product.id);
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.jpg";
                          }}
                          unoptimized={product.image?.startsWith("https://")}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white line-clamp-1">
                          {product.name}
                        </h3>
                          <p className="mt-2 text-sm text-gray-400">
                            Default size:{" "}
                            <span className="text-white">{defaultSize}</span>
                          </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <button
                          onClick={() => removeFromWishlist(product.id)}
                          className="text-xs uppercase tracking-wider text-gray-400 hover:text-white transition"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() =>
                            inCart
                              ? router.push("/cart")
                                : addToCart(product.id, defaultSize, 1)
                          }
                          className={`px-4 py-2 text-xs uppercase tracking-wider border transition ${
                            inCart
                              ? "border-white text-white hover:bg-white hover:text-black"
                              : "border-white/40 text-white hover:border-white hover:bg-white hover:text-black"
                          }`}
                        >
                          {inCart ? "View in Cart" : "Add to Cart"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/60">
            <button
              onClick={onClose}
              className="text-sm uppercase tracking-wider text-gray-400 hover:text-white transition"
            >
              Close
            </button>
            <button
              onClick={handleViewAll}
              className="px-6 py-2 text-sm font-semibold uppercase tracking-wider border border-white text-white hover:bg-white hover:text-black transition"
            >
              View All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

