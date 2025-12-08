"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import BackgroundImage from "@/components/BackgroundImage";

const categories = [
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
];

import { supabase } from "@/lib/supabase";
import { useState } from "react";

// ... (imports remain the same)

export default function Shop() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchActiveCategories = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("status", "published");

      if (data) {
        const uniqueCategories = Array.from(
          new Set(data.map((item) => item.category))
        );
        setActiveCategories(uniqueCategories);
      }
    };

    fetchActiveCategories();

    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1 });
    }

    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      Array.from(cards).forEach((card) => {
        const cardEl = card as HTMLElement;
        cardEl.style.opacity = "1";
        cardEl.style.visibility = "visible";
      });
    }
  }, []);

  const handleCategorySelect = (category: string) => {
    router.push(`/shop/${category}`);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <BackgroundImage src="bg3.webp" opacity={0.3} />
      <Header />

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen p-8 md:p-16 pt-24 md:pt-32 opacity-100"
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/about")}
          whileHover={{ scale: 1.1, x: -5 }}
          className="absolute top-20 left-4 sm:top-24 sm:left-6  md:top-28 px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-all duration-300 z-20"
        >
          ← About
        </motion.button>

        <div className="flex flex-col items-center justify-center min-h-[80vh] mt-10 md:mt-14">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold mb-16 text-center"
            whileHover={{
              rotateX: 5,
              rotateY: -5,
              scale: 1.02,
              textShadow: "4px 4px 20px rgba(255,255,255,0.3)",
              transition: { duration: 0.3 },
            }}
          >
            Select a Category
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs md:text-sm text-gray-400 italic mt-2"
            >
              Select a category to explore the secrets of Mollywood
            </motion.p>
          </motion.h1>

          <section
            ref={sectionRef}
            className="relative w-full max-w-7xl mx-auto"
          >
            <Cards
              cardsRef={cardsRef}
              categories={categories}
              handleCategorySelect={handleCategorySelect}
              activeCategories={activeCategories}
            />
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const Cards = ({
  cardsRef,
  categories,
  handleCategorySelect,
  activeCategories,
}: {
  cardsRef: React.RefObject<HTMLDivElement | null>;
  categories: string[];
  handleCategorySelect: (category: string) => void;
  activeCategories: string[];
}) => {
  // Category data mapping
  const categoryData = [
    {
      category: "1111",
      name: "Cosmic",
      src: "/categories/1.gif",
      alt: "Collection 1111",
    },
    {
      category: "2222",
      name: "Quantum",
      src: "/categories/2.gif",
      alt: "Collection 2222",
    },
    {
      category: "3333",
      name: "Interstellar",
      src: "/categories/3.gif",
      alt: "Collection 3333",
    },
    {
      category: "4444",
      name: "Nebula",
      src: "/categories/4.gif",
      alt: "Collection 4444",
    },
    {
      category: "5555",
      name: "Stellar",
      src: "/categories/5.gif",
      alt: "Collection 5555",
    },
    {
      category: "6666",
      name: "Galactic",
      src: "/categories/6.gif",
      alt: "Collection 6666",
    },
    {
      category: "7777",
      name: "Astral",
      src: "/categories/7.gif",
      alt: "Collection 7777",
    },
    {
      category: "8888",
      name: "Void",
      src: "/categories/8.gif",
      alt: "Collection 8888",
    },
    {
      category: "9999",
      name: "Celestial",
      src: "/categories/9.gif",
      alt: "Collection 9999",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full px-4"
      ref={cardsRef}
    >
      {categories.map((category) => {
        const data = categoryData.find((d) => d.category === category);
        if (!data) return null;

        const isLocked = !activeCategories.includes(category);

        return (
          <Card
            key={data.category}
            src={data.src}
            alt={data.alt}
            name={data.name}
            category={data.category}
            isLocked={isLocked}
            onViewClick={
              isLocked ? undefined : () => handleCategorySelect(data.category)
            }
          />
        );
      })}
    </div>
  );
};

const Card = ({
  src,
  alt,
  name,
  category,
  isLocked = false,
  onViewClick,
}: {
  src: string;
  alt: string;
  name: string;
  category: string;
  isLocked?: boolean;
  onViewClick?: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={
        isLocked
          ? {}
          : {
              y: -8,
            }
      }
      className={`group relative bg-black overflow-hidden transition-all duration-500 flex flex-col h-full ${
        isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={() => !isLocked && onViewClick?.()}
    >
      {/* Animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-500 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
      
      {/* Main card container with border */}
      <div className="relative border border-white/20 group-hover:border-white/60 transition-all duration-500 h-full flex flex-col">
        
        {/* Image container */}
        <div className="relative w-full h-64 sm:h-72 md:h-80 overflow-hidden bg-black">
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-700 ${
              isLocked 
                ? "grayscale" 
                : "grayscale-0 group-hover:scale-110 group-hover:brightness-110"
            }`}
            draggable={false}
          />
          
          {/* Gradient overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-500 ${
              isLocked ? "opacity-80" : "opacity-60 group-hover:opacity-40"
            }`}
          />
          
          {/* Lock icon overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center"
              >
                <svg
                  className="w-10 h-10 text-white/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </motion.div>
            </div>
          )}
          
          {/* Category number overlay - bottom left */}
          <div className="absolute bottom-4 left-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-7xl font-black text-white/10 group-hover:text-white/20 transition-all duration-500"
            >
              {category}
            </motion.div>
          </div>
        </div>

        {/* Content section */}
        <div className="relative p-6 bg-black flex-1 flex flex-col">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px bg-white/40"></div>
                <p className="text-xs text-white/50 font-medium uppercase tracking-widest">
                  Category
                </p>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight group-hover:text-white/90 transition-colors">
                {category}
              </h3>
              <p className="text-sm text-white/60 font-light">{name}</p>
            </div>

            {/* Button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (!isLocked) {
                  onViewClick?.();
                }
              }}
              disabled={isLocked}
              whileHover={isLocked ? {} : { x: 5 }}
              whileTap={isLocked ? {} : { scale: 0.98 }}
              className={`mt-6 w-full py-4 px-6 font-semibold uppercase tracking-wider transition-all duration-300 relative overflow-hidden group/btn ${
                isLocked
                  ? "bg-white/5 text-white/40 cursor-not-allowed border border-white/10"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {!isLocked && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {isLocked ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Coming Soon
                  </>
                ) : (
                  <>
                    Explore Collection
                    <svg
                      className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};