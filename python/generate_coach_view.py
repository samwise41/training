import json
import os

# --- PATH CONFIGURATION (Must match js/utils/data.js locations) ---
# We use 'os.path.join' to be safe across Windows/Mac/Linux
BASE_DIR = 'data'
INPUT_LOG = os.path.join(BASE_DIR, 'training_log.json')
INPUT_CONFIG = os.path.join(BASE_DIR, 'metrics_config.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'coaching_view.json')

# ... (Rest of the calculation logic remains the same as previous response) ...

def load_json(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {filepath}. Make sure you run this from the project root.")
        return {}

# ... (Insert calculate_metrics and grade_metric functions here) ...

def process_data():
    print(f"Reading rules from: {INPUT_CONFIG}")
    print(f"Reading log from:   {INPUT_LOG}")
    
    raw_data = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not raw_data or not config:
        return

    processed_log = []

    # ... (Processing loop from previous response) ...
    # (Let me know if you need the full processing loop pasted again)

    # Save to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(processed_log, f, indent=2)
    
    print(f"Success! Saved coaching view to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
