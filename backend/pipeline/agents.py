import json
import logging
import os

logger = logging.getLogger(__name__)

# ─── Backend Selection ──────────────────────────────────────────────────────
# If LLM_API_BASE_URL is set (e.g., pointing to vLLM on MI300X), use OpenAI client.
# Otherwise fall back to local llama-cpp-python with the GGUF model.
# ────────────────────────────────────────────────────────────────────────────

USE_VLLM = bool(os.getenv("LLM_API_BASE_URL"))

if USE_VLLM:
    from agent.llm_client import generate_assembly_json as _vllm_generate
    from agent.prompt_builder import build_system_prompt as _vllm_build_system_prompt
    logger.info("CADAgents: using vLLM backend (MI300X)")
else:
    from llama_cpp import Llama
    # _LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "/home/atiyut/models/Qwen3-8B-Q4_K_M.gguf")
    _LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH","/workspace/models/qwen2.5-1.5b-instruct-q4_k_m.gguf")
    logger.info(f"CADAgents: using local llama-cpp-python ({_LOCAL_MODEL_PATH})")
    _llm = Llama(
        model_path=_LOCAL_MODEL_PATH, 
        n_ctx=2048,      # Reduced from 4096 to save memory
        n_threads=6,     # Explicitly set threads for 8-core CPU
        n_gpu_layers=0   # Ensure CPU execution
    )


def _generate_json_local(system_prompt, user_prompt):
    """Call the local GGUF model via llama-cpp-python."""
    response = _llm.create_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
        max_tokens=1024,
    )
    text = response["choices"][0]["message"]["content"].strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return text


def _generate_json_vllm(system_prompt, user_prompt):
    """Call the remote vLLM server via the existing llm_client."""
    from agent.prompt_builder import build_system_prompt
    # generate_assembly_json only accepts (prompt, system_prompt)
    text = _vllm_generate(user_prompt, system_prompt)
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return text


_generate_raw = _generate_json_vllm if USE_VLLM else _generate_json_local


class CADAgents:
    def parse_intent(self, prompt):
        system_prompt = """You are a Semantic Intent Parser for CAD.
Extract the core object, style, material, and key parts from the user prompt.
If the prompt is NOT a request to generate or describe a physical object or CAD model, return an empty JSON object {}.
Output ONLY valid JSON. No markdown.

Example output for "modern wooden chair with 4 legs":
{
  "object": "chair",
  "style": "modern",
  "material": "wood",
  "parts": ["seat", "backrest", "legs"]
}"""
        try:
            text = _generate_raw(system_prompt, prompt)
            intent = json.loads(text)
            if not intent or "object" not in intent:
                logger.warning(f"Intent parser found no CAD intent for: {prompt}")
                return None
            return intent
        except Exception as e:
            logger.error(f"parse_intent failed: {e}")
            return None

    def plan_cad(self, semantic_intent):
        if USE_VLLM:
            # Use the existing rich system prompt from the Voxen repo
            system_prompt = _vllm_build_system_prompt()
        else:
            from agent.prompt_builder import build_system_prompt
            system_prompt = build_system_prompt()

        user_prompt = f"Generate a 3D assembly for: {json.dumps(semantic_intent)}"
        try:
            text = _generate_raw(system_prompt, user_prompt)
            return json.loads(text)
        except Exception as e:
            logger.error(f"plan_cad failed: {e}")
            return None
