from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import re

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
      "shape": "box" | "cylinder",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "color": "#HEXCODE",
      "geometry": {
        "type": "box" | "cylinder",
        "dimensions": {"width": 100, "height": 10, "depth": 50}
      },
      "material": {
        "name": "Material Name",
        "description": "Description..."
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
    "process": "How to manufacture...",
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
    background: #050505;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #222;
    font-family: 'Inter', 'JetBrains Mono', monospace;
    color: #eee;
  }
  #canvas-container {
    position: relative;
    background: radial-gradient(circle at center, #111 0%, #050505 100%);
  }
  #sidebar {
    background: #0a0a0a;
    border-left: 1px solid #222;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    font-size: 11px;
  }
  .section-header {
    background: #111;
    padding: 8px 12px;
    border-bottom: 1px solid #222;
    color: #FF6B00;
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
    border-bottom: 1px solid #1a1a1a;
  }
  .prop-label {
    width: 40%;
    padding: 6px 12px;
    color: #555;
    border-right: 1px solid #1a1a1a;
    text-transform: uppercase;
    font-size: 9px;
  }
  .prop-value {
    width: 60%;
    padding: 6px 12px;
    color: #ccc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .strategy-block {
    padding: 12px;
    border-bottom: 1px solid #1a1a1a;
  }
  .strategy-title {
    color: #FF6B00;
    font-size: 9px;
    font-weight: bold;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .strategy-text {
    color: #888;
    line-height: 1.4;
    font-family: monospace;
  }
  #viewer-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    pointer-events: none;
    z-index: 10;
  }
  .badge {
    background: rgba(255,107,0,0.1);
    color: #FF6B00;
    padding: 2px 6px;
    border: 1px solid rgba(255,107,0,0.2);
    border-radius: 4px;
    font-size: 9px;
    font-weight: bold;
  }
</style>

<div id="viewer-container">
  <div id="canvas-container">
    <div id="viewer-overlay">
      <div class="badge">AI CAD ENGINE v1.2 [SYNCED]</div>
      <div id="assembly-name-label" style="margin-top: 8px; color: #fff; font-weight: bold; font-size: 14px;"></div>
    </div>
  </div>
  <div id="sidebar">
    <div class="section-header">Project Overview</div>
    <div id="overview-content">
       <div class="prop-row"><div class="prop-label">Project</div><div class="prop-value" id="val-project">-</div></div>
       <div class="prop-row"><div class="prop-label">Version</div><div class="prop-value" id="val-version">-</div></div>
       <div class="prop-row"><div class="prop-label">Parts</div><div class="prop-value" id="val-parts">-</div></div>
    </div>
    
    <div class="section-header">Dimensions</div>
    <div id="dimensions-content"></div>
    
    <div class="section-header">AI Design Strategy</div>
    <div class="strategy-block">
      <div class="strategy-title">Design Rationale</div>
      <div class="strategy-text" id="val-rationale">Waiting for generation...</div>
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
<script>
let scene, camera, renderer, controls, group;

function init3D() {
  const container = document.getElementById("canvas-container");
  if (!container || scene) return;
  
  scene = new THREE.Scene();
  const width = container.clientWidth;
  const height = 650;
  
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
  camera.position.set(2000, 1500, 2000);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(500, 500, 500);
  scene.add(mainLight);
  
  const fillLight = new THREE.DirectionalLight(0xff6b00, 0.4);
  fillLight.position.set(-500, 200, -500);
  scene.add(fillLight);
  
  const grid = new THREE.GridHelper(10000, 100, 0x333333, 0x151515);
  scene.add(grid);
  
  group = new THREE.Group();
  scene.add(group);
  
  animate();
  window.addEventListener('resize', () => {
    const c = document.getElementById("canvas-container");
    if(!c) return;
    camera.aspect = c.clientWidth / 650;
    camera.updateProjectionMatrix();
    renderer.setSize(c.clientWidth, 650);
  });
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
    
    document.getElementById("assembly-name-label").innerText = cad.assemblyName || "Unnamed";
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
        const pos = p.position; // Array [x,y,z]
        let geo;
        
        if (p.geometry.type === "cylinder") {
          const r = (d.width || d.depth || 50) / 2;
          geo = new THREE.CylinderGeometry(r, r, d.height || 50, 32);
        } else {
          geo = new THREE.BoxGeometry(d.width || 50, d.height || 50, d.depth || 50);
        }
        
        const mat = new THREE.MeshStandardMaterial({
          color: p.color || "#888",
          metalness: 0.6,
          roughness: 0.2
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        // Position is tuple [x,y,z]
        mesh.position.set(pos[0], pos[1] + (d.height||50)/2, pos[2]);
        
        if (p.rotation) {
          mesh.rotation.set(
            p.rotation[0] * Math.PI / 180,
            p.rotation[1] * Math.PI / 180,
            p.rotation[2] * Math.PI / 180
          );
        }
        
        if (p.scale) mesh.scale.set(p.scale[0], p.scale[1], p.scale[2]);
        
        group.add(mesh);
      });
      
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      controls.target.copy(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 2.5; // Zoom out buffer
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
        status = f"✅ {parsed.get('assemblyName', 'Assembly')} generated"
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
        # ใช้รูปแบบ Messages สำหรับ Gradio 6.0+
        new_history = list(history) + [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": status}
        ]
        return new_history, "", final_json
    return final_json

# --- API ENDPOINT FOR NEXTJS ---
from fastapi import Request
from fastapi.responses import JSONResponse

# ย้าย css ไปไว้ใน launch ตามที่ Gradio เตือน
with gr.Blocks(title="VOXEN CAD Agent") as demo:
    gr.Markdown("# ▲ VOXEN — AI CAD Agent\n**Qwen3-8B · AMD MI300X**")
    with gr.Row():
        with gr.Column(scale=4):
            chatbot = gr.Chatbot(height=400, label="Chat") 
            msg = gr.Textbox(placeholder="e.g. industrial gearbox", label="Prompt", lines=2)
            btn = gr.Button("⚙️ Generate CAD", variant="primary")
            json_out = gr.Code(language="json", label="Assembly JSON", lines=10)
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
        css=".gradio-container { background: #050505; color: #eee; } button.primary { background: #FF6B00 !important; border: none !important; }"
    )
