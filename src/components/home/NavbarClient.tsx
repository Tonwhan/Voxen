"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "FEATURES", href: "#features" },
  { label: "BENCHMARKS", href: "#benchmarks" },
  { label: "ADVANTAGES", href: "#advantages" },
];

export function NavbarClient({ isSignedIn }: { isSignedIn: boolean }) {
  const [activeSection, setActiveSection] = useState<string>("");
  const isClickScrolling = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;

        entries.forEach((entry) => {
          // Use isIntersecting and check which one is more visible
          if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: [0.2, 0.5, 0.8],
        rootMargin: "-20% 0px -20% 0px", // Trigger when section is in the middle 60% of viewport
      },
    );

    NAV_LINKS.forEach((link) => {
      const el = document.getElementById(link.href.substring(1));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    isClickScrolling.current = true;
    setActiveSection(id);

    // Reset the manual scroll flag after the animation completes
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/5 animate-fade-down">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center relative">
        {/* Left Side: Logo */}
        <div className="flex-1 flex items-center">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-8 h-8">
              <Image
                src="/icon/oryxenlab.svg"
                alt="Oryxenlab"
                fill
                priority
                loading="eager"
                className="object-contain"
              />
            </div>
            <span
              className="text-white text-xl uppercase"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 300 }}
            >
              VOXEN
            </span>
          </Link>
        </div>

        {/* Center: Navigation Menu */}
        <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.substring(1);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => handleNavClick(link.href.substring(1))}
                className={cn(
                  "text-xs tracking-[0.15em] uppercase transition-all duration-300 relative py-1",
                  isActive
                    ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] font-medium"
                    : "text-white/40 hover:text-white",
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {link.label}
                {isActive && (
                  <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-fade-up" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Side: Auth Buttons */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in">
                <button className="text-xs tracking-wide uppercase text-white/60 hover:text-white px-4 py-2 rounded-[4px] border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="text-xs tracking-wide uppercase bg-[#FF6B00] hover:bg-[#FF8C33] text-white px-5 py-2 rounded-[4px] transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] cursor-pointer">
                  Get Started
                </button>
              </Link>
            </>
          ) : (
            <UserButton />
          )}
        </div>
      </div>
    </nav>
  );
}
