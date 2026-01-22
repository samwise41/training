import json
import os
import sys
from datetime import datetime

# --- SETUP PATHS ---
current_dir = os.path.dirname(os.path.abspath(__file__))
# Root: samwise41/training/training-..../
root_dir = os.path.dirname(os.path.dirname(current_dir)) 
data_dir = os.path.join(root_dir, 'data')
dashboard_dir = os.path.join(data_dir, 'dashboard')

PLANNED_FILE = os.path.join(dashboard_dir, 'planned.json')
LOG_FILE = os.path.join(data_dir, 'training_log.json')
OUTPUT_FILE = os.path.join(dashboard_dir, 'plannedWorkouts.json')

# --- HELPERS ---

def normalize_sport(sport_str):
    """Normalizes sport names to standard categories."""
    s = str(sport_str).lower()
    if 'run' in s: return 'Run'
    if 'bik' in s or 'cycl' in s or 'ride' in s: return 'Bike'
    if 'swim' in s: return 'Swim'
    if 'strength' in s or 'gym' in s or 'weight' in s: return 'Strength'
    if 'rest' in s: return 'Rest'
    return 'Other'

def main():
    print("   -> Generating Dashboard Data from planned.json...")

    # 1. Load Files
    if not os.path.exists(PLANNED_FILE):
        print(f"Error: {PLANNED_FILE} not found.")
        return

    try:
        with open(PLANNED_FILE, 'r', encoding='utf-8') as f:
            full_plan = json.load(f)
    except Exception as e:
        print(f"Error reading planned.json: {e}")
        return

    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except Exception as e:
            print(f"   -> Warning: Could not read training log: {e}")

    # 2. Create Log Lookup Map
    # Key: "YYYY-MM-DD" -> List of log entries for that day
    log_map = {}
    for l in logs:
        l_date = l.get('date', '').split('T')[0]
        if l_date:
            if l_date not in log_map: 
                log_map[l_date] = []
            log_map[l_date].append(l)

    # Track which log IDs are matched to a plan
    matched_log_ids = set()

    # 3. Process Plan
    output_list = []
    today_str = datetime.now().strftime('%Y-%m-%d')

    for plan in full_plan:
        date_str = plan.get('date')
        if not date_str: continue

        try:
            day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
        except:
            day_name = ""
        
        # --- Find Match ---
        log_entries = log_map.get(date_str, [])
        match = None
        
        plan_sport_norm = normalize_sport(plan.get('activityType'))
        
        if log_entries:
            for log in log_entries:
                # SKIP if already used
                if log.get('id') in matched_log_ids:
                    continue
                
                # SKIP placeholder/future logs
                if log.get('status') == 'PLANNED' or str(log.get('id', '')).startswith('PLAN-'):
                    continue

                log_sport_norm = normalize_sport(log.get('actualSport') or log.get('activityType'))
                
                if log_sport_norm == plan_sport_norm:
                    match = log
                    matched_log_ids.add(log.get('id'))
                    break
            
            # Fallback: If no strict match, but 1 unused log exists (and not rest day), assume it fits
            if not match and plan_sport_norm != 'Rest':
                unused = [l for l in log_entries if l.get('id') not in matched_log_ids]
                if len(unused) == 1:
                    match = unused[0]
                    matched_log_ids.add(match.get('id'))

        # --- Build Output Object ---
        planned_sport_raw = plan.get('activityType', 'Other')
        
        item = {
            "date": date_str,
            "day": day_name,
            "plannedWorkout": plan.get('plannedWorkout') or plan.get('title') or "Workout",
            "plannedDuration": float(plan.get('plannedDuration', 0) or 0),
            "notes": plan.get('notes', ''),
            "actualSport": normalize_sport(planned_sport_raw) 
        }

        # Apply Status & Match Data
        if match:
            item["status"] = "COMPLETED"
            raw_act_dur = match.get('actualDuration')
            if raw_act_dur is None:
                raw_act_dur = match.get('duration', 0) / 60
            item["actualDuration"] = round(float(raw_act_dur), 1)
            item["actualWorkout"] = match.get('actualWorkout') or match.get('activityName')
            item["actualSport"] = match.get('actualSport') or normalize_sport(match.get('activityType'))

            if item["plannedDuration"] > 0:
                item["compliance"] = round((item["actualDuration"] / item["plannedDuration"]) * 100)
            else:
                item["compliance"] = 0
        else:
            item["actualDuration"] = 0
            item["actualWorkout"] = None
            item["compliance"] = 0
            if plan_sport_norm == 'Rest':
                 item["status"] = "REST"
            elif date_str < today_str:
                item["status"] = "MISSED"
            else:
                item["status"] = "PLANNED"

        output_list.append(item)

    # --- 4. Find Unplanned / Extra Workouts (THE NEW LOGIC) ---
    for log in logs:
        # Skip if already matched or is a plan placeholder
        if log.get('id') in matched_log_ids: continue
        if log.get('status') == 'PLANNED' or str(log.get('id', '')).startswith('PLAN-'): continue
        if log.get('date') > today_str: continue

        date_str = log.get('date')
        try:
            day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
        except:
            day_name = ""

        raw_act_dur = log.get('actualDuration')
        if raw_act_dur is None:
            raw_act_dur = log.get('duration', 0) / 60
        
        extra_item = {
            "date": date_str,
            "day": day_name,
            "plannedWorkout": "Unplanned Activity",
            "plannedDuration": 0,
            "notes": "Extra workout not in original plan.",
            "status": "COMPLETED",
            "actualWorkout": log.get('actualWorkout') or log.get('activityName'),
            "actualDuration": round(float(raw_act_dur), 1),
            "actualSport": log.get('actualSport') or normalize_sport(log.get('activityType')),
            "compliance": 100 
        }
        output_list.append(extra_item)

    # 5. Sort & Save (Date ascending, then Planned items first)
    output_list.sort(key=lambda x: (x['date'], x['plannedDuration'] == 0)) 

    if not os.path.exists(dashboard_dir):
        os.makedirs(dashboard_dir)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=4)
        
    print(f"   -> Success! Processed {len(output_list)} records (including extras).")
    print(f"   -> Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
