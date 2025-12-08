"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useEffect, useRef } from "react";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { getProductsByIds, getImageUrl } from "@/lib/productHelpers";
import { Product as ShopProduct } from "@/types/product";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
}

interface SavedAddress {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUserAuth();
  const {
    cart,
    coupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    removeFromCart,
  } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkoutProducts, setCheckoutProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isAddressLoaded, setIsAddressLoaded] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    paymentMethod: "razorpay",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const razorpayLoaded = useRef(false);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Fetch saved address for logged-in user
  useEffect(() => {
    const fetchSavedAddress = async () => {
      if (!user) {
        setIsAddressLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching saved address:", error);
        } else if (data) {
          setSavedAddress(data);
          // Auto-fill form with saved address
          setFormData({
            fullName: data.full_name,
            email: data.email,
            phone: data.phone,
            streetAddress: data.street_address,
            city: data.city,
            state: data.state,
            postalCode: data.postal_code,
            country: data.country,
            paymentMethod: "razorpay",
          });
        } else {
          // No saved address, try to fill with user metadata
          const fullName = user.user_metadata?.full_name || "";
          const email = user.email || "";
          setFormData((prev) => ({
            ...prev,
            fullName: fullName,
            email: email,
          }));
        }
      } catch (error) {
        console.error("Error fetching saved address:", error);
      } finally {
        setIsAddressLoaded(true);
      }
    };

    if (user) {
      fetchSavedAddress();
    }
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    if (razorpayLoaded.current) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      razorpayLoaded.current = true;
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      if (cart.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const productIds = [...new Set(cart.map((item) => item.productId))];
        const products = await getProductsByIds(productIds);
        setCheckoutProducts(products);
      } catch (error) {
        console.error("Error fetching checkout products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cart]);

  const checkoutItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = checkoutProducts.find((p) => p.id === item.productId);
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
        ),
    [cart, checkoutProducts]
  );

  const subtotal = checkoutItems.reduce(
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

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      errors.phone = "Invalid phone number";
    }
    if (!formData.streetAddress.trim()) {
      errors.streetAddress = "Street address is required";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.state.trim()) {
      errors.state = "State is required";
    }
    if (!formData.postalCode.trim()) {
      errors.postalCode = "Postal code is required";
    }
    if (!formData.country.trim()) {
      errors.country = "Country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (formData.paymentMethod === "cod") {
      // COD is disabled
      alert(
        "Due to high demand, Cash on Delivery service is temporarily disabled. Kindly proceed with prepaid payment methods."
      );
      return;
    }

    if (!razorpayLoaded.current || !window.Razorpay) {
      alert("Payment gateway is loading. Please wait a moment and try again.");
      return;
    }

    setProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || "Failed to create order");
      }

      const orderData = await orderResponse.json();

      // Prepare order data for verification
      const orderPayload = {
        userId: user?.id || null,
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price,
        })),
        subtotal,
        discount,
        total,
        couponCode: coupon?.code || null,
      };

      // Get Razorpay key from environment
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Razorpay key not configured");
      }

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mollywood Clothing",
        description: `Order for ${formData.fullName}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          let verificationSuccessful = false;
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: orderPayload,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success && verifyData.orderId) {
              // Save or update address for logged-in users
              if (user) {
                try {
                  // Check if user has a default address
                  const { data: defaultAddress } = await supabase
                    .from("user_addresses")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("is_default", true)
                    .maybeSingle();

                  if (defaultAddress) {
                    // Update existing default address with new values
                    await supabase
                      .from("user_addresses")
                      .update({
                        full_name: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        street_address: formData.streetAddress,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.postalCode,
                        country: formData.country,
                      })
                      .eq("id", defaultAddress.id);
                  } else {
                    // No default address exists, create a new one
                    const { data: newAddress, error: insertError } =
                      await supabase
                        .from("user_addresses")
                        .insert({
                          user_id: user.id,
                          full_name: formData.fullName,
                          email: formData.email,
                          phone: formData.phone,
                          street_address: formData.streetAddress,
                          city: formData.city,
                          state: formData.state,
                          postal_code: formData.postalCode,
                          country: formData.country,
                          is_default: true,
                        })
                        .select()
                        .single();

                    // If address was created, ensure it's set as default
                    if (newAddress && !insertError) {
                      await supabase.rpc("set_default_address", {
                        p_address_id: newAddress.id,
                        p_user_id: user.id,
                      });
                    }
                  }
                } catch (error) {
                  console.error("Error saving address:", error);
                  // Don't block order completion if address save fails
                }
              }

              // Clear cart - remove all items
              const itemsToRemove = [...cart];
              itemsToRemove.forEach((item) => {
                removeFromCart(item.productId, item.size);
              });

              // Redirect directly to success page
              verificationSuccessful = true;
              window.location.href = `/checkout/success?orderId=${verifyData.orderId}`;
            } else {
              console.error("Payment verification failed:", verifyData);
              alert(
                verifyData.error ||
                  "Payment verification failed. Please contact support."
              );
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          } finally {
            // Only stop processing if we didn't redirect
            if (!verificationSuccessful) {
              setProcessing(false);
            }
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Order creation error:", error);
      alert(error.message || "Failed to initiate payment. Please try again.");
      setProcessing(false);
    }
  };

  if (loading || processing) {
    return <ScorpioLoader />;
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <StarsBackground />
        <Header />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
            Your cart is empty
          </h1>
          <p className="text-sm md:text-base text-gray-400 mb-8 max-w-md">
            Add items to your cart before proceeding to checkout. Explore our
            latest cosmic-inspired apparel and find the perfect fit.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/shop")}
              className="px-6 py-3 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              Explore Products
            </button>
            <button
              onClick={() => router.push("/cart")}
              className="px-6 py-3 border border-white/40 text-white uppercase tracking-wider text-sm hover:border-white transition"
            >
              View Cart
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider">
              Checkout
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Complete your order in a few steps. We&apos;ll send confirmation
              details once everything looks good.
            </p>
          </div>
          <button
            onClick={() => router.push("/cart")}
            className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
          >
            Back to Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-8">
          {/* Left column - details */}
          <div className="space-y-6">
            <section className="border border-white/10 bg-black/50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
                Contact Information
              </h2>
              <div className="grid gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-black border ${
                      formErrors.fullName ? "border-red-500" : "border-white/20"
                    } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                    required
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-red-400 mt-1">
                      {formErrors.fullName}
                    </p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-black border border-white/20 text-white placeholder-gray-500 opacity-60 cursor-not-allowed"
                      required
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-400 mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-black border ${
                        formErrors.phone ? "border-red-500" : "border-white/20"
                      } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                      required
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-400 mt-1">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-white/10 bg-black/50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
                Shipping Address
              </h2>
              <div className="grid gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={formData.streetAddress}
                    onChange={(e) =>
                      handleInputChange("streetAddress", e.target.value)
                    }
                    className={`w-full px-4 py-3 bg-black border ${
                      formErrors.streetAddress
                        ? "border-red-500"
                        : "border-white/20"
                    } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                    required
                  />
                  {formErrors.streetAddress && (
                    <p className="text-xs text-red-400 mt-1">
                      {formErrors.streetAddress}
                    </p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-black border ${
                        formErrors.city ? "border-red-500" : "border-white/20"
                      } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                      required
                    />
                    {formErrors.city && (
                      <p className="text-xs text-red-400 mt-1">
                        {formErrors.city}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State / Province"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-black border ${
                        formErrors.state ? "border-red-500" : "border-white/20"
                      } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                      required
                    />
                    {formErrors.state && (
                      <p className="text-xs text-red-400 mt-1">
                        {formErrors.state}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Postal code"
                      value={formData.postalCode}
                      onChange={(e) =>
                        handleInputChange("postalCode", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-black border ${
                        formErrors.postalCode
                          ? "border-red-500"
                          : "border-white/20"
                      } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                      required
                    />
                    {formErrors.postalCode && (
                      <p className="text-xs text-red-400 mt-1">
                        {formErrors.postalCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-black border ${
                        formErrors.country
                          ? "border-red-500"
                          : "border-white/20"
                      } text-white placeholder-gray-500 focus:outline-none focus:border-white transition`}
                      required
                    />
                    {formErrors.country && (
                      <p className="text-xs text-red-400 mt-1">
                        {formErrors.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-white/10 bg-black/50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
                Payment Method
              </h2>
              <div className="space-y-4">
                <label className={`flex items-start sm:items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all duration-300 ${
                  formData.paymentMethod === "razorpay" 
                    ? "border-white bg-white/10" 
                    : "border-white/10 hover:border-white/30"
                }`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="razorpay"
                    checked={formData.paymentMethod === "razorpay"}
                    onChange={(e) =>
                      handleInputChange("paymentMethod", e.target.value)
                    }
                    className="accent-white mt-1 sm:mt-0 w-5 h-5 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-300">
                    Razorpay (Card / UPI / Net Banking)
                  </span>
                </label>
                <label className="flex items-start sm:items-center gap-3 cursor-not-allowed p-4 rounded-lg border-2 border-white/10 opacity-60">
                  <input
                    type="radio"
                    name="payment-method"
                    value="cod"
                    className="accent-gray-500 mt-1 sm:mt-0 w-5 h-5 flex-shrink-0"
                    disabled
                  />
                  <span className="text-sm text-gray-300">
                    Cash on Delivery
                  </span>
                </label>
                <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
                  <p className="text-sm text-amber-300 leading-relaxed">
                    Due to high demand, Cash on Delivery service is temporarily
                    disabled. Kindly proceed with prepaid payment methods.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="self-start rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-6">
            <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">
              {checkoutItems.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex items-start gap-3"
                >
                  <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border border-white/10">
                    <Image
                      src={getImageUrl(item.product.image)}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                      onError={(e) => {
                        console.error(
                          "Checkout image failed to load:",
                          item.product.image,
                          item.product.id
                        );
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.jpg";
                      }}
                      unoptimized={getImageUrl(item.product.image)?.startsWith("https://")}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Size: <span className="text-white">{item.size}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Qty: <span className="text-white">{item.quantity}</span>
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    ₹{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

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
              {coupon && discount > 0 && (
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
                  Free over ₹2,999
                </span>
              </div>
              <div className="flex items-center justify-between text-white font-semibold text-base pt-3 border-t border-white/10">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={processing}
              className={`w-full mt-6 py-3 text-sm font-semibold uppercase tracking-wider border border-white text-black bg-white hover:bg-gray-200 hover:border-gray-200 transition ${
                processing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {processing ? "Processing..." : "Place Order"}
            </button>

            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              By placing this order you agree to the Mollywood terms of service,
              privacy policy, and refund policy.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
