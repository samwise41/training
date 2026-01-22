import sys
import os
import json
from datetime import datetime

# --- PATH SETUP ---
# Adjust path to get to root from python/utils/
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
data_dir = os.path.join(root_dir, 'data')

GARMIN_FILE = os.path.join(data_dir, 'my_garmin_data_ALL.json')
LOG_FILE = os.path.join(data_dir, 'training_log.json')

def load_json(path):
    if not os.path.exists(path): return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def safe_get(d, key, default=None):
    """Safely gets a value from a dict."""
    val = d.get(key)
    return val if val is not None else default

def normalize_sport(val, sport_type_id=None):
    """
    Returns 'Run', 'Bike', or 'Swim' based on input.
    Matches logic in sync_database.py
    """
    # 1. Trust SportTypeId if present (Integer)
    if sport_type_id is not None:
        try:
            sid = int(sport_type_id)
            if sid == 1: return 'Run'
            if sid == 2: return 'Bike'
            if sid == 5: return 'Swim'
            if sid == 255: return 'Swim' 
        except: pass

    # 2. Check value type
    if isinstance(val, dict):
        type_key = val.get('typeKey', '').lower()
        if 'run' in type_key: return 'Run'
        if 'cycl' in type_key or 'bik' in type_key or 'ride' in type_key: return 'Bike'
        if 'swim' in type_key: return 'Swim'
        return 'Other'
    
    if isinstance(val, str):
        s = val.lower()
        if 'run' in s: return 'Run'
        if 'bik' in s or 'cycl' in s: return 'Bike'
        if 'swim' in s: return 'Swim'
        return val 

    return 'Other'

def main():
    # 1. Get ID from Args or Input
    if len(sys.argv) > 1:
        target_id = sys.argv[1]
        print(f"🔧 Received Activity ID from arguments: {target_id}")
    else:
        target_id = input("Enter Garmin Activity ID to hydrate: ").strip()
    
    if not target_id:
        print("❌ No ID provided.")
        return

    # 2. Find Activity
    garmin_data = load_json(GARMIN_FILE)
    activity = next((a for a in garmin_data if str(a.get('activityId')) == target_id), None)
    
    if not activity:
        print(f"❌ Activity {target_id} not found in {GARMIN_FILE}")
        return

    print(f"✅ Found: {activity.get('activityName')} ({activity.get('startTimeLocal')})")

    # 3. Build Full Record (Matching sync_database.py telemetry)
    
    # Calculate Date/Day
    date_str = activity.get('startTimeLocal', '')[:10]
    try:
        day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
    except:
        day_name = ""

    # Calculate Duration in Minutes
    dur_sec = safe_get(activity, 'duration', 0) or 0
    act_dur_min = round(dur_sec / 60.0, 1)

    # Calculate Sport
    sport = normalize_sport(activity.get('activityType'), activity.get('sportTypeId'))

    new_record = {
        # --- Metadata ---
        "date": date_str,
        "day": day_name,
        "plannedWorkout": "",
        "plannedDuration": 0,
        "notes": "Hydrated manually via script.",
        "matchStatus": "Unplanned (Manual)",
        "status": "UNPLANNED",
        
        # --- Core Metrics ---
        "actualWorkout": activity.get('activityName'),
        "actualDuration": act_dur_min,
        "actualSport": sport,
        "id": activity.get('activityId'),
        
        # --- Full Telemetry (Copied from sync_database.py) ---
        "activityType": activity.get('activityType'), 
        "sportTypeId": activity.get('sportTypeId'),
        "duration": activity.get('duration'),
        "distance": activity.get('distance'),
        "averageHR": activity.get('averageHR'),
        "maxHR": activity.get('maxHR'),
        "aerobicTrainingEffect": activity.get('aerobicTrainingEffect'),
        "anaerobicTrainingEffect": activity.get('anaerobicTrainingEffect'),
        "trainingEffectLabel": activity.get('trainingEffectLabel'),
        "avgPower": activity.get('avgPower'),
        "maxPower": activity.get('maxPower'),
        "normPower": activity.get('normPower'),
        "trainingStressScore": activity.get('trainingStressScore'),
        "intensityFactor": activity.get('intensityFactor'),
        "averageSpeed": activity.get('averageSpeed'),
        "maxSpeed": activity.get('maxSpeed'),
        "averageBikingCadenceInRevPerMinute": activity.get('averageBikingCadenceInRevPerMinute'),
        "averageRunningCadenceInStepsPerMinute": activity.get('averageRunningCadenceInStepsPerMinute'),
        "avgStrideLength": activity.get('avgStrideLength'),
        "avgVerticalOscillation": activity.get('avgVerticalOscillation'),
        "avgGroundContactTime": activity.get('avgGroundContactTime'),
        "vO2MaxValue": activity.get('vO2MaxValue'),
        "calories": activity.get('calories'),
        "elevationGain": activity.get('elevationGain'),
        "RPE": activity.get('RPE'),
        "Feeling": activity.get('Feeling')
    }

    # 4. Append to Log
    log = load_json(LOG_FILE)
    
    # Check if exists (warn but allow overwrite/append)
    existing_index = next((i for i, r in enumerate(log) if str(r.get('id')) == target_id), -1)
    
    if existing_index != -1:
        print("⚠️ This activity is already in training_log.json. Updating existing record.")
        log[existing_index] = new_record
    else:
        log.append(new_record)
    
    # Re-sort
    log.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    save_json(LOG_FILE, log)
    print(f"🚀 Successfully saved activity {target_id} to training_log.json")

if __name__ == "__main__":
    main()
