from pydantic import BaseModel, Field
from typing import List, Tuple, Literal
from datetime import datetime

# [REQUIRED] AssemblySchema (Pydantic)
# What: Mirror of the Zod schema for backend-side validation of AI output
# Where: backend/validators/assembly_schema.py

class GeometrySchema(BaseModel):
    type: Literal['box', 'cylinder', 'sphere']
    dimensions: dict # Simple dict for width, height, depth to match Zod

class MaterialSchema(BaseModel):
    name: str
    description: str

class PartSchema(BaseModel):
    id: str
    name: str
    shape: Literal['box', 'sphere', 'cylinder', 'cone', 'plane']
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float]
    scale: Tuple[float, float, float]
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    geometry: GeometrySchema
    material: MaterialSchema
    designIntent: str

class AssemblyMetadataSchema(BaseModel):
    generatedAt: datetime
    promptSummary: str

class AssemblySchema(BaseModel):
    assemblyName: str
    version: str
    parts: List[PartSchema] = Field(..., min_length=1)
    metadata: AssemblyMetadataSchema
