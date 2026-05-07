import { GizmoHelper, GizmoViewport } from '@react-three/drei';

// Empty props type as required by standard, even if unused right now.
type GizmoOverlayProps = {};

/**
 * Adds an orientation gizmo to the 3D scene (Front/Top/Side/Iso views).
 */
export function GizmoOverlay({}: GizmoOverlayProps) {
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <GizmoViewport axisColors={['#ff3653', '#0adb71', '#2c8fdf']} labelColor="white" />
    </GizmoHelper>
  );
}
