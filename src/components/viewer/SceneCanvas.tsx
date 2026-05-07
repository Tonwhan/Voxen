import { Canvas } from '@react-three/fiber';
import { Assembly, Part } from '@/types/assembly';
import { PartMesh } from './PartMesh';
import { CameraControls } from './CameraControls';
import { GizmoOverlay } from './GizmoOverlay';

type SceneCanvasProps = {
  assembly: Assembly | null;
  showWireframe?: boolean;
  onPartClick?: (part: Part) => void;
  selectedPartId?: string;
};

/**
 * Main 3D Canvas component that sets up lighting, controls, and renders the generated assembly.
 */
export function SceneCanvas({ assembly, showWireframe = false, onPartClick, selectedPartId }: SceneCanvasProps) {
  return (
    <div className="w-full h-full min-h-[500px] bg-background border border-border rounded-md overflow-hidden relative">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        {/* Basic lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />
        
        {/* Render parts if assembly exists */}
        {assembly?.parts.map((part) => (
          <PartMesh 
            key={part.id} 
            part={part} 
            showWireframe={showWireframe} 
            onClick={() => onPartClick?.(part)}
            isSelected={part.id === selectedPartId}
            hasSelection={!!selectedPartId}
          />
        ))}

        {/* View helpers and controls */}
        <CameraControls />
        <GizmoOverlay />
      </Canvas>
    </div>
  );
}
