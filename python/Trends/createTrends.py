import json
import os
from datetime import datetime, timedelta

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
LOG_FILE = os.path.join(ROOT_DIR, 'data', 'training_log.json')
OUTPUT_FILE = os.path.join(ROOT_DIR, 'data', 'trends', 'trends.json')

def get_saturday(date_obj):
    """Returns the Saturday date for the week containing date_obj."""
    # weekday(): Monday=0, Sunday=6. Saturday=5.
    days_to_sat = (5 - date_obj.weekday()) % 7
    return date_obj + timedelta(days=days_to_sat)

def main():
    if not os.path.exists(LOG_FILE):
        print(f"Error: {LOG_FILE} not found.")
        return

    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        logs = json.load(f)

    # 1. Determine Date Range (Current Saturday and 11 weeks back)
    # Using current time 2026-01-20 (Tuesday), the current week ends 2026-01-24
    current_date = datetime(2026, 1, 20) 
    current_sat = get_saturday(current_date)
    
    # We need 13 Saturdays total (to calculate growth for the first visible week)
    saturdays = [current_sat - timedelta(weeks=i) for i in range(13)]
    saturdays.sort()

    # 2. Aggregate Volume by Saturday Week-End
    # Structure: { sat_date: { "total": {"p": 0, "a": 0}, "cycling": {...}, ... } }
    weekly_data = {sat.strftime('%Y-%m-%d'): {
        "total": {"p": 0, "a": 0},
        "cycling": {"p": 0, "a": 0},
        "running": {"p": 0, "a": 0},
        "swimming": {"p": 0, "a": 0}
    } for sat in saturdays}

    for entry in logs:
        try:
            entry_date = datetime.strptime(entry['date'], '%Y-%m-%d')
            sat_key = get_saturday(entry_date).strftime('%Y-%m-%d')
            
            if sat_key in weekly_data:
                sport = entry.get('actualSport', 'Other').lower()
                p_dur = entry.get('plannedDuration', 0)
                a_dur = entry.get('actualDuration', 0)

                # Map to categories
                cat = None
                if 'bike' in sport or 'cycling' in sport: cat = 'cycling'
                elif 'run' in sport: cat = 'running'
                elif 'swim' in sport: cat = 'swimming'

                # Update Category
                if cat:
                    weekly_data[sat_key][cat]['p'] += p_dur
                    weekly_data[sat_key][cat]['a'] += a_dur
                
                # Update Total
                weekly_data[sat_key]['total']['p'] += p_dur
                weekly_data[sat_key]['total']['a'] += a_dur
        except (ValueError, KeyError):
            continue

    # 3. Calculate Growth relative to Prior Week Actuals
    final_data = []
    # Start from index 1 so we can look back at index 0 for prior actuals
    for i in range(1, len(saturdays)):
        curr_sat = saturdays[i].strftime('%Y-%m-%d')
        prev_sat = saturdays[i-1].strftime('%Y-%m-%d')
        
        week_entry = {
            "week_label": saturdays[i].strftime('%#m/%#d'), # Windows formatting for m/d
            "week_end": curr_sat,
            "categories": {}
        }

        for cat in ["total", "cycling", "running", "swimming"]:
            curr_p = weekly_data[curr_sat][cat]['p']
            curr_a = weekly_data[curr_sat][cat]['a']
            prev_a = weekly_data[prev_sat][cat]['a']

            # Prevent division by zero
            p_growth = (curr_p / prev_a - 1) if prev_a > 0 else 0
            a_growth = (curr_a / prev_a - 1) if prev_a > 0 else 0

            week_entry["categories"][cat] = {
                "planned": curr_p,
                "actual": curr_a,
                "planned_growth": round(p_growth, 3),
                "actual_growth": round(a_growth, 3)
            }
        
        final_data.append(week_entry)

    # 4. Save Output
    output = {
        "config": {
            "trailing_weeks": 12,
            "last_updated": datetime.now().isoformat()
        },
        "data": final_data
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4)
    
    print(f"✅ Trends generated for {len(final_data)} weeks.")

if __name__ == "__main__":
    main()
