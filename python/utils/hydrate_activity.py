import sys
import os
import json
from datetime import datetime

# Adjust path to get to root
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
data_dir = os.path.join(root_dir, 'data')

GARMIN_FILE = os.path.join(data_dir, 'my_garmin_data_ALL.json')
LOG_FILE = os.path.join(data_dir, 'training_log.json')

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def normalize_sport(val):
    if isinstance(val, dict): val = val.get('typeKey', '')
    s = str(val).lower()
    if 'run' in s: return 'Run'
    if 'bik' in s or 'cycl' in s: return 'Bike'
    if 'swim' in s: return 'Swim'
    return 'Other'

def main():
    if len(sys.argv) > 1:
        target_id = sys.argv[1]
        print(f"🔧 Received Activity ID from arguments: {target_id}")
    else:
        # Fallback for local testing
        target_id = input("Enter Garmin Activity ID to hydrate: ").strip()
    
    if not target_id:
        print("❌ No ID provided.")
        return
    
    # 1. Find Activity
    garmin_data = load_json(GARMIN_FILE)
    activity = next((a for a in garmin_data if str(a.get('activityId')) == target_id), None)
    
    if not activity:
        print(f"❌ Activity {target_id} not found in {GARMIN_FILE}")
        return

    print(f"✅ Found: {activity.get('activityName')} ({activity.get('startTimeLocal')})")

    # 2. Build Record
    # Convert duration to minutes
    dur_sec = activity.get('duration', 0)
    dur_min = round(dur_sec / 60.0, 1) if dur_sec else 0

    date_str = activity.get('startTimeLocal', '')[:10]
    
    new_record = {
        "date": date_str,
        "day": datetime.strptime(date_str, '%Y-%m-%d').strftime('%A'),
        "plannedWorkout": "",
        "plannedDuration": 0,
        "notes": "Hydrated manually via script.",
        "matchStatus": "Unplanned (Manual)",
        "status": "UNPLANNED",
        "actualWorkout": activity.get('activityName'),
        "actualDuration": dur_min,
        "actualSport": normalize_sport(activity.get('activityType')),
        "id": activity.get('activityId'),
        # Add basic metrics
        "distance": activity.get('distance'),
        "averageHR": activity.get('averageHR'),
        "maxHR": activity.get('maxHR'),
        "calories": activity.get('calories'),
        "RPE": activity.get('RPE'),
        "Feeling": activity.get('Feeling')
    }

    # 3. Append to Log
    log = load_json(LOG_FILE)
    
    # Check if exists
    if any(str(r.get('id')) == target_id for r in log):
        print("⚠️ This activity is already in training_log.json.")
        choice = input("Add duplicate anyway? (y/n): ").lower()
        if choice != 'y': return

    log.append(new_record)
    
    # Re-sort
    log.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    save_json(LOG_FILE, log)
    print(f"🚀 Successfully added activity {target_id} to training_log.json")

if __name__ == "__main__":
    main()
