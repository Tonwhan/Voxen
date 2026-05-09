"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown } from "lucide-react";

export function HeroSection() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // Calculate offset for sliding effect
    const x = (clientX / innerWidth - 0.5) * 40;
    const y = (clientY / innerHeight - 0.5) * 40;
    setMousePos({ x, y });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center overflow-hidden bg-black"
    >
      {/* Central Atmospheric Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,0,0.05),transparent_70%)] pointer-events-none" />

      {/* Technical Grid Background */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)`,
        }}
      />

      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/30 pointer-events-none" />
      
      {/* Seamless transition fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 w-full relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-light leading-[1.1] mb-10 text-white animate-fade-up">
            Voxen
            <br />
            The future of CAD
            <br />
            <span className="text-white/60">
              doesn&apos;t start with a cursor.
            </span>
            <br />
            <span className="text-[#FF6B00]">It starts with a prompt.</span>
          </h1>

          {/* Prompt Bar */}
          <div
            className="flex items-center gap-3 px-5 py-4 max-w-xl group transition-all duration-300 hover:border-white/20 animate-fade-up"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              backdropFilter: "blur(12px)",
              animationDelay: "200ms"
            }}
          >
            <Sparkles size={16} className="text-[#FF6B00] flex-shrink-0" />
            <input
              type="text"
              placeholder="Describe your CAD assembly..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-sm"
              style={{ fontFamily: "var(--font-geist)" }}
            />
            <button
              className="px-4 py-1.5 bg-[#FF6B00] hover:bg-[#FF8C33] text-white text-xs tracking-wider uppercase rounded-[4px] transition-all cursor-pointer"
              onClick={() => router.push("/workspace")}
            >
              Generate
            </button>
          </div>

          <p
            className="mt-8 text-[10px] tracking-[0.2em] uppercase text-white/30"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Powered by AMD MI300X
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-12 flex items-center gap-3 animate-bounce">
        <ChevronDown size={16} className="text-white/20" />
        <span
          className="text-[10px] tracking-widest uppercase text-white/20"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Scroll
        </span>
      </div>
    </section>
  );
}
