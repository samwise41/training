import json
import os
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_FILE = os.path.join(BASE_DIR, 'data', 'training_log.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'dashboard', 'heatmaps.json')

def main():
    if not os.path.exists(LOG_FILE):
        print(f"Error: {LOG_FILE} not found.")
        return

    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        logs = json.load(f)

    heatmap_data = []

    for entry in logs:
        # Extract core fields
        date_str = entry.get('date', '').split('T')[0]
        if not date_str:
            continue
            
        planned_dur = float(entry.get('plannedDuration') or 0)
        actual_dur = float(entry.get('actualDuration') or 0)
        status = (entry.get('status') or '').upper()
        actual_sport = entry.get('actualSport', 'Other')

        # Determine Compliance Status based on specific requirements
        compliance_status = "Rest" # Default fallback
        
        # 1. Unplanned: plannedDuration=0 and actualDuration>0
        if planned_dur == 0 and actual_dur > 0:
            compliance_status = "Unplanned"
            
        # 2. Missed: plannedDuration>0 and actualDuration=0 and status=MISSED
        elif planned_dur > 0 and actual_dur == 0 and status == "MISSED":
            compliance_status = "Missed"
            
        # 3. Completed: plannedDuration>0 and actualDuration>0 and ratio >= 95%
        elif planned_dur > 0 and actual_dur > 0:
            ratio = actual_dur / planned_dur
            if ratio >= 0.95:
                compliance_status = "Completed"
            else:
                # 4. Partial: plannedDuration>0 and actualDuration>0 and ratio < 95%
                compliance_status = "Partial"
        
        # Grid Logic: Check if it's a Sunday
        dt_obj = datetime.strptime(date_str, '%Y-%m-%d')
        is_sunday = dt_obj.weekday() == 6 # 6 is Sunday in Python's weekday()
        
        # Requirement: Sundays should not show up unless there is a workout that day
        # (Workout defined here as either a planned entry or an actual entry)
        has_activity = (planned_dur > 0 or actual_dur > 0)
        if is_sunday and not has_activity:
            continue

        # Construct result object
        heatmap_data.append({
            "date": date_str,
            "actualSport": actual_sport,
            "complianceStatus": compliance_status,
            "plannedDuration": planned_dur,
            "actualDuration": actual_dur,
            "isSunday": is_sunday,
            "activityName": entry.get('actualWorkout') or entry.get('activityName') or entry.get('plannedWorkout')
        })

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(heatmap_data, f, indent=4)
        
    print(f"✅ Heatmap data generated: {len(heatmap_data)} records saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()