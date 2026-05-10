from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import re

MODEL_PATH = "./models/qwen3-8b"

SYSTEM_PROMPT = """You are a CAD JSON generator. Output ONLY valid JSON. No thinking, no explanation.

Expected JSON structure:
{
  "assemblyName": "Name of project",
  "parts": [
    {
      "id": "unique_id",
      "name": "Part Name",
      "color": "#HEXCODE",
      "geometry": {
        "type": "box" | "cylinder",
        "dimensions": {"width": 100, "height": 10, "depth": 50},
        "position": {"x": 0, "y": 0, "z": 0}
      }
    }
  ],
  "dimensions": [
    {"label": "Overall Width", "value": "1200mm"},
    {"label": "Overall Height", "value": "450mm"}
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
      <div class="badge">AI CAD ENGINE v1.0</div>
      <div id="assembly-name-label" style="margin-top: 8px; color: #fff; font-weight: bold; font-size: 14px;"></div>
    </div>
  </div>
  <div id="sidebar">
    <div class="section-header">Project Overview</div>
    <div id="overview-content">
       <div class="prop-row"><div class="prop-label">Project</div><div class="prop-value" id="val-project">-</div></div>
       <div class="prop-row"><div class="prop-label">Version</div><div class="prop-value">1.0.0</div></div>
       <div class="prop-row"><div class="prop-label">Parts</div><div class="prop-value" id="val-parts">-</div></div>
       <div class="prop-row"><div class="prop-label">Status</div><div class="prop-value" style="color: #4ade80">Ready / Validated</div></div>
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
  
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
  camera.position.set(400, 300, 400);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(500, 500, 500);
  scene.add(mainLight);
  
  const fillLight = new THREE.DirectionalLight(0xff6b00, 0.4);
  fillLight.position.set(-500, 200, -500);
  scene.add(fillLight);
  
  const grid = new THREE.GridHelper(2000, 100, 0x333333, 0x111111);
  scene.add(grid);
  
  group = new THREE.Group();
  scene.add(group);
  
  animate();
  
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  const container = document.getElementById("canvas-container");
  if (!container) return;
  camera.aspect = container.clientWidth / 650;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, 650);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer) renderer.render(scene, camera);
}

window.renderCAD = function(data) {
  if (!scene) init3D();
  
  // Clear group
  while(group.children.length > 0) {
    const obj = group.children[0];
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    group.remove(obj);
  }
  
  try {
    const cad = JSON.parse(data);
    
    // Update UI Labels
    document.getElementById("assembly-name-label").innerText = cad.assemblyName || "Unnamed Assembly";
    document.getElementById("val-project").innerText = cad.assemblyName || "-";
    document.getElementById("val-parts").innerText = cad.parts ? cad.parts.length : "0";
    
    if (cad.designStrategy) {
      document.getElementById("val-rationale").innerText = cad.designStrategy.rationale || "-";
      document.getElementById("val-process").innerText = cad.designStrategy.process || "-";
      document.getElementById("val-notes").innerText = cad.designStrategy.notes || "-";
    }
    
    // Update Dimensions list
    const dimContent = document.getElementById("dimensions-content");
    dimContent.innerHTML = "";
    if (cad.dimensions && Array.isArray(cad.dimensions)) {
      cad.dimensions.forEach(d => {
        const row = document.createElement("div");
        row.className = "prop-row";
        row.innerHTML = `<div class="prop-label">${d.label}</div><div class="prop-value">${d.value}</div>`;
        dimContent.appendChild(row);
      });
    }

    // Render Parts
    if (cad.parts && Array.isArray(cad.parts)) {
      cad.parts.forEach(p => {
        const d = p.geometry.dimensions;
        const pos = p.geometry.position;
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
        mesh.position.set(
          pos.x || 0,
          (pos.y || 0) + (d.height || 50) / 2,
          pos.z || 0
        );
        group.add(mesh);
      });
      
      // Auto-focus camera
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      controls.target.copy(center);
      const maxD = Math.max(size.x, size.y, size.z);
      camera.position.set(center.x + maxD * 2, center.y + maxD * 1.5, center.z + maxD * 2);
      camera.lookAt(center);
    }
  } catch (e) {
    console.error("Render error:", e);
  }
};

setTimeout(init3D, 500);
</script>
"""

