"use client";

import { useState, useEffect } from "react";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/UserAuthContext";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

interface Address {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export default function SavedAddressesPage() {
  const router = useRouter();
  const { user } = useUserAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1); // Only fetch one address

      if (error) throw error;
      const addressData = data || [];
      setAddresses(addressData);

      // Don't auto-set editing mode - let user see the preview first
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      full_name: address.full_name,
      email: user?.email || address.email, // Always use user's email from account
      phone: address.phone,
      street_address: address.street_address,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setShowSuccessMessage(false);
    // Reset form data to current address if exists
    if (addresses.length > 0) {
      const currentAddress = addresses[0];
      setFormData({
        full_name: currentAddress.full_name,
        email: user?.email || currentAddress.email, // Always use user's email from account
        phone: currentAddress.phone,
        street_address: currentAddress.street_address,
        city: currentAddress.city,
        state: currentAddress.state,
        postal_code: currentAddress.postal_code,
        country: currentAddress.country,
      });
    } else {
      setFormData({
        full_name: "",
        email: user?.email || "",
        phone: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Always use user's email from account
      const userEmail = user.email || formData.email;

      if (editingId) {
        // Update existing address
        const { error } = await supabase
          .from("user_addresses")
          .update({
            full_name: formData.full_name,
            email: userEmail,
            phone: formData.phone,
            street_address: formData.street_address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // Create new address (only one address allowed)
        // First, check if address exists and update it, otherwise create
        const existingAddress = addresses[0];
        if (existingAddress) {
          // Update existing address
          const { error } = await supabase
            .from("user_addresses")
            .update({
              full_name: formData.full_name,
              email: userEmail,
              phone: formData.phone,
              street_address: formData.street_address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.postal_code,
              country: formData.country,
            })
            .eq("id", existingAddress.id);

          if (error) throw error;
        } else {
          // Create new address
          const { error } = await supabase.from("user_addresses").insert({
            user_id: user.id,
            full_name: formData.full_name,
            email: userEmail,
            phone: formData.phone,
            street_address: formData.street_address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            is_default: true,
          });

          if (error) throw error;
        }
      }

      // Wait for fetch to complete before updating UI
      await fetchAddresses();

      setEditingId(null);
      setShowAddForm(false);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address. Please try again.");
    }
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <StarsBackground />
        <Header />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
          <div className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-gray-300 mb-4">
              Please log in to view your addresses
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              Log In
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <button
          onClick={() => router.push("/profile")}
          className="mb-6 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition"
        >
          ← Back to Profile
        </button>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider">
            {addresses.length > 0 ? "Edit Address" : "Add Address"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {addresses.length > 0
              ? "Update your shipping address"
              : "Add your shipping address"}
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 border border-emerald-400/50 bg-emerald-400/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-emerald-300 text-sm font-semibold uppercase tracking-wider">
              ✓ Address updated successfully!
            </p>
          </div>
        )}

        {/* Address Preview - Show when address exists and not editing */}
        {addresses.length > 0 && !editingId && !showAddForm && (
          <div className="mb-8 border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
              Current Address
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Full Name
                </p>
                <p className="text-white">{addresses[0].full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Email
                </p>
                <p className="text-white">{addresses[0].email}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Phone
                </p>
                <p className="text-white">{addresses[0].phone}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Address
                </p>
                <p className="text-white">{addresses[0].street_address}</p>
                <p className="text-white">
                  {addresses[0].city}, {addresses[0].state}{" "}
                  {addresses[0].postal_code}
                </p>
                <p className="text-white">{addresses[0].country}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => handleEdit(addresses[0])}
                className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
              >
                Edit Address
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingId || addresses.length === 0) && (
          <div className="mb-8 border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold uppercase tracking-wider mb-4">
              {addresses.length === 0 ? "Add Address" : "Edit Address"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.street_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      street_address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
              >
                Save Address
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2 border border-white/30 text-white uppercase tracking-wider text-sm hover:border-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
