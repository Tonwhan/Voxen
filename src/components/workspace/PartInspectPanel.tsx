import { Part, Assembly } from "@/types/assembly";
import { exportSTL } from "@/lib/export/exportSTL";
import { exportOBJ } from "@/lib/export/exportOBJ";
import { Button } from "@/components/ui/button";
import {
  Download,
  Info,
  Box,
  Palette,
  Move,
  Activity,
  Lightbulb,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type PartInspectPanelProps = {
  part: Part | null;
  assembly?: Assembly | null;
  hiddenPartIds?: string[];
  isLoading?: boolean;
};

/**
 * Panel to display the details of the currently selected part.
 * Styled to look like a CAD Property Grid.
 */
/**
 * Helper components for the Property Grid
 */
const PropertyRow = ({
  label,
  value,
  isColor = false,
}: {
  label: string;
  value: string | number;
  isColor?: boolean;
}) => (
  <div className="flex border-b border-border/50 text-xs">
    <div className="w-1/3 p-2 text-text-muted bg-surface-muted/20 border-r border-border/50 font-medium">
      {label}
    </div>
    <div className="w-2/3 p-2 text-text truncate flex items-center gap-2">
      {isColor && (
        <div
          className="w-3 h-3 rounded-sm border border-border shrink-0"
          style={{ backgroundColor: String(value) }}
        />
      )}
      <span className={cn(isColor && "font-mono")}>{value}</span>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-muted/40 border-y border-border mt-2 first:mt-0">
    <Icon className="w-3.5 h-3.5 text-[#FF6B00]" />
    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
      {title}
    </span>
  </div>
);

/**
 * Panel to display the details of the currently selected part.
 * Styled to look like a CAD Property Grid.
 */
export function PartInspectPanel({
  part,
  assembly,
  hiddenPartIds = [],
  isLoading = false,
}: PartInspectPanelProps) {
  const visibleParts =
    assembly?.parts.filter((p) => !hiddenPartIds.includes(p.id)) || [];

  if (isLoading) {
    return (
      <div className="border border-border rounded-md bg-surface flex flex-col h-full overflow-hidden font-sans shadow-sm">
        <div className="px-3 py-2 border-b border-border bg-surface-muted/30">
          <Skeleton className="h-4 w-24 bg-gray-600" />
        </div>
        <div className="flex-1 p-2 flex flex-col gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-gray-600/50" />
            <Skeleton className="h-8 w-full bg-gray-600/30" />
            <Skeleton className="h-8 w-full bg-gray-600/30" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-gray-600/50" />
            <Skeleton className="h-20 w-full bg-gray-600/30" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-gray-600/50" />
            <Skeleton className="h-32 w-full bg-gray-600/30" />
          </div>
        </div>
      </div>
    );
  }

  const handleExport = (format: "STL" | "OBJ") => {
    if (!part) return;

    let content = "";
    let filename = `${part.name.replace(/\s+/g, "_")}_${part.id}`;

    if (format === "STL") {
      content = exportSTL([part]);
      filename += ".stl";
    } else {
      content = exportOBJ([part]);
      filename += ".obj";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Case 1: Nothing to show
  if (!part && !assembly) {
    return (
      <div className="p-4 border border-border rounded-md bg-surface flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <Info className="w-8 h-8 text-text-muted mb-2 opacity-20" />
        <p className="text-text-muted text-xs uppercase tracking-widest font-bold">
          Properties
        </p>
        <p className="text-text-muted text-xs mt-1">
          Select a part to view properties
        </p>
      </div>
    );
  }

  // Case 2: Assembly Overview (No part selected)
  if (!part && assembly) {
    return (
      <div className="border border-border rounded-md bg-surface flex flex-col h-full overflow-hidden font-sans shadow-sm">
        <div className="px-3 py-2 border-b border-border bg-surface-muted/30">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
            Project Overview
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-soft scrollbar-track-transparent pr-1">
          <SectionHeader icon={Info} title="Assembly Details" />
          <PropertyRow
            label="Project"
            value={assembly.assemblyName || "Untitled"}
          />
          <PropertyRow label="Total Parts" value={assembly.parts.length} />
          <PropertyRow label="Visible" value={visibleParts.length} />
          <PropertyRow label="Status" value="AI Validated" />

          <SectionHeader icon={Layers} title="Hierarchy" />
          <div className="p-2 flex flex-wrap gap-1 bg-surface-muted/10 border-b border-border/50">
            {assembly.parts.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded border border-border/50 truncate max-w-[100px]",
                  hiddenPartIds.includes(p.id)
                    ? "opacity-30 bg-background"
                    : "bg-background text-text",
                )}
              >
                {p.name}
              </div>
            ))}
          </div>

          <SectionHeader icon={Activity} title="AI Assembly Insight" />
          <div className="p-3 text-xs text-text bg-background italic leading-relaxed border-b border-border/50">
            "{assembly.metadata.promptSummary}"
          </div>

          <SectionHeader icon={Lightbulb} title="Global Recommendation" />
          <div className="flex flex-col bg-surface-muted/10">
            <div className="p-3 border-b border-border/30">
              <p className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1 tracking-tighter">
                System Rationale
              </p>
              <p className="text-xs text-text leading-relaxed">
                The current {visibleParts.length} visible components form a
                cohesive structural unit with optimized center of gravity and
                stress distribution.
              </p>
            </div>
            <div className="p-3">
              <p className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1 tracking-tighter">
                Production Estimate
              </p>
              <p className="text-xs text-text">
                Recommended for additive manufacturing (SLA/SLS) due to complex
                internal intersections.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Specific Part Details (Part is guaranteed to be non-null here)
  if (!part) return null; // Final safety guard for TS

  return (
    <div className="border border-border rounded-md bg-surface flex flex-col overflow-hidden font-sans shadow-sm">
      <div className="px-3 py-2 border-b border-border bg-surface-muted/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Properties
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-soft scrollbar-track-transparent pr-1">
        <SectionHeader icon={Info} title="General" />
        <PropertyRow label="Name" value={part.name} />
        <PropertyRow label="ID" value={part.id.substring(0, 8)} />
        <PropertyRow label="Shape" value={part.shape} />

        <SectionHeader icon={Palette} title="Material" />
        <PropertyRow label="Name" value={part.material.name} />
        <PropertyRow label="Color" value={part.color} isColor />
        <div className="p-2 text-[10px] text-text-muted italic bg-background/50">
          "{part.material.description}"
        </div>

        <SectionHeader icon={Move} title="Transform" />
        <div className="grid grid-cols-1 border-b border-border/50">
          <div className="flex border-b border-border/50 last:border-0">
            <div className="w-1/3 p-2 text-text-muted bg-surface-muted/20 border-r border-border/50 text-xs uppercase font-bold">
              Position
            </div>
            <div className="w-2/3 p-2 flex justify-between text-xs font-mono scale-95 origin-left">
              <span>X:{part.position[0].toFixed(2)}</span>
              <span>Y:{part.position[1].toFixed(2)}</span>
              <span>Z:{part.position[2].toFixed(2)}</span>
            </div>
          </div>
          <div className="flex border-b border-border/50 last:border-0">
            <div className="w-1/3 p-2 text-text-muted bg-surface-muted/20 border-r border-border/50 text-xs uppercase font-bold">
              Rotation
            </div>
            <div className="w-2/3 p-2 flex justify-between text-xs font-mono scale-95 origin-left">
              <span>X:{part.rotation[0].toFixed(2)}</span>
              <span>Y:{part.rotation[1].toFixed(2)}</span>
              <span>Z:{part.rotation[2].toFixed(2)}</span>
            </div>
          </div>
          <div className="flex">
            <div className="w-1/3 p-2 text-text-muted bg-surface-muted/20 border-r border-border/50 text-xs uppercase font-bold">
              Scale
            </div>
            <div className="w-2/3 p-2 flex justify-between text-xs font-mono scale-95 origin-left">
              <span>X:{part.scale[0].toFixed(2)}</span>
              <span>Y:{part.scale[1].toFixed(2)}</span>
              <span>Z:{part.scale[2].toFixed(2)}</span>
            </div>
          </div>
        </div>

        <SectionHeader icon={Activity} title="AI Insight" />
        <div className="p-3 text-xs text-text bg-background italic leading-relaxed border-b border-border/50">
          "{part.designIntent}"
        </div>

        <SectionHeader icon={Lightbulb} title="Technical Mock-up" />
        <div className="flex flex-col bg-surface-muted/10">
          <div className="p-3 border-b border-border/30">
            <p className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1 tracking-tighter">
              Design Rationale
            </p>
            <p className="text-xs text-text leading-relaxed font-medium">
              This geometry features a balanced load-bearing architecture,
              designed to minimize stress concentrations while maintaining a
              lightweight profile.
            </p>
          </div>
          <div className="p-3 border-b border-border/30">
            <p className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1 tracking-tighter">
              Recommended Material
            </p>
            <p className="text-xs text-text font-bold">
              Carbon Fiber Reinforced Polymer (CFRP)
            </p>
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold text-[#FF6B00] uppercase mb-1 tracking-tighter">
              Material Rationale
            </p>
            <p className="text-xs text-text leading-relaxed opacity-80">
              CFRP provides exceptional tensile strength and thermal stability,
              making it ideal for precision parts that require long-term
              durability in variable environments.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-surface-muted/20 border-t border-border mt-auto">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs border-border hover:bg-background"
            onClick={() => handleExport("STL")}
          >
            <Download className="w-3 h-3 mr-1" />
            STL
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs border-border hover:bg-background"
            onClick={() => handleExport("OBJ")}
          >
            <Download className="w-3 h-3 mr-1" />
            OBJ
          </Button>
        </div>
      </div>
    </div>
  );
}
