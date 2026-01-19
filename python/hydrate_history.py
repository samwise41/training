import json
import os
import re

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

GARMIN_JSON = os.path.join(DATA_DIR, 'my_garmin_data_ALL.json')
MASTER_DB_JSON = os.path.join(DATA_DIR, 'training_log.json')

# Fields strictly FORBIDDEN from being updated
IMMUTABLE_FIELDS = {
    'date', 'day', 'plannedWorkout', 'plannedDuration', 
    'actualWorkout', 'actualDuration', 'matchStatus', 'status', 'id'
}

def load_json(path):
    if not os.path.exists(path): return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def safe_get(d, key, default=None):
    val = d.get(key)
    return val if val is not None else default

def determine_actual_sport(record):
    """
    Derives actualSport based on [TAG] in actualWorkout (Priority) or plannedWorkout.
    """
    # Helper regex to find tags like [RUN], [BIKE], [SWIM]
    def extract_tag(text):
        if not text: return None
        upper = text.upper()
        if '[RUN]' in upper: return 'Run'
        if '[BIKE]' in upper: return 'Bike'
        if '[SWIM]' in upper: return 'Swim'
        return None

    # 1. Try Actual Workout
    sport = extract_tag(record.get('actualWorkout'))
    if sport: return sport

    # 2. Try Planned Workout
    sport = extract_tag(record.get('plannedWorkout'))
    if sport: return sport

    # 3. Fallback (Optional: derive from Garmin type if needed, but spec said strictly TAGs)
    return 'Other'

def bundle_activities(activities):
    """
    Bundles multiple Garmin activities into one composite telemetry object.
    """
    if not activities: return {}
    
    # Sort by duration desc (Primary is index 0)
    # We use this to pick text values (like trainingEffectLabel)
    activities.sort(key=lambda x: safe_get(x, 'duration', 0) or 0, reverse=True)
    primary = activities[0]
    
    combined = {}
    
    # 1. Sums
    def get_sum(key):
        return sum((safe_get(a, key, 0) or 0) for a in activities)

    combined['duration'] = get_sum('duration') # Raw seconds
    combined['distance'] = get_sum('distance')
    combined['calories'] = get_sum('calories')
    combined['elevationGain'] = get_sum('elevationGain') 

    # 2. Weighted Averages
    def calc_weighted(key):
        total_dur = combined['duration']
        if total_dur == 0: return 0
        
        weighted_sum = 0
        for a in activities:
            val = safe_get(a, key)
            dur = safe_get(a, 'duration', 0) or 0
            if val is not None:
                weighted_sum += val * dur
        
        return weighted_sum / total_dur

    combined['avgPower'] = calc_weighted('avgPower')
    combined['averageHR'] = calc_weighted('averageHR')
    combined['normPower'] = calc_weighted('normPower')
    combined['averageBikingCadenceInRevPerMinute'] = calc_weighted('averageBikingCadenceInRevPerMinute')
    combined['averageRunningCadenceInStepsPerMinute'] = calc_weighted('averageRunningCadenceInStepsPerMinute')
    combined['avgStrideLength'] = calc_weighted('avgStrideLength')
    combined['avgVerticalOscillation'] = calc_weighted('avgVerticalOscillation')
    combined['avgGroundContactTime'] = calc_weighted('avgGroundContactTime')
    combined['averageSpeed'] = calc_weighted('averageSpeed')

    # 3. Maxes
    combined['maxHR'] = max((safe_get(a, 'maxHR', 0) or 0) for a in activities)
    combined['maxPower'] = max((safe_get(a, 'maxPower', 0) or 0) for a in activities)
    combined['maxSpeed'] = max((safe_get(a, 'maxSpeed', 0) or 0) for a in activities)
    combined['vO2MaxValue'] = max((safe_get(a, 'vO2MaxValue', 0) or 0) for a in activities)

    # 4. Text/Primary Fields (Take from Longest Duration)
    combined['aerobicTrainingEffect'] = primary.get('aerobicTrainingEffect')
    combined['anaerobicTrainingEffect'] = primary.get('anaerobicTrainingEffect')
    combined['trainingEffectLabel'] = primary.get('trainingEffectLabel')
    combined['trainingStressScore'] = primary.get('trainingStressScore')
    combined['intensityFactor'] = primary.get('intensityFactor')
    combined['sportTypeId'] = primary.get('sportTypeId')
    
    # 5. RPE/Feeling (If multiple, average them or take primary? Taking Primary for simplicity)
    combined['RPE'] = primary.get('RPE')
    combined['Feeling'] = primary.get('Feeling')

    return combined

def main():
    print("💧 STARTING ONE-TIME HYDRATION...")
    
    # 1. Load Data
    master_log = load_json(MASTER_DB_JSON)
    garmin_data = load_json(GARMIN_JSON)
    
    if not master_log:
        print("❌ No training log found.")
        return

    # 2. Index Garmin Data by Activity ID for fast lookup
    print("   -> Indexing Garmin Data...")
    garmin_map = {str(g['activityId']): g for g in garmin_data}
    
    updated_count = 0
    
    # 3. Iterate and Hydrate
    for record in master_log:
        r_id = str(record.get('id', ''))
        
        # Skip if no ID or it's a "PLAN-xyz" ID
        if not r_id or not r_id.replace(',', '').isdigit():
            continue
            
        # Handle Grouped IDs (e.g., "123,456")
        ids_to_find = [x.strip() for x in r_id.split(',')]
        found_activities = []
        
        for search_id in ids_to_find:
            if search_id in garmin_map:
                found_activities.append(garmin_map[search_id])
        
        if not found_activities:
            continue
            
        # Bundle logic
        telemetry = bundle_activities(found_activities)
        
        # Apply Telemetry to Record
        for key, val in telemetry.items():
            if key not in IMMUTABLE_FIELDS:
                # Only update if value exists (not None)
                if val is not None:
                    record[key] = val
                    
        # Add actualSport
        record['actualSport'] = determine_actual_sport(record)
        
        updated_count += 1

    # 4. Save
    save_json(MASTER_DB_JSON, master_log)
    print(f"✅ Hydration Complete. Updated {updated_count} records.")
    print(f"   -> New field 'actualSport' added.")
    print(f"   -> Telemetry populated (Power, HR, TSS, etc).")
    print(f"   -> Protected fields ({', '.join(list(IMMUTABLE_FIELDS)[:3])}...) were NOT touched.")

if __name__ == "__main__":
    main()