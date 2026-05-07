from flask import Flask, request, jsonify
from datetime import datetime, timezone
import json
import os
from dotenv import load_dotenv
from pydantic import ValidationError

from validators.assembly_schema import AssemblySchema
from agent.prompt_builder import build_system_prompt
from agent.llm_client import generate_assembly_json

# Load environment variables
load_dotenv()

app = Flask(__name__)

# [REQUIRED] Flask API Entrypoint
# What: Handles POST /generate requests, coordinates LLM generation and Pydantic validation
# Where: Main backend router

@app.route('/generate', methods=['POST'])
def generate():
    """
    POST /generate
    Expects: {"prompt": "string"}
    Returns: Assembly JSON or Error JSON
    """
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Missing prompt", "code": "VALIDATION_ERROR"}), 400

    prompt = data['prompt']
    system_prompt = build_system_prompt()
    
    try:
        # 1. Generate JSON from LLM
        llm_response = generate_assembly_json(prompt, system_prompt)
        
        # 2. Parse JSON
        parsed_json = json.loads(llm_response)
        
        # 3. Add metadata if not present
        if "metadata" not in parsed_json:
            parsed_json["metadata"] = {}
        parsed_json["metadata"]["generatedAt"] = datetime.now(timezone.utc).isoformat()
        parsed_json["metadata"]["promptSummary"] = prompt[:50]
        
        if "version" not in parsed_json:
            parsed_json["version"] = "1.0"
            
        # 4. Validate with Pydantic
        assembly = AssemblySchema(**parsed_json)
        
        # 5. Return valid JSON
        return jsonify(assembly.model_dump(mode='json'))
        
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse LLM response as JSON", "code": "LLM_ERROR"}), 500
    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 500
    except Exception as e:
        return jsonify({"error": str(e), "code": "LLM_ERROR"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
