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
    sid = g_item.get('sportTypeId')
    type_key = g_item.get('activityType', {}).get('typeKey', '').lower()
    
    if sid == 1 or 'running' in type_key: return 'Run'
    if sid == 2 or 'cycling' in type_key or 'virtual_ride' in type_key: return 'Bike'
    if sid == 5 or 'swimming' in type_key: return 'Swim'
    return 'Other'

def safe_get(d, key, default=0):
    """Safely gets a value, returning default if missing OR null."""
    val = d.get(key)
    return val if val is not None else default

def bundle_activities(activities):
    if not activities: return None
    
    # Sort by duration to find Primary
    # Fix: Handle case where duration is None
    activities.sort(key=lambda x: safe_get(x, 'duration'), reverse=True)
    primary = activities[0]
    
    combined = primary.copy()
    
    combined['activityId'] = ",".join([str(a['activityId']) for a in activities])
    combined['activityName'] = " + ".join([a.get('activityName', 'Activity') for a in activities])
    
    # Sums
    combined['duration'] = sum(safe_get(a, 'duration') for a in activities)
    combined['distance'] = sum(safe_get(a, 'distance') for a in activities)
    combined['calories'] = sum(safe_get(a, 'calories') for a in activities)
    combined['elevationGain'] = sum(safe_get(a, 'elevationGain') for a in activities)
    
    # Weighted Averages
    def calc_weighted(key):
        total_dur = combined['duration']
        if total_dur == 0: return 0
        w_sum = sum(safe_get(a, key) * safe_get(a, 'duration') for a in activities)
        return w_sum / total_dur

    combined['avgPower'] = calc_weighted('avgPower')
    combined['averageHR'] = calc_weighted('averageHR')
    combined['normPower'] = calc_weighted('normPower')
    combined['averageBikingCadenceInRevPerMinute'] = calc_weighted('averageBikingCadenceInRevPerMinute')
    
    # Maxes (Fix: safe_get prevents crash on max(None))
    combined['maxHR'] = max(safe_get(a, 'maxHR') for a in activities)
    combined['maxPower'] = max(safe_get(a, 'maxPower') for a in activities)
    
    return combined

def main():
    # 1. Refresh Plan
    build_plan.main()
    
    planned_data = load_json(config.PLANNED_JSON)
    garmin_data = load_json(config.GARMIN_JSON)
    master_log = load_json(config.MASTER_DB_JSON)
    
    log_map = {f"{x['date']}|{x['activityType']}": x for x in master_log}
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # --- PHASE 1: INGEST PLAN ---
    for plan in planned_data:
        key = f"{plan['date']}|{plan['activityType']}"
        
        if key in log_map:
            log_map[key].update({
                'id': plan['id'],
                'day': plan['day'],
                'plannedWorkout': plan['plannedWorkout'],
                'plannedDuration': plan['plannedDuration'],
                'notes': plan['notes']
            })
        else:
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
    garmin_grouped = {}
    for g in garmin_data:
        g_date = g.get('startTimeLocal', '')[:10]
        g_sport = detect_garmin_sport(g)
        if g_sport == 'Other': continue
        
        k = f"{g_date}|{g_sport}"
        if k not in garmin_grouped: garmin_grouped[k] = []
        garmin_grouped[k].append(g)
        
    for key, g_activities in garmin_grouped.items():
        g_date, g_sport = key.split('|')
        
        if len(g_activities) > 1:
            composite = bundle_activities(g_activities)
            match_type_suffix = " Group"
        else:
            composite = g_activities[0]
            match_type_suffix = ""
            
        # Hydrate Target fields
        actual_dur_min = safe_get(composite, 'duration') / 60.0
        
        telemetry = {
            'actualWorkout': composite.get('activityName', ''),
            'actualDuration': round(actual_dur_min, 1),
            'garminActivityId': str(composite.get('activityId')),
            'garminSportType': composite.get('sportTypeId'),
            'duration': safe_get(composite, 'duration'),
            'distance': safe_get(composite, 'distance'),
            'avgPower': safe_get(composite, 'avgPower'),
            'normPower': safe_get(composite, 'normPower'),
            'averageHR': safe_get(composite, 'averageHR'),
            'maxHR': safe_get(composite, 'maxHR'),
            'trainingStressScore': safe_get(composite, 'trainingStressScore'),
            'intensityFactor': safe_get(composite, 'intensityFactor'),
            'calories': safe_get(composite, 'calories'),
            'elevationGain': safe_get(composite, 'elevationGain'),
            'RPE': safe_get(composite, 'RPE', default=None),
            'Feeling': safe_get(composite, 'Feeling', default=None),
            'vO2MaxValue': safe_get(composite, 'vO2MaxValue')
        }

        if key in log_map:
            log_map[key].update(telemetry)
            log_map[key]['matchStatus'] = f"Linked{match_type_suffix}"
        else:
            try:
                day_name = pd.to_datetime(g_date).day_name()
            except:
                day_name = ""

            new_record = {
                'date': g_date,
                'activityType': g_sport,
                'day': day_name,
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
        p_dur = safe_get(row, 'plannedDuration')
        a_dur = safe_get(row, 'actualDuration')
        r_date = row.get('date', '')
        
        status = 'UNKNOWN'
        
        # Safe float conversion
        try: p_dur = float(p_dur)
        except: p_dur = 0
        try: a_dur = float(a_dur)
        except: a_dur = 0
        
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
        
    final_list.sort(key=lambda x: x.get('date', ''), reverse=True)
    save_json(config.MASTER_DB_JSON, final_list)
    print(f"   -> Synced Database. Total records: {len(final_list)}")

if __name__ == "__main__":
    main()
