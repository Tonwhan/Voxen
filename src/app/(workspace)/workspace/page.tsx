'use client';

import { useState } from 'react';
import { PromptInput } from '@/components/workspace/PromptInput';
import { GenerateButton } from '@/components/workspace/GenerateButton';
import { PartInspectPanel } from '@/components/workspace/PartInspectPanel';
import { SceneCanvas } from '@/components/viewer/SceneCanvas';
import { generateAssembly } from '@/lib/api/generate';
import { Assembly, Part } from '@/types/assembly';
import { exportSTL } from '@/lib/export/exportSTL';
import { exportOBJ } from '@/lib/export/exportOBJ';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function WorkspacePage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [error, setError] = useState<{message: string, code: string} | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (prompt.length < 10) {
      setError({ message: "Prompt must be at least 10 characters long.", code: "VALIDATION_ERROR" });
      return;
    }

    if (prompt.length > 500) {
      setError({ message: "Prompt must be less than 500 characters long.", code: "VALIDATION_ERROR" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAssembly(null);
    setSelectedPart(null);

    const result = await generateAssembly(prompt);
    
    setIsLoading(false);
    if (result.success) {
      setAssembly(result.data);
    } else {
      setError({ message: result.error, code: result.code });
    }
  };

  const handlePartClick = (part: Part) => {
    setSelectedPart(part);
  };

  const handleExportAssembly = (format: 'STL' | 'OBJ') => {
    if (!assembly || assembly.parts.length === 0) return;
    
    let content = "";
    let filename = `${assembly.assemblyName.replace(/\s+/g, '_')}`;
    
    if (format === 'STL') {
      content = exportSTL(assembly.parts);
      filename += ".stl";
    } else {
      content = exportOBJ(assembly.parts);
      filename += ".obj";
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-[calc(100vh-4rem)] p-4 gap-4 bg-background">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-surface p-4 rounded-md border border-border flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text">Workspace</h2>
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
          
          {assembly && (
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <span className="text-text-muted text-sm font-medium">Export Assembly</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-8 text-xs border-border hover:bg-background"
                  onClick={() => handleExportAssembly('STL')}
                >
                  <Download className="w-3 h-3 mr-1" />
                  STL
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-8 text-xs border-border hover:bg-background"
                  onClick={() => handleExportAssembly('OBJ')}
                >
                  <Download className="w-3 h-3 mr-1" />
                  OBJ
                </Button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-[#FF6B0020] border border-[#FF6B00] rounded text-sm flex flex-col gap-1">
              <strong className="text-[#FF6B00]">{error.code}</strong>
              <span className="text-text">{error.message}</span>
            </div>
          )}
        </div>

        <PartInspectPanel part={selectedPart} />
      </div>

      {/* Right Viewer */}
      <div className="flex-1 bg-surface border border-border rounded-md overflow-hidden relative min-h-[500px]">
        <SceneCanvas 
          assembly={assembly} 
          onPartClick={handlePartClick} 
          selectedPartId={selectedPart?.id} 
        />
      </div>
    </div>
  );
}