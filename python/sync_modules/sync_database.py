import json
import os
import pandas as pd
from datetime import datetime, timedelta
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

def normalize_sport(val, sport_type_id=None):
    """
    Returns 'Run', 'Bike', or 'Swim' based on input.
    Input can be a string ('Run') or a Garmin Dict.
    MAPPING: 1=Run, 2=Bike, 5=Swim, 255=Swim
    """
    if sport_type_id is not None:
        try:
            sid = int(sport_type_id)
            if sid == 1: return 'Run'
            if sid == 2: return 'Bike'
            if sid in [5, 255]: return 'Swim'
        except: pass

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

def detect_garmin_sport(g_item):
    """Maps Garmin attributes to Plan 'activityType' for Key matching."""
    return normalize_sport(g_item.get('activityType'), g_item.get('sportTypeId'))

def get_record_key(record):
    """Generates the unique key YYYY-MM-DD|Sport for a DB record."""
    date = record.get('date')
    sport = normalize_sport(record.get('activityType'), record.get('sportTypeId'))
    return f"{date}|{sport}"

def bundle_activities(activities):
    """Logic: Sums duration/distance/calories. Calculates weighted averages for Power/HR."""
    if not activities: return None
    activities.sort(key=lambda x: safe_get(x, 'duration', 0) or 0, reverse=True)
    primary = activities[0]
    combined = primary.copy() 
    ids = [str(a.get('activityId')) for a in activities if a.get('activityId')]
    combined['activityId'] = ",".join(ids)
    
    def get_sum(key):
        return sum((safe_get(a, key, 0) or 0) for a in activities)

    combined['duration'] = get_sum('duration')
    combined['distance'] = get_sum('distance')
    combined['calories'] = get_sum('calories')
    combined['elevationGain'] = get_sum('elevationGain') 

    def calc_weighted(key):
        total_dur = combined['duration']
        if total_dur == 0: return 0
        weighted_sum = sum(safe_get(a, key, 0) * safe_get(a, 'duration', 0) for a in activities if safe_get(a, key) is not None)
        return weighted_sum / total_dur if total_dur > 0 else 0

    combined['avgPower'] = calc_weighted('avgPower')
    combined['averageHR'] = calc_weighted('averageHR')
    combined['normPower'] = calc_weighted('normPower')
    combined['maxHR'] = max((safe_get(a, 'maxHR', 0) or 0) for a in activities)
    combined['maxPower'] = max((safe_get(a, 'maxPower', 0) or 0) for a in activities)
    return combined