def clean_json(text):
    # ลบ <think>...</think> ทั้งหมด
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    # ลบ markdown
    text = re.sub(r"```json|```", "", text)
    
    # พยายามหา JSON block ที่สมบูรณ์ที่สุด
    # หา { ตัวแรก
    start_idx = text.find("{")
    if start_idx == -1:
        return ""
    
    # พยายามหา } ตัวสุดท้ายที่ทำให้ JSON valid
    # หรือใช้ stack ในการหาคู่
    stack = 0
    end_idx = -1
    for i in range(start_idx, len(text)):
        if text[i] == "{":
            stack += 1
        elif text[i] == "}":
            stack -= 1
            if stack == 0:
                end_idx = i
                # หยุดที่ตัวแรกที่สมบูรณ์เพื่อกัน "Extra data"
                break
    
    if end_idx != -1:
        return text[start_idx:end_idx+1]
    
    # ถ้าหาคู่ไม่เจอ (truncated) ให้เอาตั้งแต่ { ถึงตัวสุดท้ายแล้วพยายามปิด
    return text[start_idx:].strip()

def generate_cad(prompt, history):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Generate CAD JSON for: {prompt}. Be detailed with design rationale."}
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=2048, # เพิ่มขึ้นนิดหน่อยเพื่อรองรับ text อธิบาย
            temperature=0.1,
            do_sample=True,
            top_p=0.9,
            repetition_penalty=1.05,
            pad_token_id=tokenizer.eos_token_id,
        )

    raw = tokenizer.decode(
        outputs[0][len(inputs["input_ids"][0]):],
        skip_special_tokens=True
    )
    print("RAW OUTPUT:\n", raw[:1000])

    clean = clean_json(raw)
    print("CLEAN JSON:\n", clean[:400])

    try:
        parsed = json.loads(clean)
        name = parsed.get("assemblyName", "Assembly")
        count = len(parsed.get("parts", []))
        status = f"✅ {name} — {count} parts generated"
        final_json = json.dumps(parsed, indent=2)
    except Exception as e:
        print("PARSE ERROR:", e)
        # Fallback: พยายามปิด JSON ที่ถูกตัด
        try:
            # เพิ่ม } จนกว่าจะ parse ได้ หรือครบ 10 ตัว
            temp_json = clean
            for _ in range(10):
                try:
                    parsed = json.loads(temp_json)
                    final_json = json.dumps(parsed, indent=2)
                    status = f"⚠️ Recovered: {parsed.get('assemblyName','Assembly')}"
                    break
                except:
                    # ถ้ายังไม่ได้ ให้ลองเติม } หรือลบตัวอักษรสุดท้ายที่อาจจะค้างอยู่
                    if temp_json.endswith(","): temp_json = temp_json[:-1]
                    temp_json += "}"
            else:
                raise Exception("Failed to repair")
        except Exception:
            status = f"❌ Parsing Error: {str(e)[:50]}... Check RAW output."
            final_json = "{}"

    new_history = list(history) + [
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": status},
    ]
    return new_history, "", final_json


with gr.Blocks(title="VOXEN CAD Agent", css=".gradio-container { background: #050505; color: #eee; } button.primary { background: #FF6B00 !important; border: none !important; }") as demo:
    gr.Markdown("# ▲ VOXEN — AI CAD Agent\n**Qwen3-8B · AMD MI300X**")

    with gr.Row():
        with gr.Column(scale=4):
            chatbot = gr.Chatbot(height=400, label="Chat", type="messages")
            msg = gr.Textbox(
                placeholder="e.g. industrial coffee table with steel legs",
                label="Prompt",
                lines=2,
            )
            with gr.Row():
                btn = gr.Button("⚙️ Generate CAD", variant="primary")
                clear = gr.Button("🗑 Clear")
            json_out = gr.Code(language="json", label="Assembly JSON", lines=10)

        with gr.Column(scale=9):
            gr.HTML(THREE_JS_VIEWER)

    state = gr.State([])

    btn.click(
        generate_cad, [msg, state], [state, msg, json_out]
    ).then(
        lambda s: s, state, chatbot
    ).then(
        None, [json_out], None,
        js="(j) => { if(j && j!='{}') window.renderCAD(j); }"
    )

    msg.submit(
        generate_cad, [msg, state], [state, msg, json_out]
    ).then(
        lambda s: s, state, chatbot
    ).then(
        None, [json_out], None,
        js="(j) => { if(j && j!='{}') window.renderCAD(j); }"
    )

    clear.click(lambda: ([], [], "{}"), outputs=[chatbot, state, json_out])

demo.launch(server_name="0.0.0.0", server_port=7860, share=True)
