"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function StockUpdateTimer() {
  const pathname = usePathname();
  const timerRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Only show on public-facing pages (hide on landing, intro, and admin routes)
  const pathnameValue = pathname ?? "";
  const shouldShow =
    pathnameValue !== "/" &&
    pathnameValue !== "/begins" &&
    !pathnameValue.startsWith("/admin");

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchNextUpdateDate = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("stock_update_settings")
          .select("next_update_date")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("StockUpdateTimer - Database error:", error);
          throw error;
        }

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
              minutes: Math.floor(
                (difference % (1000 * 60 * 60)) / (1000 * 60)
              ),
              seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
            setIsVisible(true);
          } else {
            // If date has passed, hide the timer
            setTimeLeft({
              days: 0,
              hours: 0,
              minutes: 0,
              seconds: 0,
            });
            setIsVisible(false);
          }
        };

        calculateTimeLeft();
        timer = setInterval(calculateTimeLeft, 1000);
        setIsLoading(false);
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
              minutes: Math.floor(
                (difference % (1000 * 60 * 60)) / (1000 * 60)
              ),
              seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
            setIsVisible(true);
          }
        };

        calculateTimeLeft();
        timer = setInterval(calculateTimeLeft, 1000);
        setIsLoading(false);
      }
    };

    fetchNextUpdateDate();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  // Initialize CSS variable on mount
  useEffect(() => {
    // Initialize CSS variable based on whether timer should be visible
    if (shouldShow) {
      document.documentElement.style.setProperty("--navbar-top", "2.5rem");
    } else {
      document.documentElement.style.setProperty("--navbar-top", "0");
    }
  }, [shouldShow]);

  // Track scroll position to hide timer and adjust navbar
  useEffect(() => {
    if (!isVisible || !shouldShow) {
      document.documentElement.style.setProperty("--navbar-top", "0");
      setIsScrolledPast(false);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Hide timer when scrolled past 2.5rem (timer height)
      const scrolledPast = scrollY > 40; // Small threshold for smooth transition
      setIsScrolledPast(scrolledPast);
      
      const newTop = scrolledPast ? "0" : "2.5rem";
      document.documentElement.style.setProperty("--navbar-top", newTop);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible, shouldShow]);

  // Don't show if not on correct page
  if (!shouldShow) {
    return null;
  }

  // Show loading state briefly, then show timer once data is loaded
  if (isLoading) {
    return null;
  }

  // Don't show if timer has expired
  if (!isVisible) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isScrolledPast && (
          <motion.div
            ref={timerRef}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="stock-timer w-full bg-black border-b border-white/10 py-2 px-4 fixed top-0 left-0 right-0 z-[60]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-xs sm:text-sm">
              <span className="text-gray-400 uppercase tracking-wider">
                 Next Drop In
              </span>
              <div className="flex items-center gap-2 sm:gap-4">
                {timeLeft.days > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold">{timeLeft.days}</span>
                    <span className="text-gray-400">d</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-gray-400">h</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-gray-400">m</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-gray-400">s</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Spacer to prevent content from being covered - only when timer is visible */}
      {!isScrolledPast && <div className="stock-timer" style={{ height: "2.5rem" }} />}
    </>
  );
}
