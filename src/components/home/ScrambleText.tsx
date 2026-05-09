"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const CHARS = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function ScrambleText({
  text,
  delay = 0,
  className,
  triggerOnce = true,
}: {
  text: string;
  delay?: number;
  className?: string;
  triggerOnce?: boolean;
}) {
  const [displayText, setDisplayText] = useState(text);
  const isAnimating = useRef(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasTriggered = useRef(false);

  const scramble = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join(""),
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        isAnimating.current = false;
      }

      iteration += 1 / 2;
    }, 40);
  }, [text]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!triggerOnce || !hasTriggered.current)) {
            setTimeout(scramble, delay);
            if (triggerOnce) hasTriggered.current = true;
          }
        });
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [scramble, delay, triggerOnce]);

  return (
    <span ref={containerRef} onMouseEnter={scramble} className={className}>
      {displayText}
    </span>
  );
}
