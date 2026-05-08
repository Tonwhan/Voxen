"use client";

import { Part } from "@/types/assembly";
import { cn } from "@/lib/utils";
import {
  Box,
  Circle,
  Pyramid,
  MousePointer2,
  Eye,
  EyeOff,
  ChevronDown,
  Cuboid,
} from "lucide-react";

interface PartListPanelProps {
  parts: Part[];
  selectedPartId?: string;
  onPartClick: (part: Part) => void;
  hiddenPartIds?: string[];
  onToggleVisibility?: (partId: string) => void;
}

const ShapeIcon = ({
  shape,
  className,
}: {
  shape: string;
  className?: string;
}) => {
  switch (shape) {
    case "box":
      return <Box className={cn("w-3.5 h-3.5", className)} />;
    case "sphere":
      return <Circle className={cn("w-3.5 h-3.5", className)} />;
    case "cylinder":
      return (
        <div
          className={cn(
            "w-3.5 h-3.5 border border-current rounded-sm",
            className,
          )}
        />
      );
    case "cone":
      return <Pyramid className={cn("w-3.5 h-3.5", className)} />;
    default:
      return <MousePointer2 className={cn("w-3.5 h-3.5", className)} />;
  }
};

export function PartListPanel({
  parts,
  selectedPartId,
  onPartClick,
  hiddenPartIds = [],
  onToggleVisibility,
}: PartListPanelProps) {
  return (
    <div className="bg-surface rounded-md border border-border flex flex-col h-full overflow-hidden font-sans">
      <div className="px-3 py-2 border-b border-border bg-surface-muted/30 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Model Tree
          </h3>
        </div>
        <span className="text-[10px] bg-background px-1.5 py-0.5 rounded border border-border text-text-muted">
          {parts.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-1 flex flex-col">
        {parts.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-xs italic">
            No parts in assembly
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Root Assembly Node */}
            <div className="flex items-center px-2 py-1 gap-1 text-text hover:bg-background/50 cursor-default group">
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              <Cuboid className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-sm font-semibold truncate">Assembly</span>
            </div>

            {/* Parts (indented) */}
            <div className="flex flex-col ml-4 border-l border-border/50">
              {parts.map((part) => {
                const isSelected = selectedPartId === part.id;
                const isHidden = hiddenPartIds.includes(part.id);

                return (
                  <div
                    key={part.id}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors relative",
                      isSelected
                        ? "bg-[#FF6B00]/10 text-[#FF6B00]"
                        : "text-text hover:bg-background/50",
                    )}
                    onClick={() => onPartClick(part)}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF6B00]" />
                    )}

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ShapeIcon
                        shape={part.shape}
                        className={isHidden ? "text-text-muted opacity-50" : ""}
                      />
                      <span
                        className={cn(
                          "text-sm truncate",
                          isHidden && "text-text-muted italic",
                        )}
                      >
                        {part.name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility?.(part.id);
                      }}
                      className={cn(
                        "p-1 rounded hover:bg-background/80 transition-opacity",
                        isHidden
                          ? "opacity-100 text-[#FF6B00]"
                          : "opacity-0 group-hover:opacity-100 text-text-muted",
                      )}
                    >
                      {isHidden ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
