"use client";

import { Layers, Cpu, Zap, Download } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ScrambleText } from "./ScrambleText";

const FEATURES = [
  {
    title: "Part-Aware AI",
    icon: <Layers size={20} />,
    description:
      "Each generated component is discrete and labeled with name, dimensions, material.",
  },
  {
    title: "Multi-Token Precision",
    icon: <Cpu size={20} />,
    description:
      "Qwen3-8B structured output validated by Zod — zero garbage JSON.",
  },
  {
    title: "AMD MI300X Power",
    icon: <Zap size={20} />,
    description:
      "192GB HBM3. 5.3 TB/s bandwidth. Full-precision inference in under 8 seconds.",
  },
  {
    title: "CAD-Ready Export",
    icon: <Download size={20} />,
    description:
      "STL, OBJ, STEP — compatible with Fusion 360, Blender, SolidWorks.",
  },
];

export function FeaturesGrid() {
  const { ref, visible } = useScrollAnimation();

  return (
    <section
      id="features"
      ref={ref}
      className={`py-32 px-8 max-w-7xl mx-auto transition-all duration-1000 relative ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {/* Top transition fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-0" />

      <div className="mb-16 relative z-10">
        <span
          className="text-[10px] tracking-[0.3em] uppercase text-[#FF6B00] mb-4 block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <ScrambleText text="[ CORE FEATURES ]" />
        </span>
        <h2 className="text-4xl font-light text-white">
          What makes Voxen <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">unstoppable</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className="p-8 cursor-default group transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px",
              backdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
            }}
          >
            <div className="mb-6 text-[#FF6B00]">{feature.icon}</div>

            <h3
              className="text-sm font-medium mb-3 text-white tracking-wide uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {feature.title}
            </h3>

            <p className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
