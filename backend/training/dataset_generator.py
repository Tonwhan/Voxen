import os
import json
import logging
from datetime import datetime
from openai import OpenAI
from pydantic import ValidationError
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.prompt_builder import build_system_prompt
from validators.assembly_schema import AssemblySchema
from taxonomy import generate_prompts

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_BASE_URL = os.getenv("TEACHER_API_BASE_URL", "http://127.0.0.1:11434/v1")
API_KEY = os.getenv("TEACHER_API_KEY", "ollama")
TEACHER_MODEL = os.getenv("TEACHER_MODEL", "qwen3:8b")

SCHEMA_VERSION = "v2.symbolic"
DATASET_VERSION = "v1"

DATASET_A_FILE = f"dataset_{DATASET_VERSION}_A_intent.jsonl"
DATASET_B_FILE = f"dataset_{DATASET_VERSION}_B_symbolic.jsonl"
NEGATIVES_FILE = f"dataset_{DATASET_VERSION}_negatives.jsonl"

client = OpenAI(api_key=API_KEY, base_url=API_BASE_URL)

def call_llm(messages: list, temperature: float = 0.7) -> str | None:
    try:
        response = client.chat.completions.create(
            model=TEACHER_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=temperature,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM API Error: {e}")
        return None

def repair_plan(original_prompt: str, bad_json: str, error_msg: str) -> str | None:
    """Repair Agent: Attempts to fix Pydantic validation errors."""
    system_prompt = build_system_prompt()
    repair_prompt = f"""You are a strict JSON Repair Agent.
The following CAD plan failed validation for the prompt: "{original_prompt}"

ERROR TRACE:
{error_msg}

BAD JSON:
{bad_json}

Return ONLY the corrected, fully valid JSON matching the strict schema.
"""
    logger.info("Attempting repair...")
    return call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": repair_prompt}
    ], temperature=0.3) # lower temp for repair

def migrate_to_v3(plan_json: dict) -> dict:
    """Migrates legacy flat plans to the new Scene Graph root_node structure."""
    if "root_node" not in plan_json and "parts" in plan_json:
        parts = plan_json.pop("parts")
        plan_json["root_node"] = {
            "id": "root_node",
            "role": "assembly",
            "primitive": "assembly_root",
            "size": "huge",
            "material": "custom",
            "children": parts
        }
        for child in plan_json["root_node"]["children"]:
            if "primitive" not in child:
                child["primitive"] = child.get("shape") or child.get("geometry", {}).get("type") or "box"
            if "role" not in child:
                child["role"] = child.get("name", "unknown_part")
    if "dsl_version" not in plan_json:
        plan_json["dsl_version"] = "0.1.0"
    return plan_json

def generate_sample(prompt_obj: dict) -> bool:
    user_prompt = prompt_obj["text"]
    metadata = prompt_obj["metadata"]
    
    # 1. Dataset A: Intent Parsing (Prompt -> Metadata)
    # We already know the ground truth metadata because we generated it!
    dataset_a_record = {
        "messages": [
            {"role": "system", "content": "Extract CAD semantic metadata from the user prompt. Return JSON."},
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": json.dumps(metadata, indent=2)}
        ],
        "metadata": {
            "teacher": "deterministic_taxonomy",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }
    
    # 2. Dataset B: Symbolic Planning (Metadata -> CAD Plan)
    # The teacher sees the explicit metadata instruction.
    system_prompt = build_system_prompt()
    teacher_prompt = f"Create a symbolic CAD plan matching this metadata: {json.dumps(metadata)}"
    
    plan_str = call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": teacher_prompt}
    ])
    
    if not plan_str:
        return False
        
    # Validation Loop
    is_valid = False
    final_plan_str = plan_str
    
    try:
        plan_json = json.loads(plan_str)
        plan_json = migrate_to_v3(plan_json)
        AssemblySchema(**plan_json)
        is_valid = True
        final_plan_str = json.dumps(plan_json)
    except ValidationError as e:
        # Pass to Repair Agent
        repaired_str = repair_plan(teacher_prompt, plan_str, str(e))
        if repaired_str:
            try:
                rep_json = json.loads(repaired_str)
                rep_json = migrate_to_v3(rep_json)
                AssemblySchema(**rep_json)
                is_valid = True
                final_plan_str = json.dumps(rep_json)
                logger.info("Repair successful!")
            except ValidationError as re:
                logger.warning("Repair failed.")
                final_plan_str = repaired_str
    except json.JSONDecodeError:
        pass

    # Save outputs
    global_metadata = {
        "teacher_model": TEACHER_MODEL,
        "temperature": 0.7,
        "schema_version": SCHEMA_VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "taxonomy": metadata
    }
    
    if is_valid:
        # Save A
        with open(DATASET_A_FILE, "a") as f:
            f.write(json.dumps(dataset_a_record) + "\n")
            
        # Save B
        dataset_b_record = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": teacher_prompt},
                {"role": "assistant", "content": json.dumps(json.loads(final_plan_str), indent=2)}
            ],
            "metadata": global_metadata
        }
        with open(DATASET_B_FILE, "a") as f:
            f.write(json.dumps(dataset_b_record) + "\n")
        return True
    else:
        # Save Negative (for training repair model later)
        negative_record = {
            "prompt": teacher_prompt,
            "failed_output": final_plan_str,
            "metadata": global_metadata
        }
        with open(NEGATIVES_FILE, "a") as f:
            f.write(json.dumps(negative_record) + "\n")
        return False

def main():
    # Use deterministic seed
    SEED = 42
    NUM_SAMPLES = 100 # Change to 5000+ for actual run
    
    logger.info(f"Initializing taxonomy engine (seed={SEED}, samples={NUM_SAMPLES})...")
    prompts = generate_prompts(seed=SEED, num_samples=NUM_SAMPLES)
    
    success_count = 0
    fail_count = 0
    
    for i, prompt in enumerate(prompts):
        logger.info(f"--- Processing {i+1}/{NUM_SAMPLES}: {prompt['text']}")
        if generate_sample(prompt):
            success_count += 1
        else:
            fail_count += 1
            
    logger.info(f"Generation Complete! Success: {success_count}, Failed (saved as negatives): {fail_count}")

if __name__ == "__main__":
    main()
