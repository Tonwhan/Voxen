from flask import Flask, request, jsonify, send_from_directory
import os
from flask_cors import CORS
import logging
from dotenv import load_dotenv

from pipeline.engine import CADPipeline

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")

# Initialize pipeline once at startup
pipeline = CADPipeline(export_dir=EXPORT_DIR)

@app.route('/generate', methods=['POST'])
def generate():
    """
    POST /generate
    Expects: {"prompt": "string", "format": "stl" | "obj"}
    Returns: Full pipeline result with validated Pydantic JSON + export_path
    """
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Missing prompt", "code": "VALIDATION_ERROR"}), 400

    prompt = data['prompt']
    export_format = data.get('format', 'stl')

    logger.info(f"Received generation request: '{prompt}' (format: {export_format})")

    result = pipeline.generate(prompt, export_format=export_format)

    if result["status"] == "success":
        # Flatten plan fields to top level so the frontend Zod schema validates correctly.
        response_data = result["plan"]
        response_data["export_path"] = result["export_path"]
        return jsonify(response_data), 200
    else:
        # Determine status code based on custom error codes
        status_code = 500
        if result.get("code") in ["INTENT_NOT_FOUND", "SCHEMA_VALIDATION_FAILED"]:
            status_code = 400
            
        return jsonify(result), status_code

@app.route('/exports/<path:filename>', methods=['GET'])
def download_export(filename):
    """
    GET /exports/<filename>
    Download a generated CAD export file (STL or OBJ).
    """
    return send_from_directory(EXPORT_DIR, filename)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    if not os.path.exists(EXPORT_DIR):
        os.makedirs(EXPORT_DIR)
    app.run(host='0.0.0.0', port=5000, debug=False)
