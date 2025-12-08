"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { useUserAuth } from "@/context/UserAuthContext";
import { getProductsByIds } from "@/lib/productHelpers";
import { Product as ShopProduct } from "@/types/product";
import ScorpioLoader from "@/components/ScorpioLoader";

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  price: number;
  product?: ShopProduct;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useUserAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch orders for the current user
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          setLoading(false);
          return;
        }

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Fetch order items for all orders
        const orderIds = ordersData.map((order) => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
        }

        // Combine orders with their items
        const ordersWithItems: Order[] = ordersData.map((order) => ({
          id: order.id,
          order_id: order.order_id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          total: parseFloat(order.total),
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
          order_items:
            itemsData?.filter((item) => item.order_id === order.id) || [],
        }));

        setOrders(ordersWithItems);

        // Fetch product details for all items
        const productIds = [
          ...new Set(itemsData?.map((item) => item.product_id) || []),
        ];
        if (productIds.length > 0) {
          const productData = await getProductsByIds(productIds);
          setProducts(productData);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "processing":
        return "border-emerald-400/60 text-emerald-300";
      case "shipped":
        return "border-blue-400/60 text-blue-300";
      case "delivered":
        return "border-green-400/60 text-green-300";
      case "cancelled":
        return "border-red-400/60 text-red-300";
      case "return":
        return "border-orange-400/60 text-orange-300";
      case "refunded":
        return "border-gray-400/60 text-gray-300";
      default:
        return "border-gray-400/60 text-gray-300";
    }
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider mb-2">
          Orders
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-10">
          Review your order history and track deliveries.
        </p>

        {!user ? (
          <div className="border border-white/30 bg-black/40 backdrop-blur-sm rounded-xl p-6 text-sm text-gray-300 space-y-4">
            <p>
              <span className="font-semibold text-white">Please log in:</span>{" "}
              You need to be logged in to view your orders.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-white/30 bg-black/40 backdrop-blur-sm rounded-xl p-6 text-sm text-gray-300 space-y-4">
            <p>
              <span className="font-semibold text-white">No Orders Yet:</span>{" "}
              You haven&apos;t placed any orders yet.
            </p>
            <p>
              When you place an order, you&apos;ll be able to review past
              purchases, check your order status, and track deliveries from this
              page.
            </p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-4 px-6 py-3 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-white/30 bg-black/40 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Order ID
                    </p>
                    <p className="text-sm text-white font-semibold uppercase tracking-wider">
                      {order.order_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Order Date
                    </p>
                    <p className="text-sm text-gray-200">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 border text-xs uppercase tracking-wider rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          order.status.toLowerCase() === "delivered"
                            ? "bg-green-400"
                            : order.status.toLowerCase() === "cancelled"
                            ? "bg-red-400"
                            : order.status.toLowerCase() === "return"
                            ? "bg-orange-400"
                            : order.status.toLowerCase() === "refunded"
                            ? "bg-gray-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Total
                    </p>
                    <p className="text-sm text-white font-semibold">
                      ₹{order.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.order_items.map((item) => {
                    const product = products.find(
                      (p) => p.id === item.product_id
                    );
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 text-sm text-gray-300"
                      >
                        <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border border-white/10">
                          {product?.image ? (
                            <Image
                              src={product.image}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold line-clamp-1">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Size:{" "}
                            <span className="text-white">{item.size}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Qty:{" "}
                            <span className="text-white">{item.quantity}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/orders/${order.order_id}`)}
                    className="px-5 py-2 border border-white text-white uppercase tracking-wider text-xs hover:bg-white hover:text-black transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
