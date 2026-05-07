import os
from openai import OpenAI

# [REQUIRED] vLLM / AMD MI300X Logic
# What: Connects to the LLM inference server (Qwen3-8B)
# Where: AMD MI300X cluster or local vLLM instance

# AI MODEL: Qwen3-8B-Instruct
# ENDPOINT: OpenAI-compatible format via vLLM on AMD MI300X
# NOTE: to swap model, change LLM_MODEL in .env

# vLLM exposes an OpenAI-compatible API
client = OpenAI(
    base_url=os.getenv("LLM_API_BASE_URL", "http://localhost:8000/v1"),
    api_key=os.getenv("LLM_API_KEY", "EMPTY")
)

def generate_assembly_json(prompt: str, system_prompt: str) -> str:
    """
    Calls the Qwen3 model via vLLM to generate the JSON assembly.
    """
    response = client.chat.completions.create(
        model=os.getenv("LLM_MODEL", "Qwen/Qwen3-8B-Instruct"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate a 3D assembly for: {prompt}"}
        ],
        temperature=0.1,
        # If the model supports JSON mode natively, we can use response_format.
        # But explicitly providing the format in the prompt is usually enough for Qwen.
        # response_format={"type": "json_object"}
    )
    return response.choices[0].message.content
