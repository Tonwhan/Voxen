from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import re
import os

MODEL_PATH = "./models/qwen3-8b"

SYSTEM_PROMPT = """You are a CAD JSON generator. Output ONLY valid JSON according to the schema. No thinking, no explanation.

Expected JSON structure:
{
  "assemblyName": "Project Name",
  "version": "1.0.0",
  "parts": [
    {
      "id": "part_1",
      "name": "Part Name",
      "shape": "box" | "cylinder" | "gear",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "color": "#HEXCODE",
      "geometry": {
        "type": "box" | "cylinder" | "gear",
        "dimensions": {
          "width": 100, "height": 10, "depth": 50,
          "teeth": 24, "module": 3, "bore": 20
        }
      },
      "material": {
        "name": "Steel" | "Aluminum" | "Plastic",
        "description": "Short description..."
      },
      "designIntent": "Purpose of this part"
    }
  ],
  "metadata": {
    "generatedAt": "ISO_TIMESTAMP",
    "promptSummary": "Short summary of the request"
  },
  "dimensions": [
    {"label": "Overall Width", "value": "1200mm"}
  ],
  "designStrategy": {
    "rationale": "Why this design works...",
    "process": "Manufacturing steps...",
    "notes": "Assembly instructions..."
  }
}"""

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)
print(f"✅ Ready on {next(model.parameters()).device}")

