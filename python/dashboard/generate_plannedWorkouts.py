import json
import os
import sys
from datetime import datetime

# --- PATH SETUP (Fixes the Import Error) ---
# 1. Get the current directory (python/dashboard)
current_dir = os.path.dirname(os.path.abspath(__file__))
# 2. Get the python/ directory (parent of dashboard)
python_dir = os.path.dirname(current_dir)
# 3. Add to system path so we can import sync_modules
sys.path.append(python_dir)

# Now we can import from the sibling folder
from sync_modules import config

# --- HELPER FUNCTIONS ---
def normalize_sport_string(item):
    """Ensures activityType is always a simple string for the UI."""
    # If it's a dictionary (Garmin format), extract the key
    val = item.get('activityType')
    if isinstance(val, dict):
        val = val.get('typeKey', 'other')
    
    # If it's a string, normalize it
    s = str(val).lower()
    if 'run' in s: return 'Run'
    if 'bik' in s or 'cycl' in s or 'ride' in s: return 'Bike'
    if 'swim' in s: return 'Swim'
    if 'strength' in s or 'weight' in s: return 'Strength'
    return 'Other'

def main():
    print("   -> Generating Dashboard Data...")

    # 1. Load Files
    if not os.path.exists(config.MASTER_DB_JSON): 
        print(f"Error: Could not find {config.MASTER_DB_JSON}")
        return
    if not os.path.exists(config.PLANNED_JSON): 
        print(f"Error: Could not find {config.PLANNED_JSON}")
        return

    with open(config.MASTER_DB_JSON, 'r', encoding='utf-8') as f:
        history = json.load(f)
    
    with open(config.PLANNED_JSON, 'r', encoding='utf-8') as f:
        full_plan = json.load(f)

    # 2. Define "Today" (System Local Time matches sync_database logic)
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    dashboard_list = []

    # 3. Add History (All Past & Today's Completed items)
    for record in history:
        # Create a clean copy for the dashboard
        clean_record = record.copy()
        clean_record['activityType'] = normalize_sport_string(record)
        
        # Ensure ID is unique for the DOM
        if 'id' not in clean_record:
            clean_record['id'] = f"LOG-{clean_record.get('date')}-{clean_record['activityType']}"
            
        dashboard_list.append(clean_record)

    # 4. Add Future Plan (Only dates AFTER today)
    # We filter out today's plan because sync_database.py already matched it 
    # if it happened, or marked it as missed/planned in the history file.
    for plan in full_plan:
        if plan['date'] > today_str:
            clean_plan = plan.copy()
            clean_plan['status'] = 'PLANNED'
            # Ensure it has a sport string
            clean_plan['activityType'] = normalize_sport_string(plan)
            # Ensure numbers are valid
            clean_plan['plannedDuration'] = float(plan.get('plannedDuration', 0) or 0)
            
            dashboard_list.append(clean_plan)

    # 5. Sort (Descending: Future -> Past)
    dashboard_list.sort(key=lambda x: x['date'], reverse=True)

    # 6. Save to Data Directory
    output_path = os.path.join(config.DATA_DIR, 'plannedWorkouts.json')
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(dashboard_list, f, indent=4)
        print(f"   -> Dashboard Data Saved to: {output_path}")
        print(f"   -> Total records: {len(dashboard_list)}")
    except Exception as e:
        print(f"   -> Error saving file: {e}")

if __name__ == "__main__":
    main()
