"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type AccordionItemProps = {
  title: string;
  content: string;
};

/**
 * Single expandable accordion item for How It Works section
 */
export function AccordionItem({ title, content }: AccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b cursor-pointer select-none group"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between py-6 transition-colors duration-200 group-hover:text-white">
        <span className={`text-sm tracking-wide transition-colors duration-200 ${open ? "text-white" : "text-white/60"}`}>
          {title}
        </span>
        <span className="text-[#FF6B00]">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-40 opacity-100 pb-6" : "max-h-0 opacity-0"}`}>
        <p className="text-xs text-white/40 leading-relaxed pr-8">
          {content}
        </p>
      </div>
    </div>
  );
}
