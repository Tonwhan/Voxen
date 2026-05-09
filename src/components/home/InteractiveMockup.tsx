"use client";

import { useState } from "react";
import { SceneCanvas } from "../viewer/SceneCanvas";
import { Assembly, Part } from "@/types/assembly";
import {
  Box,
  Settings,
  Info,
  MousePointer2,
  Palette,
  Move,
  Activity,
  Lightbulb,
  Download,
  Layers,
} from "lucide-react";

// Helper components matching PartInspectPanel.tsx
const PropertyRow = ({
  label,
  value,
  isColor = false,
}: {
  label: string;
  value: string | number;
  isColor?: boolean;
}) => (
  <div className="flex border-b border-white/5 text-[10px]">
    <div className="w-1/3 p-2 text-white/20 bg-white/[0.01] border-r border-white/5 font-mono uppercase tracking-wider">
      {label}
    </div>
    <div className="w-2/3 p-2 text-white/80 truncate flex items-center gap-2 font-mono">
      {isColor && (
        <div
          className="w-2.5 h-2.5 rounded-sm border border-white/10 shrink-0"
          style={{ backgroundColor: String(value) }}
        />
      )}
      <span>{value}</span>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border-y border-white/5 mt-4 first:mt-0">
    <Icon className="w-3 h-3 text-[#FF6B00]" />
    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
      {title}
    </span>
  </div>
);

