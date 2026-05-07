import { Part } from '@/types/assembly';
import { exportSTL } from '@/lib/export/exportSTL';
import { exportOBJ } from '@/lib/export/exportOBJ';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type PartInspectPanelProps = {
  part: Part | null;
};

/**
 * Panel to display the details of the currently selected part.
 */
export function PartInspectPanel({ part }: PartInspectPanelProps) {
  if (!part) {
    return (
      <div className="p-4 border border-border rounded-md bg-surface flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <p className="text-text-muted text-sm">Select a part to inspect its details</p>
      </div>
    );
  }

  const handleExport = (format: 'STL' | 'OBJ') => {
    if (!part) return;
    
    let content = "";
    let filename = `${part.name.replace(/\s+/g, '_')}_${part.id}`;
    
    if (format === 'STL') {
      content = exportSTL([part]);
      filename += ".stl";
    } else {
      content = exportOBJ([part]);
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
    <div className="p-4 border border-border rounded-md bg-surface flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
        Part Details
      </h3>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-text-muted">Name:</span>
        <span className="text-text truncate" title={part.name}>{part.name}</span>
        
        <span className="text-text-muted">Shape:</span>
        <span className="text-text capitalize">{part.shape}</span>
        
        <span className="text-text-muted">Material:</span>
        <span className="text-text truncate" title={part.material.description}>{part.material.name}</span>

        <span className="text-text-muted">Color:</span>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border border-border" 
            style={{ backgroundColor: part.color }}
          />
          <span className="text-text font-mono truncate">{part.color}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <span className="text-text-muted text-sm font-medium">Design Intent</span>
        <p className="text-xs text-text bg-background p-2 rounded border border-border italic">
          "{part.designIntent}"
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <span className="text-text-muted text-sm font-medium">Transform</span>
        <div className="bg-background rounded p-2 text-xs font-mono grid grid-cols-3 gap-2 text-center text-text">
          <div className="flex flex-col border border-border rounded p-1">
            <span className="text-text-muted mb-1">Pos</span>
            <span>{part.position.map(n => n.toFixed(1)).join(', ')}</span>
          </div>
          <div className="flex flex-col border border-border rounded p-1">
            <span className="text-text-muted mb-1">Rot</span>
            <span>{part.rotation.map(n => n.toFixed(1)).join(', ')}</span>
          </div>
          <div className="flex flex-col border border-border rounded p-1">
            <span className="text-text-muted mb-1">Scl</span>
            <span>{part.scale.map(n => n.toFixed(1)).join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
        <span className="text-text-muted text-sm font-medium">Export Part</span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-8 text-xs border-border hover:bg-background"
            onClick={() => handleExport('STL')}
          >
            <Download className="w-3 h-3 mr-1" />
            STL
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-8 text-xs border-border hover:bg-background"
            onClick={() => handleExport('OBJ')}
          >
            <Download className="w-3 h-3 mr-1" />
            OBJ
          </Button>
        </div>
      </div>
    </div>
  );
}
