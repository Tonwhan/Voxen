"use client";

import { useEffect, useState } from "react";

/**
 * Animates text by revealing characters one-by-one from top with a drop effect
 */
export function useCharacterDraw(text: string, delay = 30, startDelay = 500) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleCount((prev) => {
          if (prev >= text.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, delay, startDelay]);

  return visibleCount;
}
