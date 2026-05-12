import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer
from datasets import load_dataset
import os
import inspect

# --- Configuration ---
if os.path.isdir("./models/qwen3-8b"):
    MODEL_ID = "./models/qwen3-8b"
else:
    MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"

DATASET_PATH = "dataset.jsonl"
OUTPUT_DIR = "./models/qwen3-8b-voxen"
LOGGING_DIR = "./logs"


def _build_trainer(model, tokenizer, dataset, training_args):
    """Build SFTTrainer with automatic API compatibility detection."""
    sig = inspect.signature(SFTTrainer.__init__)
    params = set(sig.parameters.keys())

    kwargs = {
        "model": model,
        "train_dataset": dataset,
        "args": training_args,
    }

    # tokenizer was renamed to processing_class in trl >= 0.12
    if "tokenizer" in params:
        kwargs["tokenizer"] = tokenizer
    elif "processing_class" in params:
        kwargs["processing_class"] = tokenizer

    # max_seq_length moved to SFTConfig in some versions
    if "max_seq_length" in params:
        kwargs["max_seq_length"] = 2048

    return SFTTrainer(**kwargs)


def finetune():
    print(f"🚀 Starting Fine-tuning for Voxen CAD Engine...")
    print(f"   Model: {MODEL_ID}")
    print(f"   Dataset: {DATASET_PATH}")
    print(f"   Output: {OUTPUT_DIR}")

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
    print(f"   Loaded {len(dataset)} training samples")

    # 4. Training Arguments (plain TrainingArguments always works)
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
        report_to="none",
        logging_dir=LOGGING_DIR,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
    )

    # 5. Build Trainer (auto-detects API version)
    trainer = _build_trainer(model, tokenizer, dataset, training_args)

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
