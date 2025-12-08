"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import AlienImage from "@/components/AlienImage";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";

const mysteriousTexts = [
  "Want to know something about what you are going to see?",
];

export default function SecondQuestion() {
  const [showQuestion, setShowQuestion] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const alienRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Show question immediately
    setShowQuestion(true);

    // Animate container fade in
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  const handleYes = () => {
    router.push("/about");
  };

  const handleNo = () => {
    router.push("/shop");
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />
      <div className="absolute top-[-100px] inset-x-0 w-full h-full z-1">
        <TextHoverEffect text="MOLLYWOOD" />
      </div>

      <div
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 pt-20 sm:pt-24 md:pt-32"
      >
        <motion.div
          ref={alienRef}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
      
        >
          <AlienImage
            src="/alien/aboutimgs1.png"
            alt="Alien"
            className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80"
          />
        </motion.div>

        {showQuestion && (
          <motion.div
            ref={questionRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center space-y-6 sm:space-y-8 max-w-4xl w-full px-4"
          >
            <motion.div className="space-y-3 mb-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm sm:text-base md:text-lg text-gray-400 uppercase tracking-widest"
              >
                The Journey Begins
              </motion.p>
              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight px-2"
                style={{
                  perspective: "1000px",
                  textAlign: "center",
                  maxWidth: "100%",
                  width: "100%",
                  margin: "0 auto",
                }}
                whileHover={{
                  rotateX: 5,
                  rotateY: -5,
                  scale: 1.02,
                  textShadow: "4px 4px 20px rgba(168,85,247,0.6)",
                  transition: { duration: 0.3 },
                }}
              >
                {mysteriousTexts[0].split(" ").map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.3,
                      ease: "easeOut",
                    }}
                    style={{ display: "inline-block", marginRight: "0.25em" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
            </motion.div>

            <div className="flex flex-row gap-4 sm:gap-6 justify-center items-center mt-8 sm:mt-12 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.15, rotateY: 10, z: 50 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleYes}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    boxShadow: "0 0 40px rgba(255, 255, 255, 0.9)",
                    duration: 0.3,
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
                    duration: 0.3,
                  });
                }}
                className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 border-2 border-white text-white font-bold text-base sm:text-lg md:text-xl uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 pulse-glow transform-3d w-full sm:w-auto"
              >
                Yes
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15, rotateY: -10, z: 50 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNo}
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, {
                    boxShadow: "0 0 40px rgba(255, 255, 255, 0.9)",
                    duration: 0.3,
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, {
                    boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
                    duration: 0.3,
                  });
                }}
                className="px-8 sm:px-10 md:px-12 py-3 sm:py-4 border-2 border-white text-white font-bold text-base sm:text-lg md:text-xl uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 pulse-glow transform-3d card-3d flex-1 sm:flex-none min-w-[120px] sm:min-w-0"
              >
                Lets Shop
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
