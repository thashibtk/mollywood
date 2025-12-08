"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

interface Return {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  created_at: string;
  order?: {
    order_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total: number;
  };
}

function AdminReturnsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allReturns, setAllReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [returnType, setReturnType] = useState<"all" | "return">(
    (searchParams.get("type") as "all" | "return") || "return"
  );
  const [stats, setStats] = useState({
    totalReturns: 0,
    totalAmount: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    return: 0,
  });

  const [tempDateFrom, setTempDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [tempDateTo, setTempDateTo] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [activePreset, setActivePreset] = useState<number | null>(7);

  useEffect(() => {
    fetchReturns();
    fetchStats();
    fetchStatusCounts();
  }, [returnType, statusFilter, dateFrom, dateTo]);

  const returns = useMemo(() => {
    if (!searchQuery) return allReturns;
    
    const query = searchQuery.toLowerCase();
    return allReturns.filter(
      (ret) =>
        ret.order?.order_id.toLowerCase().includes(query) ||
        ret.order?.customer_name.toLowerCase().includes(query) ||
        ret.order?.customer_email.toLowerCase().includes(query) ||
        ret.order?.customer_phone.toLowerCase().includes(query) ||
        ret.reason.toLowerCase().includes(query)
    );
  }, [allReturns, searchQuery]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      let query = supabase.from("returns").select("*");

      // Apply return type filter
      if (returnType === "return") {
        query = query.eq("status", "return");
      }
      // "all" shows all returns regardless of status

      // Apply status filter (only for "all" tab)
      if (returnType === "all" && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply search filter
      if (searchQuery) {
        // We'll filter after fetching orders since we need order details
      }

      // Apply date filters (only for "all" tab)
      if (returnType === "all") {
        if (dateFrom) {
          query = query.gte("created_at", dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt("created_at", endDate.toISOString());
        }
      }

      query = query.order("created_at", { ascending: false });

      const { data: returnsData, error: returnsError } = await query;

      if (returnsError) throw returnsError;

      if (returnsData) {
        // Fetch order details for each return
        const orderIds = returnsData.map((r) => r.order_id);
        if (orderIds.length > 0) {
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select(
              "id, order_id, customer_name, customer_email, customer_phone, total"
            )
            .in("id", orderIds);

          if (ordersError) throw ordersError;

          const orderMap = new Map();
          ordersData?.forEach((order) => {
            orderMap.set(order.id, order);
          });

          let returnsWithOrders = returnsData.map((ret) => ({
            ...ret,
            order: orderMap.get(ret.order_id),
          }));

          // Apply search filter if needed
          // if (searchQuery) {
          //   const query = searchQuery.toLowerCase();
          //   returnsWithOrders = returnsWithOrders.filter(
          //     (ret) =>
          //       ret.order?.order_id.toLowerCase().includes(query) ||
          //       ret.order?.customer_name.toLowerCase().includes(query) ||
          //       ret.order?.customer_email.toLowerCase().includes(query) ||
          //       ret.order?.customer_phone.toLowerCase().includes(query) ||
          //       ret.reason.toLowerCase().includes(query)
          //   );
          // }

          setAllReturns(returnsWithOrders);
        } else {
          setAllReturns([]);
        }
      } else {
        setAllReturns([]);
      }
    } catch (error) {
      console.error("Error fetching returns:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let statsQuery = supabase
        .from("returns")
        .select("id, order_id, created_at");

      // Apply date filters if on "all" tab
      if (returnType === "all") {
        if (dateFrom) {
          statsQuery = statsQuery.gte("created_at", dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setDate(endDate.getDate() + 1);
          statsQuery = statsQuery.lt("created_at", endDate.toISOString());
        }
      }

      const { data: returnsData, error: returnsError } = await statsQuery;
      if (returnsError) throw returnsError;

      if (returnsData && returnsData.length > 0) {
        const orderIds = returnsData.map((r) => r.order_id);
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("total")
          .in("id", orderIds);

        if (ordersError) throw ordersError;

        const totalAmount = (ordersData || []).reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        );

        setStats({
          totalReturns: returnsData.length,
          totalAmount,
        });
      } else {
        setStats({ totalReturns: 0, totalAmount: 0 });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const { count } = await supabase
        .from("returns")
        .select("id", { count: "exact", head: true })
        .eq("status", "return");

      setStatusCounts({
        return: count || 0,
      });
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  const handleStatusUpdate = async (returnId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("returns")
        .update({ status: newStatus })
        .eq("id", returnId);

      if (error) throw error;

      // Update order status if refunded
      if (newStatus === "refunded") {
        const returnItem = returns.find((r) => r.id === returnId);
        if (returnItem) {
          await supabase
            .from("orders")
            .update({ status: "refunded" })
            .eq("id", returnItem.order_id);
        }
      }

      fetchReturns();
    } catch (error) {
      console.error("Error updating return status:", error);
      alert("Failed to update return status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      return: "bg-orange-400",
      refunded: "bg-gray-400",
    };
    return colors[status.toLowerCase()] || "bg-gray-400";
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleReturnTypeChange = (type: "all" | "return") => {
    setReturnType(type);
    // Reset filters when switching tabs
    if (type !== "all") {
      setStatusFilter("all");
      
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      setDateFrom(startStr);
      setDateTo(endStr);
      setTempDateFrom(startStr);
      setTempDateTo(endStr);
      setActivePreset(7);
    }
    router.push(`/admin/returns${type !== "return" ? `?type=${type}` : ""}`);
  };

  const handlePresetChange = (days: number) => {
    setActivePreset(days);
    const end = new Date();
    const start = new Date();
    if (days > 0) {
      start.setDate(start.getDate() - days);
    }
    const startDateStr = start.toISOString().split("T")[0];
    const endDateStr = end.toISOString().split("T")[0];
    
    setTempDateFrom(startDateStr);
    setTempDateTo(endDateStr);
    
    // Immediately apply filters
    setDateFrom(startDateStr);
    setDateTo(endDateStr);
  };

  const handleApplyFilters = () => {
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setActivePreset(null);
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            .print-orders-table,
            .print-orders-table * {
              visibility: visible !important;
            }
            .print-orders-table {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
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

      {/* Print Template - Returns Version */}
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

          {/* Report Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Returns Report
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-6 text-sm">
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

                {/* Column 2: Filter or Date Range or Total Returns */}
                <div>
                  {returnType !== "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Filter:</p>
                      <p className="text-gray-900">
                        {returnType === "return" ? "Refund Pending Returns" : "All Returns"}
                      </p>
                    </>
                  ) : returnType === "all" && (dateFrom || dateTo) ? (
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
                  ) : returnType === "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Total Returns</p>
                      <p className="text-lg font-bold text-gray-900">
                        {stats.totalReturns.toLocaleString()}
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Column 3: Total Amount or empty */}
                <div>
                  {returnType === "all" ? (
                    <>
                      <p className="text-gray-600 font-medium">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{stats.totalAmount.toLocaleString()}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>  

          {/* Returns Table */}
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
                <th className="border border-gray-700 px-3 py-2 text-left font-semibold">
                  Reason
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
              {returns.map((ret, index) => (
                <tr
                  key={ret.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 px-3 py-2 font-medium">
                    {ret.order?.order_id || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {ret.order?.customer_name || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs">
                    {ret.order?.customer_email || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {ret.order?.customer_phone || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 max-w-xs truncate">
                    {ret.reason}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    ₹{ret.order?.total.toLocaleString() || "0"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 rounded">
                      {getStatusLabel(ret.status)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {formatDate(ret.created_at)}
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

      {/* Main UI - Remains the same */}
      <div className="min-h-screen bg-white text-gray-900">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Returns & Refunds
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Monitor product returns, approve requests, and track refund
                status.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {returnType === "all" && (
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition no-print"
                >
                  Print
                </button>
              )}
              <button
                onClick={() => router.push("/admin/returns/add")}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition no-print"
              >
                Create Return
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => handleReturnTypeChange("return")}
              className={`relative px-4 py-2 text-sm font-medium transition ${
                returnType === "return"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {statusCounts.return > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {statusCounts.return > 99 ? "99+" : statusCounts.return}
                </span>
              )}
              Refund Pending
            </button>
            <button
              onClick={() => handleReturnTypeChange("all")}
              className={`px-4 py-2 text-sm font-medium transition ${
                returnType === "all"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Returns
            </button>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Overview Cards - Only show on "All Returns" tab */}
          {returnType === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">
                      Total Returns
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalReturns.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-600"
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

          {/* Filters - Only show for "All Returns" tab */}
          {returnType === "all" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 no-print">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePresetChange(0)}
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
                      onClick={() => handlePresetChange(7)}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>

                {/* Status Filter - 25% width */}
                <div className="w-1/4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="all">All Status</option>
                    <option value="return">Return</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Search only for specific status tabs */}
          {returnType !== "all" && (
            <div className="mb-6 no-print">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 w-full max-w-xs"
              />
            </div>
          )}

          <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
            {returns.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p>No returns found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">
                    Try adjusting your search or filter criteria
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                      <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                        Reason
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
                    {returns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {ret.order?.order_id || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ret.order?.customer_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {ret.order?.customer_email || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {ret.order?.customer_phone || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {ret.reason}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                          ₹{ret.order?.total.toLocaleString() || "0"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-full text-xs uppercase tracking-wider text-gray-700">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                                ret.status
                              )}`}
                            />
                            {getStatusLabel(ret.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(ret.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right no-print">
                          <button
                            onClick={() =>
                              router.push(`/admin/orders/${ret.order?.order_id}`)
                            }
                            className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminReturnsPage() {
  return (
    <Suspense fallback={<ScorpioLoader />}>
      <AdminReturnsPageContent />
    </Suspense>
  );
}
