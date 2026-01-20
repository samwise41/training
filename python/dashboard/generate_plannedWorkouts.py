import json
import os
import sys
import re
from datetime import datetime, timedelta

# --- SETUP PATHS ---
current_dir = os.path.dirname(os.path.abspath(__file__))
# Root: samwise41/training/training-..../
root_dir = os.path.dirname(os.path.dirname(current_dir)) 
data_dir = os.path.join(root_dir, 'data')
dashboard_dir = os.path.join(data_dir, 'dashboard')

PLANNED_FILE = os.path.join(data_dir, 'planned.json')
LOG_FILE = os.path.join(data_dir, 'training_log.json')
OUTPUT_FILE = os.path.join(dashboard_dir, 'plannedWorkouts.json')

# --- HELPERS ---

def get_current_week_dates():
    """Returns a list of YYYY-MM-DD strings for the current week (Mon-Sun)."""
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday()) 
    
    dates = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        dates.append(day.strftime('%Y-%m-%d'))
    return dates

def normalize_sport(sport_str):
    s = str(sport_str).lower()
    if 'run' in s: return 'Run'
    if 'bik' in s or 'cycl' in s or 'ride' in s: return 'Bike'
    if 'swim' in s: return 'Swim'
    if 'strength' in s or 'gym' in s or 'weight' in s: return 'Strength'
    return 'Other'

def main():
    print("   -> Generating Planned Workouts (from planned.json)...")
    
    # 1. Get Dates for Current Week
    week_dates = get_current_week_dates()
    print(f"   -> Processing Week: {week_dates[0]} to {week_dates[-1]}")

    # 2. Load Files
    if not os.path.exists(PLANNED_FILE):
        print(f"Error: {PLANNED_FILE} not found.")
        return

    with open(PLANNED_FILE, 'r', encoding='utf-8') as f:
        full_plan = json.load(f)

    logs = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except Exception as e:
            print(f"   -> Warning: Could not read training log: {e}")

    # 3. Create Lookup Maps
    # Plan Map: Date -> Plan Object
    # (Assuming one plan per day for simplicity, or taking the first one found)
    plan_map = {}
    for p in full_plan:
        if p.get('date') in week_dates:
            plan_map[p['date']] = p

    # Log Map: Date -> Log Object (Prioritize matching sport if complex, but here we assume Date Match)
    log_map = {}
    for l in logs:
        l_date = l.get('date', '').split('T')[0]
        if l_date in week_dates:
            # We store it. If multiple, we might overwrite, but usually 1 main workout per day is tracked here.
            # Ideally we match by Sport too, but let's look up by date first.
            if l_date not in log_map: log_map[l_date] = []
            log_map[l_date].append(l)

    # 4. Build Output
    output_list = []
    today_str = datetime.now().strftime('%Y-%m-%d')

    for date_str in week_dates:
        day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
        
        plan = plan_map.get(date_str)
        
        # If no plan exists for this date, do we show it? 
        # Usually yes, if there's an actual workout. If neither, maybe skip or show Rest.
        # Let's assume we show it if there is a plan OR an actual.
        
        log_entries = log_map.get(date_str, [])
        
        # Try to match specific plan to specific log if multiple exist
        # For simplicity in this script, we'll take the primary match or just the first log.
        
        match = None
        if plan and log_entries:
            # Try to match sport
            plan_sport = normalize_sport(plan.get('activityType'))
            for log in log_entries:
                log_sport = normalize_sport(log.get('actualSport') or log.get('activityType'))
                if log_sport == plan_sport:
                    match = log
                    break
            # If no direct sport match, just grab the first log (Unplanned/Mismatch case)
            if not match and log_entries:
                match = log_entries[0]
        elif log_entries:
            # No plan, but we have a log (Unplanned)
            match = log_entries[0]

        # --- BUILD CARD DATA ---
        
        # 1. Basic Info
        item = {
            "date": date_str,
            "day": day_name,
            "status": "PLANNED",
            "notes": ""
        }

        # 2. Extract Plan Details (if exists)
        if plan:
            item["plannedWorkout"] = plan.get('plannedWorkout') or plan.get('title')
            item["plannedDuration"] = float(plan.get('plannedDuration', 0) or 0)
            item["notes"] = plan.get('notes', '')
            planned_sport_raw = plan.get('activityType', 'Other')
        else:
            item["plannedWorkout"] = "Rest Day"
            item["plannedDuration"] = 0
            planned_sport_raw = "Rest"

        # 3. Extract Actual Details (if exists/match)
        if match:
            item["status"] = "COMPLETED"
            # Prefer actualDuration, fallback to duration/60
            raw_dur = match.get('actualDuration')
            if raw_dur is None:
                raw_dur = match.get('duration', 0) / 60
            item["actualDuration"] = round(float(raw_dur), 1)
            item["actualWorkout"] = match.get('actualWorkout') or match.get('activityName')
            
            # THE LOGIC YOU REQUESTED:
            # "Have it match the training log if the training log has a value"
            item["actualSport"] = match.get('actualSport') or normalize_sport(match.get('activityType'))
            
            # Calc Compliance
            if item["plannedDuration"] > 0:
                item["compliance"] = round((item["actualDuration"] / item["plannedDuration"]) * 100)
            else:
                item["status"] = "UNPLANNED"
        
        else:
            # No Actual Found
            item["actualDuration"] = 0
            item["actualWorkout"] = None
            
            # THE LOGIC YOU REQUESTED:
            # "If not it reverts to the activityType from the planned.json"
            item["actualSport"] = normalize_sport(planned_sport_raw)

            # Handle Missed vs Planned
            if date_str < today_str and item["plannedDuration"] > 0:
                item["status"] = "MISSED"
            
            # Handle Rest
            if item["actualSport"] == 'Rest' or (not plan and not match):
                item["status"] = "REST"
                item["actualSport"] = "Rest"

        output_list.append(item)

    # 5. Sort & Save
    output_list.sort(key=lambda x: x['date'])

    if not os.path.exists(dashboard_dir):
        os.makedirs(dashboard_dir)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=4)
        
    print(f"   -> Success! Saved {len(output_list)} records to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()