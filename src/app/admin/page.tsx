"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  todaysRevenue: number;
  todaysOrders: number;
  pendingOrders: number;
  todaysReturns: number;
}

interface RecentActivity {
  title: string;
  description: string;
  timestamp: string;
  type: "order" | "return";
  id?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todaysRevenue: 0,
    todaysOrders: 0,
    pendingOrders: 0,
    todaysReturns: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [chartPeriod, setChartPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [chartData, setChartData] = useState<
    { period: string; revenue: number }[]
  >([]);
  const [nextStockUpdate, setNextStockUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
    fetchNextStockUpdate();
  }, [chartPeriod]);

  const fetchNextStockUpdate = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_update_settings")
        .select("next_update_date")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data && data.next_update_date) {
        const date = new Date(data.next_update_date);
        setNextStockUpdate(
          date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    } catch (error) {
      console.error("Error fetching next stock update:", error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Fetch all orders
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        setChartData([]);
        return;
      }

      // Group data by period
      const groupedData = new Map<string, { revenue: number; date: Date }>();

      orders.forEach((order) => {
        const date = new Date(order.created_at);
        let key: string;
        let periodDate: Date;

        if (chartPeriod === "daily") {
          periodDate = new Date(date);
          periodDate.setHours(0, 0, 0, 0);
          key = periodDate.toISOString();
        } else if (chartPeriod === "weekly") {
          // Get week start (Monday)
          periodDate = new Date(date);
          const day = periodDate.getDay();
          const diff = periodDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
          periodDate.setDate(diff);
          periodDate.setHours(0, 0, 0, 0);
          key = periodDate.toISOString();
        } else if (chartPeriod === "monthly") {
          periodDate = new Date(date.getFullYear(), date.getMonth(), 1);
          key = periodDate.toISOString();
        } else {
          // yearly
          periodDate = new Date(date.getFullYear(), 0, 1);
          key = periodDate.toISOString();
        }

        const existing = groupedData.get(key);
        if (existing) {
          existing.revenue += Number(order.total || 0);
        } else {
          groupedData.set(key, {
            revenue: Number(order.total || 0),
            date: periodDate,
          });
        }
      });

      // Convert to array, format labels, and sort
      const chartDataArray = Array.from(groupedData.entries())
        .map(([key, data]) => {
          let period: string;
          if (chartPeriod === "daily") {
            period = data.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          } else if (chartPeriod === "weekly") {
            period = `Week ${data.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`;
          } else if (chartPeriod === "monthly") {
            period = data.date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
          } else {
            period = data.date.getFullYear().toString();
          }
          return {
            period,
            revenue: data.revenue,
            sortKey: data.date.getTime(),
          };
        })
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ period, revenue }) => ({ period, revenue }));

      setChartData(chartDataArray);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, customer_email, created_at, order_id, status");

      if (ordersError) throw ordersError;

      // Fetch returns
      const { data: returns, error: returnsError } = await supabase
        .from("returns")
        .select("id, order_id, created_at, status")
        .eq("status", "return")
        .order("created_at", { ascending: false });

      if (returnsError) throw returnsError;

      // Calculate stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todaysOrdersList = (orders || []).filter(order => new Date(order.created_at) >= startOfDay);
      
      const todaysRevenue = todaysOrdersList.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

      const todaysOrders = todaysOrdersList.length;

      const pendingOrders = (orders || []).filter((order) =>
        ["confirmed", "processing", "shipped"].includes(order.status)
      ).length;

      const todaysReturns = (returns || []).filter(ret => new Date(ret.created_at) >= startOfDay).length;

      setStats({
        todaysRevenue,
        todaysOrders,
        pendingOrders,
        todaysReturns,
      });

      // Build recent activity
      const activities: RecentActivity[] = [];

      // Add recent orders (last 5)
      const recentOrders = (orders || [])
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      recentOrders.forEach((order) => {
        const timeAgo = getTimeAgo(new Date(order.created_at));
        activities.push({
          title: "New Order",
          description: `Order ${order.order_id} - ₹${Number(
            order.total
          ).toLocaleString()}`,
          timestamp: timeAgo,
          type: "order",
          id: order.order_id,
        });
      });

      // Add recent returns
      if (returns && returns.length > 0) {
        const recentReturns = returns.slice(0, 5);
        const { data: returnOrders, error: returnOrdersError } = await supabase
          .from("orders")
          .select("id, order_id")
          .in(
            "id",
            recentReturns.map((r) => r.order_id)
          );

        if (!returnOrdersError && returnOrders) {
          const orderIdMap = new Map(
            returnOrders.map((o) => [o.id, o.order_id])
          );

          recentReturns.forEach((ret) => {
            const orderId = orderIdMap.get(ret.order_id) || "N/A";
            const timeAgo = getTimeAgo(new Date(ret.created_at));
            activities.push({
              title: "Return Request",
              description: `Return for Order ${orderId}`,
              timestamp: timeAgo,
              type: "return",
              id: ret.id,
            });
          });
        }
      }

      // Sort activities by timestamp (most recent first) and take top 5
      activities.sort((a, b) => {
        const aTime = parseTimeAgo(a.timestamp);
        const bTime = parseTimeAgo(b.timestamp);
        return bTime - aTime;
      });

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const parseTimeAgo = (timeAgo: string): number => {
    if (timeAgo === "just now") return Date.now();
    const match = timeAgo.match(/(\d+)\s*(minute|hour|day)/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = Date.now();
    if (unit === "minute") return now - value * 60000;
    if (unit === "hour") return now - value * 3600000;
    if (unit === "day") return now - value * 86400000;
    return 0;
  };

  const KPI_CARDS = [
    {
      label: "Today's Revenue",
      value: `₹${stats.todaysRevenue.toLocaleString()}`,
      change: "Today",
    },
    {
      label: "Today's Orders",
      value: stats.todaysOrders.toLocaleString(),
      change: "Today",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      change: "Pending",
    },
    {
      label: "Today's Returns",
      value: stats.todaysReturns.toLocaleString(),
      change: "Today",
    },
  ];

  if (loading) {
    return <ScorpioLoader />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold tracking-tight">
          Overview Dashboard
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Snapshot of key metrics across Mollywood operations.
        </p>
      </div>

      <div className="px-8 py-8 space-y-8">
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              className="border border-gray-200 rounded-xl bg-white shadow-sm p-5"
            >
              <p className="text-xs uppercase tracking-wider text-gray-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">
                {card.change}
              </p>
            </div>
          ))}
        </section>

        <section className="border border-gray-200 rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
              <p className="text-xs text-gray-500">
                Jump to common administrative tasks
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <button
              onClick={() => router.push("/admin/products")}
              className="p-6 text-left hover:bg-gray-100 transition"
            >
              <p className="text-sm font-semibold text-gray-900">Add Product</p>
              <p className="mt-2 text-xs text-gray-500">
                Upload imagery, set inventory, manage pricing
              </p>
            </button>
            <button
              onClick={() => router.push("/admin/coupons")}
              className="p-6 text-left hover:bg-gray-100 transition"
            >
              <p className="text-sm font-semibold text-gray-900">
                Create Coupon
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Launch new promotions or flash sales
              </p>
            </button>
            <button
              onClick={() => router.push("/admin/returns")}
              className="p-6 text-left hover:bg-gray-100 transition"
            >
              <p className="text-sm font-semibold text-gray-900">
                Manage Returns
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Process returns and handle refunds
              </p>
            </button>
            <button
              onClick={() => router.push("/admin/customers")}
              className="p-6 text-left hover:bg-gray-100 transition"
            >
              <p className="text-sm font-semibold text-gray-900">
                View Customers
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Analyze cohorts and purchase behaviour
              </p>
            </button>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-gray-200 rounded-xl bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sales Performance
                </h3>
                <p className="text-xs text-gray-500">Revenue trend over time</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setChartPeriod("daily")}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      chartPeriod === "daily"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setChartPeriod("weekly")}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      chartPeriod === "weekly"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartPeriod("monthly")}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      chartPeriod === "monthly"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartPeriod("yearly")}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${
                      chartPeriod === "yearly"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Yearly
                  </button>
                </div>
                <button
                  onClick={() => router.push("/admin/orders")}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Manage Orders
                </button>
              </div>
            </div>
            <div className="h-56">
              {chartData.length === 0 ? (
                <div className="h-full border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  No sales data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="period"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `₹${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                      formatter={(value: number) => [
                        `₹${value.toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={{ fill: "#111827", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              {recentActivity.length > 0 && (
                <button
                  onClick={() =>
                    router.push(
                      recentActivity[0]?.type === "return"
                        ? "/admin/returns"
                        : "/admin/orders"
                    )
                  }
                  className="text-xs text-gray-500 hover:text-gray-900 transition"
                >
                  View All
                </button>
              )}
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No recent activity
                </p>
              ) : (
                recentActivity.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id || index}`}
                    className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">
                      {item.timestamp}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="border border-gray-200 rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Next Stock Update
              </h3>
              <p className="text-xs text-gray-500">
                Manage the next stock update date and time
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/stock-update")}
              className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              {nextStockUpdate ? "Update" : "Set Date"}
            </button>
          </div>
          <div className="p-6">
            {nextStockUpdate ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      Next Update:
                    </span>{" "}
                    {nextStockUpdate}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No stock update date set. Click "Set Date" to configure.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