THREE_JS_VIEWER = """
<style>
  #viewer-container {
    display: grid;
    grid-template-columns: 1fr 300px;
    height: 650px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #FF6B00;
    font-family: 'Inter', sans-serif;
    color: #333;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  #canvas-container {
    position: relative;
    background: #fdfdfd;
  }
  #sidebar {
    background: #fafafa;
    border-left: 1px solid #eee;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    font-size: 11px;
  }
  .section-header {
    background: #FF6B00;
    padding: 10px 12px;
    color: #ffffff;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .prop-row {
    display: flex;
    border-bottom: 1px solid #eee;
  }
  .prop-label {
    width: 40%;
    padding: 8px 12px;
    color: #888;
    border-right: 1px solid #eee;
    text-transform: uppercase;
    font-size: 9px;
    font-weight: 600;
  }
  .prop-value {
    width: 60%;
    padding: 8px 12px;
    color: #333;
    font-weight: 500;
  }
  .strategy-block {
    padding: 12px;
    border-bottom: 1px solid #eee;
  }
  .strategy-title {
    color: #FF6B00;
    font-size: 9px;
    font-weight: bold;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .strategy-text {
    color: #666;
    line-height: 1.5;
    font-family: 'Inter', sans-serif;
  }
  #viewer-overlay {
    position: absolute;
    top: 15px;
    left: 15px;
    pointer-events: none;
    z-index: 10;
  }
  .badge {
    background: #FF6B00;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
  }
  .export-panel {
    position: absolute;
    bottom: 15px;
    right: 15px;
    display: flex;
    gap: 8px;
    z-index: 100;
  }
  .export-btn {
    background: #333;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .export-btn:hover {
    background: #FF6B00;
  }
</style>

<div id="viewer-container">
  <div id="canvas-container">
    <div id="viewer-overlay">
      <div class="badge">VOXEN AI ENGINE</div>
      <div id="assembly-name-label" style="margin-top: 10px; color: #333; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;"></div>
    </div>
    
    <div class="export-panel">
      <button class="export-btn" onclick="exportFile('OBJ')">OBJ</button>
      <button class="export-btn" onclick="exportFile('STL')">STL</button>
      <button class="export-btn" onclick="exportFile('STEP')" style="opacity: 0.5;">STEP</button>
    </div>
  </div>
  <div id="sidebar">
    <div class="section-header">Project Overview</div>
    <div id="overview-content">
       <div class="prop-row"><div class="prop-label">Project</div><div class="prop-value" id="val-project">-</div></div>
       <div class="prop-row"><div class="prop-label">Version</div><div class="prop-value" id="val-version">-</div></div>
       <div class="prop-row"><div class="prop-label">Parts</div><div class="prop-value" id="val-parts">-</div></div>
    </div>
    
    <div class="section-header">Technical Specs</div>
    <div id="dimensions-content"></div>
    
    <div class="section-header">AI Design Strategy</div>
    <div class="strategy-block">
      <div class="strategy-title">Design Rationale</div>
      <div class="strategy-text" id="val-rationale">Processing...</div>
    </div>
    <div class="strategy-block">
      <div class="strategy-title">Manufacturing</div>
      <div class="strategy-text" id="val-process">-</div>
    </div>
    <div class="strategy-block">
      <div class="strategy-title">Assembly Notes</div>
      <div class="strategy-text" id="val-notes">-</div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/OBJExporter.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/STLExporter.js"></script>

<script>
let scene, camera, renderer, controls, group;

function init3D() {
  const container = document.getElementById("canvas-container");
  if (!container || scene) return;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfdfdfd);
  
  const width = container.clientWidth;
  const height = 650;
  
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 100000);
  camera.position.set(2000, 1500, 2000);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(1000, 1000, 1000);
  scene.add(sunLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-1000, 500, -1000);
  scene.add(backLight);
  
  const grid = new THREE.GridHelper(10000, 100, 0xeeeeee, 0xdddddd);
  scene.add(grid);
  
  group = new THREE.Group();
  scene.add(group);
  
  animate();
}

function createGearGeometry(params) {
  const numTeeth = params.teeth || 24;
  const module = params.module || 3;
  const faceWidth = params.height || 15;
  const boreRadius = (params.bore || 20) / 2;

  const pitchRadius = (module * numTeeth) / 2;
  const outerRadius = pitchRadius + module;
  const rootRadius = pitchRadius - 1.25 * module;

  const shape = new THREE.Shape();
  const angleStep = (2 * Math.PI) / numTeeth;

  for (let i = 0; i < numTeeth; i++) {
    const angle = i * angleStep;
    const nextAngle = (i + 1) * angleStep;
    const toothHalfAngle = (Math.PI / numTeeth) * 0.4;
    const rootAngle1 = angle - toothHalfAngle * 1.2;
    const rootAngle2 = angle + toothHalfAngle * 1.2;

    if (i === 0) shape.moveTo(rootRadius * Math.cos(rootAngle1), rootRadius * Math.sin(rootAngle1));
    
    shape.lineTo(rootRadius * Math.cos(rootAngle1), rootRadius * Math.sin(rootAngle1));
    shape.lineTo(pitchRadius * Math.cos(angle - toothHalfAngle), pitchRadius * Math.sin(angle - toothHalfAngle));
    shape.lineTo(outerRadius * Math.cos(angle), outerRadius * Math.sin(angle));
    shape.lineTo(pitchRadius * Math.cos(angle + toothHalfAngle), pitchRadius * Math.sin(angle + toothHalfAngle));
    shape.lineTo(rootRadius * Math.cos(rootAngle2), rootRadius * Math.sin(rootAngle2));

    const gapAngle1 = rootAngle2;
    const gapAngle2 = nextAngle - toothHalfAngle * 1.2;
    const steps = 5;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const gapAngle = gapAngle1 + (gapAngle2 - gapAngle1) * t;
      shape.lineTo(rootRadius * Math.cos(gapAngle), rootRadius * Math.sin(gapAngle));
    }
  }
  shape.closePath();

  const borePath = new THREE.Path();
  borePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, false);
  shape.holes.push(borePath);

  const extrudeSettings = {
    depth: faceWidth,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 2,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  geo.rotateX(Math.PI / 2);
  return geo;
}

window.exportFile = function(type) {
  if (!group || group.children.length === 0) return alert("No model to export");
  
  if (type === 'OBJ') {
    const exporter = new THREE.OBJExporter();
    const result = exporter.parse(group);
    downloadBlob(result, 'assembly.obj', 'text/plain');
  } else if (type === 'STL') {
    const exporter = new THREE.STLExporter();
    const result = exporter.parse(group, { binary: true });
    downloadBlob(result, 'assembly.stl', 'application/octet-stream');
  } else if (type === 'STEP') {
    alert("STEP Export requires a CAD kernel (OpenCASCADE). Currently generating STL/OBJ for high-fidelity export. STEP support is being deployed.");
    // In a real production app, we would send the JSON to a Python backend with python-occ or cadquery
  }
};

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer) renderer.render(scene, camera);
}

window.renderCAD = function(data) {
  if (!scene) init3D();
  while(group.children.length > 0) {
    const obj = group.children[0];
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    group.remove(obj);
  }
  
  try {
    const cad = typeof data === 'string' ? JSON.parse(data) : data;
    
    document.getElementById("assembly-name-label").innerText = cad.assemblyName || "VOXEN PART";
    document.getElementById("val-project").innerText = cad.assemblyName || "-";
    document.getElementById("val-version").innerText = cad.version || "1.0.0";
    document.getElementById("val-parts").innerText = cad.parts ? cad.parts.length : "0";
    
    if (cad.designStrategy) {
      document.getElementById("val-rationale").innerText = cad.designStrategy.rationale || "-";
      document.getElementById("val-process").innerText = cad.designStrategy.process || "-";
      document.getElementById("val-notes").innerText = cad.designStrategy.notes || "-";
    }
    
    const dimContent = document.getElementById("dimensions-content");
    dimContent.innerHTML = "";
    if (cad.dimensions) {
      cad.dimensions.forEach(d => {
        const row = document.createElement("div");
        row.className = "prop-row";
        row.innerHTML = `<div class="prop-label">${d.label}</div><div class="prop-value">${d.value}</div>`;
        dimContent.appendChild(row);
      });
    }

    if (cad.parts) {
      cad.parts.forEach(p => {
        const d = p.geometry.dimensions;
        const pos = p.position;
        let geo;
        
        if (p.shape === "gear" || p.geometry.type === "gear") {
          geo = createGearGeometry(d);
        } else if (p.geometry.type === "cylinder") {
          const r = (d.width || d.depth || 50) / 2;
          geo = new THREE.CylinderGeometry(r, r, d.height || 50, 32);
        } else {
          geo = new THREE.BoxGeometry(d.width || 50, d.height || 50, d.depth || 50);
        }
        
        const mat = new THREE.MeshStandardMaterial({
          color: p.color || "#FF6B00",
          metalness: 0.1,
          roughness: 0.8
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos[0], pos[1] + (d.height||50)/2, pos[2]);
        
        if (p.rotation) {
          mesh.rotation.set(
            p.rotation[0] * Math.PI / 180,
            p.rotation[1] * Math.PI / 180,
            p.rotation[2] * Math.PI / 180
          );
        }
        group.add(mesh);
      });
      
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      controls.target.copy(center);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 2.5; 
      camera.position.set(center.x + cameraZ, center.y + cameraZ * 0.8, center.z + cameraZ);
      camera.lookAt(center);
    }
  } catch (e) { console.error("Render error:", e); }
};
setTimeout(init3D, 500);
</script>
"""

