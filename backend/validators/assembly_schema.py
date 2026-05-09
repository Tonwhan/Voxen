from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict
from datetime import datetime

# ==============================================================================
# SYMBOLIC CAD DSL (Schema V3)
# What: A highly constrained, intent-oriented scene graph schema.
# ==============================================================================

SizeEnum = Literal["tiny", "small", "medium", "large", "huge", "custom"]
PrimitiveEnum = Literal["box", "sphere", "cylinder", "cone", "plane", "assembly_root"]
MaterialEnum = Literal["wood", "metal", "plastic", "glass", "fabric", "rubber", "custom"]
ConstraintTypeEnum = Literal["supports", "attaches_to", "contains", "aligned_with", "surrounds"]

class SymbolicConstraint(BaseModel):
    """Defines structural and functional relationships between parts based on their roles."""
    type: ConstraintTypeEnum
    source_role: str  # The role of the part providing the constraint (e.g., "chair_leg")
    target_role: str  # The role of the part receiving the constraint (e.g., "seat")

class SceneNode(BaseModel):
    """A semantic node in the CAD scene graph."""
    id: str = Field(..., description="Unique identifier for the node")
    role: str = Field(..., description="Semantic role, e.g., 'chair', 'chair_leg', 'table_top'")
    primitive: PrimitiveEnum
    
    # Sizing
    size: SizeEnum = Field(default="medium")
    relative_to: Optional[str] = Field(default=None, description="Path to a reference dimension, e.g., 'parent.width' or 'seat.depth'")
    
    # Topology / Placement
    anchors: Optional[Dict[str, str]] = Field(default=None, description="Attachment points, e.g., {'top': 'seat.bottom'}")
    
    # Appearance
    material: MaterialEnum = Field(default="wood")
    symmetry: Optional[Literal["none", "bilateral", "radial"]] = "none"
    
    # Hierarchy
    children: Optional[List[SceneNode]] = Field(default=None, description="Child nodes in the scene graph")

class AssemblyMetadata(BaseModel):
    generatedAt: datetime
    promptSummary: str
    taxonomy_category: str = Field(default="uncategorized")

class AssemblySchema(BaseModel):
    """The root schema for the Symbolic CAD DSL."""
    dsl_version: Literal["0.1.0"] = Field(default="0.1.0", description="Strict DSL versioning")
    assemblyName: str
    
    # We now start with a single root node (e.g., the "chair" itself) which contains children.
    root_node: SceneNode = Field(..., description="The hierarchical root of the assembly")
    
    constraints: List[SymbolicConstraint] = Field(default_factory=list, description="List of structural relationships")
    metadata: AssemblyMetadata
