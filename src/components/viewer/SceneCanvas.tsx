import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Bounds, useBounds } from "@react-three/drei";
import { Assembly, Part } from "@/types/assembly";
import { PartMesh } from "./PartMesh";
import * as THREE from "three";

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
  hasContent,
}: {
  children: React.ReactNode;
  onMissed?: () => void;
  hasContent: boolean;
}) {
  const bounds = useBounds();
  return (
    <group
      onClick={(e) => {
        if (e.button === 0) {
          // Only on left click
          e.stopPropagation();
          if (e.delta < 5) {
            // Threshold for click vs drag
            bounds.refresh(e.object).fit();
          }
        }
      }}
      onPointerMissed={(e) => {
        if (e.button === 0) {
          // Only reset on left click miss
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
 * Automatically grounds and centers the assembly based on its bounding box.
 */
function AssemblyWrapper({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const bounds = useBounds();

  useEffect(() => {
    if (groupRef.current) {
      // Create a fresh box calculation
      const box = new THREE.Box3().setFromObject(groupRef.current);
      
      // Safety check: If box is empty (Infinity), don't move anything
      if (box.isEmpty()) return;

      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Move to ground (Y=0) and center (X=0, Z=0)
      groupRef.current.position.y = -box.min.y;
      groupRef.current.position.x = -center.x;
      groupRef.current.position.z = -center.z;

      // Force camera to re-fit the new grounded position
      bounds.refresh().fit();
    }
  }, [children, bounds]);

  return <group ref={groupRef}>{children}</group>;
}

/**
 * Main 3D Canvas component that sets up lighting, controls, and renders the generated assembly.
 */
export function SceneCanvas({
  assembly,
  showWireframe = false,
  onPartClick,
  onMissed,
  selectedPartId,
}: SceneCanvasProps) {
  const hasParts = (assembly?.parts.length || 0) > 0;

  return (
    <div className="w-full h-full min-h-125 bg-background border border-border rounded-md overflow-hidden relative">
      <Canvas
        camera={{ position: [2000, 2000, 2000], fov: 45, near: 1, far: 200000 }}
        shadows
      >
        {/* Basic lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5000, 5000, 2500]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight args={["#ffffff", "#444444", 0.6]} />

        {/* Grid Base (Industrial CAD scale) */}
        <Grid
          infiniteGrid
          args={[1000, 1000]}
          cellSize={100}
          cellThickness={1}
          cellColor="#303030"
          sectionSize={500}
          sectionThickness={1.5}
          sectionColor="#404040"
          fadeDistance={15000}
          fadeStrength={1}
          position={[0, -0.01, 0]}
        />

        <Bounds fit margin={1.2}>
          <SelectToFocus onMissed={onMissed} hasContent={hasParts}>
            <AssemblyWrapper>
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
            </AssemblyWrapper>
          </SelectToFocus>
        </Bounds>

        {/* Camera Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          mouseButtons={{
            LEFT: THREE.MOUSE.LEFT,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
