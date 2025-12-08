"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

export const TextHoverEffect = ({
  text,
  duration,
}: {
  text: string;
  duration?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
      setHovered(true);

      if (svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const cxPercentage = ((e.clientX - svgRect.left) / svgRect.width) * 100;
        const cyPercentage = ((e.clientY - svgRect.top) / svgRect.height) * 100;
        setMaskPosition({
          cx: `${cxPercentage}%`,
          cy: `${cyPercentage}%`,
        });
      }
    };

    const handleMouseLeave = () => {
      setHovered(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 2000 600"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none w-full h-full pointer-events-none"
    >
      <defs>
        {/* Dimmed glow gradient */}
        <linearGradient id="textGradient" gradientUnits="userSpaceOnUse">
          {hovered && (
            <>
              <stop offset="0%" stopColor="#a0a0a0" />
              <stop offset="100%" stopColor="#a0a0a0" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0.2, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>

        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      {/* Reveal dimmed glowing text on hover only */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="2.5"
        fontSize="280"
        mask="url(#textMask)"
        className="fill-transparent font-[helvetica] font-bold drop-shadow-[0_0_4px_rgba(160,160,160,0.5)]"
        style={{
          opacity: hovered ? 0.8 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        {text}
      </text>
    </svg>
  );
};
