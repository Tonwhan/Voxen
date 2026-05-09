"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "../ui/ScrollReveal";

export function CTASection() {
  return (
    <section className="relative pt-60 pb-32 px-8 overflow-hidden bg-black flex flex-col items-center justify-center text-center">
      <div className="relative z-10 max-w-4xl mx-auto mb-40">
        <ScrollReveal
          baseOpacity={0}
          enableBlur={true}
          baseRotation={5}
          blurStrength={20}
          containerClassName="mb-16"
          textClassName="text-4xl md:text-6xl font-light text-white tracking-tight leading-[1.2] uppercase"
          textStyle={{ fontFamily: "var(--font-mono)" }}
          start="top 80%"
          scrub={1.2}
          stagger={0.1}
        >
          Your next assembly starts with one prompt
        </ScrollReveal>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-8">
          <Link
            href="/workspace"
            className="group relative px-6 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-white text-sm font-medium transition-all hover:border-white/20 flex items-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          >
            Get started
          </Link>
        </div>
      </div>

      {/* Massive Background Text "VOXEN" at the bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full pointer-events-none select-none">
        <h2
          className="text-[28vw] font-bold leading-none text-white/[0.03] tracking-tighter text-center translate-y-[20%]"
          style={{
            fontFamily: "var(--font-geist), sans-serif",
          }}
        >
          VOXEN
        </h2>
      </div>
    </section>
  );
}
