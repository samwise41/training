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
    print("   -> Generating Dashboard Data (Duration Aggregation Mode)...")

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

    # 2. Build Aggregated Actuals Bucket
    # Group ALL completed actuals by Date + Sport
    # Key: "YYYY-MM-DD|Sport" -> Value: { duration: 0.0, names: [], sport: "", date: "" }
    actuals_map = {}

    for log in logs:
        # Robust Status Check (Handle 'status' vs 'Status')
        status = (log.get('status') or log.get('Status') or '').upper()
        
        # Skip PLANNED, MISSED, or SKIPPED
        if status in ['PLANNED', 'MISSED', 'SKIPPED']: continue
        
        # Get Date
        date_raw = log.get('date')
        if not date_raw: continue
        l_date = date_raw.split('T')[0]

        # Get Sport
        raw_sport = log.get('actualSport') or log.get('activityType')
        sport_norm = normalize_sport(raw_sport)

        # Create Unique Key for this Day + Sport combo
        key = f"{l_date}|{sport_norm}"

        # SAFE Duration Get (Fixes the "float() argument must be..." error)
        dur = 0.0
        
        # 1. Try explicit 'actualDuration' (usually in minutes)
        if log.get('actualDuration') is not None:
            dur = float(log.get('actualDuration'))
        
        # 2. Fallback to 'duration' (usually in seconds), handle None/Null safely
        elif log.get('duration') is not None:
            dur = float(log.get('duration')) / 60.0
            
        # 3. If both are missing/null, dur stays 0.0

        # Initialize bucket if new
        if key not in actuals_map:
            actuals_map[key] = {
                'duration': 0.0,
                'names': [],
                'sport': sport_norm, 
                'date': l_date
            }

        # Add to bucket
        actuals_map[key]['duration'] += dur
        
        # Track activity name
        w_name = log.get('actualWorkout') or log.get('activityName') or "Activity"
        if w_name not in actuals_map[key]['names']:
            actuals_map[key]['names'].append(w_name)

    # 3. Process Plans & Consume Bucket Data
    output_list = []
    today_str = datetime.now().strftime('%Y-%m-%d')

    for plan in full_plan:
        date_str = plan.get('date')
        if not date_str: continue

        plan_sport = normalize_sport(plan.get('activityType', 'Other'))
        
        # Safe Get for Planned Duration
        plan_dur = 0.0
        if plan.get('plannedDuration'):
            try:
                plan_dur = float(plan.get('plannedDuration'))
            except:
                plan_dur = 0.0
        
        # Construct Key to look for matching Actuals
        key = f"{date_str}|{plan_sport}"

        # Default Item Structure
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

        if plan_sport == 'Rest':
            item['status'] = 'REST'
            output_list.append(item)
            continue

        # --- MATCHING LOGIC ---
        if key in actuals_map:
            # We found actuals for this Planned Day & Sport!
            data = actuals_map[key]
            
            # 1. Assign TOTAL duration from the logs to this plan
            item['actualDuration'] = round(data['duration'], 1)
            
            # 2. Combine names
            item['actualWorkout'] = ", ".join(data['names'])
            
            # 3. Mark Completed
            item['status'] = 'COMPLETED'
            
            # 4. Calc Compliance
            if plan_dur > 0:
                item['compliance'] = round((item['actualDuration'] / plan_dur) * 100)
            else:
                item['compliance'] = 100

            # 5. Consume data so it doesn't appear as Unplanned
            del actuals_map[key]
        
        else:
            # No match found
            if date_str < today_str:
                item['status'] = 'MISSED'
        
        output_list.append(item)

    # 4. Handle Leftovers (Unplanned)
    for key, data in actuals_map.items():
        # Skip future dates if any crept in
        if data['date'] > today_str: continue
        
        # Optional: Skip entries with 0 duration (e.g. error logs)
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

    # 5. Sort & Save
    output_list.sort(key=lambda x: (x['date'], x['plannedDuration'] == 0))

    if not os.path.exists(dashboard_dir):
        os.makedirs(dashboard_dir)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=4)

    print(f"   -> Success! Processed {len(output_list)} records.")
    print(f"   -> Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
