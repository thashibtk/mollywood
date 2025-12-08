'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface AlienImageProps {
  src: string;
  alt: string;
  className?: string;
  flyingAway?: boolean;
}

export default function AlienImage({ src, alt, className = '', flyingAway = false }: AlienImageProps) {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    if (flyingAway) {
      setImageSrc(src);
    }
  }, [flyingAway, src]);

  return (
    <div className={`relative ${flyingAway ? 'fly-away' : ''} ${className}`}>
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 -z-10 blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Image with CSS blend */}
      <Image
        src={imageSrc}
        alt={alt}
        width={300}
        height={300}
        className="object-contain relative -z-20"
        style={{
          mixBlendMode: 'lighten',
          filter: 'brightness(2.1) contrast(1.1)',
          maskImage: 'radial-gradient(circle, black 30%, rgba(0, 0, 0, 0.7) 60%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(circle, black 30%, rgba(0, 0, 0, 0.7) 60%, transparent 85%)',
        }}
        priority
      />
    </div>
  );
}