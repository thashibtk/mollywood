'use client';

import { useEffect, useState } from 'react';

export default function StarsBackground() {
  const [stars, setStars] = useState<Array<{ top: number; left: number; delay: number }>>([]);

  useEffect(() => {
    const starsArray = Array.from({ length: 100 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setStars(starsArray);
  }, []);

  return (
    <div className="stars">
      {stars.map((star, index) => (
        <div
          key={index}
          className="star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
