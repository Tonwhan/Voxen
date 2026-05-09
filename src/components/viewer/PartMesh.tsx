import { useRef } from "react";
import { Mesh } from "three";
import { Part } from "@/types/assembly";
import { Edges } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { DimensionLabels } from "./DimensionLabels";

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
export function PartMesh({
  part,
  showWireframe = false,
  onClick,
  isSelected = false,
  hasSelection = false,
}: PartMeshProps) {
  const meshRef = useRef<Mesh>(null);

  const isFaded = hasSelection && !isSelected;

  const { dimensions } = part.geometry;
  const w = dimensions.width ?? (dimensions.radius ? dimensions.radius * 2 : 1);
  const h = dimensions.height ?? 1;
  const d = dimensions.depth ?? (dimensions.radius ? dimensions.radius * 2 : w);
  const r = dimensions.radius ?? w / 2;

  const getGeometry = () => {
    switch (part.shape) {
      case "box":
        return <boxGeometry args={[w, h, d]} />;
      case "sphere":
        return <sphereGeometry args={[r, 32, 32]} />;
      case "cylinder":
        return (
          <cylinderGeometry args={[r, r, h, 32]} />
        );
      case "cone":
        return <coneGeometry args={[r, h, 32]} />;
      case "plane":
        return <planeGeometry args={[w, d]} />;
      default:
        return <boxGeometry args={[w, h, d]} />;
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // We don't stop propagation here to let the parent SelectToFocus handle it
    // But we still call onClick for business logic (selecting the part in state)
    if (e.button === 0) {
      // Only on left click
      onClick?.();
    }
  };

  return (
    <group position={part.position} rotation={part.rotation} name={part.name}>
      <mesh
        ref={meshRef}
        scale={part.scale}
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
      >
        {getGeometry()}

        {/* Show solid mesh when selected OR when nothing is focused (hasSelection is false) OR showWireframe is false but not faded */}
        {(isSelected || !hasSelection) && !showWireframe && (
          <meshStandardMaterial
            color={part.color}
            metalness={0.2}
            roughness={0.8}
          />
        )}

        {/* Show wireframe when focused but NOT selected, OR when showWireframe is true */}
        {(showWireframe || (hasSelection && !isSelected)) && (
          <>
            <meshBasicMaterial color={part.color} transparent opacity={0.1} />
            <Edges color={isSelected ? "#FF6B00" : "#555555"} threshold={15} />
          </>
        )}
      </mesh>

      {/* Animation วัด Scale เมื่อ Focus (isSelected) */}
      {isSelected && (
        <DimensionLabels
          dimensions={[w, h, d]}
          meshScale={part.scale}
        />
      )}
    </group>
  );
}
