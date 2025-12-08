"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { Instagram, Facebook, Mail } from "lucide-react";

function FooterLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const links = [
    { name: "Shop", href: "/shop" },
    { name: "FAQ", href: "/faq" },
    { name: "Refund", href: "/refund" },
    { name: "Returns", href: "/return" },
    { name: "Cancellation", href: "/cancellation" },
    { name: "Shipping", href: "/faq?category=shipping" },
    { name: "Contact Us", href: "/contact" },
    { name: "Terms & Conditions", href: "/faq?category=terms" },
  ];

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (path !== pathname) return false;
    
    if (query) {
      const params = new URLSearchParams(query);
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }
    
    return true;
  };

  return (
    <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className={`transition-colors ${
            isActive(link.href)
              ? "text-white font-medium underline decoration-white/50 underline-offset-4"
              : "text-white/70 hover:text-white"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (footerRef.current) {
      gsap.set(footerRef.current, { opacity: 1, y: 0 });
      gsap.fromTo(
        footerRef.current,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          delay: 0.5,
        }
      );
    }
  }, []);

  return (
    <motion.footer
      ref={footerRef}
      className="relative z-10 border-t border-white/20 mt-16 py-8 pb-20 sm:pb-8"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Footer Links */}
          <Suspense fallback={<div className="h-6" />}>
            <FooterLinks />
          </Suspense>

          {/* Copyright & Social Media */}
          <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
            <p className="text-sm text-white/60 whitespace-nowrap">
              © 2025 MOLLYWOOD. All rights reserved.
            </p>
            
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/themollywoodclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/themollywoodclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@themollywoodclothing.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}