def main():
    build_plan.main()
    planned_data = load_json(config.PLANNED_JSON)
    garmin_data = load_json(config.GARMIN_JSON)
    master_log = load_json(config.MASTER_DB_JSON)
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    cutoff_date = (datetime.now() - timedelta(days=14)).strftime('%Y-%m-%d')
    print(f"   -> Syncing activities from {cutoff_date} to {today_str}...")

    log_map = {}
    existing_ids = set() 
    for row in master_log:
        key = get_record_key(row)
        log_map[key] = row
        r_id = row.get('id')
        if r_id:
            str_id = str(r_id)
            for sub in str_id.split(','):
                if sub.strip().isdigit(): existing_ids.add(sub.strip())

    # PHASE 1: INGEST PLAN
    for plan in planned_data:
        if plan['date'] > today_str: continue
        sport_key = normalize_sport(plan['activityType'])
        key = f"{plan['date']}|{sport_key}"
        entry = log_map.get(key, {})
        entry.update({
            'date': plan['date'], 'day': plan['day'],
            'activityType': entry.get('activityType', plan['activityType']),
            'plannedWorkout': plan['plannedWorkout'], 'plannedDuration': plan['plannedDuration'],
            'notes': plan['notes'], 'actualDuration': entry.get('actualDuration', 0),
            'id': entry.get('id', plan['id']) 
        })
        log_map[key] = entry

    # PHASE 2: MATCH ACTUALS (14-Day Filter)
    garmin_grouped = {}
    for g in garmin_data:
        g_date = g.get('startTimeLocal', '')[:10]
        if g_date > today_str or g_date < cutoff_date: continue
        g_sport = detect_garmin_sport(g)
        k = f"{g_date}|{g_sport}"
        if k not in garmin_grouped: garmin_grouped[k] = []
        garmin_grouped[k].append(g)
        
    for key, g_activities in garmin_grouped.items():
        composite = bundle_activities(g_activities) if len(g_activities) > 1 else g_activities[0]
        is_group = len(g_activities) > 1
        current_id_str = str(composite.get('activityId'))
        ids_to_check = current_id_str.split(',')
        if any(cid.strip() in existing_ids for cid in ids_to_check): continue

        act_dur_min = (safe_get(composite, 'duration', 0) or 0) / 60.0
        telemetry = {
            "actualWorkout": composite.get('activityName'), "actualDuration": round(act_dur_min, 1),
            "id": composite.get('activityId'), "activityType": composite.get('activityType'),
            "sportTypeId": composite.get('sportTypeId'), "duration": composite.get('duration'),
            "distance": composite.get('distance'), "averageHR": composite.get('averageHR'),
            "maxHR": composite.get('maxHR'), "aerobicTrainingEffect": composite.get('aerobicTrainingEffect'),
            "anaerobicTrainingEffect": composite.get('anaerobicTrainingEffect'), "trainingEffectLabel": composite.get('trainingEffectLabel'),
            "avgPower": composite.get('avgPower'), "maxPower": composite.get('maxPower'), "normPower": composite.get('normPower'),
            "trainingStressScore": composite.get('trainingStressScore'), "intensityFactor": composite.get('intensityFactor'),
            "averageSpeed": composite.get('averageSpeed'), "maxSpeed": composite.get('maxSpeed'),
            "averageBikingCadenceInRevPerMinute": composite.get('averageBikingCadenceInRevPerMinute'),
            "averageRunningCadenceInStepsPerMinute": composite.get('averageRunningCadenceInStepsPerMinute'),
            "avgStrideLength": composite.get('avgStrideLength'), "avgVerticalOscillation": composite.get('avgVerticalOscillation'),
            "avgGroundContactTime": composite.get('avgGroundContactTime'), "vO2MaxValue": composite.get('vO2MaxValue'),
            "calories": composite.get('calories'), "elevationGain": composite.get('elevationGain'),
            "RPE": composite.get('RPE'), "Feeling": composite.get('Feeling')
        }

        if key in log_map:
            log_map[key].update(telemetry)
            log_map[key]['matchStatus'] = "Linked Group" if is_group else "Linked"
        else:
            g_date, g_sport = key.split('|')
            try: day_name = pd.to_datetime(g_date).day_name()
            except: day_name = ""
            new_row = {"date": g_date, "day": day_name, "plannedWorkout": "", "plannedDuration": 0, "notes": "", "matchStatus": "Unplanned Group" if is_group else "Unplanned"}
            new_row.update(telemetry)
            log_map[key] = new_row
        for cid in ids_to_check: existing_ids.add(cid.strip())

    # PHASE 4: STATUS LOGIC & CLEANUP (Fixes missing date errors)
    final_list = []
    for row in log_map.values():
        r_date = row.get('date') or "1900-01-01"
        row['date'] = r_date
        match_stat = row.get('matchStatus', '')
        p_dur = float(safe_get(row, 'plannedDuration', 0) or 0)
        has_actual = row.get('id') and str(row.get('id')).replace(',','').isdigit()
        
        if not match_stat:
            if p_dur > 0 and not has_actual:
                row['matchStatus'] = "Missed" if r_date < today_str else "Planned"
        
        a_dur = float(safe_get(row, 'actualDuration', 0) or 0)
        if p_dur > 0 and a_dur > 0: status = "COMPLETED"
        elif p_dur > 0 and a_dur == 0: status = "MISSED" if r_date < today_str else "PLANNED"
        elif p_dur == 0 and a_dur > 0: status = "UNPLANNED"
        else: status = "PLANNED"
        row['status'] = status
        if r_date <= today_str: final_list.append(row)
        
    final_list.sort(key=lambda x: x.get('date') or "1900-01-01", reverse=True)
    save_json(config.MASTER_DB_JSON, final_list)
    print(f"   -> Synced Database. Total records: {len(final_list)}")

if __name__ == "__main__":
    main()
