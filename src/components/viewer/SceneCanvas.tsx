import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Bounds, useBounds } from '@react-three/drei';
import { Assembly, Part } from '@/types/assembly';
import { PartMesh } from './PartMesh';
import * as THREE from 'three';

type SceneCanvasProps = {
  assembly: Assembly | null;
  showWireframe?: boolean;
  onPartClick?: (part: Part) => void;
  onMissed?: () => void;
  selectedPartId?: string;
};

/**
 * Component to handle camera focusing when a part is selected
 */
function SelectToFocus({ 
  children, 
  onMissed, 
  hasContent 
}: { 
  children: React.ReactNode;
  onMissed?: () => void;
  hasContent: boolean;
}) {
  const bounds = useBounds();
  return (
    <group 
      onClick={(e) => {
        if (e.button === 0) { // Only on left click
          e.stopPropagation();
          if (e.delta < 5) { // Threshold for click vs drag
            bounds.refresh(e.object).fit();
          }
        }
      }}
      onPointerMissed={(e) => {
        if (e.button === 0) { // Only reset on left click miss
          if (hasContent) {
            bounds.refresh().fit();
          }
          onMissed?.();
        }
      }}
    >
      {children}
    </group>
  );
}

/**
 * Main 3D Canvas component that sets up lighting, controls, and renders the generated assembly.
 */
export function SceneCanvas({ assembly, showWireframe = false, onPartClick, onMissed, selectedPartId }: SceneCanvasProps) {
  const hasParts = (assembly?.parts.length || 0) > 0;

  return (
    <div className="w-full h-full min-h-125 bg-background border border-border rounded-md overflow-hidden relative">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }} shadows>
        {/* Basic lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
        
        {/* Grid Base (Blender-like) */}
        <Grid
          infiniteGrid
          args={[20, 20]}
          cellSize={1}
          cellThickness={1}
          cellColor="#303030"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#404040"
          fadeDistance={30}
          fadeStrength={1}
          position={[0, -0.01, 0]}
        />


        <Bounds fit clip margin={1.2}>
          <SelectToFocus onMissed={onMissed} hasContent={hasParts}>
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
          </SelectToFocus>
        </Bounds>

        {/* Camera Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: THREE.MOUSE.LEFT,   // Left click = Select (handled by SelectToFocus)
            MIDDLE: THREE.MOUSE.ROTATE, // Middle button = Rotate (Swapped from Pan)
            RIGHT: THREE.MOUSE.PAN    // Right button = Pan (Swapped from Rotate)
          }}
        />
      </Canvas>
    </div>
  );
}
