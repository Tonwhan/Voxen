import logging
import trimesh
import numpy as np
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Base bounding box sizes by taxonomy category (Width, Height, Depth) in meters
BASE_DIMENSIONS = {
    "furniture": [1.0, 1.0, 1.0],
    "tools": [0.2, 0.2, 0.05],
    "vehicles": [2.0, 1.5, 4.0],
    "architecture": [5.0, 3.0, 5.0],
    "uncategorized": [1.0, 1.0, 1.0]
}

# Scale multipliers for relative sizing
SIZE_MULTIPLIERS = {
    "tiny": 0.1,
    "small": 0.25,
    "medium": 0.5,
    "large": 0.75,
    "huge": 1.0,
    "custom": 0.5
}

class SymbolicCompiler:
    def __init__(self):
        # We will store compiled parts here as a flat list for the renderer
        self.compiled_parts = []
        # Store bounding box / layout info for anchoring
        self.node_registry = {}

    def compile(self, plan: Any) -> Dict[str, Any]:
        """
        Compiles the Symbolic AssemblySchema V3 into a raw numeric flat array 
        expected by the Trimesh engine and frontend renderer.
        """
        logger.info(f"Compiling Symbolic Plan (DSL v{plan.dsl_version})")
        self.compiled_parts = []
        self.node_registry = {}
        
        # 1. Determine root bounding box constraint
        category = plan.metadata.taxonomy_category
        base_dims = BASE_DIMENSIONS.get(category, BASE_DIMENSIONS["uncategorized"])
        
        # 2. Traverse and resolve (Simplified Prototype)
        # In a real constraint solver, we'd build a DAG and solve iteratively.
        # For this prototype, we do a top-down DFS.
        self._resolve_node(plan.root_node, parent_id=None, reference_dims=base_dims, global_offset=[0,0,0])
        
        return {
            "assemblyName": plan.assemblyName,
            "version": "1.0",
            "metadata": {
                "generatedAt": plan.metadata.generatedAt.isoformat(),
                "promptSummary": plan.metadata.promptSummary,
                "compiler_resolved": True
            },
            "parts": self.compiled_parts
        }

    def _resolve_node(self, node: Any, parent_id: str | None, reference_dims: List[float], global_offset: List[float]):
        """Recursively resolves sizing and placement for a node and its children."""
        
        # 1. Resolve Size
        # A robust compiler would parse node.relative_to (e.g. "parent.width")
        # For now, we apply the size multiplier uniformly to the reference dims.
        multiplier = SIZE_MULTIPLIERS.get(node.size, 0.5)
        
        w = reference_dims[0] * multiplier
        h = reference_dims[1] * multiplier
        d = reference_dims[2] * multiplier
        
        # 2. Resolve Placement / Anchors (Simplified Heuristic)
        # If anchors exist, we would snap to the target node.
        # Here we just use a simplified placement logic to prevent overlapping.
        pos_x, pos_y, pos_z = global_offset
        
        if node.anchors:
            for anchor_point, target in node.anchors.items():
                target_node, target_point = target.split('.') if '.' in target else (target, 'center')
                # If target is parent, and we want our top to snap to parent bottom:
                if target_node == "parent" and anchor_point == "top" and target_point == "bottom":
                    # Shift down by half our height, plus whatever the parent offset was
                    pos_y = global_offset[1] - (reference_dims[1] / 2) - (h / 2)

        # 3. Save to registry (for other nodes to reference)
        self.node_registry[node.id] = {
            "role": node.role,
            "dimensions": [w, h, d],
            "position": [pos_x, pos_y, pos_z]
        }
        
        # 4. Add to flat compiled parts list (if it's not just an abstract root)
        if node.primitive != "assembly_root":
            # Map material to a simple hex color for the frontend
            color_map = {
                "wood": "#8B5A2B", "metal": "#A9A9A9", "plastic": "#FF4500",
                "glass": "#ADD8E6", "fabric": "#F0E68C", "rubber": "#2F4F4F"
            }
            
            # The exact schema expected by the frontend/Trimesh
            part_dict = {
                "id": node.id,
                "name": node.role,
                "shape": node.primitive,
                "position": [pos_x, pos_y, pos_z],
                "rotation": [0, 0, 0],
                "scale": [1, 1, 1],
                "color": color_map.get(node.material, "#cccccc"),
                "geometry": {
                    "type": node.primitive,
                    "dimensions": {"width": w, "height": h, "depth": d} if node.primitive != "sphere" else {"radius": w/2}
                },
                "material": {
                    "name": node.material,
                    "description": f"{node.size} {node.material}"
                },
                "designIntent": f"Role: {node.role}"
            }
            self.compiled_parts.append(part_dict)

        # 5. Recursively resolve children
        if node.children:
            for child in node.children:
                # Pass this node's dimensions as the new reference for its children
                self._resolve_node(child, parent_id=node.id, reference_dims=[w, h, d], global_offset=[pos_x, pos_y, pos_z])

class GeometryCompiler:
    """Translates the flat numeric part list (from SymbolicCompiler) into a Trimesh scene."""
    def compile(self, numeric_plan: Dict[str, Any]) -> trimesh.Scene:
        logger.info("GeometryCompiler: Converting numeric parts to Trimesh Scene")
        scene = trimesh.Scene()
        
        for part in numeric_plan.get("parts", []):
            shape_type = part.get("shape", "box")
            geom = part.get("geometry", {})
            dims = geom.get("dimensions", {})
            pos = part.get("position", [0, 0, 0])
            
            mesh = None
            if shape_type == "box":
                extents = [dims.get("width", 1.0), dims.get("height", 1.0), dims.get("depth", 1.0)]
                mesh = trimesh.creation.box(extents=extents)
            elif shape_type == "sphere":
                radius = dims.get("radius", 0.5)
                mesh = trimesh.creation.icosphere(radius=radius)
            elif shape_type == "cylinder":
                radius = dims.get("radius", 0.5)
                height = dims.get("height", 1.0)
                mesh = trimesh.creation.cylinder(radius=radius, height=height)
            
            if mesh:
                # Set color
                color_hex = part.get("color", "#cccccc").lstrip('#')
                try:
                    rgb = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
                    mesh.visual.face_colors = [*rgb, 255]
                except Exception as e:
                    logger.warning(f"Failed to parse color {color_hex}: {e}")
                
                # Apply translation
                translation = trimesh.transformations.translation_matrix(pos)
                mesh.apply_transform(translation)
                
                scene.add_geometry(mesh, node_name=part.get("id"))
                
        return scene


