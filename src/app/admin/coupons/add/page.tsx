"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, CouponInsert } from "@/lib/supabase";

export default function AddCouponPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [formData, setFormData] = useState<
    CouponInsert & {
      valid_from_date: string;
      valid_from_time: string;
      valid_until_date: string;
      valid_until_time: string;
    }
  >({
    code: "",
    discount_percent: 10,
    description: "",
    status: "draft",
    usage_count: 0,
    max_usage: null,
    valid_from: null,
    valid_until: null,
    valid_from_date: "",
    valid_from_time: "",
    valid_until_date: "",
    valid_until_time: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      fetchCoupon();
    }
  }, [editId]);

  const fetchCoupon = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", editId)
        .single();

      if (error) throw error;

      if (data) {
        const validFrom = data.valid_from ? new Date(data.valid_from) : null;
        const validUntil = data.valid_until ? new Date(data.valid_until) : null;

        setFormData({
          code: data.code,
          discount_percent: data.discount_percent,
          description: data.description || "",
          status: data.status,
          usage_count: data.usage_count,
          max_usage: data.max_usage,
          valid_from: data.valid_from,
          valid_until: data.valid_until,
          valid_from_date: validFrom
            ? validFrom.toISOString().split("T")[0]
            : "",
          valid_from_time: validFrom
            ? validFrom.toTimeString().slice(0, 5)
            : "",
          valid_until_date: validUntil
            ? validUntil.toISOString().split("T")[0]
            : "",
          valid_until_time: validUntil
            ? validUntil.toTimeString().slice(0, 5)
            : "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load coupon");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "discount_percent" ||
        name === "usage_count" ||
        name === "max_usage"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Combine date and time for valid_from
      let valid_from = null;
      if (formData.valid_from_date) {
        const dateTime = formData.valid_from_time
          ? `${formData.valid_from_date}T${formData.valid_from_time}:00`
          : `${formData.valid_from_date}T00:00:00`;
        valid_from = new Date(dateTime).toISOString();
      }

      // Combine date and time for valid_until
      let valid_until = null;
      if (formData.valid_until_date) {
        const dateTime = formData.valid_until_time
          ? `${formData.valid_until_date}T${formData.valid_until_time}:00`
          : `${formData.valid_until_date}T23:59:59`;
        valid_until = new Date(dateTime).toISOString();
      }

      const couponData: CouponInsert = {
        code: formData.code.trim(), // Case-sensitive - store exactly as entered
        discount_percent: formData.discount_percent,
        description: formData.description || undefined,
        status: formData.status,
        usage_count: formData.usage_count || 0,
        max_usage: formData.max_usage || undefined,
        valid_from: valid_from || undefined,
        valid_until: valid_until || undefined,
      };

      if (editId) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editId);

        if (error) throw error;
        router.push("/admin/coupons?success=Coupon updated successfully");
      } else {
        const { error } = await supabase.from("coupons").insert(couponData);

        if (error) throw error;
        router.push("/admin/coupons?success=Coupon created successfully");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold tracking-tight">
          {editId ? "Edit Coupon" : "Create Coupon"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {editId
            ? "Update coupon details"
            : "Add a new promotional coupon code"}
        </p>
      </div>

      <div className="px-8 py-8 w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="MOLLY10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percent <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="discount_percent"
              value={formData.discount_percent}
              onChange={handleChange}
              required
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="10% off your entire order"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Usage (leave empty for unlimited)
            </label>
            <input
              type="number"
              name="max_usage"
              value={formData.max_usage || ""}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Unlimited"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From Date
              </label>
              <input
                type="date"
                name="valid_from_date"
                value={formData.valid_from_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From Time
              </label>
              <input
                type="time"
                name="valid_from_time"
                value={formData.valid_from_time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until Date
              </label>
              <input
                type="date"
                name="valid_until_date"
                value={formData.valid_until_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until Time
              </label>
              <input
                type="time"
                name="valid_until_time"
                value={formData.valid_until_time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading
                ? "Saving..."
                : editId
                ? "Update Coupon"
                : "Create Coupon"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/coupons")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
