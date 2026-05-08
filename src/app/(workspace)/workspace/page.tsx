"use client";

import { useState, useEffect } from "react";
import { PromptInput } from "@/components/workspace/PromptInput";
import { GenerateButton } from "@/components/workspace/GenerateButton";
import { PartInspectPanel } from "@/components/workspace/PartInspectPanel";
import { PartListPanel } from "@/components/workspace/PartListPanel";
import { SceneCanvas } from "@/components/viewer/SceneCanvas";
import {
  ProcessStatusPanel,
  ProcessStep,
} from "@/components/workspace/ProcessStatusPanel";
import { generateAssembly } from "@/lib/api/generate";
import { Assembly, Part } from "@/types/assembly";
import { exportSTL } from "@/lib/export/exportSTL";
import { exportOBJ } from "@/lib/export/exportOBJ";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { UserFooter } from "@/components/workspace/UserFooter";
import { Download } from "lucide-react";

export default function WorkspacePage() {
  const { user, isLoaded } = useUser();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [error, setError] = useState<{ message: string; code: string } | null>(
    null,
  );
  const [hiddenPartIds, setHiddenPartIds] = useState<string[]>([]);

  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { id: "analyze", label: "Analyzing Request", status: "pending" },
    { id: "design", label: "Designing 3D Geometry", status: "pending" },
    { id: "optimize", label: "Optimizing Mesh", status: "pending" },
    { id: "finalize", label: "Finalizing Assembly", status: "pending" },
  ]);
  const [showProcessPanel, setShowProcessPanel] = useState(false);

  // Initialize with demo data
  useEffect(() => {
    const demoAssembly: Assembly = {
      assemblyName: "Demo Assembly",
      version: "1.0.0",
      parts: [
        {
          id: "base",
          name: "Base Block",
          shape: "box",
          position: [0, 0.25, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#378ADD",
          geometry: {
            type: "box",
            dimensions: { width: 2, height: 0.5, depth: 2 },
          },
          material: { name: "Plastic", description: "Blue structural plastic" },
          designIntent: "Foundation for the assembly",
        },
        {
          id: "top",
          name: "Pillar",
          shape: "box",
          position: [0, 1.5, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: "#1D9E75",
          geometry: {
            type: "box",
            dimensions: { width: 0.5, height: 2, depth: 0.5 },
          },
          material: {
            name: "Aluminum",
            description: "Green anodized aluminum",
          },
          designIntent: "Support pillar",
        },
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        promptSummary: "Demo blocks with different scales",
      },
    };
    setAssembly(demoAssembly);

    // Artificial delay for "page load" skeleton demonstration
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (prompt.length < 10) {
      setError({
        message: "Prompt must be at least 10 characters long.",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    if (prompt.length > 500) {
      setError({
        message: "Prompt must be less than 500 characters long.",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedPart(null);
    setShowProcessPanel(true);

    // Reset steps
    setProcessSteps((prev) => prev.map((s) => ({ ...s, status: "pending" })));

    // Simulation of steps
    const updateStep = (id: string, status: "processing" | "completed") => {
      setProcessSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s)),
      );
    };

    try {
      updateStep("analyze", "processing");
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateStep("analyze", "completed");

      updateStep("design", "processing");
      const apiPromise = generateAssembly(prompt);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      updateStep("design", "completed");

      updateStep("optimize", "processing");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStep("optimize", "completed");

      updateStep("finalize", "processing");
      const result = await apiPromise;
      await new Promise((resolve) => setTimeout(resolve, 600));
      updateStep("finalize", "completed");

      setIsLoading(false);
      if (result.success) {
        setAssembly(result.data);
        // Keep panel visible for a moment then hide
        setTimeout(() => setShowProcessPanel(false), 2000);
      } else {
        setError({ message: result.error, code: result.code });
        setShowProcessPanel(false);
      }
    } catch (err) {
      setIsLoading(false);
      setError({
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
      });
      setShowProcessPanel(false);
    }
  };

  const handlePartClick = (part: Part) => {
    if (hiddenPartIds.includes(part.id)) {
      toast.warning("Part is hidden", {
        description: "Please unhide the part to view details",
        duration: 3000,
      });
      return;
    }
    setSelectedPart(part);
  };

  const handleMissed = () => {
    setSelectedPart(null);
  };

  const togglePartVisibility = (partId: string) => {
    setHiddenPartIds((prev) => {
      const isHiding = !prev.includes(partId);
      if (isHiding && selectedPart?.id === partId) {
        setSelectedPart(null);
      }
      return isHiding ? [...prev, partId] : prev.filter((id) => id !== partId);
    });
  };

  const handleExportAssembly = (format: "STL" | "OBJ") => {
    if (!assembly || assembly.parts.length === 0) return;

    let content = "";
    let filename = `${assembly.assemblyName.replace(/\s+/g, "_")}`;

    if (format === "STL") {
      content = exportSTL(assembly.parts);
      filename += ".stl";
    } else {
      content = exportOBJ(assembly.parts);
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

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-[calc(100vh-4rem)] p-4 gap-4 bg-background overflow-hidden">
      {/* Left Panel - Prompt and Control */}
      <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        <div className="bg-surface p-4 rounded-md border border-border flex flex-col gap-4 shadow-sm">
          <WorkspaceHeader />

          <PromptInput
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <GenerateButton
            onClick={handleGenerate}
            isLoading={isLoading}
            disabled={!prompt.trim()}
          />

          <ProcessStatusPanel
            steps={processSteps}
            isVisible={showProcessPanel}
          />

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm flex flex-col gap-1">
              <strong className="text-destructive text-xs uppercase">
                Error: {error.code}
              </strong>
              <span className="text-text-muted text-xs">{error.message}</span>
            </div>
          )}

          <div className="pt-4 border-t border-border flex flex-col gap-2">
            <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
              Assembly Export
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs border-border hover:bg-background"
                onClick={() => handleExportAssembly("STL")}
                disabled={!assembly}
              >
                <Download className="w-3 h-3 mr-1" />
                STL
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs border-border hover:bg-background"
                onClick={() => handleExportAssembly("OBJ")}
                disabled={!assembly}
              >
                <Download className="w-3 h-3 mr-1" />
                OBJ
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <PartListPanel
            parts={assembly?.parts || []}
            selectedPartId={selectedPart?.id}
            onPartClick={handlePartClick}
            hiddenPartIds={hiddenPartIds}
            onToggleVisibility={togglePartVisibility}
          />
        </div>

        {/* User Footer */}
        <UserFooter user={user} isLoaded={isLoaded} />
      </div>

      {/* Center Viewer */}
      <div className="flex-1 bg-surface border border-border rounded-md overflow-hidden relative min-h-[500px] shadow-sm">
        <SceneCanvas
          assembly={
            assembly
              ? {
                  ...assembly,
                  parts: assembly.parts.filter(
                    (p) => !hiddenPartIds.includes(p.id),
                  ),
                }
              : null
          }
          onPartClick={handlePartClick}
          onMissed={handleMissed}
          selectedPartId={selectedPart?.id}
        />
      </div>

      {/* Right Panel - Properties */}
      <div className="w-full md:w-80 flex flex-col shrink-0 overflow-hidden">
        <PartInspectPanel
          part={selectedPart}
          assembly={assembly}
          hiddenPartIds={hiddenPartIds}
          isLoading={isLoading || isAppLoading}
        />
      </div>
    </div>
  );
}
