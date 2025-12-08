"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BackgroundImageProps {
  src?: string; // Image path from /public/bgs folder (e.g., "bg1.webp")
  opacity?: number; // 0 to 1, default 0.3
  blur?: number; // Blur amount in pixels, default 0
  overlay?: boolean; // If true, acts as overlay (default true)
  className?: string; // Additional classes
  zIndex?: number; // Z-index control, default 0
}

export default function BackgroundImage({
  src = "bg1.webp",
  opacity = 0.3,
  blur = 0,
  overlay = true,
  className = "",
  zIndex = 1,
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Preload the image
    const img = new window.Image();
    img.src = `/bgs/${src}`;
    img.onload = () => {
      setIsLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      console.error(`Failed to load background image: /bgs/${src}`);
      setImageError(true);
    };
  }, [src]);

  if (!src || imageError) return null;

  return (
    <div
      className={`fixed inset-0 ${className}`}
      style={{
        zIndex: zIndex,
        pointerEvents: "none",
      }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: isLoaded ? opacity : 0,
        }}
      >
        <Image
          src={`/bgs/${src}`}
          alt="Background"
          fill
          className="object-cover"
          style={{
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
          quality={90}
          priority={false}
          unoptimized
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
      )}
    </div>
  );
}

// Export a list of available backgrounds for easy reference
export const availableBackgrounds = [
  "bg1.webp",
  "bg2.webp",
  "bg3.webp",
  "bg4.webp",
  "bg5.webp",
  "bg6.webp",
  "bg7.webp",
] as const;

export type BackgroundType = (typeof availableBackgrounds)[number];

