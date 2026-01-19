import json
import os
import pandas as pd
from datetime import datetime
from . import config, build_plan

def load_json(path):
    if not os.path.exists(path): return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def safe_get(d, key, default=None):
    """Safely gets a value from a dict."""
    val = d.get(key)
    return val if val is not None else default

def detect_garmin_sport(g_item):
    """Maps Garmin attributes to Plan 'activityType' (Run/Bike/Swim) for Key matching."""
    sid = g_item.get('sportTypeId')
    type_key = g_item.get('activityType', {}).get('typeKey', '').lower()
    
    if sid == 1 or 'running' in type_key: return 'Run'
    if sid == 2 or 'cycling' in type_key or 'virtual_ride' in type_key: return 'Bike'
    if sid == 5 or 'swimming' in type_key: return 'Swim'
    return 'Other'

def bundle_activities(activities):
    """
    Bundles multiple activities.
    Logic: Sums duration/distance/calories. 
    Calculates weighted averages for Power/HR. 
    Matches based on the longest duration activity (Primary).
    """
    if not activities: return None
    
    # Sort by duration desc (Primary is index 0)
    activities.sort(key=lambda x: safe_get(x, 'duration', 0) or 0, reverse=True)
    primary = activities[0]
    
    combined = primary.copy() # Start with Primary for text fields/activityType
    
    # 1. Update ID (Concatenate)
    # Filter out None IDs just in case
    ids = [str(a.get('activityId')) for a in activities if a.get('activityId')]
    combined['activityId'] = ",".join(ids)
    
    # 2. Sums
    def get_sum(key):
        return sum((safe_get(a, key, 0) or 0) for a in activities)

    combined['duration'] = get_sum('duration')
    combined['distance'] = get_sum('distance')
    combined['calories'] = get_sum('calories')
    # Elevation gain isn't explicitly in "Sums" list but logic implies standard sums. 
    # Spec said: "Sums duration/distance/calories." I will stick to spec strictly, 
    # but usually elevation sums too. I'll add elevation to be safe as it's standard physics.
    combined['elevationGain'] = get_sum('elevationGain') 

    # 3. Weighted Averages (Power/HR)
    def calc_weighted(key):
        total_dur = combined['duration']
        if total_dur == 0: return 0
        
        weighted_sum = 0
        valid_dur = 0
        
        for a in activities:
            val = safe_get(a, key)
            dur = safe_get(a, 'duration', 0) or 0
            if val is not None:
                weighted_sum += val * dur
                valid_dur += dur
        
        return weighted_sum / total_dur if total_dur > 0 else 0

    combined['avgPower'] = calc_weighted('avgPower')
    combined['averageHR'] = calc_weighted('averageHR')
    combined['normPower'] = calc_weighted('normPower')
    
    # Spec said "Weighted averages for Power/HR". 
    # Usually we want Cadence too, but I will stick to the text strictly.
    # However, copying Primary for others is safer if not averaged.
    
    # 4. Maxes (Logic implies max of max, or take primary? Spec silent, defaulting to Primary logic or max)
    # Usually MaxHR is max of all.
    combined['maxHR'] = max((safe_get(a, 'maxHR', 0) or 0) for a in activities)
    combined['maxPower'] = max((safe_get(a, 'maxPower', 0) or 0) for a in activities)
    combined['maxSpeed'] = max((safe_get(a, 'maxSpeed', 0) or 0) for a in activities)

    return combined

