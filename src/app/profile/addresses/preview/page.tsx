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

export default function AddressPreviewPage() {
  const router = useRouter();
  const { user } = useUserAuth();
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAddress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAddress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setAddress(data || null);
    } catch (error) {
      console.error("Error fetching address:", error);
    } finally {
      setLoading(false);
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
              Please log in to view your address
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
          onClick={() => router.push("/profile/addresses")}
          className="mb-6 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition"
        >
          ← Back to Address
        </button>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider">
            Address Preview
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            View your saved shipping address
          </p>
        </div>

        {!address ? (
          <div className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-4">No address saved yet</p>
            <button
              onClick={() => router.push("/profile/addresses")}
              className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider">
                Shipping Address
              </h2>
              {address.is_default && (
                <span className="px-3 py-1 text-[10px] uppercase tracking-wider border border-emerald-400/70 text-emerald-300 rounded-full">
                  Default
                </span>
              )}
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Full Name
                </p>
                <p className="text-white text-base">{address.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Email
                </p>
                <p className="text-white text-base">{address.email}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Phone
                </p>
                <p className="text-white text-base">{address.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Street Address
                </p>
                <p className="text-white text-base">{address.street_address}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  City, State, Postal Code
                </p>
                <p className="text-white text-base">
                  {address.city}, {address.state} {address.postal_code}
                </p>
              </div>
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                  Country
                </p>
                <p className="text-white text-base">{address.country}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => router.push("/profile/addresses")}
                className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
              >
                Edit Address
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

