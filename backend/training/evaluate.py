import os
import sys
import json
import logging
import time
from typing import List, Dict, Any

# Setup paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.engine import CADPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Evaluator")

BENCHMARK_PROMPTS = [
    "modern chair",
    "office desk",
    "traffic cone",
    "hammer",
    "robot arm",
    "bed frame"
]

class CADEvaluator:
    def __init__(self):
        export_dir = os.getenv("EXPORT_DIR", "benchmark_exports")
        self.pipeline = CADPipeline(export_dir=export_dir)
        self.results = []

    def run(self):
        print("\n" + "="*50)
        print("VOXEN CAD EVALUATION BENCHMARK")
        print("="*50)
        
        for prompt in BENCHMARK_PROMPTS:
            print(f"\nEvaluating: '{prompt}'...")
            start_time = time.time()
            
            # Run generation
            try:
                result = self.pipeline.generate(prompt)
                duration = time.time() - start_time
                
                # Score
                score = self._calculate_score(result, prompt)
            except Exception as e:
                logger.error(f"Generation crashed for '{prompt}': {e}")
                duration = time.time() - start_time
                score = {
                    "intent_parsed": False,
                    "plan_generated": False,
                    "schema_valid": False,
                    "compiler_success": False,
                    "render_success": False,
                    "part_count": 0,
                    "errors": [f"CRASH: {str(e)}"]
                }
            
            score["duration"] = round(duration, 2)
            score["prompt"] = prompt
            
            self.results.append(score)
            self._print_mini_report(score)

        self._print_final_summary()

    def _calculate_score(self, result: Dict[str, Any], prompt: str) -> Dict[str, Any]:
        """Calculates objective scores for a generation attempt."""
        metrics = {
            "intent_parsed": False,
            "plan_generated": False,
            "schema_valid": False,
            "compiler_success": False,
            "render_success": False,
            "part_count": 0,
            "errors": []
        }

        if result.get("status") == "success":
            metrics["intent_parsed"] = True
            metrics["plan_generated"] = True
            metrics["schema_valid"] = True
            metrics["compiler_success"] = True
            metrics["render_success"] = True
            metrics["part_count"] = len(result.get("plan", {}).get("root_node", {}).get("children", []))
        else:
            code = result.get("code")
            metrics["errors"].append(f"{code}: {result.get('error')}")
            
            if code == "SCHEMA_VALIDATION_FAILED":
                metrics["intent_parsed"] = True
                metrics["plan_generated"] = True
            elif code == "COMPILER_ERROR": # Future code
                metrics["intent_parsed"] = True
                metrics["plan_generated"] = True
                metrics["schema_valid"] = True

        return metrics

    def _print_mini_report(self, score: Dict[str, Any]):
        status = "✅ PASS" if score["render_success"] else "❌ FAIL"
        print(f"  Status: {status} ({score['duration']}s)")
        print(f"  Parts:  {score['part_count']}")
        if score["errors"]:
            print(f"  Errors: {score['errors']}")

    def _print_final_summary(self):
        total = len(self.results)
        passes = sum(1 for r in self.results if r["render_success"])
        pass_rate = (passes / total) * 100
        
        print("\n" + "="*50)
        print(f"BENCHMARK SUMMARY: {passes}/{total} Passed ({pass_rate:.1f}%)")
        print("="*50)
        
        # Save to JSON for historical tracking
        with open("benchmark_history.jsonl", "a") as f:
            summary = {
                "timestamp": time.time(),
                "pass_rate": pass_rate,
                "results": self.results
            }
            f.write(json.dumps(summary) + "\n")

if __name__ == "__main__":
    evaluator = CADEvaluator()
    evaluator.run()
