"use client";

import { useLayoutEffect, useRef, useMemo, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ScrollReveal.css";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  start?: string;
  scrub?: boolean | number;
  stagger?: number;
}

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  textStyle = {},
  rotationEnd = "bottom 80%",
  wordAnimationEnd = "bottom 80%",
  start = "top 95%",
  scrub = true,
  stagger = 0.05,
}: ScrollRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === "string" ? children : "";
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span className="word" key={index} style={{ display: "inline-block" }}>
          {word}
        </span>
      );
    });
  }, [children]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : window;

    const ctx = gsap.context(() => {
      // Rotation animation
      gsap.fromTo(
        el,
        { transformOrigin: "0% 50%", rotate: baseRotation },
        {
          ease: "none",
          rotate: 0,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: "top bottom",
            end: rotationEnd,
            scrub: scrub,
          },
        },
      );

      const wordElements = el.querySelectorAll(".word");

      // Opacity and stagger animation
      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: "opacity" },
        {
          ease: "none",
          opacity: 1,
          stagger: stagger,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: start,
            end: wordAnimationEnd,
            scrub: scrub,
          },
        },
      );

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: "none",
            filter: "blur(0px)",
            stagger: stagger,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: start,
              end: wordAnimationEnd,
              scrub: scrub,
            },
          },
        );
      }

      // Force refresh to handle dynamic layout
      ScrollTrigger.refresh();
    }, containerRef);

    // Initial refresh after a small delay
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      ctx.revert();
    };
  }, [
    scrollContainerRef,
    enableBlur,
    baseRotation,
    baseOpacity,
    rotationEnd,
    start,
    scrub,
    stagger,
    blurStrength,
  ]);

  return (
    <div ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <div className={`scroll-reveal-text ${textClassName}`} style={textStyle}>
        {splitText}
      </div>
    </div>
  );
};

export default ScrollReveal;
