import json
import os
from datetime import datetime, timedelta

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
LOG_FILE = os.path.join(ROOT_DIR, 'data', 'training_log.json')
PLANNED_FILE = os.path.join(ROOT_DIR, 'data', 'planned.json')
OUTPUT_FILE = os.path.join(ROOT_DIR, 'data', 'trends', 'trends.json')

def get_saturday(date_obj):
    """Returns the Saturday date for the week containing date_obj."""
    days_to_sat = (5 - date_obj.weekday()) % 7
    return date_obj + timedelta(days=days_to_sat)

def main():
    logs = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            logs = json.load(f)
    
    planned_data = []
    if os.path.exists(PLANNED_FILE):
        with open(PLANNED_FILE, 'r', encoding='utf-8') as f:
            planned_data = json.load(f)

    # 1. Deduplication using Date + Sport
    logged_keys = {f"{entry.get('date')}_{(entry.get('actualSport') or '').lower().strip()}" for entry in logs}
    
    combined_data = list(logs)
    added_count = 0
    for p_item in planned_data:
        p_date = p_item.get('date')
        p_sport = (p_item.get('activityType') or p_item.get('plannedSport') or "").lower().strip()
        p_key = f"{p_date}_{p_sport}"
        if p_key not in logged_keys:
            combined_data.append(p_item)
            added_count += 1

    # 2. Date Range Setup
    current_date = datetime(2026, 1, 20) 
    current_sat = get_saturday(current_date)
    saturdays = [current_sat - timedelta(weeks=i) for i in range(13)]
    saturdays.sort()

    # 3. Aggregate and Normalize Volume
    weekly_data = {sat.strftime('%Y-%m-%d'): {
        "total": {"p": 0, "a": 0}, "cycling": {"p": 0, "a": 0},
        "running": {"p": 0, "a": 0}, "swimming": {"p": 0, "a": 0}
    } for sat in saturdays}

    for entry in combined_data:
        try:
            entry_date = datetime.strptime(entry['date'], '%Y-%m-%d')
            sat_key = get_saturday(entry_date).strftime('%Y-%m-%d')
            
            if sat_key in weekly_data:
                sport = (entry.get('actualSport') or entry.get('activityType') or entry.get('plannedSport') or "").lower()
                
                # Fetch raw durations
                raw_p = entry.get('plannedDuration') or entry.get('duration') or 0
                raw_a = entry.get('actualDuration') or 0

                # --- NORMALIZATION LOGIC ---
                # Swim data often imports in seconds (e.g., 3600s instead of 60m)
                if 'swim' in sport:
                    if raw_p > 500: raw_p = raw_p / 60
                    if raw_a > 500: raw_a = raw_a / 60
                
                cat = None
                if any(x in sport for x in ['bike', 'cycling', 'stationary']): cat = 'cycling'
                elif 'run' in sport: cat = 'running'
                elif 'swim' in sport: cat = 'swimming'

                if cat:
                    weekly_data[sat_key][cat]['p'] += raw_p
                    weekly_data[sat_key][cat]['a'] += raw_a
                
                weekly_data[sat_key]['total']['p'] += raw_p
                weekly_data[sat_key][weekly_data[sat_key]['total']['a']] += raw_a
        except (ValueError, KeyError, TypeError):
            continue

    # 4. Calculate Growth and Save
    final_data = []
    for i in range(1, len(saturdays)):
        curr_sat = saturdays[i].strftime('%Y-%m-%d')
        prev_sat = saturdays[i-1].strftime('%Y-%m-%d')
        
        week_entry = {
            "week_label": saturdays[i].strftime('%#m/%#d'),
            "week_end": curr_sat,
            "categories": {}
        }

        for cat in ["total", "cycling", "running", "swimming"]:
            curr_p = weekly_data[curr_sat][cat]['p']
            curr_a = weekly_data[curr_sat][cat]['a']
            prev_a = weekly_data[prev_sat][cat]['a']

            p_growth = (curr_p / prev_a - 1) if prev_a > 0 else 0
            a_growth = (curr_a / prev_a - 1) if prev_a > 0 else 0

            week_entry["categories"][cat] = {
                "planned": round(curr_p, 1),
                "actual": round(curr_a, 1),
                "planned_growth": round(p_growth, 4),
                "actual_growth": round(a_growth, 4)
            }
        final_data.append(week_entry)

    output = {
        "config": {"trailing_weeks": 12, "last_updated": datetime.now().isoformat()},
        "data": final_data
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4)
    
    print(f"✅ Normalization complete. Swim durations over 500 converted to minutes.")

if __name__ == "__main__":
    main()