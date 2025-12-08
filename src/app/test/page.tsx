"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import Footer from "@/components/Footer";
import StarsBackground from "@/components/StarsBackground";
import { useRouter } from "next/navigation";

const DragCards = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const categories = ["1111", "2222", "3333"];

  const handleCategorySelect = (category: string, element?: HTMLElement) => {
    router.push(`/shop/${category}`);
  };

  return (
    <>
      <StarsBackground />
      <div
        ref={containerRef}
        className="relative z-10 min-h-screen p-8 md:p-16 pt-32"
      >
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push("/about")}
          whileHover={{ scale: 1.1, x: -5 }}
          className="mb-8 px-6 py-2 border border-white text-white hover:bg-white hover:text-black transition-all duration-300"
        >
          ← About
        </motion.button>

        <div className="flex flex-col items-center justify-center min-h-[30vh]">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-center"
            whileHover={{ scale: 1.05, letterSpacing: "4px" }}
          >
            Select a Category
          </motion.h1>
        </div>
        <section className="relative grid min-h-screen w-full place-content-center overflow-hidden">
          <Cards
            cardsRef={cardsRef}
            categories={categories}
            handleCategorySelect={handleCategorySelect}
          />
        </section>
      </div>

      <Footer />
    </>
  );
};

export default DragCards;

const Cards = ({
  cardsRef,
  categories,
  handleCategorySelect,
}: {
  cardsRef: React.RefObject<HTMLDivElement | null>;
  categories: string[];
  handleCategorySelect: (category: string, element?: HTMLElement) => void;
}) => {
  // Define different positions and rotations for each card
  const cardPositions = [
    {
      top: "20%",
      left: "25%",
      rotate: "6deg",
      src: "https://images.unsplash.com/photo-1635373670332-43ea883bb081?q=80&w=400",
      alt: "Collection 1111",
      category: "1111",
      name: "Cosmic Collection",
      categoryName: "1111",
    },
    {
      top: "45%",
      left: "60%",
      rotate: "12deg",
      src: "https://images.unsplash.com/photo-1635373670332-43ea883bb081?q=80&w=400",
      alt: "Collection 2222",
      category: "2222",
      name: "Quantum Collection",
      categoryName: "2222",
    },
    {
      top: "20%",
      left: "40%",
      rotate: "-6deg",
      src: "https://images.unsplash.com/photo-1635373670332-43ea883bb081?q=80&w=400",
      alt: "Collection 3333",
      category: "3333",
      name: "Interstellar Collection",
      categoryName: "3333",
    },
  ];

  return (
    <div className="absolute inset-0 z-10" ref={cardsRef}>
      {categories.map((category, index) => {
        const position = cardPositions[index];

        return (
          <Card
            key={position.category}
            containerRef={cardsRef}
            src={position.src}
            alt={position.alt}
            rotate={position.rotate}
            top={position.top}
            left={position.left}
            name={position.name}
            category={position.categoryName}
            className="w-20 h-60 md:w-80 md:h-[20rem]"
            onViewClick={() =>
              handleCategorySelect(
                position.category,
                cardsRef.current as HTMLElement
              )
            }
          />
        );
      })}
    </div>
  );
};

const Card = ({
  containerRef,
  src,
  alt,
  top,
  left,
  rotate,
  className,
  name,
  category,
  onViewClick,
  onClick,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  src: string;
  alt: string;
  top: string;
  left: string;
  rotate: string;
  className: string;
  name: string;
  category: string;
  onViewClick?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const [zIndex, setZIndex] = useState(0);

  const updateZIndex = () => {
    const els = document.querySelectorAll(".drag-elements");

    let maxZIndex = -Infinity;

    els.forEach((el) => {
      let zIndex = parseInt(
        window.getComputedStyle(el).getPropertyValue("z-index")
      );

      if (!isNaN(zIndex) && zIndex > maxZIndex) {
        maxZIndex = zIndex;
      }
    });

    setZIndex(maxZIndex + 1);
  };

  return (
    <motion.div
      onMouseDown={updateZIndex}
      onClick={onClick}
      style={{
        top,
        left,
        rotate,
        zIndex,
      }}
      className={twMerge(
        "drag-elements absolute bg-neutral-200 p-1 cursor-pointer overflow-hidden",
        className
      )}
      drag
      dragConstraints={containerRef}
      dragElastic={0.65}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-48 md:h-64 object-cover"
        draggable={false}
      />
      <div className="p-3 bg-gradient-to-b from-neutral-200 to-neutral-300">
        <div className="mb-2">
          <p className="text-xs md:text-sm text-neutral-600 font-semibold uppercase tracking-wide mb-1">
            Category: {category}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm md:text-lg font-bold text-neutral-900 flex-1">
              {name}
            </h3>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onViewClick?.();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-1.5 px-3 md:py-2 md:px-4 bg-black text-white text-xs md:text-sm font-semibold rounded-md hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              View
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
