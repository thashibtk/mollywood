"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  customer_phone: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  tracking_code: string | null;
  logistic_name: string | null;
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

const STATUS_FLOW = [
  { label: "Order Placed", status: "confirmed" },
  { label: "Processing", status: "processing" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
];

const RETURN_STATUS_FLOW = [
  { label: "Return", status: "return" },
  { label: "Refunded", status: "refunded" },
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUserAuth();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .single();

        if (orderError || !orderData) {
          console.error("Error fetching order:", orderError);
          setLoading(false);
          return;
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
        }

        const orderWithItems: Order = {
          id: orderData.id,
          order_id: orderData.order_id,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          shipping_address:
            orderData.shipping_address as Order["shipping_address"],
          subtotal: parseFloat(orderData.subtotal),
          discount: parseFloat(orderData.discount || 0),
          total: parseFloat(orderData.total),
          coupon_code: orderData.coupon_code,
          status: orderData.status,
          payment_status: orderData.payment_status,
          payment_method: orderData.payment_method,
          tracking_code: orderData.tracking_code || null,
          logistic_name: orderData.logistic_name || null,
          created_at: orderData.created_at,
          order_items: itemsData || [],
        };

        setOrder(orderWithItems);

        const productIds = [
          ...new Set(itemsData?.map((item) => item.product_id) || []),
        ];
        if (productIds.length > 0) {
          const productData = await getProductsByIds(productIds);
          setProducts(productData);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIndex = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "return" || statusLower === "refunded") {
      return -1;
    }
    if (statusLower === "confirmed") return 0;
    if (statusLower === "processing") return 1;
    if (statusLower === "shipped") return 2;
    if (statusLower === "delivered") return 3;
    return 0;
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

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  if (!order) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <StarsBackground />
        <Header />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
          <button
            onClick={() => router.push("/orders")}
            className="mb-6 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition"
          >
            ← Back to Orders
          </button>
          <div className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-gray-300">Order not found</p>
            <button
              onClick={() => router.push("/orders")}
              className="mt-4 px-6 py-3 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              View All Orders
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isInMainFlow = currentStatusIndex >= 0;

  const showTrackingInfo =
    (order.status.toLowerCase() === "shipped" ||
      order.status.toLowerCase() === "delivered" ||
      order.status.toLowerCase() === "return" ||
      order.status.toLowerCase() === "refunded") &&
    (order.tracking_code || order.logistic_name);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden main-wrapper">
      <div className="no-print">
        <StarsBackground />
        <Header />
      </div>

      {/* Invoice Print Template */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print {
            display: none !important;
          }
          .main-wrapper {
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          .print-invoice {
            display: block !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}} />

      <div className="print-invoice hidden print:block bg-white text-black p-6 max-w-[210mm] mx-auto">
        {/* Modern Invoice Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-start gap-4">
            <img
              src="/logo/logo.jpg"
              alt="Mollywood Logo"
              width={80}
              height={80}
              className="object-contain rounded-full"
            />
            <div className="text-center mt-2">
              <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">The</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight ">MOLLYWOOD</p>
              <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Clothing</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-extrabold text-gray-100 tracking-tighter mb-1">INVOICE</h2>
            <p className="text-base font-semibold text-gray-900">#{order.order_id}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
            <div className="text-xs text-gray-900 leading-relaxed">
              <p className="font-bold text-sm mb-0.5">{order.customer_name}</p>
              <p>{order.shipping_address.street}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}
              </p>
              <p>{order.shipping_address.country}</p>
              <div className="mt-2 space-y-0.5 text-gray-600">
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 flex items-center justify-center rounded-full bg-gray-100 text-[8px]">📞</span>
                  {order.customer_phone}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-3 h-3 flex items-center justify-center rounded-full bg-gray-100 text-[8px]">✉️</span>
                  {order.customer_email}
                </p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Order Details</h3>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono font-medium text-gray-900">{order.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-900 capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-800 capitalize">
                    {order.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-900">
                <th className="py-2 text-left text-[10px] font-bold text-gray-900 uppercase tracking-wider w-1/2">Item Description</th>
                <th className="py-2 text-center text-[10px] font-bold text-gray-900 uppercase tracking-wider">Size</th>
                <th className="py-2 text-center text-[10px] font-bold text-gray-900 uppercase tracking-wider">Qty</th>
                <th className="py-2 text-right text-[10px] font-bold text-gray-900 uppercase tracking-wider">Price</th>
                <th className="py-2 text-right text-[10px] font-bold text-gray-900 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.order_items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-4">
                      <p className="font-semibold text-xs text-gray-900">{item.product_name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">SKU: {products.find(p => p.id === item.product_id)?.sku || item.product_id}</p>
                  </td>
                  <td className="py-2 text-center text-xs text-gray-600 font-medium">{item.size}</td>
                  <td className="py-2 text-center text-xs text-gray-600 font-medium">{item.quantity}</td>
                  <td className="py-2 text-right text-xs text-gray-600">₹{item.price.toLocaleString()}</td>
                  <td className="py-2 text-right text-xs font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-6">
          <div className="w-1/2 space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Discount {order.coupon_code && <span className="text-[10px] bg-emerald-50 px-1 py-0.5 rounded ml-1">{order.coupon_code}</span>}</span>
                <span className="font-medium">-₹{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-600">
              <span>Shipping</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="border-t border-gray-900 pt-2 mt-2 flex justify-between items-end">
              <div>
                <span className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Total Amount</span>
                <span className="text-[10px] text-gray-500">Including all taxes</span>
              </div>
              <span className="text-xl font-bold text-gray-900">₹{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap justify-between items-start gap-6">
            <div className="text-[10px] text-black max-w-md space-y-0.5">
              <p className="font-bold text-gray-900 uppercase tracking-wider mb-1">Terms & Conditions</p>
              <p>• All sales are final. Returns accepted within 7 days of delivery for eligible items.</p>
              <p>• Items must be unworn and in original condition with tags attached.</p>
              <p>• For support, please visit the <a href="https://themollywoodclothing.com/contact" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">themollywoodclothing.com/contact</a></p>
            </div>
            
            <div className="flex gap-2 items-start">
              <div className="text-left">
                <img
                  src="/qr/Mollywoodqr.png"
                  alt="QR Code"
                  width={48}
                  height={48}
                  className="mb-1 opacity-80"
                />
                <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Thank You</p>
              </div>
              
              <div className="text-[10px] text-black leading-tight">
                <p className="font-bold text-gray-900 uppercase tracking-wider mb-1">Contact Us</p>
                <p>Thottumugham, Aluva</p>
                <p>Ernakulam, Kerala 679333, India</p>
                <p>info@themollywoodclothing.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 no-print">
        <button
          onClick={() => router.push("/orders")}
          className="mb-6 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition"
        >
          ← Back to Orders
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold uppercase tracking-wider whitespace-nowrap">
              Order #{order.order_id}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintInvoice}
              className="px-4 py-2 border border-white/30 text-white text-xs uppercase tracking-wider hover:bg-white hover:text-black transition"
            >
              Download Invoice
            </button>
            <span
              className={`px-4 py-2 border text-xs uppercase tracking-wider rounded-full ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-8">
          <div className="space-y-6">
            <section className="border border-white/10 bg-black/50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
                Items in this Order
              </h2>
              {order.order_items.length === 0 ? (
                <p className="text-sm text-gray-400">No items found.</p>
              ) : (
                <div className="space-y-4">
                  {order.order_items.map((item) => {
                    const product = products.find(
                      (p) => p.id === item.product_id
                    );
                    return (
                      <div key={item.id} className="flex items-start gap-4">
                        <div className="relative w-14 h-14 overflow-hidden rounded-md border border-white/10">
                          {product?.image ? (
                            <Image
                              src={product.image}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                              sizes="56px"
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
                          <h3 className="text-sm font-semibold text-white line-clamp-1">
                            {item.product_name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            Size:{" "}
                            <span className="text-white">{item.size}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Qty:{" "}
                            <span className="text-white">{item.quantity}</span>
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-white whitespace-nowrap">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="border border-white/10 bg-black/50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
                Shipping Timeline
              </h2>
              <div className="space-y-4">
                {STATUS_FLOW.map((step, index) => {
                  const isCompleted =
                    isInMainFlow && index <= currentStatusIndex;
                  const isCurrent =
                    isInMainFlow && index === currentStatusIndex;
                  const isShippedStep = step.status === "shipped";

                  return (
                    <div key={step.label}>
                      <div className="flex gap-3 items-start text-sm text-gray-300">
                        <span
                          className={`mt-1 w-2 h-2 rounded-full ${
                            isCompleted ? "bg-emerald-400" : "bg-gray-600"
                          }`}
                        />
                        <div className="flex-1">
                          <p
                            className={`font-semibold uppercase tracking-wider ${
                              isCurrent ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 text-xs text-emerald-400">
                                (Current)
                              </span>
                            )}
                          </p>
                          {isCurrent && step.status !== "shipped" && (
                            <p className="text-xs text-gray-400 mt-1">
                              Your order is currently being processed
                            </p>
                          )}
                        </div>
                      </div>
                      {isShippedStep && showTrackingInfo && (
                        <div className="ml-5 mt-3 mb-2">
                          <div className="text-sm">
                            <p className="text-white">
                              <span className="text-gray-400">Track:</span>{" "}
                              {order.logistic_name && (
                                <span className="text-white">
                                  {order.logistic_name}
                                </span>
                              )}
                              {order.logistic_name && order.tracking_code && (
                                <span className="text-gray-500"> - </span>
                              )}
                              {order.tracking_code && (
                                <span className="text-white font-mono">
                                  {order.tracking_code}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(order.status.toLowerCase() === "return" ||
                  order.status.toLowerCase() === "refunded") && (
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="space-y-4">
                      {RETURN_STATUS_FLOW.map((step) => {
                        const statusLower = order.status.toLowerCase();
                        const isReturn = statusLower === "return";
                        const isRefunded = statusLower === "refunded";
                        const isCompleted =
                          (step.status === "return" && isReturn) ||
                          (step.status === "refunded" && isRefunded);
                        const isCurrent =
                          (step.status === "return" && isReturn) ||
                          (step.status === "refunded" && isRefunded);

                        return (
                          <div
                            key={step.label}
                            className="flex gap-3 items-start text-sm text-gray-300"
                          >
                            <span
                              className={`mt-1 w-2 h-2 rounded-full ${
                                isCompleted ? "bg-orange-400" : "bg-gray-600"
                              }`}
                            />
                            <div>
                              <p
                                className={`font-semibold uppercase tracking-wider ${
                                  isCurrent ? "text-white" : "text-gray-400"
                                }`}
                              >
                                {step.label}
                                {isCurrent && (
                                  <span className="ml-2 text-xs text-orange-400">
                                    (Current)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="border border-white/10 bg-black/60 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-lg font-semibold uppercase tracking-wider mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>
                      Discount
                      {order.coupon_code && ` (${order.coupon_code})`}
                    </span>
                    <span>-₹{order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-400">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex items-center justify-between text-white font-semibold text-base pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                <p>
                  Payment Status:{" "}
                  <span className="text-white">{order.payment_status}</span>
                </p>
                <p className="mt-1">
                  Payment Method:{" "}
                  <span className="text-white">{order.payment_method}</span>
                </p>
              </div>
              <button
                onClick={() => router.push("/orders")}
                className="w-full mt-6 py-3 text-sm font-semibold uppercase tracking-wider border border-white text-black bg-white hover:bg-gray-200 hover:border-gray-200 transition"
              >
                View All Orders
              </button>
            </section>

            <section className="border border-white/10 bg-black/60 backdrop-blur-md rounded-xl p-6 text-sm text-gray-300 space-y-2">
              <h3 className="text-base font-semibold text-white uppercase tracking-wider mb-2">
                Delivery Address
              </h3>
              <p className="text-white">{order.customer_name}</p>
              <p>{order.shipping_address.street}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.postalCode}
              </p>
              <p>{order.shipping_address.country}</p>
              <p className="mt-2">Phone: {order.customer_phone}</p>
              <p>Email: {order.customer_email}</p>
            </section>
          </div>
        </div>
      </div>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}