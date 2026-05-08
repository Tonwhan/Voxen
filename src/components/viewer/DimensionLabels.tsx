import { Text, Line, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useState } from "react";

type DimensionLabelsProps = {
  dimensions: [number, number, number];
  meshScale: [number, number, number];
  color?: string;
};

/**
 * Renders dimension lines and labels for a part.
 * Positioned in world space (relative to part rotation/position but NOT its scale)
 * to avoid text distortion.
 */
export function DimensionLabels({
  dimensions,
  meshScale,
  color = "#FF6B00",
}: DimensionLabelsProps) {
  const [w, h, d] = dimensions;
  const [sX, sY, sZ] = meshScale;
  const [opacity, setOpacity] = useState(0);

  // World-space dimensions of the part
  const worldW = w * sX;
  const worldH = h * sY;
  const worldD = d * sZ;

  useFrame(() => {
    // Smooth fade in
    if (opacity < 1) {
      setOpacity((prev) => Math.min(prev + 0.05, 1));
    }
  });

  const lineProps = {
    color: color,
    lineWidth: 1,
    transparent: true,
    opacity: opacity * 0.6,
  };

  const textProps = {
    color: color,
    fontSize: 0.1,
    anchorX: "center" as const,
    anchorY: "middle" as const,
    transparent: true,
    opacity: opacity,
  };

  return (
    <group>
      {/* Width (X axis) - Top front edge */}
      <group position={[0, worldH / 2, worldD / 2]}>
        <Line
          points={[
            [-worldW / 2, 0, 0],
            [worldW / 2, 0, 0],
          ]}
          {...lineProps}
        />
        {/* Tick marks at ends */}
        <Line
          points={[
            [-worldW / 2, -0.05, 0],
            [-worldW / 2, 0.05, 0],
          ]}
          {...lineProps}
        />
        <Line
          points={[
            [worldW / 2, -0.05, 0],
            [worldW / 2, 0.05, 0],
          ]}
          {...lineProps}
        />

        {/* Billboard ensures text always faces camera and isn't stretched by parent scale */}
        <Billboard position={[0, 0.12, 0]}>
          <Text {...(textProps as any)}>{worldW.toFixed(1)}</Text>
        </Billboard>
      </group>

      {/* Height (Y axis) - Front right edge */}
      <group position={[worldW / 2, 0, worldD / 2]}>
        <Line
          points={[
            [0, -worldH / 2, 0],
            [0, worldH / 2, 0],
          ]}
          {...lineProps}
        />
        {/* Tick marks at ends */}
        <Line
          points={[
            [-0.05, -worldH / 2, 0],
            [0.05, -worldH / 2, 0],
          ]}
          {...lineProps}
        />
        <Line
          points={[
            [-0.05, worldH / 2, 0],
            [0.05, worldH / 2, 0],
          ]}
          {...lineProps}
        />

        <Billboard position={[0.15, 0, 0]}>
          <Text {...(textProps as any)}>{worldH.toFixed(1)}</Text>
        </Billboard>
      </group>

      {/* Depth (Z axis) - Top right edge */}
      <group position={[worldW / 2, worldH / 2, 0]}>
        <Line
          points={[
            [0, 0, -worldD / 2],
            [0, 0, worldD / 2],
          ]}
          {...lineProps}
        />
        {/* Tick marks at ends */}
        <Line
          points={[
            [0, -0.05, -worldD / 2],
            [0, 0.05, -worldD / 2],
          ]}
          {...lineProps}
        />
        <Line
          points={[
            [0, -0.05, worldD / 2],
            [0, 0.05, worldD / 2],
          ]}
          {...lineProps}
        />

        <Billboard position={[0.12, 0, 0]}>
          <Text {...(textProps as any)}>{worldD.toFixed(1)}</Text>
        </Billboard>
      </group>
    </group>
  );
}
