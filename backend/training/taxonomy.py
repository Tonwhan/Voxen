import random
import itertools

CATEGORIES = [
    "furniture", "tools", "vehicles", "architecture", "containers", 
    "electronics", "toys", "weapons", "abstract", "industrial"
]

STYLES = [
    "modern", "classic", "minimalist", "ornate", "futuristic", 
    "steampunk", "industrial", "rustic", "geometric"
]

MATERIALS = [
    "wood", "metal", "plastic", "glass", "fabric", "rubber", "stone", "mixed"
]

COMPLEXITIES = [
    "simple (2-3 primitives)", 
    "medium (4-6 primitives)", 
    "complex (7-12 primitives)"
]

BASE_OBJECTS = {
    "furniture": ["chair", "table", "bookshelf", "bed frame", "cabinet", "stool"],
    "tools": ["hammer", "wrench", "screwdriver", "saw", "drill", "pliers"],
    "vehicles": ["car shape", "rocket ship", "boat hull", "train car", "bicycle frame"],
    "architecture": ["wood house", "bridge", "tower", "castle wall", "pillars"],
    "containers": ["coffee mug", "storage box", "barrel", "vase", "bucket"],
    "electronics": ["desktop monitor", "smartphone", "speaker", "camera", "laptop"],
    "toys": ["snowman", "robot", "spinning top", "building block castle"],
    "weapons": ["sword", "shield", "bow", "axe", "mace"],
    "abstract": ["monument", "sculpture", "geometric puzzle", "floating crystal"],
    "industrial": ["gear", "traffic cone", "conveyor belt segment", "pipe junction"]
}

def generate_prompts(seed=42, num_samples=5000):
    """
    Generates a deterministic list of unique combinatorial prompts.
    Returns a list of dicts with semantic metadata.
    """
    random.seed(seed)
    
    prompts = []
    
    # We want to balance across categories
    samples_per_category = num_samples // len(CATEGORIES)
    
    for category in CATEGORIES:
        objects = BASE_OBJECTS[category]
        for _ in range(samples_per_category):
            obj = random.choice(objects)
            style = random.choice(STYLES)
            material = random.choice(MATERIALS)
            complexity = random.choice(COMPLEXITIES)
            
            prompt_text = f"Create a {style} {obj} made primarily of {material}. The structure should be {complexity}."
            
            metadata = {
                "taxonomy_category": category,
                "style": style,
                "material": material,
                "complexity": complexity,
                "base_object": obj
            }
            
            prompts.append({
                "text": prompt_text,
                "metadata": metadata
            })
            
    # Shuffle to mix categories
    random.shuffle(prompts)
    return prompts

if __name__ == "__main__":
    # Test generation
    sample = generate_prompts(num_samples=10)
    for s in sample:
        print(s["text"])
