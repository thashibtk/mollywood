"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product as ShopProduct } from "@/types/product";
import { getProductsByIds } from "@/lib/productHelpers";
import { useCart } from "@/context/CartContext";
import ScorpioLoader from "@/components/ScorpioLoader";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll?: () => void;
  anchorRect: DOMRect | null;
}

export default function CartModal({
  isOpen,
  onClose,
  onViewAll,
  anchorRect,
}: CartModalProps) {
  const router = useRouter();
  const { cart, coupon, removeFromCart, getDiscountAmount } = useCart();
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 80, left: 16 });
  const [cartItems, setCartItems] = useState<
    Array<{
      product: ShopProduct;
      size: string;
      quantity: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchCartProducts = async () => {
      if (cart.length === 0) {
        setCartItems([]);
        return;
      }

      setLoading(true);
      const productIds = [...new Set(cart.map((item) => item.productId))];
      const products = await getProductsByIds(productIds);

      // Map cart items with products
      const mapped = cart
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return {
            product,
            size: item.size,
            quantity: item.quantity,
          };
        })
        .filter(
          (
            item
          ): item is {
            product: ShopProduct;
            size: string;
            quantity: number;
          } => Boolean(item)
        );

      setCartItems(mapped);
      setLoading(false);
    };

    if (isOpen) {
      fetchCartProducts();
    }
  }, [cart, isOpen]);

  const subtotal = cartItems.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);
  
  const discount = getDiscountAmount(subtotal);
  const total = Math.max(subtotal - discount, 0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (anchorRect) {
      const panelWidth = Math.min(360, window.innerWidth - 32);
      const desiredLeft = anchorRect.left - (panelWidth - anchorRect.width) / 2;
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
      router.push("/cart");
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
                Cart
              </h2>
              <p className="text-sm text-gray-400">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white transition"
              aria-label="Close cart modal"
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
            ) : cartItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <p className="text-lg font-medium">
                  Your cart is currently empty.
                </p>
                <p className="mt-2 text-sm">
                  Add products to see them here and continue to checkout.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {cartItems.map((item) => {
                  const { product, size, quantity } = item;
                  return (
                    <li
                      key={`${product.id}-${size}`}
                      className="px-6 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border border-white/10">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            onError={(e) => {
                              console.error("Cart image failed to load:", product.image, product.id);
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.jpg";
                            }}
                            unoptimized={product.image?.startsWith("https://")}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-semibold text-white line-clamp-1">
                                {product.name}
                              </h3>
                              <p className="mt-1 text-xs text-gray-400">
                                Size: <span className="text-white">{size}</span>
                              </p>
                              <p className="text-xs text-gray-400">
                                Qty:{" "}
                                <span className="text-white">{quantity}</span>
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                ₹{(product.price * quantity).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(product.id, size)}
                              className="text-[10px] uppercase tracking-wider text-gray-400 hover:text-white transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/10 bg-black/60">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm uppercase tracking-wider text-gray-400">
                Subtotal
              </span>
              <span className="text-lg font-semibold text-white">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>
            {coupon && discount > 0 && (
              <div className="flex items-center justify-between mb-4 text-sm text-emerald-400">
                <span>Coupon ({coupon.code})</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm uppercase tracking-wider text-gray-400 hover:text-white transition"
              >
                Continue Shopping
              </button>
              <button
                onClick={handleViewAll}
                className="flex-1 py-2 text-sm font-semibold uppercase tracking-wider border border-white text-white hover:bg-white hover:text-black transition"
              >
                Go To Cart · ₹{total.toLocaleString()}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
