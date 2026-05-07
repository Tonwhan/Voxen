import { OrbitControls } from '@react-three/drei';

type CameraControlsProps = {
  autoRotate?: boolean;
};

/**
 * Provides orbit controls for the R3F canvas, allowing the user to zoom, pan, and rotate.
 */
export function CameraControls({ autoRotate = false }: CameraControlsProps) {
  return (
    <OrbitControls
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={100}
    />
  );
}
