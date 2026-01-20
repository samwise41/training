import json
import os
import sys
import re
from datetime import datetime, timedelta

# --- SETUP PATHS ---
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir)) # Root of repo
data_dir = os.path.join(root_dir, 'data')
dashboard_dir = os.path.join(data_dir, 'dashboard')

PLAN_FILE = os.path.join(root_dir, 'endurance_plan.md')
LOG_FILE = os.path.join(data_dir, 'training_log.json')
OUTPUT_FILE = os.path.join(dashboard_dir, 'plannedWorkouts.json')

# --- HELPERS ---

def get_current_week_dates():
    """Returns a list of YYYY-MM-DD strings for the current week (Mon-Sun)."""
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday()) # Monday
    
    dates = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        dates.append(day.strftime('%Y-%m-%d'))
    return dates

def parse_duration(dur_str):
    """Extracts minutes from strings like '60 min', '1h 30m', '1:30'."""
    if not dur_str: return 0
    dur_str = str(dur_str).lower()
    
    # Regex for "X min"
    mins = re.search(r'(\d+)\s*m', dur_str)
    if mins: return float(mins.group(1))
    
    # Regex for "X hr"
    hrs = re.search(r'(\d+)\s*h', dur_str)
    if hrs: return float(hrs.group(1)) * 60
    
    return 0

def normalize_sport(sport_str):
    s = str(sport_str).lower()
    if 'run' in s: return 'Run'
    if 'bik' in s or 'cycl' in s: return 'Bike'
    if 'swim' in s: return 'Swim'
    if 'strength' in s or 'gym' in s: return 'Strength'
    return 'Other'

def parse_markdown_schedule(target_dates):
    """
    Parses the Markdown file looking for table rows that match the target dates.
    Returns a dict: { 'YYYY-MM-DD': [ {workout_obj}, ... ] }
    """
    if not os.path.exists(PLAN_FILE):
        print(f"Error: {PLAN_FILE} not found.")
        return {}

    found_plans = {d: [] for d in target_dates}
    
    with open(PLAN_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Simplified parsing: Look for table rows containing our target dates
    # We assume a row looks like: | Date | Sport | Workout | Duration | ...
    
    current_year = str(datetime.now().year)
    
    for line in lines:
        if not line.strip().startswith('|'): continue
        
        # Check if any of our target dates (formatted loosely) are in this line
        # We look for "Jan 19" or "2026-01-19"
        
        matched_date = None
        for d in target_dates:
            dt_obj = datetime.strptime(d, '%Y-%m-%d')
            
            # Formats to check: "2026-01-19", "Jan 19", "January 19"
            check_formats = [
                d, 
                dt_obj.strftime('%b %-d'), # Jan 19
                dt_obj.strftime('%B %-d')  # January 19
            ]
            
            for fmt in check_formats:
                if fmt.lower() in line.lower():
                    matched_date = d
                    break
            if matched_date: break
        
        if matched_date:
            # We found a row for a date in this week!
            parts = [p.strip() for p in line.split('|')]
            if len(parts) < 4: continue # Not enough columns
            
            # Naive column mapping (Adjust based on your actual MD table structure)
            # Assuming: | Date | Sport | Workout | Duration | Notes |
            # parts[0] is empty (before first |)
            # parts[1] is Date
            
            # Try to guess columns based on content
            sport_candidate = parts[2] if len(parts) > 2 else "Other"
            title_candidate = parts[3] if len(parts) > 3 else "Workout"
            dur_candidate = parts[4] if len(parts) > 4 else "0"
            notes_candidate = parts[5] if len(parts) > 5 else ""

            plan_obj = {
                "date": matched_date,
                "sport": normalize_sport(sport_candidate),
                "title": title_candidate,
                "planned_duration": parse_duration(dur_candidate),
                "notes": notes_candidate
            }
            found_plans[matched_date].append(plan_obj)

    return found_plans

def main():
    print("   -> Generating Planned Workouts (Current Week)...")
    
    # 1. Get Dates
    week_dates = get_current_week_dates()
    print(f"   -> Processing Week: {week_dates[0]} to {week_dates[-1]}")

    # 2. Parse Plan from Markdown
    plans_by_date = parse_markdown_schedule(week_dates)
    
    # 3. Load Actual Logs
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            logs = json.load(f)
    else:
        logs = []

    # 4. Match & Merge
    output_list = []
    
    for date_str in week_dates:
        day_plans = plans_by_date.get(date_str, [])
        
        if not day_plans:
            # Optional: Add a "Rest Day" or empty placeholder if desired
            pass
            
        for plan in day_plans:
            # Find matching log (Date + Sport)
            match = None
            for log in logs:
                # Normalize log date (handle timestamps if necessary)
                log_date = log.get('date', '').split('T')[0]
                
                # Check Date match
                if log_date == date_str:
                    # Check Sport match
                    log_sport = normalize_sport(log.get('activityType', '') or log.get('actualSport', ''))
                    if log_sport == plan['sport']:
                        match = log
                        break
            
            # Construct Final Object
            merged = {
                "date": date_str,
                "day": datetime.strptime(date_str, '%Y-%m-%d').strftime('%A'),
                "sport": plan['sport'],
                "planned_title": plan['title'],
                "planned_duration": plan['planned_duration'],
                "notes": plan['notes'],
                "status": "PLANNED",
                "actual_duration": 0,
                "actual_title": None,
                "compliance": 0
            }
            
            if match:
                merged["status"] = "COMPLETED"
                merged["actual_duration"] = match.get('actualDuration') or (match.get('duration', 0) / 60)
                merged["actual_title"] = match.get('activityName') or match.get('actualWorkout')
                
                # Calculate Compliance
                if merged["planned_duration"] > 0:
                    merged["compliance"] = round((merged["actual_duration"] / merged["planned_duration"]) * 100)
            
            # Handle "Missed" (Past date, no match)
            if not match and date_str < datetime.now().strftime('%Y-%m-%d'):
                merged["status"] = "MISSED"

            output_list.append(merged)

    # 5. Sort
    output_list.sort(key=lambda x: x['date'])

    # 6. Save
    if not os.path.exists(dashboard_dir):
        os.makedirs(dashboard_dir)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=4)
        
    print(f"   -> Saved {len(output_list)} records to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
