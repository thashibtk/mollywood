"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import StarsBackground from "@/components/StarsBackground";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function RefundPage() {
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Refund Policy
              </h1>
            </div>
            <p className="text-gray-300 text-lg">
              Learn about our refund process and policies
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Refund Eligibility */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Refund Eligibility
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>
                    Refunds are available for orders cancelled before processing and for approved product returns
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>
                    Returns are accepted within 3 days after delivery
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>
                    Products must be unused and have all original tags attached
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>
                    Refunds are not provided for items damaged by the customer
                  </span>
                </li>
              </ul>
            </motion.section>


            {/* Refund Process */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Refund Process</h2>
              <ol className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">1.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Contact Support</p>
                    <p>Reach out to us within 3 days after delivery to initiate a return request.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">2.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Return Authorization</p>
                    <p>Our team will provide return approval and instructions.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">3.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Ship the Product</p>
                    <p>Return the item using the method instructed by our support team.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">4.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Quality Check</p>
                    <p>We inspect the returned product to confirm eligibility.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">5.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">Refund Processing</p>
                    <p>Approved refunds are processed within 5–7 business days.</p>
                  </div>
                </li>
              </ol>
            </motion.section>

            {/* Refund Timeline */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Refund Timeline
              </h2>
              <div className="space-y-3 text-gray-300">
                <p>
                  <span className="text-white font-semibold">Processing Time:</span>{" "}
                  Refunds are issued within 2 days after the returned product is inspected and accepted.
                </p>
                <p>
                  <span className="text-white font-semibold">
                    Credit Card:
                  </span>{" "}
                  Refunds may appear in your statement within 1–2 billing cycles.
                </p>
                <p>
                  <span className="text-white font-semibold">UPI/Bank:</span>{" "}
                  Refunds are credited to your account within the standard banking time after processing.
                </p>
              </div>
            </motion.section>

            {/* Refund Processing step inside Refund Process */}
            <li className="flex items-start gap-3">
              <span className="text-white font-bold">5.</span>
              <div>
                <p className="font-semibold text-white mb-1">
                  Refund Processing
                </p>
                <p>
                  Once approved, refunds are issued within 2 days after inspection of the returned item.
                </p>
              </div>
            </li>


            {/* Need Help Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
              <p className="text-gray-300 mb-4">
                For refund inquiries or return requests, contact our support team.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 transition-all font-medium"
                >
                  Contact Us
                </Link>

                <Link
                  href="/faq?category=returns"
                  className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 transition-all font-medium"
                >
                  View Returns FAQ
                </Link>

                {/* WhatsApp Button */}
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
