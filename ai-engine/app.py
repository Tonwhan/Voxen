from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import re

MODEL_PATH = "./models/qwen3-8b"

SYSTEM_PROMPT = """You are a CAD JSON generator. Output ONLY valid JSON. No thinking, no explanation.

Example output:
{"assemblyName":"Table","parts":[{"id":"top","name":"Table Top","color":"#8B4513","geometry":{"type":"box","dimensions":{"width":120,"height":5,"depth":60},"position":{"x":0,"y":40,"z":0}}},{"id":"leg1","name":"Leg 1","color":"#8B4513","geometry":{"type":"box","dimensions":{"width":5,"height":40,"depth":5},"position":{"x":55,"y":0,"z":25}}}]}"""

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
<div id="canvas-container" style="width:100%;height:600px;background:#111;border-radius:8px;overflow:hidden;border:1px solid #333;"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script>
let scene,camera,renderer,controls,group;
function init3D(){
  const c=document.getElementById("canvas-container");
  if(!c||scene)return;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(45,c.clientWidth/600,0.1,10000);
  camera.position.set(300,250,300);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(c.clientWidth,600);
  renderer.setClearColor(0x111111);
  c.appendChild(renderer.domElement);
  controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  scene.add(new THREE.AmbientLight(0xffffff,1.5));
  const d=new THREE.DirectionalLight(0xffffff,2);
  d.position.set(300,400,500);scene.add(d);
  scene.add(new THREE.GridHelper(1000,50,0x444444,0x222222));
  group=new THREE.Group();scene.add(group);
  animate();
}
function animate(){
  requestAnimationFrame(animate);
  if(controls)controls.update();
  if(renderer)renderer.render(scene,camera);
}
window.renderCAD=function(data){
  if(!scene)init3D();
  while(group.children.length>0){
    const o=group.children[0];
    if(o.geometry)o.geometry.dispose();
    if(o.material)o.material.dispose();
    group.remove(o);
  }
  try{
    const cad=JSON.parse(data);
    cad.parts.forEach(p=>{
      const d=p.geometry.dimensions;
      const pos=p.geometry.position;
      let geo;
      if(p.geometry.type==="cylinder"){
        const r=(d.width||d.depth||50)/2;
        geo=new THREE.CylinderGeometry(r,r,d.height||50,32);
      }else{
        geo=new THREE.BoxGeometry(d.width||50,d.height||50,d.depth||50);
      }
      const mat=new THREE.MeshStandardMaterial({color:p.color||"#888",metalness:0.3,roughness:0.5});
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(pos.x||0,(pos.y||0)+(d.height||50)/2,pos.z||0);
      group.add(mesh);
    });
    const box=new THREE.Box3().setFromObject(group);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    controls.target.copy(center);
    const maxD=Math.max(size.x,size.y,size.z);
    camera.position.set(center.x+maxD*2,center.y+maxD*1.5,center.z+maxD*2);
    camera.lookAt(center);
  }catch(e){console.error("Render error:",e);}
};
setTimeout(init3D,500);
</script>
"""

def clean_json(text):
    # ลบ <think>...</think> ทั้งหมด
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    # ลบ markdown
    text = re.sub(r"```json|```", "", text)
    # หา JSON block
    match = re.search(r'\{.*\}', text, re.DOTALL)
    return match.group(0).strip() if match else ""

def generate_cad(prompt, history):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Generate CAD JSON for: {prompt}. Output JSON only, start with {{"}
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        # ปิด thinking mode
        enable_thinking=False,
    )

    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=1500,
            temperature=0.01,
            do_sample=False,          # greedy — แน่นอนที่สุด
            repetition_penalty=1.05,
            pad_token_id=tokenizer.eos_token_id,
        )

    raw = tokenizer.decode(
        outputs[0][len(inputs["input_ids"][0]):],
        skip_special_tokens=True
    )
    print("RAW OUTPUT:\n", raw[:800])

    clean = clean_json(raw)
    print("CLEAN JSON:\n", clean[:400])

    try:
        parsed = json.loads(clean)
        name = parsed.get("assemblyName", "Assembly")
        count = len(parsed.get("parts", []))
        status = f"✅ {name} — {count} parts"
        final_json = json.dumps(parsed, indent=2)
    except Exception as e:
        print("PARSE ERROR:", e)
        # Fallback: ลอง parse เฉพาะส่วนแรก
        try:
            # หา JSON ที่ถูกตัดกลางคัน แล้วปิด
            partial = clean.rsplit("}", 1)[0] + "}}"
            parsed = json.loads(partial)
            final_json = json.dumps(parsed, indent=2)
            status = f"⚠️ Partial: {parsed.get('assemblyName','Assembly')}"
        except Exception:
            status = f"❌ Error: {str(e)[:100]}\nRaw: {raw[:150]}"
            final_json = "{}"

    new_history = list(history) + [
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": status},
    ]
    return new_history, "", final_json


with gr.Blocks(title="VOXEN CAD Agent") as demo:
    gr.Markdown("# ▲ VOXEN — AI CAD Agent\n**Qwen3-8B · AMD MI300X**")

    with gr.Row():
        with gr.Column(scale=1):
            chatbot = gr.Chatbot(height=350, label="Chat")
            msg = gr.Textbox(
                placeholder="e.g. coffee table with 4 legs",
                label="Prompt",
                lines=2,
            )
            btn = gr.Button("⚙️ Generate CAD", variant="primary")
            clear = gr.Button("🗑 Clear")
            json_out = gr.Code(language="json", label="Assembly JSON", lines=12)

        with gr.Column(scale=1):
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
