import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import load_dataset
import os

# --- Configuration ---
if os.path.isdir("./models/qwen3-8b"):
    MODEL_ID = "./models/qwen3-8b"
else:
    MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"

DATASET_PATH = "dataset.jsonl"
OUTPUT_DIR = "./models/qwen3-8b-voxen"
LOGGING_DIR = "./logs"

def finetune():
    print(f"🚀 Starting Fine-tuning for Voxen CAD Engine...")
    
    # 1. Load Tokenizer & Model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
    )

    # 2. PEFT / LoRA Configuration
    # เราเน้นปรับจูนส่วน Attention และ MLP เพื่อให้เข้าใจโครงสร้าง JSON และมิติทางวิศวกรรม
    lora_config = LoraConfig(
        r=32,
        lora_alpha=64,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 3. Load Dataset
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    # 4. Training Arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=5,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=1e-4,
        weight_decay=0.01,
        bf16=True,
        logging_steps=1,
        save_strategy="epoch",
        report_to="none", # หรือ "wandb" ถ้าต้องการ tracking
        logging_dir=LOGGING_DIR,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
    )

    # 5. Trainer Initialization
    # SFTTrainer จะจัดการ 'messages' format ให้อัตโนมัติถ้าใช้เวอร์ชันล่าสุด
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset,
        args=training_args,
        tokenizer=tokenizer,
        max_seq_length=2048,
    )

    # 6. Train
    print("🔥 Training in progress...")
    trainer.train()

    # 7. Save Model & Tokenizer
    print(f"💾 Saving fine-tuned model to {OUTPUT_DIR}...")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("✅ Fine-tuning complete!")

if __name__ == "__main__":
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: {DATASET_PATH} not found!")
    else:
        finetune()
