from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import re

MODEL_ID = "./models/qwen3-8b-voxen"

SYSTEM_PROMPT = """
You are Voxen AI, an expert CAD assembly generator.

CRITICAL RULES:
- Output VALID JSON only
- No markdown
- No explanation
- No <think>
- No reasoning
- Start response with {
- End response with }

Schema:
{
  "assemblyName": "string",
  "parts": [
    {
      "id": "string",
      "name": "string",
      "color": "#hexcode",
      "geometry": {
        "type": "box|cylinder",
        "dimensions": {
          "width": number,
          "height": number,
          "depth": number,
          "radius": number
        },
        "position": {
          "x": number,
          "y": number,
          "z": number
        }
      }
    }
  ]
}
"""

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(MODEL_ID, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True)

THREE_JS_VIEWER = """
<div id="canvas-container" style="width:100%; height:700px; background:#1e1e1e; border-radius:16px; overflow:hidden; border:1px solid #333;"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script>
let scene, camera, renderer, controls, group;
function init3D() {
    const container = document.getElementById("canvas-container");
    if (!container || scene) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / 700, 0.1, 10000);
    camera.position.set(250, 220, 250);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, 700);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x1e1e1e);
    container.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dir1 = new THREE.DirectionalLight(0xffffff, 2);
    dir1.position.set(300, 400, 500);
    scene.add(dir1);
    const grid = new THREE.GridHelper(2000, 100, 0x666666, 0x333333);
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    scene.add(grid);
    scene.add(new THREE.AxesHelper(200));
    group = new THREE.Group();
    scene.add(group);
    window.addEventListener("resize", () => {
        camera.aspect = container.clientWidth / 700;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, 700);
    });
    animate();
}
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}
window.renderCAD = function(data) {
    if (!scene) init3D();
    while(group.children.length > 0) {
        const obj = group.children[0];
        if(obj.geometry) obj.geometry.dispose();
        if(obj.material) obj.material.dispose();
        group.remove(obj);
    }
    try {
        const cad = JSON.parse(data);
        cad.parts.forEach(part => {
            const d = part.geometry.dimensions;
            const p = part.geometry.position;
            let geometry = (part.geometry.type === "box") ? 
                new THREE.BoxGeometry(d.width, d.height, d.depth) : 
                new THREE.CylinderGeometry(d.radius || 10, d.radius || 10, d.height, 32);
            const material = new THREE.MeshStandardMaterial({
                color: part.color || "#cccccc",
                metalness: 0.2,
                roughness: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(p.x, p.z + (d.height / 2), p.y);
            group.add(mesh);
        });
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        controls.target.copy(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(center.x + maxDim * 2, center.y + maxDim * 1.5, center.z + maxDim * 2);
        camera.lookAt(center);
    } catch(err) { console.error("CAD ERROR:", err); }
};
setTimeout(init3D, 1000);
</script>
"""

def clean_json_response(text):
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = text.replace("```json", "").replace("```", "")
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0).strip()
    return text.strip()

def generate_cad(prompt, history):
    # ปรับ History ให้เป็น format ที่ระบบต้องการ (Dict)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append(msg)
    messages.append({"role": "user", "content": prompt})

    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=512, temperature=0.05, top_p=0.9, do_sample=True)

    raw = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)
    clean = clean_json_response(raw)

    try:
        parsed = json.loads(clean)
        final_json = json.dumps(parsed, indent=2)
        status = f"Generated: {parsed.get('assemblyName', 'Model')}"
    except Exception as e:
        final_json = json.dumps({"assemblyName": "error", "parts": []}, indent=2)
        status = "JSON Error"

    history.append({"role": "user", "content": prompt})
    history.append({"role": "assistant", "content": status})
    
    return history, "", final_json

with gr.Blocks(title="VOXEN 3D Agent") as demo:
    gr.Markdown("# ▲ VOXEN 3D Agent")
    with gr.Row():
        with gr.Column(scale=1):
            # ลบ type="messages" ออกเพื่อแก้ TypeError
            chatbot = gr.Chatbot(height=450)
            msg = gr.Textbox(placeholder="Ask me to build something...")
            btn = gr.Button("Generate CAD", variant="primary")
            json_out = gr.Code(language="json", label="CAD JSON", lines=18)
        with gr.Column(scale=1):
            gr.HTML(THREE_JS_VIEWER)

    btn.click(generate_cad, [msg, chatbot], [chatbot, msg, json_out]).then(
        None, [json_out], None, js="(json_str) => { window.renderCAD(json_str); }"
    )

# ย้าย theme มาไว้ที่ launch()
demo.launch(
    server_name="0.0.0.0",
    server_port=7860,
    share=True,
    theme=gr.themes.Soft()
)
