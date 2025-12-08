"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyStats {
  date: string;
  revenue: number;
  orders: number;
  returns: number;
}

interface ReportMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalReturns: number;
  netRevenue: number;
  averageOrderValue: number;
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0], // Last 30 days by default
    to: new Date().toISOString().split("T")[0],
  });
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalReturns: 0,
    netRevenue: 0,
    averageOrderValue: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  const [activePreset, setActivePreset] = useState<number | null>(30);

  useEffect(() => {
    fetchReportData();
  }, []); // Only run on mount

  const fetchReportData = async (
    customFrom?: string,
    customTo?: string
  ) => {
    try {
      setLoading(true);

      const fromDate = customFrom || dateRange.from;
      const toDate = customTo || dateRange.to;

      // Adjust end date to include the full day
      const endDate = new Date(toDate);
      endDate.setDate(endDate.getDate() + 1);

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, created_at, status")
        .gte("created_at", fromDate)
        .lt("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      // Fetch returns
      const { data: returns, error: returnsError } = await supabase
        .from("returns")
        .select("created_at")
        // .eq("status", "return") // Removed to include all returns (refunded, etc.)
        .gte("created_at", fromDate)
        .lt("created_at", endDate.toISOString());

      if (returnsError) throw returnsError;

      // Process Data
      const statsMap = new Map<string, DailyStats>();

      // Initialize map with all dates in range
      const current = new Date(fromDate);
      const end = new Date(toDate);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        statsMap.set(dateStr, {
          date: dateStr,
          revenue: 0,
          orders: 0,
          returns: 0,
        });
        current.setDate(current.getDate() + 1);
      }

      let totalRevenue = 0;
      let totalOrders = 0;

      (orders || []).forEach((order) => {
        const dateStr = new Date(order.created_at).toISOString().split("T")[0];
        const stat = statsMap.get(dateStr);
        if (stat) {
          const orderTotal = Number(order.total || 0);
          stat.revenue += orderTotal;
          stat.orders += 1;

          totalRevenue += orderTotal;
          totalOrders += 1;
        }
      });

      let totalReturns = 0;
      (returns || []).forEach((ret) => {
        const dateStr = new Date(ret.created_at).toISOString().split("T")[0];
        const stat = statsMap.get(dateStr);
        if (stat) {
          stat.returns += 1;
          totalReturns += 1;
        }
      });

      // Convert map to array and sort
      const statsArray = Array.from(statsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      setDailyStats(statsArray);

      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setMetrics({
        totalRevenue,
        totalOrders,
        totalReturns,
        netRevenue: totalRevenue,
        averageOrderValue,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (days: number) => {
    setActivePreset(days);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];

    setDateRange({
      from: fromStr,
      to: toStr,
    });

    // Trigger fetch immediately with new dates
    fetchReportData(fromStr, toStr);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            .print-only,
            .print-only * {
              visibility: visible !important;
            }
            .print-only {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `,
        }}
      />

      {/* Print Template - Recreated from Returns Page Template */}
      <div className="print-only hidden print:block">
        <div className="bg-white w-full">
          {/* Header with Logo and QR - Left aligned */}
          <div className="flex items-start justify-between pb-3 mb-3 border-b-2 border-gray-900">
            <div className="flex items-center gap-3">
              {/* Rounded Logo */}
              <img
                src="/logo/logo.jpg"
                alt="Mollywood Logo"
                width={50}
                height={50}
                className="object-cover rounded-full"
              />
              <div className="flex flex-col items-center">
                {/* Centered "The" relative to Mollywood */}
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">
                  The
                </p>
                
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide leading-tight">
                  Mollywood
                </h1>
                
                {/* Centered "Clothing" relative to Mollywood */}
                <p className="text-[10px] text-gray-600 uppercase tracking-wide">
                  Clothing
                </p>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Sales Report
            </h2>
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-[10px]">
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
                <div>
                  <p className="text-gray-600 font-medium">Period:</p>
                  <p className="text-gray-900">
                    {new Date(dateRange.from).toLocaleDateString("en-US")} -{" "}
                    {new Date(dateRange.to).toLocaleDateString("en-US")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Total Days:</p>
                  <p className="text-gray-900">
                    {dailyStats.length} days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-3 pt-2 border-t-2 border-gray-900">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Summary</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] font-medium text-gray-600 mb-1">
                  Total Revenue
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] font-medium text-gray-600 mb-1">
                  Total Orders
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {metrics.totalOrders}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] font-medium text-gray-600 mb-1">
                  Total Returns
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {metrics.totalReturns}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] font-medium text-gray-600 mb-1">
                  Avg. Order Value
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(metrics.averageOrderValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Data Table - Using exact classes from Returns page */}
          <table className="min-w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-700 px-1.5 py-0.5 text-left font-semibold">
                  Date
                </th>
                <th className="border border-gray-700 px-1.5 py-0.5 text-right font-semibold">
                  Revenue
                </th>
                <th className="border border-gray-700 px-1.5 py-0.5 text-right font-semibold">
                  Orders
                </th>
                <th className="border border-gray-700 px-1.5 py-0.5 text-right font-semibold">
                  Returns
                </th>
                <th className="border border-gray-700 px-1.5 py-0.5 text-right font-semibold">
                  Avg. Order
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((stat, index) => (
                <tr
                  key={stat.date}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 px-1.5 py-0.5 font-medium">
                    {new Date(stat.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-0.5 text-right font-semibold">
                    {formatCurrency(stat.revenue)}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-0.5 text-right">
                    {stat.orders}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-0.5 text-right text-red-600">
                    {stat.returns}
                  </td>
                  <td className="border border-gray-300 px-1.5 py-0.5 text-right">
                    {formatCurrency(
                      stat.orders > 0 ? stat.revenue / stat.orders : 0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer - Split layout */}
          <div className="mt-4 pt-2 border-t border-gray-300 flex items-center justify-between break-inside-avoid">
            {/* Left side text */}
            <div className="text-left max-w-2/3">
              <p className="text-[9px] text-gray-500">
                This is a computer-generated report from The Mollywood Clothing
              </p>
              <p className="text-[9px] text-gray-500 mt-1">
                For inquiries, info@themollywoodclothing.com
              </p>
            </div>
            
            {/* Right side QR code */}
            <div className="flex-shrink-0 mt-2">
              <img
                src="/qr/Mollywoodqr.png"
                alt="Mollywood QR Code"
                width={50}
                height={50}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div className="min-h-screen bg-white text-gray-900 no-print">
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Reports</h2>
            <p className="text-sm text-gray-500 mt-1">
              Analyze store performance and metrics.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition no-print"
          >
            Print
          </button>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm no-print">
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
                    value={dateRange.from}
                    onChange={(e) => {
                      setActivePreset(null);
                      setDateRange((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }));
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">To:</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => {
                      setActivePreset(null);
                      setDateRange((prev) => ({
                        ...prev,
                        to: e.target.value,
                      }));
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <button
                  onClick={() => fetchReportData()}
                  className="px-4 py-2 text-xs uppercase tracking-wider bg-gray-900 text-white rounded-lg hover:bg-black transition"
                >
                  Filter
                </button>
                {activePreset !== 30 && (
                  <button
                    onClick={() => handlePresetChange(30)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <ScorpioLoader />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Total Revenue
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatCurrency(metrics.totalRevenue)}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Total Orders
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {metrics.totalOrders}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Total Returns
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {metrics.totalReturns}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Avg. Order Value
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatCurrency(metrics.averageOrderValue)}
                  </p>
                </div>
              </div>

              {/* Charts - Hidden in print */}
              <div className="grid lg:grid-cols-2 gap-6 print:hidden">
                {/* Revenue Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Revenue Trend
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          fontSize={12}
                          tickFormatter={(val) =>
                            new Date(val).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={12}
                          tickFormatter={(val) =>
                            `₹${(val / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                          formatter={(val: number) => [
                            formatCurrency(val),
                            "Revenue",
                          ]}
                          labelFormatter={(label) =>
                            new Date(label).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Orders vs Returns Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Orders vs Returns
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          fontSize={12}
                          tickFormatter={(val) =>
                            new Date(val).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                          labelFormatter={(label) =>
                            new Date(label).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          }
                        />
                        <Legend />
                        <Bar dataKey="orders" name="Orders" fill="#3b82f6" />
                        <Bar
                          dataKey="returns"
                          name="Returns"
                          fill="#ef4444"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detailed Breakdown
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Returns
                        </th>
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-xs text-gray-500">
                          Avg. Order
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {dailyStats.map((stat) => (
                        <tr key={stat.date} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(stat.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900 font-medium">
                            {formatCurrency(stat.revenue)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            {stat.orders}
                          </td>
                          <td className="px-6 py-4 text-right text-red-600">
                            {stat.returns}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            {formatCurrency(
                              stat.orders > 0 ? stat.revenue / stat.orders : 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
