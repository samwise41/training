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
        # Handle date string variations (e.g. 2023-10-25T14:30:00)
        l_date = l.get('date', '').split('T')[0]
        if l_date:
            if l_date not in log_map: 
                log_map[l_date] = []
            log_map[l_date].append(l)

    # 3. Process Plan
    output_list = []
    today_str = datetime.now().strftime('%Y-%m-%d')

    for plan in full_plan:
        date_str = plan.get('date')
        if not date_str: continue

        # Format friendly Day name
        try:
            day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
        except:
            day_name = ""
        
        # --- Find Match ---
        log_entries = log_map.get(date_str, [])
        match = None
        
        # Strategy: Try to match by sport first
        plan_sport_norm = normalize_sport(plan.get('activityType'))
        
        if log_entries:
            for log in log_entries:
                log_sport_norm = normalize_sport(log.get('actualSport') or log.get('activityType'))
                if log_sport_norm == plan_sport_norm:
                    match = log
                    break
            
            # If no strict sport match, but only 1 log exists and it's not a rest day, assume it's the one
            if not match and len(log_entries) == 1 and plan_sport_norm != 'Rest':
                match = log_entries[0]

        # --- Build Output Object ---
        
        # 1. Defaults from Plan
        planned_sport_raw = plan.get('activityType', 'Other')
        
        item = {
            "date": date_str,
            "day": day_name,
            "plannedWorkout": plan.get('plannedWorkout') or plan.get('title') or "Workout",
            "plannedDuration": float(plan.get('plannedDuration', 0) or 0),
            "notes": plan.get('notes', ''),
            # This will be overwritten if match is found
            "actualSport": normalize_sport(planned_sport_raw) 
        }

        # 2. Apply Status & Match Data
        if match:
            item["status"] = "COMPLETED"
            
            # Get actual duration (prefer 'actualDuration', fallback to 'duration')
            raw_act_dur = match.get('actualDuration')
            if raw_act_dur is None:
                raw_act_dur = match.get('duration', 0) / 60
            item["actualDuration"] = round(float(raw_act_dur), 1)
            
            item["actualWorkout"] = match.get('actualWorkout') or match.get('activityName')
            
            # USE LOG SPORT if available
            item["actualSport"] = match.get('actualSport') or normalize_sport(match.get('activityType'))

            # Compliance
            if item["plannedDuration"] > 0:
                item["compliance"] = round((item["actualDuration"] / item["plannedDuration"]) * 100)
            else:
                item["compliance"] = 0 # Unplanned or Rest
        
        else:
            # No match found
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

    # 4. Sort & Save
    # Sort descending (Newest first) or Ascending? 
    # Usually lists are better Ascending (Oldest -> Newest) or just Newest at top.
    # Let's do Standard Chronological (Ascending) so user sees the flow of the week
    output_list.sort(key=lambda x: x['date'])

    if not os.path.exists(dashboard_dir):
        os.makedirs(dashboard_dir)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=4)
        
    print(f"   -> Success! Processed {len(output_list)} records.")
    print(f"   -> Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
