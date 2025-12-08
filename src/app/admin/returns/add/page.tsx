"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getProductsByIds } from "@/lib/productHelpers";
import { Product as ShopProduct } from "@/types/product";
import ScorpioLoader from "@/components/ScorpioLoader";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  status: string;
  order_items?: OrderItem[];
}

function AddReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId");

  const [orderId, setOrderId] = useState(urlOrderId || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [productMap, setProductMap] = useState<Map<string, ShopProduct>>(
    new Map()
  );

  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
      fetchOrder(urlOrderId);
    }
  }, [urlOrderId]);

  const fetchOrder = async (orderIdToFetch: string) => {
    if (!orderIdToFetch || !orderIdToFetch.trim()) {
      setError("Please enter an Order ID");
      return;
    }

    try {
      setLoading(true);
      setSearching(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          "id, order_id, customer_name, customer_email, customer_phone, subtotal, discount, total, coupon_code, status"
        )
        .eq("order_id", orderIdToFetch.trim())
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Order not found");
        return;
      }

      if (data.status.toLowerCase() !== "delivered") {
        setError("Returns can only be created for delivered orders");
        return;
      }

      // Check if return already exists
      const { data: existingReturn, error: returnError } = await supabase
        .from("returns")
        .select("id")
        .eq("order_id", data.id)
        .single();

      if (existingReturn) {
        setError("A return already exists for this order");
        return;
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", data.id);

      if (itemsError) throw itemsError;

      setOrder({
        ...data,
        order_items: itemsData || [],
      });

      // Fetch product details for images
      if (itemsData && itemsData.length > 0) {
        const productIds = new Set<string>();
        itemsData.forEach((item) => {
          productIds.add(item.product_id);
        });

        if (productIds.size > 0) {
          const products = await getProductsByIds(Array.from(productIds));
          const map = new Map<string, ShopProduct>();
          products.forEach((product) => {
            map.set(product.id, product);
          });
          setProductMap(map);
        }
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.message || "Failed to fetch order");
      setOrder(null);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearchOrder = () => {
    if (orderId.trim()) {
      fetchOrder(orderId.trim());
    } else {
      setError("Please enter an Order ID");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("Please provide a reason for the return");
      return;
    }

    if (!order) {
      setError("Order information is missing");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const { error: insertError } = await supabase.from("returns").insert({
        order_id: order.id,
        reason: reason.trim(),
        status: "return",
      });

      if (insertError) throw insertError;

      // Update order status to 'return'
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "return" })
        .eq("id", order.id);

      if (updateError) throw updateError;

      router.push("/admin/returns");
    } catch (err: any) {
      console.error("Error creating return:", err);
      setError(err.message || "Failed to create return");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && searching) {
    return <ScorpioLoader />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-semibold tracking-tight">Create Return</h2>
        <p className="text-sm text-gray-500 mt-1">
          Create a return request for a delivered order
        </p>
      </div>

      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Order ID Search Section */}
          {!order && (
            <div className="mb-6 border border-gray-200 rounded-xl bg-white shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Search Order</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchOrder();
                    }
                  }}
                  placeholder="Enter Order ID (e.g., MO-1093)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSearchOrder}
                  disabled={loading || !orderId.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          )}

          {order && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Top Section: Product Details (Left) and Order Information (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Product Details */}
                <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Product Details
                  </h3>
                  {order.order_items && order.order_items.length > 0 ? (
                    <div className="space-y-4">
                      {order.order_items.map((item) => {
                        const product = productMap.get(item.product_id);
                        return (
                          <div
                            key={item.id}
                            className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-start gap-4">
                              {/* Product Image */}
                              {product ? (
                                <div className="relative w-20 h-20 overflow-hidden rounded-md border border-gray-200 shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-md border border-gray-200 shrink-0 flex items-center justify-center">
                                  <svg
                                    className="w-8 h-8 text-gray-400"
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
                                </div>
                              )}

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">
                                      {item.product_name}
                                    </p>
                                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                                      <p>
                                        Size:{" "}
                                        <span className="font-medium">
                                          {item.size}
                                        </span>
                                      </p>
                                      <p>
                                        Quantity:{" "}
                                        <span className="font-medium">
                                          {item.quantity}
                                        </span>
                                      </p>
                                      <p>
                                        Price:{" "}
                                        <span className="font-medium">
                                          ₹{item.price.toLocaleString()}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-gray-900">
                                      ₹
                                      {(
                                        item.price * item.quantity
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Subtotal
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">
                            Subtotal
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{order.subtotal.toLocaleString()}
                          </p>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              Discount
                              {order.coupon_code && (
                                <span className="ml-1 text-xs">
                                  ({order.coupon_code})
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              -₹{order.discount.toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700">
                            Order Total
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{order.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No items found</p>
                  )}
                </div>

                {/* Right: Order Information */}
                <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Order Information
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Order ID</p>
                      <p className="font-medium text-gray-900">
                        {order.order_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Customer Name</p>
                      <p className="font-medium text-gray-900">
                        {order.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Email</p>
                      <p className="font-medium text-gray-900">
                        {order.customer_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">
                        {order.customer_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Order Status</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {order.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Return Details (Full Width) */}
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Return Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Return <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the reason for return (e.g., Size too small, Defective product, Changed mind, etc.)"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Please provide a detailed reason for the return
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating..." : "Create Return"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AddReturnPage() {
  return (
    <Suspense fallback={<ScorpioLoader />}>
      <AddReturnPageContent />
    </Suspense>
  );
}
