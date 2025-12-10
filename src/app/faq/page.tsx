"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import StarsBackground from "@/components/StarsBackground";
import Footer from "@/components/Footer";
import ScorpioLoader from "@/components/ScorpioLoader";

type FAQCategory = {
  id: string;
  name: string;
  questions: {
    question: string;
    answer?: string;
  }[];
  description?: string;
  actionText?: string;
  actionLink?: string;
};

const faqCategories: FAQCategory[] = [
  {
    id: "top-queries",
    name: "Top Queries",
    description: "You can track your orders in 'My Orders.'",
    actionText: "TRACK ORDERS",
    actionLink: "/orders",
    questions: [
      {
        question: "Why are there different prices for the same product? Is it legal?",
        answer:
          "Mollywood products have only one fixed price based on their category (1111, 2222, 3333, etc.). There are no multiple prices for the same item. All pricing is transparent and fully legal.",
      },
      {
        question: "How can I contact any seller?",
        answer:
          "Mollywood does not use third-party sellers. For any assistance, contact us directly through our Contact page or email us at info@themollywoodclothing.com.",
      },
      {
        question:
          "I saw the product at a certain price but noticed a change later. Why?",
        answer:
          "Prices do not change based on size or variants. Each product category (1111, 2222, 3333…) has a single fixed price. If you see a different price, it may be due to refreshed listings or updated stock.",
      },
      {
        question:
          "How will I detect fraudulent emails or calls seeking personal information?",
        answer:
          "Mollywood will never ask for your password, OTP, or payment details. Always interact only through our official website and verified email addresses. Report any suspicious messages immediately.",
      },
      {
        question: "How will I identify a genuine appointment letter?",
        answer:
          "Official communication from Mollywood will only come from email addresses ending with @themollywoodclothing.com and will include our verified branding and contact details.",
      },
      {
        question: "Why is 'My Cashback' not available on Mollywood?",
        answer:
          "Mollywood does not offer cashback. We provide exclusive prices and occasional coupons that can be applied during checkout.",
      },
      {
        question: "How do I cancel an order I placed?",
        answer:
          "Orders can be cancelled before they are processed. Please contact us through the cancellation page to request a cancellation: /cancellation",
      },
      {
        question: "How do I create a Return Request?",
        answer:
          "To request a return, please contact our support team through the Returns page: /returns",
      },
    ],
  },
  {
    id: "terms",
    name: "Terms and Conditions",
    questions: [
      {
        question: "What are the terms of service?",
        answer: "By using Mollywood, you agree to our terms of service which include policies on product usage, returns, and customer conduct.",
      },
      {
        question: "What is your privacy policy?",
        answer: "We respect your privacy and handle all personal information in accordance with our privacy policy. We never share your data with third parties without consent.",
      },
      {
        question: "What are the age restrictions?",
        answer: "You must be at least 18 years old to make purchases on Mollywood. Users under 18 require parental consent.",
      },
    ],
  },
  {
    id: "coupons",
    name: "Coupons & Discounts",
    questions: [
      {
        question: "How do I apply a coupon code?",
        answer:
          "You can apply a coupon during checkout. Enter the code in the 'Coupon Code' field and click 'Apply' to update your total.",
      },
      {
        question: "Where can I find coupon codes?",
        answer:
          "Coupons are shared through our official website, newsletter, and social media pages. Follow us for exclusive offers.",
      },
      {
        question: "Can I use multiple coupons on one order?",
        answer:
          "No. Only one coupon can be applied per order.",
      },
      {
        question: "What if my coupon code doesn't work?",
        answer:
          "Ensure the coupon is valid, not expired, and meets the stated conditions. If it still doesn't work, contact our support team.",
      },
    ],
  },
  {
    id: "shipping",
    name: "Shipping, Order Tracking & Delivery",
    questions: [
      {
        question: "What are your shipping charges?",
        answer: "Shipping charges vary based on location and order value. Free shipping is available on orders above a certain amount. Check your cart for shipping details.",
      },
      {
        question: "How long does delivery take?",
        answer: "Standard delivery takes 5-7 business days. Express delivery options are available at checkout for faster shipping.",
      },
      {
        question: "How can I track my order?",
        answer: "You can track your order from the 'My Orders' section. You'll receive tracking information via email once your order is shipped.",
      },
      {
        question: "What if my order is delayed?",
        answer: "If your order is delayed beyond the estimated delivery date, please contact our support team. We'll investigate and keep you updated.",
      },
    ],
  },
  {
    id: "cancellations",
    name: "Cancellations and Modifications",
    questions: [
      {
        question: "Can I cancel my order?",
        answer:
          "You can request a cancellation only before the order is processed. Please contact us through the cancellation page: /cancellation",
      },
      {
        question: "Can I modify my order?",
        answer:
          "Modifications are allowed only before processing begins. Contact our support team immediately if you need changes.",
      },
      {
        question: "Will I get a full refund on cancellation?",
        answer:
          "Yes. If the order has not been processed, you will receive a full refund to your original payment method.",
      },
    ],
  },
  {
    id: "returns",
    name: "Returns",
    questions: [
      {
        question: "What is your return policy?",
        answer:
          "Returns are accepted within 3 days after delivery for unused items in their original condition with all tags attached.",
      },
      {
        question: "How do I return a product?",
        answer:
          "Returns must be requested by contacting our support team. Please visit: /returns",
      },
      {
        question: "Can I exchange a product?",
        answer:
          "Exchanges are not available. You may request a return within the 3-day window and place a new order.",
      },
      {
        question: "How long does it take to process a return?",
        answer:
          "Once the returned item is received and inspected, refunds are issued within 5–7 business days to your original payment method.",
      },
    ],
  },
  {
    id: "signup",
    name: "Sign Up and Login",
    questions: [
      {
        question: "How do I create an account?",
        answer: "Click on 'Sign Up' in the navigation menu, enter your email and password, and follow the verification steps.",
      },
      {
        question: "Can I sign up with Google?",
        answer: "Yes, we support Google Sign-In. Click the 'Sign in with Google' button on the login page.",
      },
      {
        question: "I forgot my password. What should I do?",
        answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a password reset link.",
      },
      {
        question: "How do I update my profile information?",
        answer: "Go to 'Profile' from the navigation menu. You can update your personal information and address details there.",
      },
    ],
  },
  {
    id: "payments",
    name: "Payments",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept credit/debit cards, UPI, net banking, and digital wallets. Cash on Delivery is temporarily unavailable.",
      },
      {
        question: "Is my payment information secure?",
        answer: "Yes, all payments are processed through secure, encrypted payment gateways. We never store your complete card details.",
      },
      {
        question: "What if my payment fails?",
        answer: "If payment fails, check your card/bank account balance and try again. Contact your bank if issues persist. Your order won't be placed until payment is successful.",
      },
      {
        question: "Will I receive a payment receipt?",
        answer: "Yes, you'll receive an order confirmation email with payment details and receipt after successful payment.",
      },
    ],
  },
];

function FAQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>("top-queries");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      const found = faqCategories.find((cat) => cat.id === category);
      if (found) {
        setActiveCategory(category);
        setIsMobileMenuOpen(false); // Close mobile menu when category is selected
      }
    }
  }, [searchParams]);

  const currentCategory = faqCategories.find(
    (cat) => cat.id === activeCategory
  ) || faqCategories[0];

  return (
    <div className="relative min-h-screen bg-black text-white">
      <StarsBackground />
      <div className="relative z-10 min-h-screen pt-20 md:pt-24 pb-16 px-4 sm:px-6 md:px-8 lg:px-16">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-all w-full justify-center"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            <span>{isMobileMenuOpen ? "Close Menu" : "FAQ Categories"}</span>
          </button>
        </div>

        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Frequently Asked Questions
          </h1>
          <button
            onClick={() => router.push("/contact")}
            className="px-4 py-2 border-2 border-white/30 text-white hover:bg-white/10 transition-all text-sm font-medium w-full sm:w-auto text-center"
          >
            CONTACT US
          </button>
        </div>
        
        <p className="text-gray-400 mb-8 text-sm sm:text-base">Still need help?</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation - Responsive */}
          <aside className={`${isMobileMenuOpen ? "block" : "hidden"} lg:block w-full lg:w-64 flex-shrink-0`}>
            <nav className="space-y-2 bg-black/50 backdrop-blur-sm rounded-lg p-4 lg:bg-transparent lg:backdrop-blur-none lg:p-0">
              {faqCategories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      router.push(`/faq?category=${category.id}`, { scroll: false });
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all rounded-lg ${
                      isActive
                        ? "text-white font-semibold bg-white/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm sm:text-base truncate">{category.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Category Indicator */}
            <div className="lg:hidden flex items-center gap-2 mb-6 p-3 bg-white/5 rounded-lg">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-medium">{currentCategory.name}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-1 h-8 sm:h-12 bg-white"></div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {currentCategory.name}
              </h2>
            </div>

            {currentCategory.description && (
              <div className="mb-6 p-4 sm:p-0">
                <p className="text-gray-300 mb-4 text-sm sm:text-base">{currentCategory.description}</p>
                {currentCategory.actionText && currentCategory.actionLink && (
                  <button
                    onClick={() => router.push(currentCategory.actionLink!)}
                    className="px-4 py-2 border-2 border-white/30 text-white hover:bg-white/10 transition-all text-sm font-medium w-full sm:w-auto"
                  >
                    {currentCategory.actionText}
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              {currentCategory.questions.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/20 pb-4 sm:pb-6 last:border-b-0"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2">
                    {faq.question}
                  </h3>
                  {faq.answer && (
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function FAQPage() {
  return (
    <Suspense fallback={<ScorpioLoader />}>
      <FAQContent />
    </Suspense>
  );
}