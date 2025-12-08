"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScorpioLoader from "@/components/ScorpioLoader";
import { useCart } from "@/context/CartContext";
import { Product as ShopProduct } from "@/types/product";
import { getProductsByIds } from "@/lib/productHelpers";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    coupon,
    isLoading: cartLoading,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [cartProducts, setCartProducts] = useState<
    Array<{
      product: ShopProduct;
      size: string;
      quantity: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchCartProducts = async () => {
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

      setCartProducts(mapped);
      setLoading(false);
    };

    if (cart.length > 0) {
      fetchCartProducts();
    } else {
      setCartProducts([]);
      setLoading(false);
    }
  }, [cart]);

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  
  const discount = getDiscountAmount(subtotal);
  const total = Math.max(subtotal - discount, 0);

  const handleApplyCoupon = async (event: FormEvent) => {
    event.preventDefault();
    const result = await applyCoupon(couponInput);
    if (result.success) {
      setCouponMessage(result.message);
      setCouponError(null);
    } else {
      setCouponError(result.message);
      setCouponMessage(null);
    }
    setCouponInput("");
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMessage(null);
    setCouponError(null);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider">
              Your Cart
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {cartProducts.length === 0
                ? "Your cart is currently empty."
                : `You have ${cartProducts.length} ${
                    cartProducts.length === 1 ? "item" : "items"
                  } in your cart.`}
            </p>
          </div>
          <button
            onClick={() => router.push("/shop")}
            className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
          >
            Continue Shopping
          </button>
        </div>

        {(cartLoading || loading) ? (
          <ScorpioLoader />
        ) : cartProducts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-md p-10 text-center">
            <p className="text-lg text-gray-400">
              Looks like you haven't added anything to your cart yet.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-6 px-6 py-3 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
              <ul className="divide-y divide-white/10">
            {cartProducts.map((item) => (
                  <li
                key={`${item.product.id}-${item.size}`}
                className="flex flex-col sm:flex-row gap-4 px-6 py-5 hover:bg-white/5 transition"
                  >
                <div className="relative w-full sm:w-36 h-36 sm:h-28 overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 150px"
                    onError={(e) => {
                      console.error("Cart page image failed to load:", item.product.image, item.product.id);
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.jpg";
                    }}
                    unoptimized={item.product.image?.startsWith("https://")}
                  />
                </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {item.product.name}
                          </h3>
                      <p className="mt-3 text-sm text-gray-400">
                        Size: <span className="text-white">{item.size}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Quantity:{" "}
                        <span className="text-white">{item.quantity}</span>
                      </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            ₹{item.product.price.toLocaleString()} each
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <button
                      onClick={() =>
                        removeFromCart(item.product.id, item.size)
                      }
                          className="text-xs uppercase tracking-wider text-gray-400 hover:text-white transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="self-start rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
                Order Summary
              </h2>
              <form onSubmit={handleApplyCoupon} className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 bg-black border border-white/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs uppercase tracking-wider border border-white text-white hover:bg-white hover:text-black transition"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className="text-xs text-emerald-400 uppercase tracking-wider">
                    {couponMessage}
                  </p>
                )}
                {couponError && (
                  <p className="text-xs text-red-400 uppercase tracking-wider">
                    {couponError}
                  </p>
                )}
              </form>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {coupon && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="flex items-center gap-2">
                      Coupon ({coupon.code})
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] uppercase tracking-wider text-red-300 hover:text-red-100 transition"
                      >
                        Remove
                      </button>
                    </span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="uppercase tracking-wider text-xs">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex items-center justify-between text-white font-semibold text-base pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
              <button
                disabled={cartProducts.length === 0}
                onClick={() => router.push("/checkout")}
                className={`w-full mt-6 py-3 text-sm font-semibold uppercase tracking-wider border transition ${
                  cartProducts.length === 0
                    ? "border-gray-600 text-gray-500 cursor-not-allowed"
                    : "border-white text-black bg-white hover:bg-gray-200 hover:border-gray-200"
                }`}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

