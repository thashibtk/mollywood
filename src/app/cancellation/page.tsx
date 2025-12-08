"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import StarsBackground from "@/components/StarsBackground";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function CancellationPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-black text-white">
      <StarsBackground />
      <div className="relative z-10 min-h-screen pt-24 pb-16 px-4 sm:px-6 md:px-8 lg:px-16">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/faq")}
          whileHover={{ scale: 1.05, x: -5 }}
          className="mb-8 px-6 py-2 border border-white/30 text-white hover:bg-white/10 transition-all duration-300"
        >
          ← Back to FAQ
        </motion.button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-12 bg-white"></div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Order Cancellation
              </h1>
            </div>
            <p className="text-gray-300 text-lg">
              Cancel your order before processing begins
            </p>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-white/30 rounded-lg p-6 md:p-8 bg-white/5 mb-8"
          >
            <div className="flex items-start gap-4">
              <svg
                className="w-8 h-8 text-white flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Important Notice</h2>
                <p className="text-gray-300">
                  Orders can only be cancelled by contacting our support team before the order is processed. 
                  Once processing has started or the order is shipped, cancellation is no longer possible. 
                  In that case, you may request a return after delivery.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-8">
            {/* How to Cancel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">How to Cancel Your Order</h2>
              <ol className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">1.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Contact Support</p>
                    <p>
                      Reach out to our support team (email, contact page, or WhatsApp) to request cancellation.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">2.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Provide Order Details</p>
                    <p>
                      Share your order number and reason for cancellation so we can process it quickly.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">3.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Confirmation</p>
                    <p>
                      Our team will confirm whether your order is still eligible for cancellation 
                      (only possible before processing begins).
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">4.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Refund Processing</p>
                    <p>
                      Once cancelled, your refund will be issued to your original payment method. 
                      Processing follows our refund policy timelines.
                    </p>
                  </div>
                </li>
              </ol>
            </motion.section>

            {/* Cancellation Policy */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Cancellation Policy</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Cancellations are only possible before order processing begins</span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>You must contact our support team to cancel your order</span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Full refunds are issued for cancelled orders</span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>
                    If your order has already shipped or processing has begun, cancellation is not possible — 
                    you may request a return after delivery
                  </span>
                </li>
              </ul>
            </motion.section>

            {/* Contact Information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <span className="text-white font-semibold">Email:</span> info@themollywoodclothing.com
                </p>
                <p>
                  <span className="text-white font-semibold">WhatsApp:</span>{" "}
                  <a
                    href="https://wa.me/9656636699"
                    target="_blank"
                    className="text-green-400 hover:text-green-300 underline"
                  >
                    9656636699
                  </a>
                </p>
                <p>
                  <span className="text-white font-semibold">Response Time:</span> Typically within 24 hours
                </p>
                <p className="text-sm text-gray-400">
                  Please include your order number in your cancellation request for faster processing.
                </p>
              </div>
            </motion.section>

            {/* Need Help Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
              <p className="text-gray-300 mb-4">
                For cancellation requests or questions, please contact our support team.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 transition-all font-medium"
                >
                  Contact Us
                </Link>

                <Link
                  href="/faq?category=cancellations"
                  className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 transition-all font-medium"
                >
                  View Cancellation FAQ
                </Link>

                <a
                  href="https://wa.me/9656636699"
                  target="_blank"
                  className="px-6 py-3 border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-medium"
                >
                  WhatsApp Support
                </a>
              </div>
            </motion.section>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}

