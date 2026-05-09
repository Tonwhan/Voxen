"use client";

import { useState, useEffect } from "react";
import {
  LucideIcon,
  Hexagon,
  Database,
  Brain,
  MousePointer2Off,
} from "lucide-react";

interface ComparisonCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: {
    label: string;
    value: string;
    status: "positive" | "negative" | "neutral";
  }[];
  isVoxen?: boolean;
}

const ComparisonCard = ({
  title,
  description,
  icon: Icon,
  features,
  isVoxen,
}: ComparisonCardProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Visual Container */}
      <div
        className={`relative aspect-[16/10] rounded-3xl overflow-hidden border ${
          isVoxen
            ? "bg-[#080808] border-[#FF6B00]/20 shadow-[0_0_80px_-20px_rgba(255,107,0,0.15)]"
            : "bg-[#030303] border-white/5"
        }`}
      >
        {/* Subtle Noise Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative Grid */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${isVoxen ? "#FF6B00" : "white"} 1px, transparent 1px), linear-gradient(90deg, ${isVoxen ? "#FF6B00" : "white"} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Atmospheric Glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[100px] rounded-full ${
            isVoxen ? "bg-[#FF6B00]/25 opacity-40" : "bg-white/5 opacity-20"
          }`}
        />

        {/* Floating Core Visual - Always Undefined */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full h-full flex items-center justify-center opacity-30">
            <div className="w-32 h-32 border border-dashed border-white/20 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute w-24 h-24 bg-white/10 blur-3xl" />
            <div className="absolute flex flex-col gap-2 items-center">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em]">
                Undefined
              </div>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
        </div>

        {/* Top Edge Beam for Voxen */}
        {isVoxen && (
          <div className="absolute top-0 left-0 right-0 h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B00]/50 to-transparent" />
            <div className="absolute inset-x-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent blur-[2px]" />
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="mt-10 flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isVoxen ? "bg-white/5 text-white" : "bg-white/5 text-white"
            }`}
          >
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-medium text-white">{title}</h3>
          </div>
        </div>

        <p
          className={`text-base leading-relaxed mb-8 flex-1 font-light ${isVoxen ? "text-white" : "text-white/40"}`}
        >
          {description}
        </p>

        <div className="grid grid-cols-1 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.01]"
            >
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isVoxen ? "text-white" : "text-white/30"}`}
              >
                {f.label}
              </span>
              <span
                className={`text-xs font-mono font-bold ${isVoxen ? "text-white" : f.status === "positive" ? "text-[#FF6B00]" : "text-white/60"}`}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export function ComparisonSection() {
  return (
    <section className="py-40 px-8 max-w-7xl mx-auto relative z-10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[60%] bg-[#FF6B00]/5 blur-[120px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[10%] right-[-10%] w-[30%] h-[50%] bg-[#FF6B00]/3 blur-[100px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="mb-24 animate-fade-up">
        <h2 className="text-4xl lg:text-4xl font-light text-white tracking-tight leading-[1.1] mb-8">
          Most AI stops at the shape.
          <br />
          Voxen starts at the part.
        </h2>
        <div className="space-y-2">
          <p className="text-white/50 text-lg leading-relaxed font-light">
            Generic CAD AI creates pictures. Voxen creates{" "}
            <span className="text-white font-medium">engineering reality</span>.
          </p>
          <p className="text-white/50 text-lg leading-relaxed font-light">
            Step into the next generation of industrial design where every pixel
            is a validated physical coordinate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
          <ComparisonCard
            title="Standard CAD AI"
            description="Built on visual diffusion models. It generates 'dumb' geometry that lacks connectivity, assembly constraints, and manufacturing logic."
            icon={MousePointer2Off}
            features={[
              {
                label: "Precision",
                value: "Geometric Approximation",
                status: "negative",
              },
              {
                label: "Data Format",
                value: "Point Cloud / OBJ",
                status: "negative",
              },
              { label: "Logic", value: "Non-Parametric", status: "negative" },
              {
                label: "Manufacturing",
                value: "Needs Manual Rebuild",
                status: "negative",
              },
            ]}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "600ms" }}>
          <ComparisonCard
            isVoxen
            title="Voxen Intelligence"
            description="Driven by proprietary B-Rep generation kernels. Voxen understands topological relationships and engineering intent."
            icon={Brain}
            features={[
              {
                label: "Precision",
                value: "Industrial Standard",
                status: "positive",
              },
              {
                label: "Data Format",
                value: "Native STEP / NURBS",
                status: "positive",
              },
              { label: "Logic", value: "Fully Parametric", status: "positive" },
              {
                label: "Manufacturing",
                value: "Validated for Production",
                status: "positive",
              },
            ]}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </section>
  );
}
