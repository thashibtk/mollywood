"use client";

import { useEffect, useState } from "react";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/UserAuthContext";
import { supabase } from "@/lib/supabase";
import ScorpioLoader from "@/components/ScorpioLoader";

const PROFILE_SECTIONS = [
  {
    label: "Order History",
    description: "Track orders and download invoices",
    path: "/orders",
  },
  {
    label: "Wishlist",
    description: "View and manage saved favourites",
    path: "/wishlist",
  },
];

interface UserAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUserAuth();
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [memberSince, setMemberSince] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch user's saved address
      const { data: savedAddress } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (savedAddress) {
        setUserAddress({
          street: savedAddress.street_address,
          city: savedAddress.city,
          state: savedAddress.state,
          postalCode: savedAddress.postal_code,
          country: savedAddress.country,
        });
      } else {
        // Fallback: try to get from most recent order
        const { data: recentOrder } = await supabase
          .from("orders")
          .select("shipping_address, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentOrder?.shipping_address) {
          setUserAddress(recentOrder.shipping_address as UserAddress);
        }
      }

      // Fetch total orders count
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setTotalOrders(count || 0);

      // Fetch user metadata for member since date
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.created_at) {
        const createdDate = new Date(userData.user.created_at);
        setMemberSince(createdDate.getFullYear().toString());
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: UserAddress | null): string => {
    if (!address) return "No address saved";
    return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;
  };

  if (loading) {
    return <ScorpioLoader />;
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <StarsBackground />
        <Header />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
          <div className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-gray-300 mb-4">
              Please log in to view your profile
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-white uppercase">
                {user.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wider">
                {user.email || "User"}
              </h1>
            </div>
          </div>
          <button
            onClick={() => router.push("/orders")}
            className="px-5 py-2 border border-white text-white uppercase tracking-wider text-sm hover:bg-white hover:text-black transition"
          >
            View Orders
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8">
          <div className="space-y-6">
            <section className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-6">
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {PROFILE_SECTIONS.map((section) => (
                  <button
                    key={section.label}
                    onClick={() => router.push(section.path)}
                    className="group border border-white/10 bg-black/40 rounded-lg px-5 py-4 text-left hover:border-white/40 transition"
                  >
                    <p className="text-sm font-semibold text-white uppercase tracking-wider group-hover:text-white">
                      {section.label}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 group-hover:text-gray-300">
                      {section.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-white/10 bg-black/40 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold uppercase tracking-wider mb-6">
                Personal Information
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                    Email
                  </p>
                  <p className="text-white">{user.email || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-wider text-xs mb-1">
                    Member Since
                  </p>
                  <p className="text-white">{memberSince || "2024"}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="border border-white/10 bg-black/60 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-lg font-semibold uppercase tracking-wider mb-4">
                Account Summary
              </h2>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  <span className="text-white font-semibold">
                    Total Orders:
                  </span>{" "}
                  {totalOrders}
                </p>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-white font-semibold mb-1">
                        Address:
                      </p>
                      <p className="text-gray-300">
                        {formatAddress(userAddress)}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/profile/addresses")}
                      className="px-4 py-2 text-xs font-medium uppercase tracking-wider border border-white/30 text-white hover:border-white hover:bg-white hover:text-black transition whitespace-nowrap"
                    >
                      View Address
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
