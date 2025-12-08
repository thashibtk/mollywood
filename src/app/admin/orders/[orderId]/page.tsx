"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [productMap, setProductMap] = useState<Map<string, ShopProduct>>(
    new Map()
  );
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [logisticName, setLogisticName] = useState("");
  const [showRefundInput, setShowRefundInput] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [editTrackingCode, setEditTrackingCode] = useState("");
  const [editLogisticName, setEditLogisticName] = useState("");
  const [updatingTracking, setUpdatingTracking] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      setEditTrackingCode(order.tracking_code || "");
      setEditLogisticName(order.logistic_name || "");
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (orderError) throw orderError;

      if (orderData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);

        if (itemsError) throw itemsError;

        const orderWithItems: Order = {
          ...orderData,
          shipping_address: orderData.shipping_address as any,
          order_items: itemsData || [],
        };

        setOrder(orderWithItems);

        const productIds = new Set<string>();
        itemsData?.forEach((item) => {
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
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-blue-400",
      processing: "bg-yellow-400",
      shipped: "bg-purple-400",
      delivered: "bg-emerald-400",
      cancelled: "bg-red-400",
      return: "bg-orange-400",
      refunded: "bg-gray-400",
    };
    return colors[status.toLowerCase()] || "bg-gray-400";
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateTracking = async () => {
    if (!order) return;

    if (!editTrackingCode.trim() || !editLogisticName.trim()) {
      alert("Both logistic name and tracking code are required.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to update the tracking information?\n\nLogistic: ${editLogisticName.trim()}\nTracking Code: ${editTrackingCode.trim()}`
      )
    ) {
      return;
    }

    try {
      setUpdatingTracking(true);

      const { error } = await supabase
        .from("orders")
        .update({
          tracking_code: editTrackingCode.trim(),
          logistic_name: editLogisticName.trim(),
        })
        .eq("id", order.id);

      if (error) throw error;

      setOrder({
        ...order,
        tracking_code: editTrackingCode.trim(),
        logistic_name: editLogisticName.trim(),
      });

      setIsEditingTracking(false);
    } catch (error) {
      console.error("Error updating tracking:", error);
      alert("Failed to update tracking information. Please try again.");
    } finally {
      setUpdatingTracking(false);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      confirmed: "processing",
      processing: "shipped",
      shipped: "delivered",
      return: "refunded",
    };
    return statusFlow[currentStatus.toLowerCase()] || null;
  };

  const getStatusButtonColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      processing: "bg-blue-600 hover:bg-blue-700",
      shipped: "bg-purple-600 hover:bg-purple-700",
      delivered: "bg-emerald-600 hover:bg-emerald-700",
      refunded: "bg-gray-600 hover:bg-gray-700",
    };
    return (
      statusColors[status.toLowerCase()] || "bg-gray-900 hover:bg-gray-800"
    );
  };

  const validateRefundAmount = (input: string): boolean => {
    if (!input.trim() || !order) return false;

    const enteredAmount = parseFloat(input.replace(/,/g, ""));
    if (isNaN(enteredAmount)) return false;

    return Math.abs(enteredAmount - order.total) <= 0.01;
  };

  const handleRefundAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) return;
    setRefundAmount(numericValue);
  };

  const handleStatusChange = async (
    newStatus: string,
    tracking?: string,
    logistic?: string,
    refundAmountConfirm?: string
  ) => {
    if (!order) return;

    if (newStatus.toLowerCase() === "shipped") {
      if (!tracking?.trim()) {
        alert("Tracking code is required to mark order as shipped.");
        return;
      }
      if (!logistic?.trim()) {
        alert("Logistic name is required to mark order as shipped.");
        return;
      }
    }

    if (newStatus.toLowerCase() === "refunded") {
      if (!refundAmountConfirm?.trim()) {
        alert("Please enter the refund amount to confirm.");
        return;
      }

      if (!validateRefundAmount(refundAmountConfirm)) {
        alert(
          `Amount mismatch. Please enter the exact order total: ₹${order.total.toLocaleString()}`
        );
        return;
      }
    }

    if (
      !confirm(
        `Are you sure you want to change the order status to "${newStatus}"?`
      )
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const updateData: {
        status: string;
        tracking_code?: string;
        logistic_name?: string;
      } = {
        status: newStatus,
      };

      if (newStatus.toLowerCase() === "shipped" && tracking && logistic) {
        updateData.tracking_code = tracking.trim();
        updateData.logistic_name = logistic.trim();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);

      if (error) throw error;

      // If status is being changed to refunded, also update the return status and increase stock
      if (newStatus.toLowerCase() === "refunded") {
        const { error: returnError } = await supabase
          .from("returns")
          .update({ status: "refunded" })
          .eq("order_id", order.id);

        if (returnError) {
          console.error("Error updating return status:", returnError);
          // Don't throw, just log - the order status update succeeded
        }

        // Increase stock for each order item
        try {
          const stockUpdates = new Map<
            string,
            { size: string; quantity: number }[]
          >();

          // Group items by product_id
          order.order_items.forEach((item) => {
            const productId = item.product_id;
            if (!stockUpdates.has(productId)) {
              stockUpdates.set(productId, []);
            }
            stockUpdates.get(productId)!.push({
              size: item.size,
              quantity: item.quantity,
            });
          });

          // Update stock for each product
          for (const [productId, items] of stockUpdates.entries()) {
            // Fetch current product to get sizes
            const { data: product, error: productError } = await supabase
              .from("products")
              .select("sizes")
              .eq("id", productId)
              .single();

            if (productError || !product) {
              console.error(
                `Error fetching product ${productId} for stock update:`,
                productError
              );
              continue;
            }

            // Update sizes object
            const currentSizes =
              (product.sizes as Record<string, number>) || {};
            const updatedSizes = { ...currentSizes };

            items.forEach(({ size, quantity }) => {
              const currentStock = updatedSizes[size] || 0;
              updatedSizes[size] = currentStock + quantity;
            });

            // Update product stock
            const { error: updateError } = await supabase
              .from("products")
              .update({ sizes: updatedSizes })
              .eq("id", productId);

            if (updateError) {
              console.error(
                `Error updating stock for product ${productId}:`,
                updateError
              );
            } else {
              console.log(
                `Stock increased successfully for product ${productId}`
              );
            }
          }
        } catch (stockError) {
          console.error("Error updating stock on refund:", stockError);
          // Don't fail the refund if stock update fails, but log it
        }
      }

      setOrder({
        ...order,
        status: newStatus,
        tracking_code:
          newStatus.toLowerCase() === "shipped"
            ? tracking?.trim() || null
            : order.tracking_code,
        logistic_name:
          newStatus.toLowerCase() === "shipped"
            ? logistic?.trim() || null
            : order.logistic_name,
      });

      setShowTrackingInput(false);
      setTrackingCode("");
      setLogisticName("");
      setShowRefundInput(false);
      setRefundAmount("");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">Order not found</div>
      </div>
    );
  }

  const isOrderActive = ![
    "cancelled",
    "delivered",
    "return",
    "refunded",
  ].includes(order.status.toLowerCase());

  return (
    <>
      <div className="min-h-screen bg-white text-gray-900">
        {/* Header */}
        <div className="no-print px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Orders
            </button>
            <h2 className="text-2xl font-semibold tracking-tight">
              Order {order.order_id}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(order.created_at)}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition"
          >
            Print Shipping Label
          </button>
        </div>

        <div className="no-print px-8 py-8">
          {/* Order Status Section */}
          <div className="mb-8">
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Status */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Current Status
                  </h3>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-full text-xs uppercase tracking-wider text-gray-700">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    />
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  <div className="text-xs">
                    <p className="text-gray-500">Payment Status</p>
                    <p className="font-medium text-gray-900">
                      {order.payment_status.charAt(0).toUpperCase() +
                        order.payment_status.slice(1)}
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-900">
                      {order.payment_method.charAt(0).toUpperCase() +
                        order.payment_method.slice(1)}
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-gray-500">Razorpay ID</p>
                    <p className="font-medium text-gray-900">
                      {order.razorpay_order_id?.slice(0, 10)}...
                    </p>
                  </div>
                </div>

                {/* Status Flow */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status Flow
                  </h3>
                  {order.status.toLowerCase() !== "cancelled" && (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        {[
                          "confirmed",
                          "processing",
                          "shipped",
                          "delivered",
                        ].map((status, index) => {
                          const currentIndex = [
                            "confirmed",
                            "processing",
                            "shipped",
                            "delivered",
                          ].indexOf(order.status.toLowerCase());
                          const isCompleted = index <= currentIndex;

                          return (
                            <div key={status} className="flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isCompleted ? "bg-gray-900" : "bg-gray-300"
                                }`}
                              />
                              {index < 3 && (
                                <div
                                  className={`w-8 h-0.5 ${
                                    isCompleted && index < currentIndex
                                      ? "bg-gray-900"
                                      : "bg-gray-300"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 flex-wrap">
                        {[
                          "confirmed",
                          "processing",
                          "shipped",
                          "delivered",
                        ].map((status, index, array) => (
                          <div key={status} className="flex items-center">
                            <span
                              className={
                                order.status.toLowerCase() === status
                                  ? "font-semibold text-gray-900"
                                  : ""
                              }
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                            {index < array.length - 1 && (
                              <span className="mx-1">→</span>
                            )}
                          </div>
                        ))}
                        {(order.status.toLowerCase() === "return" ||
                          order.status.toLowerCase() === "refunded") && (
                          <>
                            <span className="mx-2">|</span>
                            <span
                              className={
                                order.status.toLowerCase() === "return"
                                  ? "font-semibold text-gray-900"
                                  : ""
                              }
                            >
                              Return
                            </span>
                            <span className="mx-1">→</span>
                            <span
                              className={
                                order.status.toLowerCase() === "refunded"
                                  ? "font-semibold text-gray-900"
                                  : ""
                              }
                            >
                              Refunded
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tracking Information Section - Show when shipped or beyond */}
                      {(order.status.toLowerCase() === "shipped" ||
                        order.status.toLowerCase() === "delivered" ||
                        order.status.toLowerCase() === "return" ||
                        order.status.toLowerCase() === "refunded") &&
                        (order.tracking_code || order.logistic_name) && (
                          <div className="pt-4 mt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                              Tracking Information
                            </h3>
                            {isEditingTracking &&
                            order.status.toLowerCase() === "shipped" ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Logistic Name{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={editLogisticName}
                                    onChange={(e) =>
                                      setEditLogisticName(e.target.value)
                                    }
                                    placeholder="e.g., FedEx, DHL, India Post"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Tracking Code{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={editTrackingCode}
                                    onChange={(e) =>
                                      setEditTrackingCode(e.target.value)
                                    }
                                    placeholder="Enter tracking code"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleUpdateTracking}
                                    disabled={
                                      updatingTracking ||
                                      !editTrackingCode.trim() ||
                                      !editLogisticName.trim()
                                    }
                                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingTracking
                                      ? "Updating..."
                                      : "Save Changes"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsEditingTracking(false);
                                      setEditTrackingCode(
                                        order.tracking_code || ""
                                      );
                                      setEditLogisticName(
                                        order.logistic_name || ""
                                      );
                                    }}
                                    disabled={updatingTracking}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs space-y-1.5">
                                {order.logistic_name && (
                                  <div>
                                    <p className="text-gray-500">Logistic:</p>
                                    <p className="font-medium text-gray-900">
                                      {order.logistic_name}
                                    </p>
                                  </div>
                                )}
                                {order.tracking_code && (
                                  <div>
                                    <p className="text-gray-500">Tracking:</p>
                                    <p className="font-medium text-gray-900 font-mono">
                                      {order.tracking_code}
                                    </p>
                                  </div>
                                )}
                                {order.status.toLowerCase() === "shipped" && (
                                  <button
                                    onClick={() => setIsEditingTracking(true)}
                                    className="mt-3 px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition"
                                  >
                                    Edit Tracking
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </>
                  )}
                </div>

                {/* Change Status Actions */}
                {isOrderActive && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Change Status
                    </h3>
                    <div className="space-y-2">
                      {getNextStatus(order.status)?.toLowerCase() ===
                        "shipped" && showTrackingInput ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Logistic Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={logisticName}
                              onChange={(e) => setLogisticName(e.target.value)}
                              placeholder="e.g., FedEx, DHL, India Post"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Tracking Code{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={trackingCode}
                              onChange={(e) => setTrackingCode(e.target.value)}
                              placeholder="Enter tracking code"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  "shipped",
                                  trackingCode,
                                  logisticName
                                )
                              }
                              disabled={
                                updatingStatus ||
                                !trackingCode.trim() ||
                                !logisticName.trim()
                              }
                              className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${getStatusButtonColor(
                                "shipped"
                              )}`}
                            >
                              {updatingStatus
                                ? "Updating..."
                                : "Confirm Shipment"}
                            </button>
                            <button
                              onClick={() => {
                                setShowTrackingInput(false);
                                setTrackingCode("");
                                setLogisticName("");
                              }}
                              disabled={updatingStatus}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : getNextStatus(order.status) ? (
                        <button
                          onClick={() => {
                            const nextStatus = getNextStatus(order.status)!;
                            if (nextStatus.toLowerCase() === "shipped") {
                              setShowTrackingInput(true);
                            } else {
                              handleStatusChange(nextStatus);
                            }
                          }}
                          disabled={updatingStatus}
                          className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${getStatusButtonColor(
                            getNextStatus(order.status)!
                          )}`}
                        >
                          {updatingStatus
                            ? "Updating..."
                            : `Mark as ${
                                getNextStatus(order.status)!
                                  .charAt(0)
                                  .toUpperCase() +
                                getNextStatus(order.status)!.slice(1)
                              }`}
                        </button>
                      ) : null}

                      {order.status.toLowerCase() !== "shipped" && (
                        <button
                          onClick={() => handleStatusChange("cancelled")}
                          disabled={updatingStatus}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingStatus ? "Updating..." : "Cancel Order"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Return/Refund Actions */}
                {order.status.toLowerCase() === "delivered" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </h3>
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/returns/add?orderId=${order.order_id}`
                        )
                      }
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition"
                    >
                      Create Return
                    </button>
                  </div>
                )}

                {order.status.toLowerCase() === "return" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Change Status
                    </h3>
                    {showRefundInput ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Enter Order Total to Confirm Refund{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            Order Total: ₹{order.total.toLocaleString()}
                          </p>
                          <input
                            type="text"
                            value={refundAmount}
                            onChange={(e) =>
                              handleRefundAmountChange(e.target.value)
                            }
                            placeholder={`Enter ${order.total.toLocaleString()}`}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                            autoFocus
                          />
                          {refundAmount &&
                            !validateRefundAmount(refundAmount) && (
                              <p className="text-xs text-red-500 mt-1">
                                Amount must be exactly ₹
                                {order.total.toLocaleString()}
                              </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleStatusChange(
                                "refunded",
                                undefined,
                                undefined,
                                refundAmount
                              )
                            }
                            disabled={
                              updatingStatus ||
                              !validateRefundAmount(refundAmount)
                            }
                            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${getStatusButtonColor(
                              "refunded"
                            )}`}
                          >
                            {updatingStatus ? "Updating..." : "Confirm Refund"}
                          </button>
                          <button
                            onClick={() => {
                              setShowRefundInput(false);
                              setRefundAmount("");
                            }}
                            disabled={updatingStatus}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRefundInput(true)}
                        disabled={updatingStatus}
                        className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${getStatusButtonColor(
                          "refunded"
                        )}`}
                      >
                        Mark as Refunded
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                <div className="text-sm text-gray-900 space-y-1">
                  <p className="font-medium">{order.customer_name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.state}{" "}
                    {order.shipping_address.postalCode}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <p className="mt-2 text-gray-600">
                    Phone: {order.customer_phone}
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Customer</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">
                      {order.customer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">
                      {order.customer_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {order.customer_phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Size / Qty
                        </th>
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {order.order_items.map((item) => {
                        const product = productMap.get(item.product_id);
                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4">
                              {product ? (
                                <div className="flex items-center gap-3">
                                  <div className="relative w-16 h-16 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                                      src={product.image}
                                      alt={product.name}
                                      fill
                                      className="object-cover"
                                      sizes="64px"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-gray-900 font-medium">
                                      {item.product_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {product.category}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-gray-900 font-medium">
                                    {item.product_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Product ID: {item.product_id}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <p>Size: {item.size}</p>
                              <p>Qty: {item.quantity}</p>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                              ₹{item.price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-right text-sm font-semibold text-gray-700"
                        >
                          Subtotal:
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          ₹{order.subtotal.toLocaleString()}
                        </td>
                      </tr>
                      {order.discount > 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-4 text-right text-sm text-gray-600"
                          >
                            Discount{" "}
                            {order.coupon_code ? `(${order.coupon_code})` : ""}:
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            -₹{order.discount.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-right text-sm font-bold text-gray-900"
                        >
                          Total:
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                          ₹{order.total.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Template */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 0; }
              body * { visibility: hidden; }
              .print-shipping-label, .print-shipping-label * { visibility: visible; }
              .print-shipping-label {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 148.5mm !important;
                padding: 12mm !important;
                margin: 0 !important;
                opacity: 1 !important;
                visibility: visible !important;
                box-sizing: border-box !important;
              }
              .print-shipping-label img {
                visibility: visible !important;
                display: block !important;
                max-width: 70px !important;
                width: 70px !important;
                height: auto !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                page-break-inside: avoid !important;
              }
              .no-print { display: none !important; }
            }
          `,
        }}
      />
      <div className="print-shipping-label hidden print:block">
        <div className="bg-white h-full flex flex-col justify-between">
          <div className="flex items-start justify-between pb-4 border-b-2 border-gray-900">
            <div>
              <p className="text-base text-gray-700 font-medium">The</p>
              <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide leading-tight">
                Mollywood
              </h1>
              <p className="text-base text-gray-700 font-medium">Clothing</p>
            </div>
            <div>
              <img
                src="/qr/Mollywoodqr.png"
                alt="QR Code"
                width={70}
                height={70}
                className="object-contain block"
                style={{ display: "block", maxWidth: "70px", height: "auto" }}
                loading="eager"
              />
            </div>
          </div>

          <div className="bg-gray-900 text-white px-3 py-2 my-4 rounded">
            <div className="flex justify-between text-sm">
              <span>
                <strong>Order:</strong> {order.order_id}
              </span>
              <span>
                <strong>Date:</strong>{" "}
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="grow">
            <div className="bg-gray-900 text-white px-3 py-2 mb-3">
              <h2 className="text-lg font-bold uppercase tracking-wide">
                Ship To:
              </h2>
            </div>
            <div className="px-3 leading-relaxed">
              <p className="text-xl font-bold mb-2">{order.customer_name}</p>
              <p className="text-base">{order.shipping_address.street}</p>
              <p className="text-base">
                {order.shipping_address.city}, {order.shipping_address.state}
              </p>
              <p className="text-2xl font-bold my-2">
                {order.shipping_address.postalCode}
              </p>
              <p className="text-base">{order.shipping_address.country}</p>
              <p className="mt-3 text-sm">
                <strong>Phone:</strong> {order.customer_phone}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-gray-900 pt-3 mt-4">
            <p className="text-sm font-bold mb-2 uppercase">Return Address:</p>
            <div className="text-sm leading-snug">
              <p className="font-semibold">The Mollywood Clothing</p>
              <p>Thottumugham, Aluva</p>
              <p>Ernakulam, Kerala 679333, India</p>
            </div>
          </div>

          <div className="text-center mt-4 pt-3 border-t border-gray-300">
            <p className="text-sm font-semibold text-gray-700">
              Thank You for Your Order
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
