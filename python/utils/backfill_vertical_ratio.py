import json
import os
import sys

# --- CONFIGURATION ---
# Adjust these paths based on your file structure
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # python/
ROOT_DIR = os.path.dirname(BASE_DIR)                                     # Project Root

LOG_FILE = os.path.join(ROOT_DIR, 'data', 'training_log.json')
GARMIN_FILE = os.path.join(ROOT_DIR, 'data', 'garmin_activities.json')

def load_json(path):
    if not os.path.exists(path): return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def main():
    print("💧 Starting Data Hydration: Vertical Ratio...")

    # 1. Load Data
    log_data = load_json(LOG_FILE)
    garmin_data = load_json(GARMIN_FILE)

    if not log_data or not garmin_data:
        print("❌ Error: Could not load data files.")
        return

    # 2. Create a Map for Fast Lookup (Garmin Activity ID -> Activity Object)
    garmin_map = {}
    for g in garmin_data:
        gid = str(g.get('activityId'))
        if gid:
            garmin_map[gid] = g

    # 3. Iterate and Update
    updated_count = 0
    
    for entry in log_data:
        # Get the ID(s) from the log entry
        log_id = str(entry.get('id', ''))
        
        # Handle comma-separated IDs (bundled activities)
        ids = [x.strip() for x in log_id.split(',')] if ',' in log_id else [log_id]
        
        found_val = None
        
        # Look for the data in the source Garmin file
        for single_id in ids:
            if single_id in garmin_map:
                g_activity = garmin_map[single_id]
                # Grab the target field
                v_ratio = g_activity.get('avgVerticalRatio')
                
                if v_ratio is not None:
                    found_val = v_ratio
                    break # Stop if we found it
        
        # Update the log entry if we found new data
        if found_val is not None:
            # Only update if it's missing or different (optional check)
            if 'avgVerticalRatio' not in entry or entry['avgVerticalRatio'] != found_val:
                entry['avgVerticalRatio'] = found_val
                updated_count += 1

    # 4. Save
    if updated_count > 0:
        save_json(LOG_FILE, log_data)
        print(f"✅ Hydration Complete! Updated {updated_count} records with avgVerticalRatio.")
    else:
        print("✅ Analysis Complete. No records needed updating (field might already exist).")

if __name__ == "__main__":
    main()
