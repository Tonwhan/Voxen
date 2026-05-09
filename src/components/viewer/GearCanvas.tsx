import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import gsap from "gsap";

interface GearParams {
  numTeeth: number;
  module: number;
  faceWidth: number;
  boreDiameter: number;
  pressureAngle: number;
}

interface GearCanvasProps {
  onSelectPart?: (partId: string | null) => void;
}

export const GearCanvas: React.FC<GearCanvasProps> = ({ onSelectPart }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const onSelectPartRef = useRef(onSelectPart);
  useEffect(() => {
    onSelectPartRef.current = onSelectPart;
  }, [onSelectPart]);

  // Hardcoded params for the mockup based on user code
  const gearParams: GearParams = {
    numTeeth: 24,
    module: 3,
    faceWidth: 15,
    boreDiameter: 20,
    pressureAngle: 20,
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Derived dimensions
    const pitchDiameter = gearParams.module * gearParams.numTeeth;
    const outsideDiameter = gearParams.module * (gearParams.numTeeth + 2);

    // Scene setup
    const scene = new THREE.Scene();
    // Use transparent background to blend with Voxen's dark theme
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(60, 50, 60);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight,
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // CSS2D Renderer for Labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight,
    );
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";
    labelRenderer.domElement.style.pointerEvents = "none";
    mountRef.current.appendChild(labelRenderer.domElement);

    // Controls (Match Workspace)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    
    // Auto-rotate delay logic
    let interactTimeout: ReturnType<typeof setTimeout>;
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      clearTimeout(interactTimeout);
    });
    controls.addEventListener('end', () => {
      interactTimeout = setTimeout(() => {
        controls.autoRotate = true;
      }, 2000);
    });
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE, // Or THREE.MOUSE.LEFT, which maps to ROTATE if used correctly, but THREE.MOUSE.ROTATE is explicit
      MIDDLE: THREE.MOUSE.ROTATE, // Middle click to rotate
      RIGHT: THREE.MOUSE.PAN, // Right click to pan
    };

    // Lighting (Adjusted for dark theme)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(50, 100, 50);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-50, 50, -50);
    scene.add(directionalLight2);

    // Add orange accent light to match Voxen theme
    const orangeLight = new THREE.PointLight(0xff6b00, 2, 100);
    orangeLight.position.set(0, -10, 0);
    scene.add(orangeLight);

    // Grid helper (Match Workspace styling)
    const gridHelper = new THREE.GridHelper(200, 100, 0x404040, 0x303030);
    gridHelper.position.y = -gearParams.faceWidth / 2 - 10;
    // Add transparency to simulate fading effect
    if (!Array.isArray(gridHelper.material)) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.6;
    }
    scene.add(gridHelper);

    // Create gear geometry
    const createGearGeometry = (params: GearParams): THREE.ExtrudeGeometry => {
      const { numTeeth, module } = params;
      const pitchRadius = (module * numTeeth) / 2;
      const outerRadius = pitchRadius + module; // addendum
      const rootRadius = pitchRadius - 1.25 * module; // dedendum

      const shape = new THREE.Shape();
      const angleStep = (2 * Math.PI) / numTeeth;

      for (let i = 0; i < numTeeth; i++) {
        const angle = i * angleStep;
        const nextAngle = (i + 1) * angleStep;

        const toothHalfAngle = (Math.PI / numTeeth) * 0.4;
        const rootAngle1 = angle - toothHalfAngle * 1.2;
        const rootAngle2 = angle + toothHalfAngle * 1.2;

        if (i === 0) {
          shape.moveTo(
            rootRadius * Math.cos(rootAngle1),
            rootRadius * Math.sin(rootAngle1),
          );
        }

        shape.lineTo(
          rootRadius * Math.cos(rootAngle1),
          rootRadius * Math.sin(rootAngle1),
        );
        shape.lineTo(
          pitchRadius * Math.cos(angle - toothHalfAngle),
          pitchRadius * Math.sin(angle - toothHalfAngle),
        );
        shape.lineTo(
          outerRadius * Math.cos(angle),
          outerRadius * Math.sin(angle),
        );
        shape.lineTo(
          pitchRadius * Math.cos(angle + toothHalfAngle),
          pitchRadius * Math.sin(angle + toothHalfAngle),
        );
        shape.lineTo(
          rootRadius * Math.cos(rootAngle2),
          rootRadius * Math.sin(rootAngle2),
        );

        const gapAngle1 = rootAngle2;
        const gapAngle2 = nextAngle - toothHalfAngle * 1.2;
        const steps = 5;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const gapAngle = gapAngle1 + (gapAngle2 - gapAngle1) * t;
          shape.lineTo(
            rootRadius * Math.cos(gapAngle),
            rootRadius * Math.sin(gapAngle),
          );
        }
      }

      shape.closePath();

      const borePath = new THREE.Path();
      const boreRadius = params.boreDiameter / 2;
      borePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, false);
      shape.holes.push(borePath);

      const extrudeSettings = {
        depth: params.faceWidth,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 2,
      };

      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    };

    // Create gear mesh
    const gearGeometry = createGearGeometry(gearParams);
    gearGeometry.center();
    gearGeometry.rotateX(Math.PI / 2);

    const gearMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888, // Steel-like color
      metalness: 0.8,
      roughness: 0.4,
    });

    const gearMesh = new THREE.Mesh(gearGeometry, gearMaterial);
    scene.add(gearMesh);

    // Create 3D Labels
    const createLabel = (text: string, position: THREE.Vector3) => {
      const div = document.createElement("div");
      div.className =
        "text-[#FF6B00] text-[9px] font-mono tracking-[0.2em] bg-black/80 px-2 py-1.5 rounded border border-[#FF6B00]/30 backdrop-blur-md whitespace-nowrap uppercase shadow-[0_0_10px_rgba(255,107,0,0.2)]";
      div.innerHTML = `<span class="opacity-50 mr-1 text-[8px]">+</span>${text}`;
      const label = new CSS2DObject(div);
      label.position.copy(position);
      return label;
    };

    const pcdRadius = (gearParams.module * gearParams.numTeeth) / 2;
    const outerRadius = pcdRadius + gearParams.module;
    const fw = gearParams.faceWidth;

    // Pitch Circle Diameter
    scene.add(
      createLabel("PCD: 72mm", new THREE.Vector3(pcdRadius, fw / 2, 0)),
    );
    // Thickness
    scene.add(
      createLabel("Thick: 15mm", new THREE.Vector3(outerRadius + 2, 0, 0)),
    );
    // Module
    scene.add(createLabel("Mod: 3", new THREE.Vector3(0, fw / 2, outerRadius)));
    // Pressure Angle
    scene.add(
      createLabel("PA: 20°", new THREE.Vector3(0, fw / 2, -outerRadius)),
    );

    // Click to focus implementation
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };
    let isAnimating = false;

    const onPointerDown = (e: MouseEvent) => {
      pointerDownTime = performance.now();
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const timeDiff = performance.now() - pointerDownTime;
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y,
      );

      // Distinguish click from drag
      if (e.button === 0 && timeDiff < 300 && dist < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(gearMesh);

        if (intersects.length > 0) {
          if (onSelectPartRef.current) onSelectPartRef.current('gear-main');
          
          isAnimating = true;
          controls.enabled = false;

          // Animate focus using GSAP
          gsap.to(controls.target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.8,
            ease: "power2.out",
          });

          const distToFit =
            (outsideDiameter / 2 / Math.sin((camera.fov * Math.PI) / 180 / 2)) *
            1.5;
          const currentDir = new THREE.Vector3()
            .subVectors(camera.position, controls.target)
            .normalize();
          if (currentDir.length() < 0.1) currentDir.set(1, 1, 1).normalize();
          const newPos = currentDir.multiplyScalar(distToFit);

          gsap.to(camera.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
              isAnimating = false;
              controls.enabled = true;
              controls.update();
            }
          });
        } else {
          // Unfocus (reset camera)
          if (onSelectPartRef.current) onSelectPartRef.current(null);

          isAnimating = true;
          controls.enabled = false;
          
          gsap.to(controls.target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.8,
            ease: "power2.out",
          });

          gsap.to(camera.position, {
            x: 60,
            y: 50,
            z: 60,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
              isAnimating = false;
              controls.enabled = true;
              controls.update();
            }
          });
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isAnimating) {
        controls.update();
      } else {
        camera.lookAt(controls.target);
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight,
      );
      labelRenderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight,
      );
    };

    // Initial resize to ensure correct bounds
    handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      clearTimeout(interactTimeout);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        if (renderer.domElement.parentNode === mountRef.current)
          mountRef.current.removeChild(renderer.domElement);
        if (labelRenderer.domElement.parentNode === mountRef.current)
          mountRef.current.removeChild(labelRenderer.domElement);
      }
      controls.dispose();
      gearGeometry.dispose();
      gearMaterial.dispose();
      renderer.dispose();
    };
  }, [gearParams]);

  return <div ref={mountRef} className="w-full h-full cursor-default" />;
};
