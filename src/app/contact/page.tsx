"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import StarsBackground from "@/components/StarsBackground";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/context/UserAuthContext";
import gsap from "gsap";
import { Mail, Instagram, Facebook } from "lucide-react";
import BackgroundImage from "@/components/BackgroundImage";

export default function Contact() {
  const router = useRouter();
  const { user } = useUserAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitStatus({
        type: "success",
        message: "Thank you! We'll get back to you within 24 hours.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <BackgroundImage src="bg2.jpg" opacity={0.4} />
      

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen pt-24 pb-16 px-4 sm:px-6 md:px-8 lg:px-16"
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/shop")}
          whileHover={{ scale: 1.05, x: -5 }}
          className="absolute top-20 left-4 sm:top-24 sm:left-6 md:top-28 px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-all duration-300 z-20"
        >
          ← Back
        </motion.button>



        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                Contact Us
              </h1>
            </div>
            <p className="text-gray-300 text-lg md:text-xl">
              Reach out to the cosmic realm of Mollywood
            </p>
          </motion.div>

          {/* Contact Form - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="border border-white/20 rounded-lg p-6 md:p-8 bg-black/50 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                Send us a Message
              </h2>

              {submitStatus.type && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 p-4 rounded-lg ${
                    submitStatus.type === "success"
                      ? "bg-white/10 border border-white/30"
                      : "bg-red-500/20 border border-red-500/30"
                  }`}
                >
                  <p
                    className={
                      submitStatus.type === "success"
                        ? "text-white"
                        : "text-red-300"
                    }
                  >
                    {submitStatus.message}
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-white font-medium mb-2"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-white font-medium mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!!user?.email}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-white/5"
                      placeholder="your.email@example.com"
                    />
                    {user?.email && (
                      <p className="mt-1 text-xs text-gray-400">
                        Using your account email
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-white font-medium mb-2"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all"
                      placeholder="+91 XXX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-white font-medium mb-2"
                    >
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all"
                    >
                      <option value="" className="bg-black">
                        Select a subject
                      </option>
                      <option value="general" className="bg-black">
                        General Inquiry
                      </option>
                      <option value="order" className="bg-black">
                        Order Related
                      </option>
                      <option value="return" className="bg-black">
                        Return Request
                      </option>
                      <option value="refund" className="bg-black">
                        Refund Inquiry
                      </option>
                      <option value="cancellation" className="bg-black">
                        Cancellation Request
                      </option>
                      <option value="shipping" className="bg-black">
                        Shipping & Delivery
                      </option>
                      <option value="other" className="bg-black">
                        Other
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-white font-medium mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full md:w-auto px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Send Message"
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Contact Information & Quick Links - Side by side below */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Get in Touch */}
            <div className="border border-white/20 rounded-lg p-6 bg-black/50 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">
                Get in Touch
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-white mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <a
                      href="mailto:info@mollywoodclothing.com"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      info@mollywoodclothing.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <svg
                    className="w-6 h-6 text-white mt-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      Response Time
                    </h3>
                    <p className="text-gray-300">
                      We'll respond within 24 hours
                    </p>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="flex items-start gap-4">
                  <svg
                    className="w-6 h-6 text-white mt-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-white font-semibold mb-2">
                      Follow Us
                    </h3>
                    <div className="flex items-center gap-4">
                      <a
                        href="https://www.instagram.com/themollywoodclothing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <Instagram className="w-5 h-5 text-gray-300 hover:text-white hover:scale-110 transition-all duration-300" />
                      </a>
                      <a
                        href="https://www.facebook.com/themollywoodclothing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <Facebook className="w-5 h-5 text-gray-300 hover:text-white hover:scale-110 transition-all duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border border-white/20 rounded-lg p-6 bg-black/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">
                Quick Links
              </h3>
              <div className="space-y-3">
                <a
                  href="/faq"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  → FAQ
                </a>
                <a
                  href="/return"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  → Returns
                </a>
                <a
                  href="/refund"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  → Refunds
                </a>
                <a
                  href="/cancellation"
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  → Cancellations
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}