const MOCK_ASSEMBLY: Assembly = {
  assemblyName: "VX-01 Turbine Core",
  version: "1.2.0",
  parts: [
    {
      id: "part-1",
      name: "Main Housing",
      shape: "box",
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#333333",
      geometry: {
        type: "box",
        dimensions: { width: 2, height: 2, depth: 2 },
      },
      material: { name: "Titanium Alloy", description: "Grade 5 Aerospace" },
      designIntent:
        "Primary structural support with optimized thermal dissipation",
    },
    {
      id: "part-2",
      name: "Rotor Shaft",
      shape: "cylinder",
      position: [0, 3.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#FF6B00",
      geometry: {
        type: "cylinder",
        dimensions: { width: 0.2, height: 3, depth: 0.2 },
      },
      material: { name: "Stainless Steel", description: "316L High Polished" },
      designIntent:
        "High-speed rotational transmission with zero-tolerance fitment",
    },
  ],
  metadata: {
    generatedAt: new Date().toISOString(),
    promptSummary: "High-performance turbine assembly with titanium housing",
  },
};

export function InteractiveMockup() {
  const [selectedPart, setSelectedPart] = useState<Part | null>(
    MOCK_ASSEMBLY.parts[0],
  );

  return (
    <section
      className="py-32 px-8 max-w-7xl mx-auto relative z-10 animate-fade-up"
      style={{ animationDelay: "400ms" }}
    >
      <div className="mb-16">
        <span
          className="text-[10px] tracking-[0.3em] uppercase text-[#FF6B00] mb-4 block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          [ INTERACTIVE PREVIEW ]
        </span>
        <h2 className="text-4xl font-light text-white">
          Real-time{" "}
          <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            CAD Interaction
          </span>
        </h2>
        <p className="mt-4 text-white/40 max-w-xl text-sm leading-relaxed">
          Experience the precision of Voxen-generated assemblies. Rotate,
          inspect, and analyze every component with our built-in industrial
          viewer.
        </p>
      </div>

      <div className="relative group/mockup">
        {/* Atmospheric Edge Effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-[12px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-[#FFFFFF]/50 to-transparent blur-[2px] z-20" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-black border border-white/5 rounded-[12px] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative z-10">
          {/* Main Viewer Area */}
          <div className="lg:col-span-8 h-[550px] bg-black relative group">
            {/* Viewer Header */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 flex items-center justify-between px-4 z-20 bg-black/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
                <span className="ml-4 text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                  Viewer / {MOCK_ASSEMBLY.assemblyName}
                </span>
              </div>
            </div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
              <MousePointer2 size={10} className="text-[#FF6B00]" />
              <span className="text-[9px] text-white/40 font-mono uppercase tracking-[0.2em]">
                Drag to Rotate
              </span>
            </div>

            <SceneCanvas
              assembly={MOCK_ASSEMBLY}
              onPartClick={(p) => setSelectedPart(p)}
              selectedPartId={selectedPart?.id}
              onMissed={() => setSelectedPart(null)}
            />
          </div>

          {/* Side Panel: Properties (Styled after PartInspectPanel.tsx) */}
          <div className="lg:col-span-4 bg-white/[0.01] border-l border-white/5 flex flex-col overflow-hidden h-[550px]">
            {/* Panel Header */}
            <div className="h-10 border-b border-white/5 flex items-center px-4 bg-white/[0.02]">
              <h3 className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                Properties Grid
              </h3>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
              {selectedPart ? (
                <div className="animate-fade-up">
                  <SectionHeader icon={Info} title="General" />
                  <PropertyRow label="Name" value={selectedPart.name} />
                  <PropertyRow
                    label="ID"
                    value={selectedPart.id.toUpperCase()}
                  />
                  <PropertyRow
                    label="Shape"
                    value={selectedPart.shape.toUpperCase()}
                  />

                  <SectionHeader icon={Palette} title="Material" />
                  <PropertyRow
                    label="Material"
                    value={selectedPart.material.name}
                  />
                  <PropertyRow
                    label="Color"
                    value={selectedPart.color}
                    isColor
                  />
                  <div className="p-3 text-[10px] text-white/30 italic bg-white/[0.01] leading-relaxed border-b border-white/5 font-mono">
                    "{selectedPart.material.description}"
                  </div>

                  <SectionHeader icon={Move} title="Transform" />
                  <PropertyRow
                    label="Pos X"
                    value={selectedPart.position[0].toFixed(2)}
                  />
                  <PropertyRow
                    label="Pos Y"
                    value={selectedPart.position[1].toFixed(2)}
                  />
                  <PropertyRow
                    label="Pos Z"
                    value={selectedPart.position[2].toFixed(2)}
                  />

                  <SectionHeader icon={Activity} title="AI Insight" />
                  <div className="p-3 text-[10px] text-white/60 bg-white/[0.02] italic leading-relaxed border-b border-white/5 font-mono">
                    "{selectedPart.designIntent}"
                  </div>

                  <SectionHeader icon={Lightbulb} title="Technical Model" />
                  <div className="p-4 bg-white/[0.01]">
                    <p className="text-[9px] font-bold text-[#FF6B00] uppercase mb-2 tracking-widest">
                      Design Rationale
                    </p>
                    <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                      High-precision geometry optimized for variable thermal
                      stress. Recommended for additive manufacturing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-up">
                  <SectionHeader icon={Layers} title="Assembly Overview" />
                  <PropertyRow
                    label="Project"
                    value={MOCK_ASSEMBLY.assemblyName}
                  />
                  <PropertyRow label="Version" value={MOCK_ASSEMBLY.version} />
                  <PropertyRow
                    label="Parts"
                    value={MOCK_ASSEMBLY.parts.length}
                  />
                  <PropertyRow label="Status" value="Ready / Validated" />

                  <SectionHeader icon={Activity} title="AI Design Strategy" />
                  <div className="p-4 space-y-6">
                    <div>
                      <p className="text-[9px] font-bold text-[#FF6B00] uppercase mb-2 tracking-widest">
                        Design Rationale
                      </p>
                      <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                        Optimized for weight-to-strength ratio using generative
                        lattice structures in the core housing. Thermal
                        dissipation paths are aligned with high-speed rotor
                        vectors.
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-[#FF6B00] uppercase mb-2 tracking-widest">
                        Prototype Phase
                      </p>
                      <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                        Recommended: SLA 3D Printing with High-Temp Resin. Focus
                        on dimensional fitment and assembly clearance validation
                        before final material selection.
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-[#FF6B00] uppercase mb-2 tracking-widest">
                        Production Roadmap
                      </p>
                      <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                        Recommended: 5-Axis CNC Milling for the main housing.
                        For scale, switch to Titanium Investment Casting to
                        maintain structural integrity at high RPMs.
                      </p>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col items-center justify-center text-center opacity-20 mt-auto">
                    <Info size={16} className="text-white/20 mb-3" />
                    <p className="text-[8px] text-white uppercase tracking-[0.2em] leading-relaxed font-mono">
                      Select part for component-level telemetry
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
