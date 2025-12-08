"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import StarsBackground from "@/components/StarsBackground";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ReturnPage() {
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Return Policy
              </h1>
            </div>
            <p className="text-gray-300 text-lg">
              Returns are accepted within 3 days after delivery
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
                <h2 className="text-xl font-bold text-white mb-2">
                  Important Notice
                </h2>
                <p className="text-gray-300">
                  Returns must be initiated by contacting our support team within 3 days of delivery. 
                  Items must be unused, in original condition, with all tags attached.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-8">
            {/* How to Return */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                How to Return Your Order
              </h2>
              <ol className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">1.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Contact Support
                    </p>
                    <p>
                      Reach out to our support team within 3 days after delivery to initiate a return request.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">2.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Provide Details
                    </p>
                    <p>
                      Share your order number, item details, and reason for return.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">3.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Return Authorization
                    </p>
                    <p>
                      Our team will provide approval and return instructions.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">4.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Prepare Package
                    </p>
                    <p>
                      Pack the item securely in its original packaging with all tags included.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">5.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Ship the Return
                    </p>
                    <p>
                      Ship the item back using the instructions provided by our support team.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-white font-bold">6.</span>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Refund Processing
                    </p>
                    <p>
                      After inspection and approval, your refund will be issued within 2 days.
                    </p>
                  </div>
                </li>
              </ol>
            </motion.section>

            {/* Return Eligibility */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Return Eligibility
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Returns must be initiated within 3 days after delivery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Items must be unused, unworn, and in original condition</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Original packaging, tags, and accessories must be included</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Returns are only accepted through contacting our support team</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white mt-1">•</span>
                  <span>Items damaged by the customer are not eligible for return</span>
                </li>
              </ul>
            </motion.section>

            {/* Return Timeline */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Return Timeline
              </h2>
              <div className="space-y-3 text-gray-300">
                <p>
                  <span className="text-white font-semibold">Initiation Period:</span>{" "}
                  Contact us within 3 days after delivery
                </p>

                <p>
                  <span className="text-white font-semibold">Return Shipping:</span>{" "}
                  Ship the item within 3 days after receiving return authorization
                </p>

                <p>
                  <span className="text-white font-semibold">Processing Time:</span>{" "}
                  Refunds are issued within 2 days after inspection and approval
                </p>

                <p>
                  <span className="text-white font-semibold">Refund Credit:</span>{" "}
                  Refunds will appear in your account based on your bank or payment provider’s timeline
                </p>
              </div>
            </motion.section>

            {/* Need Help */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Need Help?
              </h2>
              <p className="text-gray-300 mb-4">
                For return requests or questions, please contact our support team.
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

                <Link
                  href="/refund"
                  className="px-6 py-3 border-2 border-white/30 text-white hover:bg-white/10 transition-all font-medium"
                >
                  Refund Policy
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

