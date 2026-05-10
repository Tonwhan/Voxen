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
<div id="voxen-root" style="width: 100%; height: 650px; min-height: 650px;">
<style>
  #viewer-container {
    display: grid;
    grid-template-columns: 1fr 300px;
    height: 650px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 3px solid #FF6B00;
    font-family: 'Inter', sans-serif;
    color: #333;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }
  #canvas-container { position: relative; background: #fdfdfd; }
  #sidebar { background: #fafafa; border-left: 1px solid #eee; display: flex; flex-direction: column; overflow-y: auto; font-size: 11px; }
  .section-header { background: #FF6B00; padding: 12px; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 11px; }
  .prop-row { display: flex; border-bottom: 1px solid #eee; }
  .prop-label { width: 40%; padding: 10px 12px; color: #999; border-right: 1px solid #eee; text-transform: uppercase; font-size: 9px; font-weight: 700; }
  .prop-value { width: 60%; padding: 10px 12px; color: #333; font-weight: 600; }
  .strategy-block { padding: 15px; border-bottom: 1px solid #eee; }
  .strategy-title { color: #FF6B00; font-size: 10px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; }
  .strategy-text { color: #555; line-height: 1.6; }
  .badge-main { position: absolute; top: 20px; left: 20px; background: #FF6B00; color: white; padding: 5px 12px; border-radius: 6px; font-weight: 900; z-index: 100; }
  .export-bar { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 10px; z-index: 100; }
  .btn-exp { background: #222; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; }
</style>

<div id="viewer-container">
  <div id="canvas-container">
    <div class="badge-main">VOXEN AI ENGINE</div>
    <div id="model-title" style="position: absolute; top: 60px; left: 20px; color: #333; font-weight: 900; font-size: 24px;">READY TO GEN</div>
    <div class="export-bar">
      <button class="btn-exp" onclick="window.runExport('OBJ')">OBJ</button>
      <button class="btn-exp" onclick="window.runExport('STL')">STL</button>
    </div>
  </div>
  <div id="sidebar">
    <div class="section-header">Assembly Information</div>
    <div class="prop-row"><div class="prop-label">Project</div><div class="prop-value" id="s-project">-</div></div>
    <div class="prop-row"><div class="prop-label">Version</div><div class="prop-value" id="s-version">-</div></div>
    <div class="prop-row"><div class="prop-label">Parts Count</div><div class="prop-value" id="s-parts">-</div></div>
    <div class="section-header">AI Strategy</div>
    <div class="strategy-block"><div class="strategy-title">Rationale</div><div id="s-rationale" class="strategy-text">-</div></div>
    <div class="strategy-block"><div class="strategy-title">Manufacturing</div><div id="s-process" class="strategy-text">-</div></div>
  </div>
</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/OBJExporter.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/STLExporter.js"></script>

<script>
var scene, camera, renderer, controls, group;

function init() {
  var container = document.getElementById("canvas-container");
  if (!container || scene) return;
  if (container.clientWidth === 0) { setTimeout(init, 200); return; }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfdfdfd);
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / 650, 1, 100000);
  camera.position.set(2000, 1500, 2000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, 650);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  var sun = new THREE.DirectionalLight(0xffffff, 0.6);
  sun.position.set(1000, 2000, 1000);
  scene.add(sun);
  scene.add(new THREE.GridHelper(10000, 100, 0xeeeeee, 0xdddddd));
  group = new THREE.Group();
  scene.add(group);
  function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
  animate();
}

function createGear(params) {
  var teeth=params.teeth||24, module=params.module||3, height=params.height||15, bore=params.bore||20;
  var pr=(module*teeth)/2, or=pr+module, rr=pr-1.25*module;
  var shape=new THREE.Shape();
  var step=(Math.PI*2)/teeth;
  for(var i=0; i<teeth; i++) {
    var a=i*step, ha=(Math.PI/teeth)*0.4;
    if(i===0) shape.moveTo(rr*Math.cos(a-ha*1.2), rr*Math.sin(a-ha*1.2));
    shape.lineTo(rr*Math.cos(a-ha*1.2), rr*Math.sin(a-ha*1.2));
    shape.lineTo(pr*Math.cos(a-ha), pr*Math.sin(a-ha));
    shape.lineTo(or*Math.cos(a), or*Math.sin(a));
    shape.lineTo(pr*Math.cos(a+ha), pr*Math.sin(a+ha));
    shape.lineTo(rr*Math.cos(a+ha*1.2), rr*Math.sin(a+ha*1.2));
  }
  shape.closePath();
  var hole=new THREE.Path(); hole.absarc(0,0,bore/2,0,Math.PI*2,true); shape.holes.push(hole);
  var geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelThickness:0.5,bevelSize:0.5});
  geo.center(); geo.rotateX(Math.PI/2); return geo;
}

window.renderCAD = function(data) {
  if (!data || data === '{}' || data === '') return;
  if (!scene) { init(); setTimeout(function(){ window.renderCAD(data); }, 500); return; }
  try {
    var cad = typeof data === 'string' ? JSON.parse(data) : data;
    while(group.children.length > 0) { var o=group.children[0]; if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); group.remove(o); }
    document.getElementById("model-title").innerText = cad.assemblyName || "GENERATED";
    document.getElementById("s-project").innerText = cad.assemblyName || "-";
    document.getElementById("s-version").innerText = cad.version || "1.0.0";
    document.getElementById("s-parts").innerText = cad.parts ? cad.parts.length : "0";
    if(cad.designStrategy) {
      document.getElementById("s-rationale").innerText = cad.designStrategy.rationale || "-";
      document.getElementById("s-process").innerText = cad.designStrategy.process || "-";
    }
    if(cad.parts) {
      cad.parts.forEach(function(p) {
        var d = p.geometry.dimensions;
        var geo;
        if(p.shape === 'gear' || p.geometry.type === 'gear') geo = createGear(d);
        else if(p.shape === 'cylinder' || p.geometry.type === 'cylinder') geo = new THREE.CylinderGeometry(d.width/2, d.width/2, d.height, 32);
        else geo = new THREE.BoxGeometry(d.width||50, d.height||50, d.depth||50);
        var mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: p.color || 0xFF6B00, metalness: 0.2, roughness: 0.7 }));
        mesh.position.set(p.position[0], p.position[1] + (d.height||50)/2, p.position[2]);
        if(p.rotation) mesh.rotation.set(p.rotation[0]*Math.PI/180, p.rotation[1]*Math.PI/180, p.rotation[2]*Math.PI/180);
        group.add(mesh);
      });
    }
    var box = new THREE.Box3().setFromObject(group), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    controls.target.copy(center);
    var maxDim = Math.max(size.x, size.y, size.z), dist = maxDim * 2.5;
    camera.position.set(center.x + dist, center.y + dist, center.z + dist);
    camera.lookAt(center);
  } catch(e) { console.error("CAD Render Error:", e); }
};

window.runExport = function(type) {
  if(!group || group.children.length === 0) return alert("No model to export");
  var res, name, mime;
  if(type==='OBJ') { res = new THREE.OBJExporter().parse(group); name='model.obj'; mime='text/plain'; }
  else if(type==='STL') { res = new THREE.STLExporter().parse(group, {binary:true}); name='model.stl'; mime='application/octet-stream'; }
  var b = new Blob([res], {type:mime}), u = URL.createObjectURL(b), l = document.createElement('a');
  l.href=u; l.download=name; l.click();
};

window.addEventListener("message", function(e) { if(e.data && e.data.type === "VOXEN_RENDER") window.renderCAD(e.data.json); }, false);

var lastJson = "";
setInterval(function() {
  try {
    var codeBlocks = document.querySelectorAll('pre');
    for (var i = 0; i < codeBlocks.length; i++) {
      var text = codeBlocks[i].innerText;
      if (text && text.includes("assemblyName") && text !== lastJson) { window.renderCAD(text); lastJson = text; }
    }
    if(window.parent) {
      var pBlocks = window.parent.document.querySelectorAll('pre');
      for (var j = 0; j < pBlocks.length; j++) {
        var pText = pBlocks[j].innerText;
        if (pText && pText.includes("assemblyName") && pText !== lastJson) { window.renderCAD(pText); lastJson = pText; }
      }
    }
  } catch(e) {}
}, 1000);

function startEngine() { if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') { init(); window.top.renderCAD = window.renderCAD; window.parent.renderCAD = window.renderCAD; } else { setTimeout(startEngine, 200); } }
startEngine();
</script>
"""

def clean_json(text):
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"```json|```", "", text)
    start_idx = text.find("{")
    if start_idx == -1: return ""
    stack = 0
    for i in range(start_idx, len(text)):
        if text[i] == "{": stack += 1
        elif text[i] == "}":
            stack -= 1
            if stack == 0: return text[start_idx:i+1]
    return text[start_idx:].strip()

def generate_cad(prompt, history=None):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": f"Generate CAD JSON for: {prompt}"}]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=2048, temperature=0.1, do_sample=True, top_p=0.9, pad_token_id=tokenizer.eos_token_id)
    raw = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)
    clean = clean_json(raw)
    try:
        parsed = json.loads(clean)
        final_json = json.dumps(parsed, indent=2)
        status = f"✅ {parsed.get('assemblyName', 'Assembly')} created"
    except: final_json = "{}"; status = "❌ Generation Error"
    if history is not None:
        new_history = list(history)
        new_history.append({"role": "user", "content": prompt})
        new_history.append({"role": "assistant", "content": status})
        return new_history, "", final_json
    return final_json

with gr.Blocks(title="VOXEN CAD Agent") as demo:
    gr.Markdown("# ▲ VOXEN — AI CAD Agent")
    with gr.Row():
        with gr.Column(scale=4):
            chatbot = gr.Chatbot(height=400, label="History") 
            msg = gr.Textbox(placeholder="Design something...", label="Prompt")
            btn = gr.Button("⚙️ Generate CAD Model", variant="primary")
            json_out = gr.Code(language="json", label="Output", lines=8)
        with gr.Column(scale=9):
            gr.HTML(THREE_JS_VIEWER)
    state = gr.State([])
    
    JS_BROADCAST = """(j) => {
      const msg = { type: "VOXEN_RENDER", json: j };
      window.postMessage(msg, "*");
      if(window.parent) window.parent.postMessage(msg, "*");
      if(window.top) window.top.postMessage(msg, "*");
      const call = (win) => {
        try {
          if (win.renderCAD) win.renderCAD(j);
          for (let i = 0; i < win.frames.length; i++) call(win.frames[i]);
        } catch (e) {}
      };
      call(window.top);
    }"""

    btn.click(generate_cad, [msg, state], [state, msg, json_out]).then(lambda s: s, state, chatbot).then(None, [json_out], None, js=JS_BROADCAST)
    msg.submit(generate_cad, [msg, state], [state, msg, json_out]).then(lambda s: s, state, chatbot).then(None, [json_out], None, js=JS_BROADCAST)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=True, css=".gradio-container { background: white; } button.primary { background: #FF6B00 !important; }")
