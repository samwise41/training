import json
import os
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
    if not sport_str: return 'Other'
    s = str(sport_str).lower()
    if 'run' in s: return 'Run'
    if 'bik' in s or 'cycl' in s or 'ride' in s: return 'Bike'
    if 'swim' in s: return 'Swim'
    if 'strength' in s or 'gym' in s or 'weight' in s: return 'Strength'
    if 'rest' in s: return 'Rest'
    return 'Other'

def get_day_name(date_str):
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
    except:
        return ""

def main():
    print("   -> Generating Dashboard Data (Date-Filtered Aggregation)...")

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

    # 2. Determine Plan Date Range
    plan_dates = [p.get('date') for p in full_plan if p.get('date')]
    if not plan_dates:
        print("   -> Error: No dates found in planned.json")
        return

    PLAN_START = min(plan_dates)
    PLAN_END = max(plan_dates)
    print(f"   -> Date Range: {PLAN_START} to {PLAN_END}")

    # 3. Build Aggregated Actuals Bucket
    actuals_map = {}

    for log in logs:
        raw_status = log.get('status') or log.get('Status') or ''
        status = raw_status.upper()

        if status in ['PLANNED', 'MISSED', 'SKIPPED']: continue
        
        date_raw = log.get('date')
        if not date_raw: continue
        l_date = date_raw.split('T')[0]

        if l_date < PLAN_START or l_date > PLAN_END: continue

        raw_sport = log.get('actualSport') or log.get('activityType')
        sport_norm = normalize_sport(raw_sport)

        key = f"{l_date}|{sport_norm}"

        dur = 0.0
        if log.get('actualDuration') is not None:
            dur = float(log.get('actualDuration'))
        elif log.get('duration') is not None:
            dur = float(log.get('duration')) / 60.0

        if key not in actuals_map:
            actuals_map[key] = {
                'duration': 0.0,
                'names': [],
                'sport': sport_norm, 
                'date': l_date
            }

        actuals_map[key]['duration'] += dur
        
        w_name = log.get('actualWorkout') or log.get('activityName') or "Activity"
        if w_name and w_name not in actuals_map[key]['names']:
            actuals_map[key]['names'].append(w_name)

    # 4. Process Plans
    output_list = []
    today_str = datetime.now().strftime('%Y-%m-%d')

    for plan in full_plan:
        date_str = plan.get('date')
        if not date_str: continue

        plan_sport = normalize_sport(plan.get('activityType', 'Other'))
        
        plan_dur = 0.0
        if plan.get('plannedDuration'):
            try:
                plan_dur = float(plan.get('plannedDuration'))
            except:
                plan_dur = 0.0
        
        key = f"{date_str}|{plan_sport}"

        item = {
            "date": date_str,
            "day": get_day_name(date_str),
            "plannedWorkout": plan.get('plannedWorkout') or "Workout",
            "plannedDuration": plan_dur,
            "notes": plan.get('notes', ''),
            "actualSport": plan_sport,
            "actualDuration": 0.0,
            "actualWorkout": None,
            "status": "PLANNED",
            "compliance": 0
        }

        # --- FIX: ROBUST REST DETECTION ---
        # Checks if the Sport is Rest OR if the Title contains "Rest"
        workout_title = item['plannedWorkout'].lower()
        is_rest_day = (plan_sport == 'Rest') or ('rest' in workout_title)

        if is_rest_day:
            item['status'] = 'REST'
            item['actualSport'] = 'Rest' # Normalize category for UI
            output_list.append(item)
            continue # Skip matching logic (prevents "MISSED")

        # --- MATCHING LOGIC ---
        if key in actuals_map:
            data = actuals_map[key]
            item['actualDuration'] = round(data['duration'], 1)
            item['actualWorkout'] = ", ".join(data['names'])
            item['status'] = 'COMPLETED'
            
            if plan_dur > 0:
                item['compliance'] = round((item['actualDuration'] / plan_dur) * 100)
            else:
                item['compliance'] = 100

            del actuals_map[key]
        
        else:
            if date_str < today_str:
                item['status'] = 'MISSED'
        
        output_list.append(item)

    # 5. Handle Leftovers
    for key, data in actuals_map.items():
        if data['duration'] <= 0.1: continue

        extra_item = {
            "date": data['date'],
            "day": get_day_name(data['date']),
            "plannedWorkout": "Unplanned Activity", 
            "plannedDuration": 0,                   
            "notes": f"Unplanned {data['sport']} volume",
            "actualSport": data['sport'],
            "status": "UNPLANNED",
            "actualDuration": round(data['duration'], 1),
            "actualWorkout": ", ".join(data['names']),
            "compliance": 100
        }
        output_list.append(extra_item)

    output_list.sort(key=lambda x: (x['date'], x['plannedDuration'] == 0))

    if not os.path.exists(dashboard_dir):
        os.makedirs(dashboard_dir)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=4)

    print(f"   -> Success! Processed {len(output_list)} records.")
    print(f"   -> Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
