"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [orderType, setOrderType] = useState<
    "all" | "confirmed" | "processing" | "shipped" | "pending"
  >(
    (searchParams.get("type") as
      | "all"
      | "confirmed"
      | "processing"
      | "shipped"
      | "pending") || "confirmed"
  );
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    confirmed: 0,
    processing: 0,
    shipped: 0,
    pending: 0,
  });
  const [tempDateFrom, setTempDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [tempDateTo, setTempDateTo] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [activePreset, setActivePreset] = useState<number | null>(7);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchStatusCounts();
  }, [currentPage, statusFilter, orderType, dateFrom, dateTo]);

  const orders = useMemo(() => {
    if (!searchQuery) return allOrders;
    
    const query = searchQuery.toLowerCase();
    return allOrders.filter(
      (order) =>
        order.order_id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.customer_phone.toLowerCase().includes(query)
    );
  }, [allOrders, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase.from("orders").select("*", { count: "exact" });

      // Apply order type filter (only for specific status tabs, not "all")
      if (orderType === "confirmed") {
        query = query.eq("status", "confirmed");
      } else if (orderType === "processing") {
        query = query.eq("status", "processing");
      } else if (orderType === "shipped") {
        query = query.eq("status", "shipped");
      } else if (orderType === "pending") {
        query = query.in("status", ["confirmed", "processing", "shipped"]);
      }
      // "all" shows all orders regardless of status

      // Apply status filter (only for "all" tab)
      if (orderType === "all" && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply search filter
      // if (searchQuery) {
      //   query = query.or(
      //     `order_id.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`
      //   );
      // }

      // Apply date filters (only for "all" tab)
      if (orderType === "all") {
        if (dateFrom) {
          query = query.gte("created_at", dateFrom);
        }
        if (dateTo) {
          // Add one day to include the entire end date
          const endDate = new Date(dateTo);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt("created_at", endDate.toISOString());
        }
      }

      // Get total count for pagination
      const { count } = await query;
      setTotalOrders(count || 0);

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      // Order by created_at descending
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      if (error) throw error;
      setAllOrders((data as Order[]) || []);
      // setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Build base query for stats (no pagination, no search)
      let statsQuery = supabase.from("orders").select("total, status");

      // Apply date filters if on "all" tab
      if (orderType === "all") {
        if (dateFrom) {
          statsQuery = statsQuery.gte("created_at", dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setDate(endDate.getDate() + 1);
          statsQuery = statsQuery.lt("created_at", endDate.toISOString());
        }
      }

      const { data, error } = await statsQuery;

      if (error) throw error;

      const ordersData = (data || []) as { total: number; status: string }[];

      // Calculate statistics
      const totalOrders = ordersData.length;
      const totalAmount = ordersData.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

      setStats({
        totalOrders,
        totalAmount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      // Fetch counts for each status
      const [confirmedResult, processingResult, shippedResult, pendingResult] =
        await Promise.all([
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "confirmed"),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "processing"),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", "shipped"),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .in("status", ["confirmed", "processing", "shipped"]),
        ]);

      setStatusCounts({
        confirmed: confirmedResult.count || 0,
        processing: processingResult.count || 0,
        shipped: shippedResult.count || 0,
        pending: pendingResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-blue-400",
      processing: "bg-yellow-400",
      shipped: "bg-purple-400",
      delivered: "bg-emerald-400",
      cancelled: "bg-red-400",
      refunded: "bg-gray-400",
    };
    return colors[status.toLowerCase()] || "bg-gray-400";
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  const handleOrderTypeChange = (
    type: "all" | "confirmed" | "processing" | "shipped" | "pending"
  ) => {
    setOrderType(type);
    setCurrentPage(1);
    // Reset filters when switching tabs
    if (type !== "all") {
      setStatusFilter("all");
      setDateFrom("");
      setDateTo("");
    }
    router.push(`/admin/orders${type !== "confirmed" ? `?type=${type}` : ""}`);
  };

  const handlePresetChange = (days: number) => {
    setActivePreset(days);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];

    setDateFrom(fromStr);
    setDateTo(toStr);
    setTempDateFrom(fromStr);
    setTempDateTo(toStr);
  };

  const handleResetFilters = () => {
    handlePresetChange(7);
  };

  const handleApplyFilters = () => {
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setActivePreset(null);
  };

  return (
    <>

      <div className="min-h-screen bg-white text-gray-900">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Manage Orders
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                View and manage all customer orders from the database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition no-print"
              >
                Print
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => handleOrderTypeChange("confirmed")}
              className={`relative px-4 py-2 text-sm font-medium transition ${
                orderType === "confirmed"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {statusCounts.confirmed > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {statusCounts.confirmed > 99 ? "99+" : statusCounts.confirmed}
                </span>
              )}
              Confirmed Orders
            </button>
            <button
              onClick={() => handleOrderTypeChange("processing")}
              className={`relative px-4 py-2 text-sm font-medium transition ${
                orderType === "processing"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {statusCounts.processing > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-yellow-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {statusCounts.processing > 99
                    ? "99+"
                    : statusCounts.processing}
                </span>
              )}
              Processing Orders
            </button>
            <button
              onClick={() => handleOrderTypeChange("shipped")}
              className={`relative px-4 py-2 text-sm font-medium transition ${
                orderType === "shipped"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {statusCounts.shipped > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {statusCounts.shipped > 99 ? "99+" : statusCounts.shipped}
                </span>
              )}
              Shipped Orders
            </button>
            <button
              onClick={() => handleOrderTypeChange("pending")}
              className={`relative px-4 py-2 text-sm font-medium transition ${
                orderType === "pending"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {statusCounts.pending > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {statusCounts.pending > 99 ? "99+" : statusCounts.pending}
                </span>
              )}
              Pending Orders
            </button>
            <button
              onClick={() => handleOrderTypeChange("all")}
              className={`px-4 py-2 text-sm font-medium transition ${
                orderType === "all"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Orders
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Overview Cards - Only show on "All Orders" tab */}
          {orderType === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
                      Total Orders
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalOrders.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{stats.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters - Only show for "All Orders" tab */}
          {orderType === "all" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 no-print">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePresetChange(0)} // Today
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg transition ${
                      activePreset === 0
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handlePresetChange(7)}
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg transition ${
                      activePreset === 7
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handlePresetChange(30)}
                    className={`px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg transition ${
                      activePreset === 30
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Last 30 Days
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">From:</label>
                    <input
                      type="date"
                      value={tempDateFrom}
                      onChange={(e) => {
                        setActivePreset(null);
                        setTempDateFrom(e.target.value);
                      }}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">To:</label>
                    <input
                      type="date"
                      value={tempDateTo}
                      onChange={(e) => {
                        setActivePreset(null);
                        setTempDateTo(e.target.value);
                      }}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <button
                    onClick={handleApplyFilters}
                    className="px-4 py-2 text-xs uppercase tracking-wider bg-gray-900 text-white rounded-lg hover:bg-black transition"
                  >
                    Filter
                  </button>
                  {activePreset !== 7 && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Search and Status Filter Row */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {/* Search - 75% width */}
              <div className="w-3/4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by order ID, name, or email..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              {/* Status Filter - 25% width */}
              <div className="w-1/4">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="return">Return</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
            </div>
          )}

          {/* Search only for specific status tabs */}
          {orderType !== "all" && (
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by order ID, name, or email..."
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 w-full max-w-md"
              />
            </div>
          )}

          {/* Orders Table */}
          {loading ? (
            <ScorpioLoader />
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No orders found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500 no-print">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-semibold">
                          {order.order_id}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {order.customer_email}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {order.customer_phone}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                          ₹{order.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-full text-xs uppercase tracking-wider text-gray-700`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                                order.status
                              )}`}
                            />
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              router.push(`/admin/orders/${order.order_id}`)
                            }
                            className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition no-print"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Only show for "All Orders" tab or when there are multiple pages */}
              {(orderType === "all" || totalPages > 1) && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)} of{" "}
                    {totalOrders} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center gap-1">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 text-sm border rounded-lg ${
                                currentPage === page
                                  ? "border-gray-900 bg-gray-900 text-white"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-orders-table,
            .print-orders-table * {
              visibility: visible;
            }
            .print-orders-table {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `,
        }}
      />

      {/* Print Template */}
      <div className="print-orders-table hidden print:block">
        <div className="bg-white">
          {/* Header with Logo and QR - Left aligned */}
          <div className="flex items-start justify-between pb-4 mb-6 border-b-2 border-gray-900">
            <div className="flex items-center gap-4">
              {/* Rounded Logo */}
              <img
                src="/logo/logo.jpg"
                alt="Mollywood Logo"
                width={80}
                height={80}
                className="object-cover rounded-full"
              />
              <div className="flex flex-col items-center">
                {/* Centered "The" relative to Mollywood */}
                <p className="text-sm text-gray-600 uppercase tracking-wide">
                  The
                </p>
                
                <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide leading-tight">
                  Mollywood
                </h1>
                
                {/* Centered "Clothing" relative to Mollywood */}
                <p className="text-sm text-gray-600 uppercase tracking-wide">
                  Clothing
                </p>
              </div>
            </div>
          </div>

          {/* Report Info & Summary */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Orders Report
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-sm">
                {/* Column 1: Generated On */}
                <div>
                  <p className="text-gray-600 font-medium">Generated On:</p>
                  <p className="text-gray-900">
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Column 2: Filter or Date Range or Total Orders */}
                <div>
                  {orderType !== "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Filter:</p>
                      <p className="text-gray-900">
                        {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Orders
                      </p>
                    </>
                  ) : orderType === "all" && (dateFrom || dateTo) ? (
                    <>
                      <p className="text-gray-600 font-medium">Date Range:</p>
                      <p className="text-gray-900">
                        {dateFrom
                          ? new Date(dateFrom).toLocaleDateString("en-US")
                          : "Start"}{" "}
                        to{" "}
                        {dateTo
                          ? new Date(dateTo).toLocaleDateString("en-US")
                          : "End"}
                      </p>
                    </>
                  ) : orderType === "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Column 3: Total Orders or empty */}
                <div>
                  {orderType === "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </>
                  ) : (
                    <div className="h-full"></div>
                  )}
                </div>

                {/* Column 4: Total Amount or empty */}
                <div>
                  {orderType === "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{stats.totalAmount.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <div className="h-full"></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-700 px-3 py-2 text-left font-semibold">
                  Order ID
                </th>
                <th className="border border-gray-700 px-3 py-2 text-left font-semibold">
                  Customer
                </th>
                <th className="border border-gray-700 px-3 py-2 text-left font-semibold">
                  Email
                </th>
                <th className="border border-gray-700 px-3 py-2 text-left font-semibold">
                  Phone
                </th>
                <th className="border border-gray-700 px-3 py-2 text-right font-semibold">
                  Total
                </th>
                <th className="border border-gray-700 px-3 py-2 text-center font-semibold">
                  Status
                </th>
                <th className="border border-gray-700 px-3 py-2 text-left font-semibold">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 px-3 py-2 font-medium">
                    {order.order_id}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {order.customer_name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs">
                    {order.customer_email}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {order.customer_phone}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    ₹{order.total.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 rounded">
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          

          {/* Footer - Split layout */}
          <div className="mt-8 pt-4 border-t border-gray-300 flex items-center justify-between">
            {/* Left side text */}
            <div className="text-left max-w-2/3">
              <p className="text-xs text-gray-500">
                This is a computer-generated report from The Mollywood Clothing
              </p>
              <p className="text-xs text-gray-500 mt-1">
                For inquiries, info@themollywoodclothing.com
              </p>
            </div>
            
            {/* Right side QR code */}
            <div className="flex-shrink-0 mt-4">
              <img
                src="/qr/Mollywoodqr.png"
                alt="Mollywood QR Code"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
