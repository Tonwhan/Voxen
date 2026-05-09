"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-20 px-8 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2">
          <span
            className="text-white tracking-[0.25em] text-sm uppercase"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 300 }}
          >
            VOXEN
          </span>
          <p
            className="text-[10px] text-white/20 tracking-widest uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            The Future of Generative CAD
          </p>
        </div>

        <div className="flex gap-10" />

        <p
          className="text-[10px] text-white/20 tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          © 2026 Oryxenlab. AMD Hackathon Edition.
        </p>
      </div>
    </footer>
  );
}
