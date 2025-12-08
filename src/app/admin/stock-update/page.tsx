"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

export default function StockUpdatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextUpdateDate, setNextUpdateDate] = useState("");
  const [nextUpdateTime, setNextUpdateTime] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchStockUpdateSettings();
  }, []);

  const fetchStockUpdateSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stock_update_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const date = new Date(data.next_update_date);
        const dateStr = date.toISOString().split("T")[0];
        const timeStr = date.toTimeString().slice(0, 5); // HH:MM format
        setNextUpdateDate(dateStr);
        setNextUpdateTime(timeStr);
      } else {
        // Set default to 3 months from now
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 3);
        const dateStr = defaultDate.toISOString().split("T")[0];
        const timeStr = defaultDate.toTimeString().slice(0, 5);
        setNextUpdateDate(dateStr);
        setNextUpdateTime(timeStr);
      }
    } catch (error) {
      console.error("Error fetching stock update settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nextUpdateDate || !nextUpdateTime) {
      setMessage({ type: "error", text: "Please fill in both date and time" });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      // Combine date and time
      const dateTimeString = `${nextUpdateDate}T${nextUpdateTime}:00`;
      const dateTime = new Date(dateTimeString);

      if (isNaN(dateTime.getTime())) {
        setMessage({ type: "error", text: "Invalid date or time" });
        return;
      }

      // Check if date is in the past
      if (dateTime < new Date()) {
        setMessage({
          type: "error",
          text: "Update date cannot be in the past",
        });
        return;
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from("stock_update_settings")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("stock_update_settings")
          .update({ next_update_date: dateTime.toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("stock_update_settings")
          .insert({ next_update_date: dateTime.toISOString() });

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: "Stock update date saved successfully!",
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error saving stock update settings:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="text-gray-500 hover:text-gray-900 transition"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Stock Update Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Set the date and time for the next stock update
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 w-full">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Next Stock Update
            </h3>

            {message && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={nextUpdateDate}
                  onChange={(e) => setNextUpdateDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={nextUpdateTime}
                  onChange={(e) => setNextUpdateTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {nextUpdateDate && nextUpdateTime && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Next Update:</span>{" "}
                  {new Date(
                    `${nextUpdateDate}T${nextUpdateTime}`
                  ).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin")}
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
