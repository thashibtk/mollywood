"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, Coupon } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

export default function AdminCouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("usage");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(success);
      setShowSuccess(true);
      // Remove success param from URL
      router.replace("/admin/coupons");
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter, sortBy]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      let query = supabase.from("coupons").select("*");

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply sorting
      if (sortBy === "usage") {
        query = query.order("usage_count", { ascending: false });
      } else if (sortBy === "discount") {
        query = query.order("discount_percent", { ascending: false });
      } else if (sortBy === "expiry") {
        query = query.order("valid_until", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter
      let filteredData = data || [];
      if (searchQuery) {
        filteredData = filteredData.filter((coupon) =>
          coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (coupon.description || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setCoupons(filteredData);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);

      if (error) throw error;

      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setSuccessMessage("Coupon deleted successfully");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("Failed to delete coupon");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100 text-blue-800",
      draft: "bg-gray-100 text-gray-800",
      expired: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded uppercase tracking-wider ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Coupon Manager
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure and track promotional codes to boost conversions.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/coupons/add")}
          className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-900 text-white bg-gray-900 rounded-lg hover:bg-black transition"
        >
          Create Coupon
        </button>
      </div>

      {showSuccess && (
        <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="px-8 py-8 space-y-6">
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchCoupons();
                }
              }}
              placeholder="Search coupons..."
              className="px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded-lg"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 text-sm focus:outline-none focus:border-gray-400 rounded-lg"
            >
              <option value="usage">Sort by Usage</option>
              <option value="discount">Sort by Discount</option>
              <option value="expiry">Sort by Expiry</option>
              <option value="created">Sort by Created</option>
            </select>
          </div>

          {loading ? (
            <ScorpioLoader />
          ) : coupons.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No coupons found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 tracking-wider">
                      {coupon.code}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {coupon.valid_until
                        ? `Ends ${formatDate(coupon.valid_until)}`
                        : "No expiry"}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 text-xs uppercase tracking-wider text-gray-500">
                    <span>Discount: {coupon.discount_percent}%</span>
                    <span>
                      Usage: {coupon.usage_count}
                      {coupon.max_usage ? ` / ${coupon.max_usage}` : ""}
                    </span>
                    {getStatusBadge(coupon.status)}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        router.push(`/admin/coupons/add?id=${coupon.id}`)
                      }
                      className="text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-xs uppercase tracking-wider text-red-500 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