def clean_json(text):
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"```json|```", "", text)
    start_idx = text.find("{")
    if start_idx == -1: return ""
    stack = 0
    end_idx = -1
    for i in range(start_idx, len(text)):
        if text[i] == "{": stack += 1
        elif text[i] == "}":
            stack -= 1
            if stack == 0:
                end_idx = i
                break
    if end_idx != -1: return text[start_idx:end_idx+1]
    return text[start_idx:].strip()

def generate_cad(prompt, history=None):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Generate CAD JSON for: {prompt}"}
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=2048,
            temperature=0.1,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
        )

    raw = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)
    clean = clean_json(raw)

    try:
        parsed = json.loads(clean)
        if "metadata" not in parsed:
            parsed["metadata"] = {
                "generatedAt": "2026-05-10T00:00:00Z",
                "promptSummary": prompt[:100]
            }
        if "version" not in parsed: parsed["version"] = "1.0.0"
        final_json = json.dumps(parsed, indent=2)
        status = f"✅ {parsed.get('assemblyName', 'Assembly')} created"
    except Exception as e:
        try:
            temp = clean
            for _ in range(5):
                try:
                    parsed = json.loads(temp)
                    final_json = json.dumps(parsed, indent=2)
                    status = "⚠️ Recovered"
                    break
                except: temp += "}"
            else: raise Exception()
        except:
            status = f"❌ Error: {str(e)[:50]}"
            final_json = "{}"

    if history is not None:
        new_history = list(history)
        new_history.append({"role": "user", "content": prompt})
        new_history.append({"role": "assistant", "content": status})
        return new_history, "", final_json
    return final_json

# --- API ENDPOINT FOR NEXTJS ---
from fastapi import Request
from fastapi.responses import JSONResponse

with gr.Blocks(title="VOXEN CAD Agent") as demo:
    gr.Markdown("# ▲ VOXEN — AI CAD Agent\n**Theme: White & Orange · AMD MI300X**")
    with gr.Row():
        with gr.Column(scale=4):
            chatbot = gr.Chatbot(height=400, label="Chat History") 
            msg = gr.Textbox(placeholder="e.g. coffee table with 4 legs", label="AI Prompt", lines=2)
            btn = gr.Button("⚙️ Generate CAD Model", variant="primary")
            json_out = gr.Code(language="json", label="Output JSON", lines=10)
        with gr.Column(scale=9):
            gr.HTML(THREE_JS_VIEWER)

    state = gr.State([])
    
    btn.click(generate_cad, [msg, state], [state, msg, json_out]).then(
        lambda s: s, state, chatbot
    ).then(None, [json_out], None, js="(j) => { if(j && j!='{}') window.renderCAD(j); }")

    msg.submit(generate_cad, [msg, state], [state, msg, json_out]).then(
        lambda s: s, state, chatbot
    ).then(None, [json_out], None, js="(j) => { if(j && j!='{}') window.renderCAD(j); }")

    # Mount API Route
    from fastapi.middleware.cors import CORSMiddleware
    app = demo.app
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.post("/generate")
    async def api_generate(request: Request):
        data = await request.json()
        prompt = data.get("prompt", "")
        if not prompt: return JSONResponse({"error": "Prompt required"}, status_code=400)
        result_json = generate_cad(prompt)
        return JSONResponse(json.loads(result_json))

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0", 
        server_port=7860,
        share=True,
        css="""
        .gradio-container { background-color: #ffffff !important; color: #333333 !important; }
        button.primary { background: #FF6B00 !important; border: none !important; color: white !important; font-weight: bold !important; }
        .block { border: 1px solid #eeeeee !important; }
        #component-0 { background: white !important; }
        .chatbot .message.user { background: #fdf2e9 !important; border: 1px solid #FF6B00 !important; }
        .chatbot .message.bot { background: #ffffff !important; border: 1px solid #eeeeee !important; }
        """
    )
