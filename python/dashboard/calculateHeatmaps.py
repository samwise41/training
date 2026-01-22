import json
import os
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_FILE = os.path.join(BASE_DIR, 'data', 'training_log.json')
READINESS_FILE = os.path.join(BASE_DIR, 'data', 'readiness', 'readiness.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'dashboard', 'heatmaps.json')

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
                    # Parse "May 5, 2026"
                    try:
                        dt = datetime.strptime(d_str, "%B %d, %Y")
                        date_key = dt.strftime("%Y-%m-%d")
                        events_map[date_key] = event.get('name', 'Race')
                    except (ValueError, TypeError):
                        pass
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
        
        # Sum Durations
        p_dur = float(entry.get('plannedDuration') or 0)
        a_dur = float(entry.get('actualDuration') or 0)
        day['plannedDuration'] += p_dur
        day['actualDuration'] += a_dur
        
        # Track Sport if activity occurred
        sport = entry.get('actualSport', 'Other')
        if a_dur > 0:
            day['sports'].add(sport)
            
        # Keep details for tooltip
        day['activities'].append({
            "name": entry.get('actualWorkout') or entry.get('plannedWorkout') or "Activity",
            "sport": sport,
            "actual": a_dur
        })

    # 4. Generate Final List with Compliance Logic
    heatmap_data = []
    
    # We want a record for every day we have data OR an event
    all_dates = set(daily_map.keys()) | set(events_map.keys())
    sorted_dates = sorted(list(all_dates))

    for date_str in sorted_dates:
        day_data = daily_map.get(date_str, {
            "date": date_str, "plannedDuration": 0, "actualDuration": 0, "sports": set(), "activities": []
        })
        
        planned = day_data['plannedDuration']
        actual = day_data['actualDuration']
        event_name = events_map.get(date_str)
        
        # --- Compliance Logic ---
        # Default
        status = "Rest"
        
        if event_name:
            status = "Event"
        elif planned > 0:
            if actual == 0:
                # planned > 0 and actual = 0 -> Missed
                status = "Missed"
            else:
                # planned > 0 and actual > 0
                ratio = actual / planned
                if ratio >= 0.90:
                    status = "Completed" # Green
                else:
                    status = "Partial"   # Yellow
        elif actual > 0:
            # planned = 0 and actual > 0 -> Unplanned
            status = "Unplanned"

        # --- Sunday Filtering ---
        # Requirement: don't show sunday unless there is a workout on sunday.
        dt_obj = datetime.strptime(date_str, '%Y-%m-%d')
        is_sunday = dt_obj.weekday() == 6
        has_activity = (planned > 0 or actual > 0 or event_name)
        
        if is_sunday and not has_activity:
            continue

        heatmap_data.append({
            "date": date_str,
            "complianceStatus": status,
            "plannedDuration": planned,
            "actualDuration": actual,
            "sports": list(day_data['sports']), # List for multi-color logic
            "isSunday": is_sunday,
            "eventName": event_name,
            "activities": day_data['activities']
        })

    # 5. Output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(heatmap_data, f, indent=4)
        
    print(f"✅ Heatmap data generated: {len(heatmap_data)} records saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
