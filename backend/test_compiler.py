import os
import sys
import json
from datetime import datetime

# Add parent directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from validators.assembly_schema import AssemblySchema
from pipeline.compiler import SymbolicCompiler, GeometryCompiler

def run_test():
    print("Testing Symbolic Compiler...")

    # A hardcoded Symbolic CAD Plan for a Table
    # The root node has children. The children define anchors.
    test_plan = {
        "dsl_version": "0.1.0",
        "assemblyName": "Test Table",
        "metadata": {
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "promptSummary": "Generate a simple wooden table",
            "taxonomy_category": "furniture"
        },
        "root_node": {
            "id": "root_table",
            "role": "table",
            "primitive": "assembly_root",
            "size": "medium",
            "material": "wood",
            "children": [
                {
                    "id": "table_top",
                    "role": "table_top",
                    "primitive": "box",
                    "size": "huge",
                    "material": "wood"
                },
                {
                    "id": "leg_1",
                    "role": "table_leg",
                    "primitive": "cylinder",
                    "size": "medium",
                    "material": "wood",
                    "anchors": {
                        "top": "table_top.bottom"
                    }
                }
            ]
        },
        "constraints": [
            {
                "type": "supports",
                "source_role": "table_leg",
                "target_role": "table_top"
            }
        ]
    }

    try:
        # 1. Validate Schema
        print("1. Validating against AssemblySchema V3...")
        schema = AssemblySchema(**test_plan)
        print("   -> Schema Valid!")

        # 2. Compile to Numeric
        print("2. Running SymbolicCompiler...")
        sym_compiler = SymbolicCompiler()
        numeric_plan = sym_compiler.compile(schema)
        print("   -> Output Numeric Plan:")
        print(json.dumps(numeric_plan, indent=2))

        # 3. Compile to Trimesh
        print("3. Running GeometryCompiler...")
        geom_compiler = GeometryCompiler()
        scene = geom_compiler.compile(numeric_plan)
        print(f"   -> Success! Trimesh Scene created with {len(scene.geometry)} geometries.")
        
        # 4. Optional: Export test
        # scene.export('test_table.stl')
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run_test()
