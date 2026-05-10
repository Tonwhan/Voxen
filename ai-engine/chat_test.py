from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

MODEL_PATH = "./models/qwen3-8b"

print("Loading Qwen3-8B on AMD MI300X...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_PATH,
    trust_remote_code=True,
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)

SYSTEM_PROMPT = """You are a CAD JSON generator. Output ONLY valid JSON. No thinking, no explanation.

Expected JSON structure:
{
  "assemblyName": "Name of project",
  "parts": [...],
  "dimensions": [{"label": "...", "value": "..."}],
  "designStrategy": {"rationale": "...", "process": "...", "notes": "..."}
}"""

print(f"✅ Loaded on: {next(model.parameters()).device}")
print("Type 'quit' to exit\n")

while True:
    try:
        user_input = input("You (Prompt for CAD): ").strip()
    except (EOFError, KeyboardInterrupt):
        break

    if user_input.lower() in ["quit", "exit", "q"]:
        break
    if not user_input:
        continue

    # สร้าง messages ใหม่ทุกครั้งสำหรับการทดสอบ CAD (หรือทำเป็น Chat history ก็ได้)
    current_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Generate CAD JSON for: {user_input}"}
    ]

    text = tokenizer.apply_chat_template(
        current_messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=1024,
            temperature=0.1,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = outputs[0][len(inputs["input_ids"][0]):]
    response = tokenizer.decode(new_tokens, skip_special_tokens=True)

    print(f"\n--- VOXEN CAD ENGINE OUTPUT ---\n{response}\n-------------------------------\n")
