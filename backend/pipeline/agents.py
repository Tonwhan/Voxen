import json
import logging
from .inference_backend import InferenceBackend

logger = logging.getLogger(__name__)

# Load backend once
_backend = InferenceBackend()

class CADAgents:
    """Core agents for intent parsing, planning, and repair."""
    
    def __init__(self):
        self.backend = _backend

    def parse_intent(self, prompt):
        system_prompt = """You are a Semantic Intent Parser for CAD.
Extract the core object, style, material, and key parts from the user prompt.
Include industrial tools, furniture, vehicles, and architectural components.
If the prompt is NOT a request to generate or describe a physical object or CAD model, return an empty JSON object {}.
Output ONLY valid JSON. No markdown."""

        try:
            text = self.backend.generate(system_prompt, prompt)
            if not text:
                return None
            intent = json.loads(text)
            if not intent or "object" not in intent:
                logger.warning(f"Intent parser found no CAD intent for: {prompt}")
                return None
            return intent
        except Exception as e:
            logger.error(f"parse_intent failed: {e}")
            return None

    def plan_cad(self, semantic_intent):
        from agent.prompt_builder import build_system_prompt
        system_prompt = build_system_prompt()
        user_prompt = f"Generate a 3D assembly for: {json.dumps(semantic_intent)}"
        
        try:
            text = self.backend.generate(system_prompt, user_prompt)
            if not text:
                return None
            return json.loads(text)
        except Exception as e:
            logger.error(f"plan_cad failed: {e}")
            return None
