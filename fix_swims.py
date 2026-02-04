import json
import os

# --- CONFIGURATION ---
DB_PATH = 'data/master_db.json'
FIX_FILE = 'swim_fix.json'

def load_json(path):
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    print(f"💾 Saved updates to {path}")

def main():
    print("🏊 Starting Swim Distance Fixer...")

    # 1. Load Data
    master_db = load_json(DB_PATH)
    corrections = load_json(FIX_FILE)

    if master_db is None: return
    if corrections is None: return

    # 2. Build Lookup Map
    # Convert IDs to strings to ensure "123" matches 123
    fix_map = {}
    for item in corrections:
        if 'id' in item and 'distance' in item:
            fix_map[str(item['id'])] = item['distance']
    
    print(f"🔍 Loaded {len(fix_map)} corrections.")

    # 3. Apply Updates
    updated_count = 0
    
    for row in master_db:
        # Check if record has an ID
        current_id = row.get('id')
        if not current_id: continue

        # Handle Garmin IDs (sometimes lists, usually strings/ints)
        # We strip commas just in case, though swims are usually single IDs
        current_id_str = str(current_id).replace(',', '').strip()
        
        # MATCH FOUND?
        if current_id_str in fix_map:
            new_distance = fix_map[current_id_str]
            old_distance = row.get('distance', 'N/A')
            
            # Update ONLY the distance
            row['distance'] = new_distance
            
            print(f"   ✅ Fixed ID {current_id_str}: {old_distance} -> {new_distance}")
            updated_count += 1

    # 4. Save
    if updated_count > 0:
        save_json(DB_PATH, master_db)
        print(f"🚀 Success! Updated {updated_count} swim records.")
    else:
        print("⚠️ No matching IDs found in the database. Check your ID numbers.")

if __name__ == "__main__":
    main()
