import json
import os
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_FILE = os.path.join(BASE_DIR, 'data', 'training_log.json')
READINESS_FILE = os.path.join(BASE_DIR, 'data', 'readiness', 'readiness.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'dashboard', 'heatmaps.json')

def parse_event_date(date_str):
    """
    Parses dates like 'May 5, 2026', 'Aug 15, 2026', 'Sept 11, 2026'.
    Handles common abbreviations that %B doesn't catch by default.
    """
    # Clean up string
    date_str = date_str.strip()
    
    # Manual mapping for non-standard abbreviations if standard parse fails
    replacements = {
        "Sept ": "September ",
        "Aug ": "August ",
        "Oct ": "October ",
        "Nov ": "November ",
        "Dec ": "December ",
        "Jan ": "January ",
        "Feb ": "February ",
        "Mar ": "March ",
        "Apr ": "April ",
        "Jun ": "June ",
        "Jul ": "July "
    }
    
    # Try standard parse first
    try:
        return datetime.strptime(date_str, "%B %d, %Y")
    except ValueError:
        pass
        
    # Try replacing abbreviations
    for abbr, full in replacements.items():
        if date_str.startswith(abbr):
            date_str = date_str.replace(abbr, full)
            break
            
    try:
        return datetime.strptime(date_str, "%B %d, %Y")
    except ValueError:
        return None

def main():
    if not os.path.exists(LOG_FILE):
        print(f"Error: {LOG_FILE} not found.")
        return

    # 1. Load Training Logs
    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        logs = json.load(f)

    # 2. Load Upcoming Events (for Annual View)
    events_map = {}
    if os.path.exists(READINESS_FILE):
        try:
            with open(READINESS_FILE, 'r', encoding='utf-8') as f:
                readiness = json.load(f)
                for event in readiness.get('upcomingEvents', []):
                    d_str = event.get('dateStr')
                    dt = parse_event_date(d_str)
                    if dt:
                        date_key = dt.strftime("%Y-%m-%d")
                        events_map[date_key] = event.get('name', 'Race')
        except Exception as e:
            print(f"Warning: Could not load readiness events: {e}")

    # 3. Aggregate Logs by Date
    daily_map = {}

    for entry in logs:
        date_str = entry.get('date', '').split('T')[0]
        if not date_str: 
            continue

        if date_str not in daily_map:
            daily_map[date_str] = {
                "date": date_str,
                "plannedDuration": 0.0,
                "actualDuration": 0.0,
                "sports": set(),
                "activities": []
            }
        
        day = daily_map[date_str]
        
        p_dur = float(entry.get('plannedDuration') or 0)
        a_dur = float(entry.get('actualDuration') or 0)
        day['plannedDuration'] += p_dur
        day['actualDuration'] += a_dur
        
        sport = entry.get('actualSport', 'Other')
        # Only add sport if it was actually done
        if a_dur > 0:
            day['sports'].add(sport)
            
        day['activities'].append({
            "name": entry.get('actualWorkout') or entry.get('plannedWorkout') or "Activity",
            "sport": sport,
            "actual": a_dur
        })

    # 4. Generate Final List
    heatmap_data = []
    
    # Union of all relevant dates
    all_dates = set(daily_map.keys()) | set(events_map.keys())
    sorted_dates = sorted(list(all_dates))

    for date_str in sorted_dates:
        day_data = daily_map.get(date_str, {
            "date": date_str, "plannedDuration": 0, "actualDuration": 0, "sports": set(), "activities": []
        })
        
        planned = day_data['plannedDuration']
        actual = day_data['actualDuration']
        event_name = events_map.get(date_str)
        
        # --- Compliance / Coloring Priority ---
        # 1. EVENT (Highest Priority - shows Purple)
        # 2. Missed / Completed / Partial / Unplanned
        
        status = "Rest"
        
        if event_name:
            status = "Event"
        elif planned > 0:
            if actual == 0:
                status = "Missed"
            else:
                ratio = actual / planned
                status = "Completed" if ratio >= 0.90 else "Partial"
        elif actual > 0:
            status = "Unplanned"

        # --- Sunday Filtering Logic ---
        dt_obj = datetime.strptime(date_str, '%Y-%m-%d')
        is_sunday = dt_obj.weekday() == 6
        
        # Sunday is totally hidden unless there is an ACTUAL workout > 0
        # (Even if there is an event or a plan, we hide it if no actual work was done, per instructions)
        if is_sunday and actual <= 0:
            continue

        heatmap_data.append({
            "date": date_str,
            "complianceStatus": status,
            "plannedDuration": planned,
            "actualDuration": actual,
            "sports": list(day_data['sports']),
            "isSunday": is_sunday,
            "eventName": event_name,
            "activities": day_data['activities']
        })

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(heatmap_data, f, indent=4)
        
    print(f"✅ Heatmap data generated: {len(heatmap_data)} records saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
