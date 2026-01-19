import os
import json
import re
from . import config

def parse_markdown_plan():
    if not os.path.exists(config.PLAN_MARKDOWN):
        print("   -> ⚠️ Plan Markdown file not found.")
        return []

    with open(config.PLAN_MARKDOWN, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    table_data = []
    in_table = False
    headers = []

    # Regex to find the Weekly Schedule table
    # Looking for a line that starts with | Status | Day ...
    
    for line in lines:
        stripped = line.strip()
        
        # Detect Header
        if '| Status |' in stripped and 'Planned Workout' in stripped:
            in_table = True
            headers = [h.strip() for h in stripped.strip('|').split('|')]
            continue
        
        # Detect End of Table (or headers underline)
        if in_table:
            if stripped.startswith('|-') or '---' in stripped:
                continue
            if not stripped.startswith('|'):
                in_table = False
                continue
            
            # Parse Row
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            if len(cols) < len(headers):
                continue

            row_dict = dict(zip(headers, cols))
            
            # Extract Fields defined in Spec
            planned_workout = row_dict.get('Planned Workout', '')
            
            # Determine Activity Type from [TAG]
            act_type = 'Other'
            if '[BIKE]' in planned_workout: act_type = 'Bike'
            elif '[RUN]' in planned_workout: act_type = 'Run'
            elif '[SWIM]' in planned_workout: act_type = 'Swim'
            
            # Parse Duration
            dur_str = row_dict.get('Planned Duration', '0')
            try:
                # Remove 'mins' or non-numeric chars
                dur_clean = re.sub(r"[^0-9.]", "", dur_str)
                dur = float(dur_clean) if dur_clean else 0
            except:
                dur = 0
            
            entry = {
                'id': f"PLAN-{row_dict.get('Date', '0000')}-{act_type}", # System ID
                'date': row_dict.get('Date', ''),
                'day': row_dict.get('Day', ''),
                'plannedWorkout': planned_workout,
                'plannedDuration': dur,
                'activityType': act_type,
                'notes': row_dict.get('Notes / Targets', ''),
                'status': row_dict.get('Status', 'PLANNED')
            }
            
            # Basic validation
            if entry['date'] and entry['plannedWorkout']:
                table_data.append(entry)

    return table_data

def main():
    print("   -> Building Plan JSON from Markdown...")
    data = parse_markdown_plan()
    
    os.makedirs(os.path.dirname(config.PLANNED_JSON), exist_ok=True)
    with open(config.PLANNED_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    print(f"   -> Parsed {len(data)} planned workouts.")

if __name__ == "__main__":
    main()
