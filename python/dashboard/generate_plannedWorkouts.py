import json
import os
from datetime import datetime
from . import config

# Helper to ensure activity type is always a simple string for the UI
def normalize_sport_string(item):
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
    if not os.path.exists(config.MASTER_DB_JSON): return
    if not os.path.exists(config.PLANNED_JSON): return

    with open(config.MASTER_DB_JSON, 'r', encoding='utf-8') as f:
        history = json.load(f)
    
    with open(config.PLANNED_JSON, 'r', encoding='utf-8') as f:
        full_plan = json.load(f)

    # 2. Define "Today" (System Local Time matches sync_database logic)
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    dashboard_list = []

    # 3. Add History (All Past & Today's Completed items)
    # We clean up the data so the UI doesn't have to guess types
    for record in history:
        # Create a clean copy for the dashboard
        clean_record = record.copy()
        clean_record['activityType'] = normalize_sport_string(record)
        
        # Ensure ID is unique for the DOM
        if 'id' not in clean_record:
            clean_record['id'] = f"LOG-{clean_record.get('date')}-{clean_record['activityType']}"
            
        dashboard_list.append(clean_record)

    # 4. Add Future Plan (Only dates AFTER today)
    # sync_database.py handles "Today" matching, so we trust it for today's data.
    # We only grab plan items strictly in the future.
    for plan in full_plan:
        if plan['date'] > today_str:
            clean_plan = plan.copy()
            clean_plan['status'] = 'PLANNED'
            # Ensure it has a sport string
            clean_plan['activityType'] = normalize_sport_string(plan)
            # Ensure numbers are valid
            clean_plan['plannedDuration'] = float(plan.get('plannedDuration', 0) or 0)
            
            dashboard_list.append(clean_plan)

    # 5. Sort (Descending: Newest/Future at top, Oldest at bottom)
    # or Ascending depending on your UI preference. 
    # Usually Dashboards show "Today" then look forward or back.
    # Let's standardise on Descending (Future -> Past)
    dashboard_list.sort(key=lambda x: x['date'], reverse=True)

    # 6. Save
    output_path = os.path.join(config.DATA_DIR, 'dashboard_data.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dashboard_list, f, indent=4)
        
    print(f"   -> Dashboard Data Saved: {len(dashboard_list)} records")

if __name__ == "__main__":
    main()
