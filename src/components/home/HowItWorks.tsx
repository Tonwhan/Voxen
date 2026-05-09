"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { AccordionItem } from "./AccordionItem";
import { ScrambleText } from "./ScrambleText";

const STEPS = [
  {
    title: "Prompt to JSON",
    content: "Describe your engineering requirements in natural language. Voxen interprets materials, dimensions, and structural relationships."
  },
  {
    title: "Structured Validation",
    content: "Our AI engine generates structured data validated against Zod schemas, ensuring every part is geometrically sound and CAD-compliant."
  },
  {
    title: "Real-Time 3D Rendering",
    content: "Instantly visualize your generated assembly in our high-performance 3D viewer, with part-level inspection and hierarchy management."
  },
  {
    title: "CAD-Ready Export",
    content: "Seamlessly export your designs as industry-standard STEP or STL files, ready to be imported into Fusion 360 or SolidWorks."
  }
];

export function HowItWorks() {
  const { ref, visible } = useScrollAnimation();

  return (
    <section 
      id="advantages"
      ref={ref}
      className={`py-32 px-8 max-w-7xl mx-auto transition-all duration-1000 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#FF6B00] mb-4 block" style={{ fontFamily: "var(--font-mono)" }}>
            <ScrambleText text="[ ADVANTAGES ]" />
          </span>
          <h2 className="text-4xl font-light text-white leading-tight">
            Outsmart the competition <br />
            with Voxen
          </h2>
          <p className="mt-8 text-white/40 max-w-md leading-relaxed">
            We've combined frontier LLMs with industrial-grade CAD kernels to bridge the gap between imagination and engineering.
          </p>
        </div>

        <div className="flex flex-col">
          {STEPS.map((step, i) => (
            <AccordionItem key={i} title={step.title} content={step.content} />
          ))}
        </div>
      </div>
    </section>
  );
}
