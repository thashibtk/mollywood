"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2 } from "lucide-react";

import { Suspense } from "react";
import ScorpioLoader from "@/components/ScorpioLoader";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    setOrderId(orderIdParam);
  }, [searchParams]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="border border-white/10 bg-black/50 backdrop-blur-md rounded-xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl" />
              <CheckCircle2 className="relative w-20 h-20 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
            Order Confirmed!
          </h1>

          <p className="text-sm md:text-base text-gray-400 mb-2">
            Thank you for your purchase. Your order has been successfully placed.
          </p>

          {orderId && (
            <p className="text-xs text-gray-500 mb-8">
              Order ID: <span className="text-white font-semibold">{orderId}</span>
            </p>
          )}

          <p className="text-sm text-gray-300 mb-8 leading-relaxed">
            We&apos;ve sent a confirmation email with your order details. You&apos;ll
            receive another email when your order ships.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push(`/orders${orderId ? `/${orderId}` : ""}`)}
              className="px-6 py-3 text-sm font-semibold uppercase tracking-wider border border-white text-black bg-white hover:bg-gray-200 hover:border-gray-200 transition"
            >
              View Order
            </button>
            <button
              onClick={() => router.push("/orders")}
              className="px-6 py-3 text-sm font-semibold uppercase tracking-wider border border-white/30 text-white hover:border-white transition"
            >
              All Orders
            </button>
            <button
              onClick={() => router.push("/shop")}
              className="px-6 py-3 text-sm font-semibold uppercase tracking-wider border border-white/30 text-white hover:border-white transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<ScorpioLoader />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

