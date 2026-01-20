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

def normalize_sport(sport_name):
    """Standardizes sport names for chart categories."""
    if not sport_name: return ""
    s = str(sport_name).lower().strip()
    if any(x in s for x in ['bike', 'cycling', 'stationary', 'virtual ride']): return 'cycling'
    if 'run' in s: return 'running'
    if 'swim' in s: return 'swimming'
    return s

def main():
    logs = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            logs = json.load(f)
    
    planned_data = []
    if os.path.exists(PLANNED_FILE):
        with open(PLANNED_FILE, 'r', encoding='utf-8') as f:
            planned_data = json.load(f)

    # 1. Deduplication with Strict Field Logic
    # For logs: Key = Date + actualSport
    logged_keys = {f"{entry.get('date')}_{normalize_sport(entry.get('actualSport'))}" for entry in logs}
    
    combined_data = []
    
    # Add all logs first
    for entry in logs:
        combined_data.append({
            "date": entry.get('date'),
            "sport": normalize_sport(entry.get('actualSport')),
            "p_dur": entry.get('plannedDuration') or 0,
            "a_dur": entry.get('actualDuration') or 0
        })

    # Add planned items ONLY if they don't match a log
    added_planned = 0
    for p_item in planned_data:
        p_date = p_item.get('date')
        # Use activityType for planned.json source
        p_sport = normalize_sport(p_item.get('activityType'))
        p_key = f"{p_date}_{p_sport}"
        
        if p_key not in logged_keys:
            combined_data.append({
                "date": p_date,
                "sport": p_sport,
                "p_dur": p_item.get('plannedDuration') or p_item.get('duration') or 0,
                "a_dur": 0 # Planned items never have actual duration
            })
            added_planned += 1

    # 2. Date Range (Current Saturday and 12 weeks back)
    current_date = datetime(2026, 1, 20) 
    current_sat = get_saturday(current_date)
    saturdays = [current_sat - timedelta(weeks=i) for i in range(13)]
    saturdays.sort()

    # 3. Initialize Weekly Data
    weekly_data = {sat.strftime('%Y-%m-%d'): {
        "total": {"p": 0, "a": 0}, "cycling": {"p": 0, "a": 0},
        "running": {"p": 0, "a": 0}, "swimming": {"p": 0, "a": 0}
    } for sat in saturdays}

    # 4. Aggregate Volume
    for entry in combined_data:
        try:
            entry_date = datetime.strptime(entry['date'], '%Y-%m-%d')
            sat_key = get_saturday(entry_date).strftime('%Y-%m-%d')
            
            if sat_key in weekly_data:
                sport_cat = entry['sport']
                p_dur = entry['p_dur']
                a_dur = entry['a_dur']

                # Swim Normalization
                if sport_cat == 'swimming':
                    if p_dur > 500: p_dur /= 60
                    if a_dur > 500: a_dur /= 60
                
                # Update Category
                if sport_cat in weekly_data[sat_key]:
                    weekly_data[sat_key][sport_cat]['p'] += p_dur
                    weekly_data[sat_key][sport_cat]['a'] += a_dur
                
                # Update Total
                weekly_data[sat_key]['total']['p'] += p_dur
                weekly_data[sat_key]['total']['a'] += a_dur
        except (ValueError, KeyError, TypeError):
            continue

    # 5. Calculate Growth and Save
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

    # 6. Final JSON Output
    output = {
        "config": {"trailing_weeks": 12, "last_updated": datetime.now().isoformat()},
        "data": final_data
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4)
    
    print(f"✅ Deduplication fixed. Source fields applied: actualSport (Log) vs activityType (Planned).")

if __name__ == "__main__":
    main()