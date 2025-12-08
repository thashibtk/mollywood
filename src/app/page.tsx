"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AlienImage from "@/components/AlienImage";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import BackgroundImage from "@/components/BackgroundImage";

export default function Home() {
  const [showQuestion, setShowQuestion] = useState(false);
  const [alienFlying, setAlienFlying] = useState(false);
  const [closing, setClosing] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Ensure container is visible
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1, scale: 1 });
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }
      );
    }

    // Show question immediately
    setShowQuestion(true);

    // Animate question after a brief delay
    const timer = setTimeout(() => {
      if (questionRef.current) {
        gsap.fromTo(
          questionRef.current,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "back.out(1.7)" }
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleYes = () => {
    router.push("/begins");
  };

  const handleNo = () => {
    setAlienFlying(true);
    setTimeout(() => {
      setClosing(true);
      // Try to close window, but show a message if it doesn't work
      try {
        if (window.opener) {
          window.close();
        } else {
          // If window can't be closed, redirect or show message
          setTimeout(() => {
            alert("The alien has flown away! Thanks for visiting.");
          }, 500);
        }
      } catch (e) {
        setTimeout(() => {
          alert("The alien has flown away! Thanks for visiting.");
        }, 500);
      }
    }, 2000);
  };

  if (closing) {
    return null;
  }

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
        <AnimatePresence mode="wait">
          {!alienFlying ? (
            <motion.div
              key="alien-normal"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8 sm:mb-12"
            >
              <AlienImage
                src="/alien/main.jpg"
                alt="Alien"
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80"
                flyingAway={false}
              />
            </motion.div>
          ) : (
            <motion.div
              key="alien-flying"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: "100vw",
                y: "-100vh",
                scale: 0.1,
                rotate: 360,
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <AlienImage
                src="/alien/alien1.png"
                alt="Alien"
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80"
                flyingAway={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showQuestion && !alienFlying && (
            <motion.div
              ref={questionRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-center space-y-6 sm:space-y-8 w-full max-w-5xl px-2 sm:px-4"
            >
              <motion.div className="space-y-3 mb-6">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm sm:text-base md:text-lg text-gray-400 uppercase tracking-widest"
                >
                  Welcome to Mollywood
                </motion.p>
                <motion.h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 leading-tight"
                  style={{
                    maxWidth: "100%",
                    width: "100%",
                    margin: "0 auto",
                    perspective: "1000px",
                    wordBreak: "break-word",
                    hyphens: "auto",
                    lineHeight: "1.2",
                    overflowWrap: "break-word",
                    textAlign: "center",
                  }}
                  whileHover={{
                    rotateX: 5,
                    rotateY: -5,
                    scale: 1.02,
                    textShadow: "4px 4px 20px rgba(168,85,247,0.6)",
                    transition: { duration: 0.3 },
                  }}
                  whileTap={{
                    scale: 0.98,
                    transition: { duration: 0.2 },
                  }}
                >
                  {"Do you want something?".split(" ").map((word, index) => (
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
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-xs sm:text-sm md:text-base text-gray-400 italic max-w-2xl mx-auto"
                >
                  Decide. The world listens.
                </motion.p>
              </motion.div>

              <div className="flex flex-row gap-4 sm:gap-6 justify-center items-center flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.15, rotateY: 5, z: 50 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleYes}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      boxShadow: "0 0 30px rgba(255, 255, 255, 0.8)",
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
                  whileHover={{ scale: 1.15, rotateY: -5, z: 50 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNo}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      boxShadow: "0 0 30px rgba(255, 255, 255, 0.8)",
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
                  No
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
