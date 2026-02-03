import json
import os

# --- HARDCODED PATHS ---
# Assumes you run this from the repo root (e.g., python python/utils/backfill_vertical_ratio.py)
LOG_FILE = r'C:\Users\samwi\Documents\training\data\training_log.json'
GARMIN_FILE = r'C:\Users\samwi\Documents\training\data\my_garmin_data_ALL.json'

def main():
    print(f"Loading {LOG_FILE} and {GARMIN_FILE}...")

    # 1. Load Data
    try:
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            log_data = json.load(f)
        with open(GARMIN_FILE, 'r', encoding='utf-8') as f:
            garmin_data = json.load(f)
    except FileNotFoundError as e:
        print(f"❌ Error: Could not find file. Make sure you are running from the repo root.\nDetailed error: {e}")
        return

    # 2. Map Garmin Data (ID -> Vertical Ratio)
    # We create a simple dictionary for instant lookup
    garmin_map = {}
    for g in garmin_data:
        if 'activityId' in g:
            garmin_map[str(g['activityId'])] = g.get('avgVerticalRatio')

    # 3. Update Log
    updated_count = 0
    print(f"Scanning {len(log_data)} logs against {len(garmin_map)} garmin records...")

    for entry in log_data:
        # Get ID from log (handle strings/ints)
        log_id = str(entry.get('id', ''))
        
        # Handle comma-separated IDs if you have bundled activities
        ids = [x.strip() for x in log_id.split(',')] if ',' in log_id else [log_id]
        
        for check_id in ids:
            if check_id in garmin_map:
                val = garmin_map[check_id]
                
                # Update if value exists and is different/missing
                if val is not None:
                    if 'avgVerticalRatio' not in entry or entry['avgVerticalRatio'] != val:
                        entry['avgVerticalRatio'] = val
                        updated_count += 1
                    break # Found a match, stop checking other IDs in this bundle

    # 4. Save
    if updated_count > 0:
        with open(LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=4)
        print(f"✅ Success! Updated {updated_count} records.")
    else:
        print("✅ No updates needed.")

if __name__ == "__main__":
    main()