def main():
    # 1. Refresh Plan
    build_plan.main()
    
    planned_data = load_json(config.PLANNED_JSON)
    garmin_data = load_json(config.GARMIN_JSON)
    master_log = load_json(config.MASTER_DB_JSON)
    
    # Key: "YYYY-MM-DD|Sport" (e.g., 2026-01-19|Bike)
    # We rebuild the map from the Master DB to preserve history
    log_map = {f"{x['date']}|{x.get('temp_sport', x.get('activityType'))}": x for x in master_log}
    
    # Helper to determine the "Sport" key from a DB record for mapping purposes
    # (Since we might overwrite 'activityType' with an object, we need a stable key)
    # We will trust the plan's simple string (Run/Bike) for the key.
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # --- PHASE 1: INGEST PLAN ---
    for plan in planned_data:
        # Plan 'activityType' is 'Run', 'Bike', 'Swim'
        key = f"{plan['date']}|{plan['activityType']}"
        
        entry = log_map.get(key, {})
        
        # Update Planned Fields
        entry.update({
            'date': plan['date'],
            'day': plan['day'],
            'activityType': plan['activityType'], # Initialize with simple string
            'temp_sport': plan['activityType'],   # Keep a stable sport key for matching
            'plannedWorkout': plan['plannedWorkout'],
            'plannedDuration': plan['plannedDuration'],
            'notes': plan['notes'],
            # Ensure Actuals are initialized if new
            'actualDuration': entry.get('actualDuration', 0),
            'id': entry.get('id', plan['id']) # Keep existing ID or use Plan ID
        })
        log_map[key] = entry

    # --- PHASE 2: MATCH ACTUALS ---
    # Group Garmin Data
    garmin_grouped = {}
    for g in garmin_data:
        g_date = g.get('startTimeLocal', '')[:10]
        g_sport = detect_garmin_sport(g) # 'Run', 'Bike', 'Other'
        if g_sport == 'Other': continue
        
        k = f"{g_date}|{g_sport}"
        if k not in garmin_grouped: garmin_grouped[k] = []
        garmin_grouped[k].append(g)
        
    for key, g_activities in garmin_grouped.items():
        # Bundle
        if len(g_activities) > 1:
            composite = bundle_activities(g_activities)
            is_group = True
        else:
            composite = g_activities[0]
            is_group = False
            
        # Hydration
        # "actualWorkout" - Garmin field activityName
        # "actualDuration" - garmin field duration converted to minutes
        # "id" - garmin field activityId (concatenated if group)
        
        try:
            dur_sec = safe_get(composite, 'duration', 0) or 0
            act_dur_min = dur_sec / 60.0
        except:
            act_dur_min = 0

        # Construct specific telemetry payload
        telemetry = {
            "actualWorkout": composite.get('activityName'),
            "actualDuration": round(act_dur_min, 1),
            "id": composite.get('activityId'), # Concatenated string from bundle or int
            "activityType": composite.get('activityType'), # Full Object
            
            # Exact Match Fields
            "sportTypeId": composite.get('sportTypeId'),
            "duration": composite.get('duration'),
            "distance": composite.get('distance'),
            "averageHR": composite.get('averageHR'),
            "maxHR": composite.get('maxHR'),
            "aerobicTrainingEffect": composite.get('aerobicTrainingEffect'),
            "anaerobicTrainingEffect": composite.get('anaerobicTrainingEffect'),
            "trainingEffectLabel": composite.get('trainingEffectLabel'),
            "avgPower": composite.get('avgPower'),
            "maxPower": composite.get('maxPower'),
            "normPower": composite.get('normPower'),
            "trainingStressScore": composite.get('trainingStressScore'),
            "intensityFactor": composite.get('intensityFactor'),
            "averageSpeed": composite.get('averageSpeed'),
            "maxSpeed": composite.get('maxSpeed'),
            "averageBikingCadenceInRevPerMinute": composite.get('averageBikingCadenceInRevPerMinute'),
            "averageRunningCadenceInStepsPerMinute": composite.get('averageRunningCadenceInStepsPerMinute'),
            "avgStrideLength": composite.get('avgStrideLength'),
            "avgVerticalOscillation": composite.get('avgVerticalOscillation'),
            "avgGroundContactTime": composite.get('avgGroundContactTime'),
            "vO2MaxValue": composite.get('vO2MaxValue'),
            "calories": composite.get('calories'),
            "elevationGain": composite.get('elevationGain'),
            "RPE": composite.get('RPE'),
            "Feeling": composite.get('Feeling')
        }

        # Match Logic
        if key in log_map:
            # LINKED
            log_map[key].update(telemetry)
            log_map[key]['matchStatus'] = "Linked Group" if is_group else "Linked"
        else:
            # UNPLANNED (Phase 3)
            # Create new record
            g_date, g_sport = key.split('|')
            try:
                day_name = pd.to_datetime(g_date).day_name()
            except:
                day_name = ""

            new_row = {
                "date": g_date,
                "temp_sport": g_sport, # Helper
                "day": day_name,
                "plannedWorkout": "",
                "plannedDuration": 0,
                "notes": "",
                "matchStatus": "Unplanned Group" if is_group else "Unplanned"
            }
            new_row.update(telemetry)
            log_map[key] = new_row

    # --- PHASE 4: STATUS LOGIC & CLEANUP ---
    final_list = []
    
    for key, row in log_map.items():
        # Clean up temp helper
        if 'temp_sport' in row: del row['temp_sport']
        
        # Calculate Match Status for Missed/Planned
        # (If Garmin loop didn't touch it, matchStatus might be missing or empty)
        match_stat = row.get('matchStatus', '')
        p_dur = safe_get(row, 'plannedDuration', 0)
        
        # Ensure p_dur is float
        try: p_dur = float(p_dur)
        except: p_dur = 0
        
        # Is there actual data?
        has_actual = False
        if row.get('id') and str(row.get('id')).replace(',','').isdigit(): 
            # Check if ID looks like a Garmin ID (digits), not "PLAN-..."
            has_actual = True
        
        # If not linked/unplanned, determine if Missed or Planned
        if not match_stat:
            if p_dur > 0 and not has_actual:
                if row['date'] < today_str:
                    row['matchStatus'] = "Missed"
                else:
                    row['matchStatus'] = "Planned"
        
        # Business Rule: STATUS
        # COMPLETED: plannedDuration > 0 AND actualDuration > 0
        # MISSED: plannedDuration > 0 AND actualDuration == 0 (Past)
        # UNPLANNED: plannedDuration == 0 AND actualDuration > 0
        # PLANNED: Future dates where actuals are 0
        
        a_dur = safe_get(row, 'actualDuration', 0)
        try: a_dur = float(a_dur)
        except: a_dur = 0
        
        status = "UNKNOWN"
        
        if p_dur > 0 and a_dur > 0:
            status = "COMPLETED"
        elif p_dur > 0 and a_dur == 0:
            if row['date'] < today_str:
                status = "MISSED"
            else:
                status = "PLANNED"
        elif p_dur == 0 and a_dur > 0:
            status = "UNPLANNED"
        elif row['date'] >= today_str:
            status = "PLANNED"
            
        row['status'] = status
        
        final_list.append(row)
        
    # Sort by Date Descending
    final_list.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    save_json(config.MASTER_DB_JSON, final_list)
    print(f"   -> Synced Database. Total records: {len(final_list)}")

if __name__ == "__main__":
    main()
