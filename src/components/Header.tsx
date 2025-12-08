"use client";

import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      // Ensure header is visible immediately
      gsap.set(headerRef.current, { opacity: 1, y: 0 });

      // Animate in from top
      gsap.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        }
      );
    }
  }, []);

  // Only show header on landing page and begins page
  const shouldShow = pathname === "/" || pathname === "/begins";

  if (!shouldShow) return null;

  return (
    <motion.header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-[60] p-6 md:p-8 bg-black/80 backdrop-blur-sm"
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <motion.button
          onClick={() => router.push("/")}
          whileHover={{ scale: 1.1, letterSpacing: "2px" }}
          whileTap={{ scale: 0.95 }}
          className="brand-font text-3xl md:text-4xl font-bold tracking-wider cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-3"
        >
          <Image
            src="/logo/logo.jpg"
            alt="Mollywood Logo"
            width={40}
            height={40}
            className="object-contain rounded-full border-2 border-white p-1"
          />
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[0.5rem] md:text-[0.6rem] font-normal tracking-wider opacity-70">
              The
            </span>
            <span className="leading-none text-2xl">MOLLYWOOD</span>
            <span className="text-[0.5rem] md:text-[0.6rem] font-normal tracking-wider opacity-70">
              Clothing
            </span>
          </div>
        </motion.button>
      </div>
    </motion.header>
  );
}
