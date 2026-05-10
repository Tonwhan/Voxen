from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import re
import html

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

def generate_iframe_html(json_str):
    safe_json = json_str.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
    
    raw_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/OBJExporter.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/STLExporter.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
        <style>
            body {{ margin: 0; overflow: hidden; font-family: 'Inter', sans-serif; color: #333; }}
            #container {{ display: grid; grid-template-columns: 1fr 300px; height: 100vh; background: #ffffff; }}
            #canvas-area {{ position: relative; background: #fdfdfd; border-right: 1px solid #eee; display: flex; align-items: center; justify-content: center; }}
            canvas {{ display: block; outline: none; }}
            #sidebar {{ background: #fafafa; display: flex; flex-direction: column; overflow-y: auto; font-size: 11px; }}
            .section-header {{ background: #FF6B00; padding: 12px; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }}
            .prop-row {{ display: flex; border-bottom: 1px solid #eee; }}
            .prop-label {{ width: 40%; padding: 10px 12px; color: #999; border-right: 1px solid #eee; text-transform: uppercase; font-size: 9px; font-weight: 700; }}
            .prop-value {{ width: 60%; padding: 10px 12px; color: #333; font-weight: 600; }}
            .strategy-block {{ padding: 15px; border-bottom: 1px solid #eee; }}
            .strategy-title {{ color: #FF6B00; font-size: 10px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; }}
            .strategy-text {{ color: #555; line-height: 1.6; }}
            .badge-main {{ position: absolute; top: 20px; left: 20px; background: #FF6B00; color: white; padding: 5px 12px; border-radius: 6px; font-weight: 900; z-index: 100; font-size: 12px; box-shadow: 0 4px 10px rgba(255,107,0,0.3); }}
            #model-title {{ position: absolute; top: 60px; left: 20px; color: #333; font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 2px 2px 0px rgba(255,255,255,0.8); z-index: 100; pointer-events: none; }}
            .export-bar {{ position: absolute; bottom: 20px; right: 20px; display: flex; gap: 10px; z-index: 100; }}
            .btn-exp {{ background: #222; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; transition: 0.2s; text-transform: uppercase; }}
            .btn-exp:hover {{ background: #FF6B00; transform: translateY(-2px); }}
        </style>
    </head>
    <body>
        <div id="container">
            <div id="canvas-area">
                <div class="badge-main">VOXEN AI ENGINE</div>
                <div id="model-title">READY TO GEN</div>
                <div class="export-bar">
                    <button class="btn-exp" onclick="runExport('OBJ')">OBJ</button>
                    <button class="btn-exp" onclick="runExport('STL')">STL</button>
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

        <script>
            let scene, camera, renderer, controls, group;

            function init() {{
                const container = document.getElementById("canvas-area");
                scene = new THREE.Scene();
                scene.background = new THREE.Color(0xfdfdfd);
                
                camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 100000);
                camera.position.set(2000, 1500, 2000);
                
                renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: false }});
                renderer.setSize(container.clientWidth, container.clientHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                container.appendChild(renderer.domElement);
                
                controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                
                scene.add(new THREE.AmbientLight(0xffffff, 0.8));
                const sun = new THREE.DirectionalLight(0xffffff, 0.6);
                sun.position.set(1000, 2000, 1000);
                scene.add(sun);
                
                scene.add(new THREE.GridHelper(10000, 100, 0xeeeeee, 0xdddddd));
                
                group = new THREE.Group();
                scene.add(group);
                
                function animate() {{
                    requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                }}
                animate();

                window.addEventListener('resize', () => {{
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                }});
            }}

            function createGear(params) {{
                const teeth = params.teeth || 24;
                const module = params.module || 3;
                const height = params.height || 15;
                const bore = params.bore || 20;
                
                const pr = (module * teeth) / 2;
                const or = pr + module;
                const rr = pr - 1.25 * module;
                const shape = new THREE.Shape();
                const step = (Math.PI * 2) / teeth;
                
                for(let i=0; i<teeth; i++) {{
                    const a = i * step;
                    const ha = (Math.PI / teeth) * 0.4;
                    if(i===0) shape.moveTo(rr * Math.cos(a-ha*1.2), rr * Math.sin(a-ha*1.2));
                    shape.lineTo(rr * Math.cos(a-ha*1.2), rr * Math.sin(a-ha*1.2));
                    shape.lineTo(pr * Math.cos(a-ha), pr * Math.sin(a-ha));
                    shape.lineTo(or * Math.cos(a), or * Math.sin(a));
                    shape.lineTo(pr * Math.cos(a+ha), pr * Math.sin(a+ha));
                    shape.lineTo(rr * Math.cos(a+ha*1.2), rr * Math.sin(a+ha*1.2));
                }}
                shape.closePath();
                const hole = new THREE.Path();
                hole.absarc(0,0, bore/2, 0, Math.PI*2, true);
                shape.holes.push(hole);
                
                const geo = new THREE.ExtrudeGeometry(shape, {{ depth: height, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 }});
                geo.center(); geo.rotateX(Math.PI/2);
                return geo;
            }}

            function renderCAD(cadStr) {{
                if (!cadStr || cadStr === '{{}}') return;
                try {{
                    const cad = JSON.parse(cadStr);
                    document.getElementById("model-title").innerText = cad.assemblyName || "GENERATED";
                    document.getElementById("s-project").innerText = cad.assemblyName || "-";
                    document.getElementById("s-version").innerText = cad.version || "1.0.0";
                    document.getElementById("s-parts").innerText = cad.parts ? cad.parts.length : "0";
                    
                    if(cad.designStrategy) {{
                        document.getElementById("s-rationale").innerText = cad.designStrategy.rationale || "-";
                        document.getElementById("s-process").innerText = cad.designStrategy.process || "-";
                    }}

                    if(cad.parts) {{
                        cad.parts.forEach(p => {{
                            const d = p.geometry.dimensions;
                            let geo;
                            if(p.shape === 'gear' || p.geometry.type === 'gear') geo = createGear(d);
                            else if(p.shape === 'cylinder' || p.geometry.type === 'cylinder') geo = new THREE.CylinderGeometry(d.width/2, d.width/2, d.height, 32);
                            else geo = new THREE.BoxGeometry(d.width||50, d.height||50, d.depth||50);
                            
                            const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({{ color: p.color || 0xFF6B00, metalness: 0.2, roughness: 0.7 }}));
                            mesh.position.set(p.position[0], p.position[1] + (d.height||50)/2, p.position[2]);
                            if(p.rotation) mesh.rotation.set(p.rotation[0]*Math.PI/180, p.rotation[1]*Math.PI/180, p.rotation[2]*Math.PI/180);
                            group.add(mesh);
                        }});
                        
                        const box = new THREE.Box3().setFromObject(group);
                        const center = box.getCenter(new THREE.Vector3());
                        const size = box.getSize(new THREE.Vector3());
                        controls.target.copy(center);
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const dist = maxDim * 2.5;
                        camera.position.set(center.x + dist, center.y + dist, center.z + dist);
                        camera.lookAt(center);
                    }}
                }} catch(e) {{
                    console.error("Parse/Render Error:", e);
                }}
            }}

            window.runExport = function(type) {{
                if(!group || group.children.length === 0) return alert("No model to export");
                let res, name, mime;
                if(type === 'OBJ') {{
                    res = new THREE.OBJExporter().parse(group);
                    name = 'model.obj'; mime = 'text/plain';
                }} else if(type === 'STL') {{
                    res = new THREE.STLExporter().parse(group, {{binary:true}});
                    name = 'model.stl'; mime = 'application/octet-stream';
                }}
                const b = new Blob([res], {{type: mime}});
                const u = URL.createObjectURL(b);
                const l = document.createElement('a');
                l.href = u; l.download = name; l.click();
            }};

            // Wait for DOM
            window.onload = function() {{
                init();
                const json_data = `{safe_json}`;
                if (json_data !== '{{}}') {{
                    renderCAD(json_data);
                }}
            }};
        </script>
    </body>
    </html>
    """
    
    escaped_html = html.escape(raw_html)
    return f'<iframe srcdoc="{escaped_html}" style="width: 100%; height: 650px; border: 3px solid #FF6B00; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); box-sizing: border-box; display: block;"></iframe>'

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
    except Exception as e:
        final_json = "{}"
        status = "❌ Generation Error"

    # Generate new iframe html containing the json
    new_html = generate_iframe_html(final_json)

    if history is not None:
        new_history = list(history)
        new_history.append({"role": "user", "content": prompt})
        new_history.append({"role": "assistant", "content": status})
        return new_history, "", final_json, new_html
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
            # Initial blank viewer
            viewer_html = gr.HTML(generate_iframe_html("{}"))
            
    state = gr.State([])
    
    # Notice we now output to viewer_html directly from the python function
    btn.click(generate_cad, [msg, state], [state, msg, json_out, viewer_html])
    msg.submit(generate_cad, [msg, state], [state, msg, json_out, viewer_html])

    # API
    from fastapi import Request
    from fastapi.middleware.cors import CORSMiddleware
    app = demo.app
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
    @app.post("/generate")
    async def api_gen(request: Request):
        data = await request.json()
        result_json = generate_cad(data.get("prompt", ""))[2] if isinstance(generate_cad(data.get("prompt", "")), tuple) else generate_cad(data.get("prompt", ""))
        return json.loads(result_json)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=True, css=".gradio-container { background: white; } button.primary { background: #FF6B00 !important; border: none !important; color: white !important; }")
