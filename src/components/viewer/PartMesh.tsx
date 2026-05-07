import { useRef } from "react";
import { Mesh } from "three";
import { Part } from "@/types/assembly";
import { Edges } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

type PartMeshProps = {
  part: Part;
  showWireframe?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  hasSelection?: boolean;
};

/**
 * Renders a single discrete part in the 3D viewer.
 * Supports different shapes (box, sphere, cylinder, cone, plane) and an optional wireframe toggle.
 */
export function PartMesh({ part, showWireframe = false, onClick, isSelected = false, hasSelection = false }: PartMeshProps) {
  const meshRef = useRef<Mesh>(null);

  const isFaded = hasSelection && !isSelected;
  const effectiveWireframe = showWireframe || isFaded;

  const getGeometry = () => {
    switch (part.shape) {
      case "box":
        return <boxGeometry args={[1, 1, 1]} />;
      case "sphere":
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case "cylinder":
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case "cone":
        return <coneGeometry args={[0.5, 1, 32]} />;
      case "plane":
        return <planeGeometry args={[1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <mesh
      ref={meshRef}
      position={part.position}
      rotation={part.rotation}
      scale={part.scale}
      name={part.name}
      onPointerDown={handlePointerDown}
    >
      {getGeometry()}
      <meshStandardMaterial
        color={part.color}
        transparent
        opacity={effectiveWireframe ? 0.3 : 1}
        wireframe={effectiveWireframe}
      />
      {isSelected && <Edges scale={1.05} threshold={15} color="#FF6B00" />}
    </mesh>
  );
}
