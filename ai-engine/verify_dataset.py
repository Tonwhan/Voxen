import json
import os

def verify_dataset(file_path):
    print(f"🧐 Verifying {file_path}...")
    if not os.path.exists(file_path):
        print("❌ File not found!")
        return

    count = 0
    errors = 0
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            try:
                data = json.loads(line)
                messages = data.get("messages", [])
                if not messages:
                    print(f"❌ Line {i+1}: Missing messages")
                    errors += 1
                    continue
                
                # Check format
                assistant_msg = messages[-1]["content"]
                parsed_json = json.loads(assistant_msg)
                
                required_fields = ["assemblyName", "parts", "dimensions", "designStrategy"]
                for field in required_fields:
                    if field not in parsed_json:
                        print(f"⚠️ Line {i+1}: Missing field '{field}' in JSON")
                
                count += 1
            except json.JSONDecodeError as e:
                print(f"❌ Line {i+1}: Invalid JSON - {e}")
                errors += 1

    print(f"\n✅ Verification complete: {count} samples found, {errors} errors.")

if __name__ == "__main__":
    verify_dataset("dataset.jsonl")
