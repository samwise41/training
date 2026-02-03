import os
import json

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
ROOT_DIR = os.path.dirname(BASE_DIR)

OUTPUT_FILE = os.path.join(ROOT_DIR, 'data', 'metrics', 'drift_history.json')

# Map Folders to Sports
SOURCES = [
    (os.path.join(ROOT_DIR, 'strava_data', 'power_cache'), "Bike"),
    (os.path.join(ROOT_DIR, 'strava_data', 'running_cache'), "Run")
]

def main():
    print("🔄 Compiling Drift History (Sport Aware)...")
    
    drift_entries = []
    
    for path, sport_type in SOURCES:
        if not os.path.exists(path):
            print(f"⚠️ Directory not found: {path}")
            continue

        print(f"📂 Scanning {sport_type} folder...")
        files = [f for f in os.listdir(path) if f.endswith('.json')]
        
        for fname in files:
            try:
                with open(os.path.join(path, fname), 'r') as f:
                    data = json.load(f)
                    
                    if data.get('aerobic_decoupling') is not None:
                        drift_entries.append({
                            "date": data.get('date'),
                            "val": data.get('aerobic_decoupling'),
                            "id": data.get('id'),
                            "sport": sport_type,  # <--- CRITICAL NEW FIELD
                            "name": data.get('name', 'Workout')
                        })
            except:
                continue

    # Sort by date
    drift_entries.sort(key=lambda x: x['date'])
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(drift_entries, f, indent=4)

    print(f"✅ Saved {len(drift_entries)} drift records to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
