import os
import json
import re
from . import config

def clean_header(header):
    """Removes Markdown bold/italic syntax and whitespace."""
    return re.sub(r"[*_]", "", header).strip()

def parse_markdown_plan():
    if not os.path.exists(config.PLAN_MARKDOWN):
        print("   -> ⚠️ Plan Markdown file not found.")
        return []

    with open(config.PLAN_MARKDOWN, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    table_data = []
    in_table = False
    headers = []

    for line in lines:
        stripped = line.strip()
        
        # Detect Header (Handle **Status** vs Status)
        clean_line = stripped.replace('*', '') # Quick clean for detection
        if '| Status |' in clean_line and 'Planned Workout' in clean_line:
            in_table = True
            # Strip pipes, split, then clean each header
            raw_headers = [h for h in stripped.strip('|').split('|')]
            headers = [clean_header(h) for h in raw_headers]
            continue
        
        # Detect End of Table
        if in_table:
            if stripped.startswith('|-') or '---' in stripped:
                continue
            if not stripped.startswith('|'):
                in_table = False
                continue
            
            # Parse Row
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            
            # Guard: Ensure row has enough columns
            if len(cols) < len(headers):
                continue

            row_dict = dict(zip(headers, cols))
            
            # Extract Fields
            planned_workout = row_dict.get('Planned Workout', '')
            
            # Skip empty rows or separator artifacts
            if not planned_workout: continue

            # Determine Activity Type from [TAG]
            act_type = 'Other'
            if '[BIKE]' in planned_workout: act_type = 'Bike'
            elif '[RUN]' in planned_workout: act_type = 'Run'
            elif '[SWIM]' in planned_workout: act_type = 'Swim'
            
            # Parse Duration
            dur_str = row_dict.get('Planned Duration', '0')
            try:
                dur_clean = re.sub(r"[^0-9.]", "", dur_str)
                dur = float(dur_clean) if dur_clean else 0
            except:
                dur = 0
            
            entry = {
                'id': f"PLAN-{row_dict.get('Date', '0000')}-{act_type}",
                'date': row_dict.get('Date', ''),
                'day': row_dict.get('Day', ''),
                'plannedWorkout': planned_workout,
                'plannedDuration': dur,
                'activityType': act_type,
                'notes': row_dict.get('Notes / Targets', ''),
                'status': row_dict.get('Status', 'PLANNED')
            }
            
            if entry['date']:
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
