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

print(f"✅ Loaded on: {next(model.parameters()).device}")
print("Type 'quit' to exit\n")

messages = []

while True:
    try:
        user_input = input("You: ").strip()
    except (EOFError, KeyboardInterrupt):
        break

    if user_input.lower() in ["quit", "exit", "q"]:
        break
    if not user_input:
        continue

    messages.append({"role": "user", "content": user_input})

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = outputs[0][len(inputs["input_ids"][0]):]
    response = tokenizer.decode(new_tokens, skip_special_tokens=True)

    messages.append({"role": "assistant", "content": response})
    print(f"\nVoxen: {response}\n")
