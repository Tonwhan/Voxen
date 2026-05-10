import logging
from datetime import datetime, timezone
from pydantic import ValidationError
from validators.assembly_schema import AssemblySchema

from .agents import CADAgents
from .compiler import GeometryCompiler, SymbolicCompiler
from .exporters import CADExporter

logger = logging.getLogger(__name__)

class CADPipeline:
    def __init__(self, export_dir="exports"):
        self.agents = CADAgents()
        self.symbolic_compiler = SymbolicCompiler()
        self.geometry_compiler = GeometryCompiler()
        self.exporter = CADExporter(export_dir)

    def _clean_plan_json(self, plan_json):
        """
        Migrates legacy V1/V2 flat plans to the new V3 Scene Graph structure.
        Ensures the system remains functional even if the LLM outputs an older format.
        """
        # If root_node is missing but parts list exists, migrate it
        if "root_node" not in plan_json and "parts" in plan_json:
            logger.info("CADPipeline: Migrating legacy flat parts list to root_node hierarchy.")
            parts = plan_json.pop("parts")
            
            # Create a synthetic assembly_root to wrap the flat parts
            plan_json["root_node"] = {
                "id": "legacy_root",
                "role": "assembly",
                "primitive": "assembly_root",
                "size": "huge",
                "material": "custom",
                "children": parts
            }
            
            # Map legacy 'shape' and 'geometry.type' to V3 'primitive' if missing
            for child in plan_json["root_node"]["children"]:
                if "primitive" not in child:
                    child["primitive"] = child.get("shape") or child.get("geometry", {}).get("type") or "box"
                if "role" not in child:
                    child["role"] = child.get("name", "unknown_part")
        
        return plan_json

    def generate(self, prompt, export_format="stl"):
        # Stage 1: Intent Parser
        logger.info("Stage 1: Parsing intent...")
        intent = self.agents.parse_intent(prompt)
        if not intent:
            return {"status": "error", "error": "Failed to parse intent", "code": "INTENT_NOT_FOUND"}

        # Stage 2: CAD Planning
        logger.info("Stage 2: Planning CAD...")
        plan_json = self.agents.plan_cad(intent)
        if not plan_json:
            return {"status": "error", "error": "Failed to generate plan", "code": "LLM_GENERATION_FAILED"}

        # Stage 3: Validation (using existing Pydantic schema)
        logger.info("Stage 3: Validating plan with Pydantic...")
        
        # Inject metadata if missing
        if "metadata" not in plan_json:
            plan_json["metadata"] = {}
        plan_json["metadata"]["generatedAt"] = datetime.now(timezone.utc).isoformat()
        plan_json["metadata"]["promptSummary"] = prompt[:50]
        
        if "dsl_version" not in plan_json:
            plan_json["dsl_version"] = "0.1.0"
            
        # Migrate legacy plans if necessary
        plan_json = self._clean_plan_json(plan_json)
            
        try:
            validated_plan = AssemblySchema(**plan_json)
        except ValidationError as e:
            logger.error(f"Validation failed: {e}")
            return {"status": "error", "error": "Validation failed", "errors": str(e), "code": "SCHEMA_VALIDATION_FAILED"}

        # Stage 4: Symbolic Compilation
        logger.info("Stage 4: Compiling Symbolic DSL to Canonical Numeric Dict...")
        numeric_plan = self.symbolic_compiler.compile(validated_plan)

        # Stage 5: Geometry Compilation
        logger.info("Stage 5: Compiling Canonical Numeric Dict to Geometry...")
        scene = self.geometry_compiler.compile(numeric_plan)

        # Stage 6: Export
        logger.info("Stage 6: Exporting...")
        filename = validated_plan.assemblyName.replace(" ", "_").lower()
        filepath = self.exporter.export_scene(scene, filename, format=export_format)

        return {
            "status": "success",
            "intent": intent,
            "plan": validated_plan.model_dump(mode='json'),
            "export_path": filepath,
            "errors": None
        }
