"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import StarsBackground from "@/components/StarsBackground";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden px-4">
      <StarsBackground />
      
      <div className="relative z-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-bold text-white mb-4"
        >
          404
        </motion.h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl md:text-3xl font-semibold mb-6"
        >
          Page Not Found
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-gray-400 mb-8 max-w-md mx-auto"
        >
          This page has slipped out of orbit. Let’s guide you back home.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link 
            href="/shop"
            className="inline-block px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-transform hover:scale-105 active:scale-95"
          >
            Return Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
