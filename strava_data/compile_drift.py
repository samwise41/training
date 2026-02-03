import os
import json

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # This is .../strava_data
ROOT_DIR = os.path.dirname(BASE_DIR)                  # This is .../ (Repo Root)

OUTPUT_FILE = os.path.join(ROOT_DIR, 'data', 'metrics', 'drift_history.json')

# Define source folders
SOURCES = [
    os.path.join(ROOT_DIR, 'strava_data', 'power_cache'),   # Cycling
    os.path.join(ROOT_DIR, 'strava_data', 'running_cache')  # Running
]

def main():
    print("🔄 Compiling Drift History from All Sports...")
    
    drift_entries = []
    
    for cache_dir in SOURCES:
        if not os.path.exists(cache_dir):
            print(f"⚠️ Directory not found: {cache_dir}")
            continue

        print(f"📂 Scanning {cache_dir}...")
        files = [f for f in os.listdir(cache_dir) if f.endswith('.json')]
        
        for fname in files:
            try:
                with open(os.path.join(cache_dir, fname), 'r') as f:
                    data = json.load(f)
                    
                    # Grab aerobic_decoupling if it exists
                    if data.get('aerobic_decoupling') is not None:
                        drift_entries.append({
                            "date": data.get('date'),
                            "val": data.get('aerobic_decoupling'),
                            "id": data.get('id'),
                            "name": data.get('name', 'Workout')
                        })
            except:
                continue

    # Sort by date
    drift_entries.sort(key=lambda x: x['date'])
    
    # Save Combined File
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(drift_entries, f, indent=4)

    print(f"✅ Saved {len(drift_entries)} total drift records to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
