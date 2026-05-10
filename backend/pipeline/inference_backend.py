import os
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("InferenceBackend")

class InferenceBackend:
    def __init__(self):
        self.engine_type = os.getenv("LLM_ENGINE", "llama-cpp").lower()
        self.model_path = os.getenv("MODEL_PATH")
        self.api_base = os.getenv("API_BASE_URL", "http://127.0.0.1:11434/v1")
        self.api_key = os.getenv("API_KEY", "ollama")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.ctx_size = int(os.getenv("CTX_SIZE", "4096"))
        
        self._llm = None
        self._client = None
        
        if self.engine_type == "llama-cpp":
            from llama_cpp import Llama
            if not self.model_path or not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found at {self.model_path}. Set MODEL_PATH in .env")
            
            logger.info(f"Initializing Llama-CPP with model: {self.model_path}")
            self._llm = Llama(
                model_path=self.model_path,
                n_ctx=self.ctx_size,
                n_gpu_layers=-1, # Auto-detect
                verbose=False
            )
        else:
            logger.info(f"Initializing OpenAI-compatible client at {self.api_base}")
            self._client = OpenAI(
                api_key=self.api_key, 
                base_url=self.api_base,
                timeout=120.0  # Increased for slow local inference
            )

    def generate(self, system_prompt: str, user_prompt: str, json_format: bool = True) -> Optional[str]:
        """Unified generation interface."""
        logger.info(f"Generating with {self.engine_type}...")
        try:
            if self.engine_type == "llama-cpp":
                text = self._generate_llama_cpp(system_prompt, user_prompt, json_format)
            else:
                text = self._generate_api(system_prompt, user_prompt, json_format)
            
            logger.info(f"Raw Response: {text[:200]}...")
            return text
        except Exception as e:
            logger.error(f"Inference Error ({self.engine_type}): {e}")
            return None

    def _generate_llama_cpp(self, system_prompt, user_prompt, json_format):
        response = self._llm.create_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"} if json_format else None,
            temperature=self.temperature
        )
        return response["choices"][0]["message"]["content"]

    def _generate_api(self, system_prompt, user_prompt, json_format):
        response = self._client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "default-model"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"} if json_format else None,
            temperature=self.temperature
        )
        return response.choices[0].message.content
