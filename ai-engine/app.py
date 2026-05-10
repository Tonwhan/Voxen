from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import gradio as gr
import json
import os

MODEL_ID = "Qwen/Qwen3-8B"

SYSTEM_PROMPT = """You are Voxen AI, an expert CAD assembly generator.
Always respond with valid JSON only. No explanation, no markdown fences.

OUTPUT FORMAT:
{
  "assemblyName": "string",
  "version": "1.0",
  "parts": [
    {
      "id": "string",
      "name": "string",
      "color": "#hexcode",
      "geometry": {
        "type": "box|cylinder|sphere|cone",
        "dimensions": { "width": number, "height": number, "depth": number },
        "position": { "x": number, "y": number, "z": number }
      },
      "material": { "name": "string", "description": "string" },
      "designIntent": "string"
    }
  ],
  "metadata": {
    "generatedAt": "2026-05-10T00:00:00Z",
    "promptSummary": "string",
    "totalParts": number
  }
}
RULES: max 6 parts, no overlapping positions, all dimensions in mm"""

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)
print(f"✅ Model ready on {next(model.parameters()).device}")


def generate_cad(prompt, history):
    if not prompt.strip():
        return history, "", "{}"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history:
        messages.append({"role": "user", "content": h[0]})
        if h[1]:
            messages.append({"role": "assistant", "content": h[1]})
    messages.append({"role": "user", "content": prompt})

    text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=1024,
            temperature=0.1,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = outputs[0][len(inputs["input_ids"][0]):]
    response = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    # Clean JSON
    if "```" in response:
        response = response.split("```")[1]
        if response.startswith("json"):
            response = response[4:]
    response = response.strip()

    # Validate JSON
    try:
        data = json.loads(response)
        assembly_name = data.get("assemblyName", "Assembly")
        parts = data.get("parts", [])
        display = f"✅ {assembly_name} — {len(parts)} parts generated"
        json_out = json.dumps(data, indent=2)
    except Exception:
        display = response
        json_out = response

    history = history + [[prompt, display]]
    return history, "", json_out


with gr.Blocks(title="Voxen AI CAD Agent") as demo:
    gr.Markdown("# ▲ VOXEN — AI CAD Agent\n**Assembly-Aware CAD Generation · AMD MI300X · Qwen3-8B**")

    with gr.Row():
        with gr.Column(scale=6):
            chatbot = gr.Chatbot(height=400, label="Conversation")
            with gr.Row():
                msg = gr.Textbox(
                    placeholder="Describe a CAD assembly...",
                    show_label=False,
                    scale=5,
                )
                send = gr.Button("Generate", variant="primary", scale=1)
            clear = gr.Button("New Session")

        with gr.Column(scale=4):
            gr.Markdown("### Assembly JSON Output")
            json_out = gr.Code(language="json", label="", lines=20)

    state = gr.State([])

    send.click(generate_cad, [msg, state], [state, msg, json_out]).then(
        lambda s: s, state, chatbot
    )
    msg.submit(generate_cad, [msg, state], [state, msg, json_out]).then(
        lambda s: s, state, chatbot
    )
    clear.click(lambda: ([], [], "{}"), outputs=[chatbot, state, json_out])

demo.launch(server_name="0.0.0.0", server_port=7860, share=True)
