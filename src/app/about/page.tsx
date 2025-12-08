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
import { supabase } from "@/lib/supabase";
import { Mail, Instagram, Facebook } from "lucide-react";

export default function About() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);

  // Fetch next update date from database
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchNextUpdateDate = async () => {
      try {
        const { data, error } = await supabase
          .from("stock_update_settings")
          .select("next_update_date")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        let nextUpdate: Date;
        if (data && data.next_update_date) {
          nextUpdate = new Date(data.next_update_date);
        } else {
          // Fallback to 3 months from now if no data
          nextUpdate = new Date();
          nextUpdate.setMonth(nextUpdate.getMonth() + 3);
        }

        const calculateTimeLeft = () => {
          const now = new Date();
          const difference = nextUpdate.getTime() - now.getTime();

          if (difference > 0) {
            setTimeLeft({
              days: Math.floor(difference / (1000 * 60 * 60 * 24)),
              hours: Math.floor(
                (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              ),
              minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
          } else {
            // If date has passed, set all to 0
            setTimeLeft({
              days: 0,
              hours: 0,
              minutes: 0,
              seconds: 0,
            });
          }
        };

        calculateTimeLeft();
        timer = setInterval(calculateTimeLeft, 1000);
      } catch (error) {
        console.error("Error fetching next update date:", error);
        // Fallback to 3 months from now
        const nextUpdate = new Date();
        nextUpdate.setMonth(nextUpdate.getMonth() + 3);
        
        const calculateTimeLeft = () => {
          const now = new Date();
          const difference = nextUpdate.getTime() - now.getTime();

          if (difference > 0) {
            setTimeLeft({
              days: Math.floor(difference / (1000 * 60 * 60 * 24)),
              hours: Math.floor(
                (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              ),
              minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
          }
        };

        calculateTimeLeft();
        timer = setInterval(calculateTimeLeft, 1000);
      }
    };

    fetchNextUpdateDate();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }

    if (contentRef.current && contentRef.current.children) {
      const children = Array.from(contentRef.current.children) as HTMLElement[];
      children.forEach((child) => gsap.set(child, { opacity: 1, x: 0 }));
      gsap.fromTo(
        children,
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.3,
        }
      );
    }

    if (countdownRef.current && countdownRef.current.children) {
      const items = Array.from(countdownRef.current.children) as HTMLElement[];
      items.forEach((item) =>
        gsap.set(item, { opacity: 1, scale: 1, rotation: 0 })
      );
      gsap.fromTo(
        items,
        { scale: 0, rotation: 180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: "back.out(1.7)",
          delay: 0.8,
        }
      );
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />
      <div
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 pt-20 sm:pt-24 md:pt-32"
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/shop")}
          whileHover={{ scale: 1.1, x: -5 }}
          className="absolute top-20 left-4 sm:top-24 sm:left-6  md:top-28 px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-all duration-300 z-20"
        >
          ← Go to Shop
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-2 mt-20"
        >
          <AlienImage
            src="/alien/aboutus.png"
            alt="Alien"
            className="left-2 sm:left-5 md:left-8 lg:left-15 w-48  h-34 sm:w-64 sm:h-50 md:w-80 md:h-64 lg:w-96 lg:h-64"
          />
        </motion.div>

        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center  w-full max-w-4xl px-2 sm:px-4"
        >
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 brand-font">
              MOLLYWOOD
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-6">
              India's First Premium Clothing Brand
            </h2>

            <div className="space-y-4 text-base sm:text-lg md:text-xl leading-relaxed text-left">
              <p>
                We are India's first luxury brand. At Mollywood Clothing, we believe real style doesn't need loud colours. That's why we dedicate ourselves exclusively to black and white fabrics only.
              </p>
              <p>
                Modern technology—and every system within it—is born from the binary. A 0 means nothing; a 1 means something. Alone they are simple, but together they build worlds. Our aesthetic follows the same idea — dark luxury is our theme.
              </p>
              <p>
                Our collection arrives once every 90 days, giving us the freedom to focus on quality from the yarn to the tags. Each drop represents a fresh evolution of our core identity and signature style.
              </p>
              <p>
                We are an online-only brand, making our products accessible to customers anywhere. We keep the experience simple and global. All orders are shipped worldwide, ensuring our work reaches those who value uniqueness.
              </p>
              <p className="font-bold text-center pt-4">
                Two colours. One identity.
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="mt-12 sm:mt-16 text-center w-full max-w-5xl"
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-8">
              Next Update In
            </h3>
            <div
              ref={countdownRef}
              className="flex flex-row justify-center items-center gap-2 sm:gap-3 md:gap-6 mx-auto px-2"
            >
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  className="relative group flex-1 min-w-0"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Card container */}
                  <div className="relative bg-black border-2 border-white p-3 sm:p-4 md:p-6 overflow-hidden hover:bg-white hover:text-black transition-colors duration-300">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-white group-hover:border-black transition-colors duration-300"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-white group-hover:border-black transition-colors duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-white group-hover:border-black transition-colors duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-white group-hover:border-black transition-colors duration-300"></div>
                    
                    {/* Number display */}
                    <motion.div
                      key={item.value}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-1 sm:mb-2 tabular-nums"
                    >
                      {String(item.value).padStart(2, "0")}
                    </motion.div>
                    
                    {/* Label */}
                    <div className="text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-light opacity-70">
                      {item.label}
                    </div>
                    
                    {/* Pulse animation on seconds */}
                    {item.label === "Seconds" && (
                      <motion.div
                        className="absolute inset-0 border-2 border-white"
                        animate={{ 
                          scale: [1, 1.02, 1],
                          opacity: [0.3, 0, 0.3] 
                        }}
                        transition={{ 
                          duration: 1, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      ></motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Contact Information - Moved outside content section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Email */}
            <a
              href="mailto:info@mollywoodclothing.com"
              className="flex items-center gap-3 text-base sm:text-lg hover:text-gray-300 transition-colors duration-300 group"
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" />
              <span>info@mollywoodclothing.com</span>
            </a>

            {/* Social Media */}
            <div className="flex items-center gap-8">
              <a
                href="https://www.instagram.com/themollywoodclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors duration-300"
              >
                <Instagram className="w-7 h-7 hover:scale-110 transition-transform duration-300" />
              </a>
              <a
                href="https://www.facebook.com/themollywoodclothing"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors duration-300"
              >
                <Facebook className="w-7 h-7 hover:scale-110 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}