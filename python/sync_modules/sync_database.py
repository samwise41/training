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

def detect_garmin_sport(g_item):
    """Maps Garmin typeKey or sportTypeId to our Plan types."""
    # sportTypeId: 1=Run, 2=Bike, 5=Swim
    sid = g_item.get('sportTypeId')
    type_key = g_item.get('activityType', {}).get('typeKey', '').lower()
    
    if sid == 1 or 'running' in type_key: return 'Run'
    if sid == 2 or 'cycling' in type_key or 'virtual_ride' in type_key: return 'Bike'
    if sid == 5 or 'swimming' in type_key: return 'Swim'
    return 'Other'

def bundle_activities(activities):
    """Bundles multiple Garmin activities into one composite record."""
    if not activities: return None
    
    # Sort by duration desc to find "Primary" activity
    sorted_acts = sorted(activities, key=lambda x: x.get('duration', 0), reverse=True)
    primary = sorted_acts[0]
    
    combined = primary.copy()
    
    # Concatenate IDs
    combined['activityId'] = ",".join([str(a['activityId']) for a in sorted_acts])
    combined['activityName'] = " + ".join([a['activityName'] for a in sorted_acts])
    
    # Sums
    combined['duration'] = sum(a.get('duration', 0) for a in activities) # Seconds
    combined['distance'] = sum(a.get('distance', 0) for a in activities)
    combined['calories'] = sum(a.get('calories', 0) for a in activities)
    combined['elevationGain'] = sum(a.get('elevationGain', 0) for a in activities)
    
    # Weighted Averages (Power, HR, Cadence)
    # Helper to calc weighted avg
    def calc_weighted(key):
        total_dur = combined['duration']
        if total_dur == 0: return 0
        w_sum = sum(a.get(key, 0) * a.get('duration', 0) for a in activities if a.get(key) is not None)
        return w_sum / total_dur

    combined['avgPower'] = calc_weighted('avgPower')
    combined['averageHR'] = calc_weighted('averageHR')
    combined['normPower'] = calc_weighted('normPower')
    combined['averageBikingCadenceInRevPerMinute'] = calc_weighted('averageBikingCadenceInRevPerMinute')
    
    # Maxes
    combined['maxHR'] = max(a.get('maxHR', 0) for a in activities)
    combined['maxPower'] = max(a.get('maxPower', 0) for a in activities)
    
    return combined

def main():
    # 1. Refresh Plan
    build_plan.main()
    
    planned_data = load_json(config.PLANNED_JSON)
    garmin_data = load_json(config.GARMIN_JSON)
    master_log = load_json(config.MASTER_DB_JSON)
    
    # Convert Master Log to Dict Map for easy update (Key: Date|Sport)
    # We maintain a list for the final output, but use a map for processing
    log_map = {f"{x['date']}|{x['activityType']}": x for x in master_log}
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # --- PHASE 1: INGEST PLAN ---
    for plan in planned_data:
        key = f"{plan['date']}|{plan['activityType']}"
        
        if key in log_map:
            # Update existing Planned Fields
            log_map[key].update({
                'id': plan['id'], # Keep system ID in sync
                'day': plan['day'],
                'plannedWorkout': plan['plannedWorkout'],
                'plannedDuration': plan['plannedDuration'],
                'notes': plan['notes']
            })
        else:
            # Create Pending
            if plan['date'] <= today_str: # Or allow future? Spec says "No future dates" for pending creation in DB? 
                # Spec: "If not, it creates a 'Pending' record if the date is the current date or earlier. No future dates."
                # Actually, standard logic usually allows seeing future plans. 
                # But we will follow spec: Only create record if today or earlier OR if we want to visualize future.
                # However, for the "Master Log" (History), we usually only care about past/today.
                pass 
            
            # Actually, let's add it to ensure the DB has the plan record, 
            # Status calc will handle "PLANNED" vs "MISSED"
            log_map[key] = {
                'date': plan['date'],
                'activityType': plan['activityType'],
                'day': plan['day'],
                'plannedWorkout': plan['plannedWorkout'],
                'plannedDuration': plan['plannedDuration'],
                'notes': plan['notes'],
                'actualDuration': 0,
                'actualWorkout': '',
                'matchStatus': 'Pending'
            }

    # --- PHASE 2: MATCH ACTUALS ---
    # Group Garmin by Date + Sport
    garmin_grouped = {}
    for g in garmin_data:
        g_date = g['startTimeLocal'][:10]
        g_sport = detect_garmin_sport(g)
        if g_sport == 'Other': continue
        
        k = f"{g_date}|{g_sport}"
        if k not in garmin_grouped: garmin_grouped[k] = []
        garmin_grouped[k].append(g)
        
    for key, g_activities in garmin_grouped.items():
        g_date, g_sport = key.split('|')
        
        # Bundle
        if len(g_activities) > 1:
            composite = bundle_activities(g_activities)
            match_type_suffix = " Group"
        else:
            composite = g_activities[0]
            match_type_suffix = ""
            
        # Hydrate Target fields
        actual_dur_min = (composite.get('duration', 0) or 0) / 60
        
        telemetry = {
            'actualWorkout': composite.get('activityName'),
            'actualDuration': round(actual_dur_min, 1),
            'garminActivityId': str(composite.get('activityId')),
            'garminSportType': composite.get('sportTypeId'),
            'duration': composite.get('duration'),
            'distance': composite.get('distance'),
            'avgPower': composite.get('avgPower'),
            'normPower': composite.get('normPower'),
            'averageHR': composite.get('averageHR'),
            'maxHR': composite.get('maxHR'),
            'trainingStressScore': composite.get('trainingStressScore'),
            'intensityFactor': composite.get('intensityFactor'),
            'calories': composite.get('calories'),
            'elevationGain': composite.get('elevationGain'),
            'RPE': composite.get('RPE'),
            'Feeling': composite.get('Feeling'),
            'vO2MaxValue': composite.get('vO2MaxValue')
            # Add other fields from spec as needed
        }

        # Check if Plan exists
        if key in log_map:
            # LINK
            log_map[key].update(telemetry)
            log_map[key]['matchStatus'] = f"Linked{match_type_suffix}"
        else:
            # UNPLANNED
            new_record = {
                'date': g_date,
                'activityType': g_sport,
                'day': pd.to_datetime(g_date).day_name(),
                'plannedWorkout': '',
                'plannedDuration': 0,
                'notes': '',
                'matchStatus': f"Unplanned{match_type_suffix}"
            }
            new_record.update(telemetry)
            log_map[key] = new_record

    # --- PHASE 4: STATUS CALCULATION ---
    final_list = []
    for key, row in log_map.items():
        p_dur = row.get('plannedDuration', 0)
        a_dur = row.get('actualDuration', 0)
        r_date = row.get('date')
        
        status = 'UNKNOWN'
        
        if p_dur > 0 and a_dur > 0:
            status = 'COMPLETED'
        elif p_dur > 0 and a_dur == 0:
            if r_date < today_str:
                status = 'MISSED'
            else:
                status = 'PLANNED'
        elif p_dur == 0 and a_dur > 0:
            status = 'UNPLANNED'
        elif r_date >= today_str:
            status = 'PLANNED'
            
        row['status'] = status
        final_list.append(row)
        
    # Sort and Save
    final_list.sort(key=lambda x: x['date'], reverse=True)
    save_json(config.MASTER_DB_JSON, final_list)
    print(f"   -> Synced Database. Total records: {len(final_list)}")

if __name__ == "__main__":
    main()
